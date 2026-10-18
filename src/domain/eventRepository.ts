import { EventPayload, MemoryEvent, NewMemoryEvent } from "./types.js";

/**
 * Port (in the Ports & Adapters / Hexagonal sense) for event storage.
 *
 * The domain and MCP layers depend only on this interface, never on
 * Postgres directly (Dependency Inversion Principle). This makes it
 * possible to swap PostgresEventRepository for another adapter later
 * (e.g. SQLite for a lighter local-first mode) without touching the
 * memory service, the projector, or the MCP tools — and makes the
 * service trivially unit-testable with InMemoryEventRepository.
 */
export interface EventRepository {
  ensureProject(projectId: string, name?: string): Promise<void>;
  append<T extends EventPayload>(event: NewMemoryEvent<T>): Promise<MemoryEvent<T>>;
  listByProject(projectId: string): Promise<MemoryEvent[]>;
  search(projectId: string, term: string): Promise<MemoryEvent[]>;
}
