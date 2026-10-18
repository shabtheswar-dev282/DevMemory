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
 * Projects an ordered list of events (oldest first) into the current
 * state of a project's memory. This is a pure function — no I/O, no
 * database — which makes it trivial to unit test and to reuse anywhere
 * (MCP server, web dashboard API, CLI) without touching storage.
 */
export function projectMemory(projectId: string, events: MemoryEvent[]): ProjectMemorySummary {
  const decisions: ProjectMemorySummary["decisions"] = [];
  const notes: ProjectMemorySummary["notes"] = [];

  // Bugs and TODOs are keyed by their business id so a later event
  // (resolved / completed) supersedes the earlier one, the way an
  // event-sourced read model normally works.
  const bugs = new Map<
    string,
    { title: string; description: string; reportedAt: string; resolution?: string; resolvedAt?: string }
  >();
  const todos = new Map<string, { title: string; addedAt: string; completedAt?: string }>();

  let lastUpdated: string | null = null;

  for (const event of events) {
    lastUpdated = event.createdAt;

    switch (event.eventType) {
      case "decision_recorded": {
        const p = event.payload as DecisionRecordedPayload;
        decisions.push({ title: p.title, rationale: p.rationale, recordedAt: event.createdAt });
        break;
      }
      case "bug_reported": {
        const p = event.payload as BugReportedPayload;
        bugs.set(p.bugId, { title: p.title, description: p.description, reportedAt: event.createdAt });
        break;
      }
      case "bug_resolved": {
        const p = event.payload as BugResolvedPayload;
        const existing = bugs.get(p.bugId);
        if (existing) {
          existing.resolution = p.resolution;
          existing.resolvedAt = event.createdAt;
        }
        break;
      }
      case "todo_added": {
        const p = event.payload as TodoAddedPayload;
        todos.set(p.todoId, { title: p.title, addedAt: event.createdAt });
        break;
      }
      case "todo_completed": {
        const p = event.payload as TodoCompletedPayload;
        const existing = todos.get(p.todoId);
        if (existing) existing.completedAt = event.createdAt;
        break;
      }
      case "note_added": {
        const p = event.payload as NoteAddedPayload;
        notes.push({ title: p.title, body: p.body, recordedAt: event.createdAt });
        break;
      }
      default: {
        // Exhaustiveness guard: if a new EventType is added to the domain
        // without updating this projector, TypeScript will flag it here.
        const _exhaustive: never = event.eventType;
        throw new Error(`Unhandled event type in projector: ${_exhaustive}`);
      }
    }
  }

  const openBugs: ProjectMemorySummary["openBugs"] = [];
  const resolvedBugs: ProjectMemorySummary["resolvedBugs"] = [];
  for (const [bugId, bug] of bugs) {
    if (bug.resolution && bug.resolvedAt) {
      resolvedBugs.push({ bugId, title: bug.title, resolution: bug.resolution, resolvedAt: bug.resolvedAt });
    } else {
      openBugs.push({ bugId, title: bug.title, description: bug.description, reportedAt: bug.reportedAt });
    }
  }

  const openTodos: ProjectMemorySummary["openTodos"] = [];
  const completedTodos: ProjectMemorySummary["completedTodos"] = [];
  for (const [todoId, todo] of todos) {
    if (todo.completedAt) {
      completedTodos.push({ todoId, title: todo.title, completedAt: todo.completedAt });
    } else {
      openTodos.push({ todoId, title: todo.title, addedAt: todo.addedAt });
    }
  }

  return {
    projectId,
    decisions,
    openBugs,
    resolvedBugs,
    openTodos,
    completedTodos,
    notes,
    eventCount: events.length,
    lastUpdated,
  };
}

/**
 * Renders a ProjectMemorySummary as compact Markdown suitable for injecting
 * directly into an AI model's context window at the start of a session.
 * Kept deliberately terse — this is meant to cost as few tokens as possible.
 */
export function renderSummaryAsMarkdown(summary: ProjectMemorySummary): string {
  const lines: string[] = [];
  lines.push(`# Project Memory: ${summary.projectId}`);
  lines.push(`_${summary.eventCount} events, last updated ${summary.lastUpdated ?? "never"}_`);

  if (summary.decisions.length) {
    lines.push("\n## Architecture Decisions");
    for (const d of summary.decisions) lines.push(`- **${d.title}** — ${d.rationale}`);
  }

  if (summary.openBugs.length) {
    lines.push("\n## Open Bugs");
    for (const b of summary.openBugs) lines.push(`- [${b.bugId}] **${b.title}** — ${b.description}`);
  }

  if (summary.openTodos.length) {
    lines.push("\n## Open TODOs");
    for (const t of summary.openTodos) lines.push(`- [${t.todoId}] ${t.title}`);
  }

  if (summary.notes.length) {
    lines.push("\n## Notes");
    for (const n of summary.notes) lines.push(`- **${n.title}** — ${n.body}`);
  }

  if (summary.resolvedBugs.length) {
    lines.push(`\n## Resolved Bugs (${summary.resolvedBugs.length})`);
    for (const b of summary.resolvedBugs) lines.push(`- [${b.bugId}] ${b.title} — resolved: ${b.resolution}`);
  }

  if (summary.completedTodos.length) {
    lines.push(`\n## Completed TODOs (${summary.completedTodos.length})`);
    for (const t of summary.completedTodos) lines.push(`- [${t.todoId}] ${t.title}`);
  }

  return lines.join("\n");
}
