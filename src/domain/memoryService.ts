import { EventRepository } from "./eventRepository.js";
import { projectMemory, renderSummaryAsMarkdown } from "./projector.js";
import {
  BugReportedPayload,
  BugResolvedPayload,
  DecisionRecordedPayload,
  MemoryEvent,
  NoteAddedPayload,
  ProjectMemorySummary,
  TodoAddedPayload,
  TodoCompletedPayload,
} from "./types.js";

/**
 * The application/use-case layer. This is what the MCP server (and,
 * later, the web dashboard API) calls — it never talks to the database
 * or the projector directly. Keeping this layer free of any MCP- or
 * Postgres-specific types is what lets both of those be swapped out
 * independently (Single Responsibility + Dependency Inversion).
 */
export class MemoryService {
  constructor(private readonly repo: EventRepository) {}

  async recordDecision(projectId: string, payload: DecisionRecordedPayload, actor?: string): Promise<MemoryEvent> {
    await this.repo.ensureProject(projectId);
    return this.repo.append({ projectId, eventType: "decision_recorded", payload, actor });
  }

  async reportBug(projectId: string, payload: BugReportedPayload, actor?: string): Promise<MemoryEvent> {
    await this.repo.ensureProject(projectId);
    return this.repo.append({ projectId, eventType: "bug_reported", payload, actor });
  }

  async resolveBug(projectId: string, payload: BugResolvedPayload, actor?: string): Promise<MemoryEvent> {
    await this.repo.ensureProject(projectId);
    return this.repo.append({ projectId, eventType: "bug_resolved", payload, actor });
  }

  async addTodo(projectId: string, payload: TodoAddedPayload, actor?: string): Promise<MemoryEvent> {
    await this.repo.ensureProject(projectId);
    return this.repo.append({ projectId, eventType: "todo_added", payload, actor });
  }

  async completeTodo(projectId: string, payload: TodoCompletedPayload, actor?: string): Promise<MemoryEvent> {
    await this.repo.ensureProject(projectId);
    return this.repo.append({ projectId, eventType: "todo_completed", payload, actor });
  }

  async addNote(projectId: string, payload: NoteAddedPayload, actor?: string): Promise<MemoryEvent> {
    await this.repo.ensureProject(projectId);
    return this.repo.append({ projectId, eventType: "note_added", payload, actor });
  }

  async getProjectMemory(projectId: string): Promise<ProjectMemorySummary> {
    const events = await this.repo.listByProject(projectId);
    return projectMemory(projectId, events);
  }

  async getProjectMemoryAsMarkdown(projectId: string): Promise<string> {
    return renderSummaryAsMarkdown(await this.getProjectMemory(projectId));
  }

  async searchMemory(projectId: string, term: string): Promise<MemoryEvent[]> {
    return this.repo.search(projectId, term);
  }
}
