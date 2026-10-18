-- DevMemory schema
--
-- Deliberately just two tables. The event log is the single source of
-- truth (event sourcing); current state is derived at read time by the
-- projector in src/domain/projector.ts, not stored redundantly here.
-- A materialized snapshot table can be added later purely as a
-- performance optimization once real projects are large enough to need it.

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_events (
  id          BIGSERIAL PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (
    event_type IN (
      'decision_recorded',
      'bug_reported',
      'bug_resolved',
      'todo_added',
      'todo_completed',
      'note_added'
    )
  ),
  payload     JSONB NOT NULL,
  actor       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_events_project_created
  ON memory_events (project_id, created_at);

CREATE INDEX IF NOT EXISTS idx_memory_events_project_type
  ON memory_events (project_id, event_type);

-- Speeds up the ILIKE-based search in PostgresEventRepository.search().
-- Requires the pg_trgm extension (bundled with standard Postgres installs).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_memory_events_payload_trgm
  ON memory_events USING gin ((payload::text) gin_trgm_ops);
