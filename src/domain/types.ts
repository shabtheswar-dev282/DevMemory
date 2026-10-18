/**
 * Domain types for DevMemory's event-sourced memory core.
 *
 * The memory core never stores "current state" directly. It stores an
 * append-only log of typed events. Current state (open TODOs, open bugs,
 * decisions, notes) is *derived* by replaying the log — see projector.ts.
 * This is the same pattern git and event-sourced systems use: the log is
 * the source of truth, everything else is a read-side projection of it.
 */

export const EVENT_TYPES = [
  "decision_recorded",
  "bug_reported",
  "bug_resolved",
  "todo_added",
  "todo_completed",
  "note_added",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface DecisionRecordedPayload {
  title: string;
  rationale: string;
}

export interface BugReportedPayload {
  bugId: string;
  title: string;
  description: string;
}

export interface BugResolvedPayload {
  bugId: string;
  resolution: string;
}

export interface TodoAddedPayload {
  todoId: string;
  title: string;
}

export interface TodoCompletedPayload {
  todoId: string;
}

export interface NoteAddedPayload {
  title: string;
  body: string;
}

export type EventPayload =
  | DecisionRecordedPayload
  | BugReportedPayload
  | BugResolvedPayload
  | TodoAddedPayload
  | TodoCompletedPayload
  | NoteAddedPayload;

/** A persisted event, as read back from storage. */
export interface MemoryEvent<T extends EventPayload = EventPayload> {
  id: number;
  projectId: string;
  eventType: EventType;
  payload: T;
  actor: string | null;
  createdAt: string; // ISO timestamp
}

/** A new event, not yet assigned an id or timestamp by storage. */
export interface NewMemoryEvent<T extends EventPayload = EventPayload> {
  projectId: string;
  eventType: EventType;
  payload: T;
  actor?: string | null;
}

/** The compact, AI-readable projection of a project's memory. */
export interface ProjectMemorySummary {
  projectId: string;
  decisions: Array<{ title: string; rationale: string; recordedAt: string }>;
  openBugs: Array<{ bugId: string; title: string; description: string; reportedAt: string }>;
  resolvedBugs: Array<{ bugId: string; title: string; resolution: string; resolvedAt: string }>;
  openTodos: Array<{ todoId: string; title: string; addedAt: string }>;
  completedTodos: Array<{ todoId: string; title: string; completedAt: string }>;
  notes: Array<{ title: string; body: string; recordedAt: string }>;
  eventCount: number;
  lastUpdated: string | null;
}
