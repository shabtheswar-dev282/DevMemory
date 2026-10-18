import type { Pool } from "pg";
import { EventRepository } from "../domain/eventRepository.js";
import { EventPayload, MemoryEvent, NewMemoryEvent } from "../domain/types.js";

interface EventRow {
  id: string; // BIGSERIAL comes back as string from node-pg
  project_id: string;
  event_type: string;
  payload: unknown;
  actor: string | null;
  created_at: Date;
}

function rowToEvent<T extends EventPayload>(row: EventRow): MemoryEvent<T> {
  return {
    id: Number(row.id),
    projectId: row.project_id,
    eventType: row.event_type as MemoryEvent["eventType"],
    payload: row.payload as T,
    actor: row.actor,
    createdAt: row.created_at.toISOString(),
  };
}

/** Production adapter for EventRepository, backed by PostgreSQL. */
export class PostgresEventRepository implements EventRepository {
  constructor(private readonly pool: Pool) {}

  async ensureProject(projectId: string, name?: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO projects (id, name)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [projectId, name ?? projectId]
    );
  }

  async append<T extends EventPayload>(event: NewMemoryEvent<T>): Promise<MemoryEvent<T>> {
    const result = await this.pool.query<EventRow>(
      `INSERT INTO memory_events (project_id, event_type, payload, actor)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING id, project_id, event_type, payload, actor, created_at`,
      [event.projectId, event.eventType, JSON.stringify(event.payload), event.actor ?? null]
    );
    return rowToEvent<T>(result.rows[0]);
  }

  async listByProject(projectId: string): Promise<MemoryEvent[]> {
    const result = await this.pool.query<EventRow>(
      `SELECT id, project_id, event_type, payload, actor, created_at
       FROM memory_events
       WHERE project_id = $1
       ORDER BY id ASC`,
      [projectId]
    );
    return result.rows.map((r) => rowToEvent(r));
  }

  async search(projectId: string, term: string): Promise<MemoryEvent[]> {
    const result = await this.pool.query<EventRow>(
      `SELECT id, project_id, event_type, payload, actor, created_at
       FROM memory_events
       WHERE project_id = $1
         AND payload::text ILIKE $2
       ORDER BY id ASC`,
      [projectId, `%${term}%`]
    );
    return result.rows.map((r) => rowToEvent(r));
  }
}
