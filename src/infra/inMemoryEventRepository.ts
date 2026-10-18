import { EventRepository } from "../domain/eventRepository.js";
import { EventPayload, MemoryEvent, NewMemoryEvent } from "../domain/types.js";

/**
 * In-memory adapter for EventRepository. Used in tests (and could be
 * used for a "try it without a database" demo mode) so the domain and
 * MCP layers can be exercised without standing up Postgres.
 */
export class InMemoryEventRepository implements EventRepository {
  private events: MemoryEvent[] = [];
  private projects = new Set<string>();
  private nextId = 1;

  async ensureProject(projectId: string): Promise<void> {
    this.projects.add(projectId);
  }

  async append<T extends EventPayload>(event: NewMemoryEvent<T>): Promise<MemoryEvent<T>> {
    const stored: MemoryEvent<T> = {
      id: this.nextId++,
      projectId: event.projectId,
      eventType: event.eventType,
      payload: event.payload,
      actor: event.actor ?? null,
      createdAt: new Date().toISOString(),
    };
    this.events.push(stored);
    return stored;
  }

  async listByProject(projectId: string): Promise<MemoryEvent[]> {
    return this.events
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => a.id - b.id);
  }

  async search(projectId: string, term: string): Promise<MemoryEvent[]> {
    const needle = term.toLowerCase();
    return (await this.listByProject(projectId)).filter((e) =>
      JSON.stringify(e.payload).toLowerCase().includes(needle)
    );
  }
}
