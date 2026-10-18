import { describe, expect, it } from "vitest";
import { projectMemory, renderSummaryAsMarkdown } from "../src/domain/projector.js";
import { MemoryEvent } from "../src/domain/types.js";

function event<T>(id: number, eventType: MemoryEvent["eventType"], payload: T, createdAt = "2026-01-01T00:00:00.000Z"): MemoryEvent {
  return { id, projectId: "demo", eventType, payload: payload as never, actor: null, createdAt };
}

describe("projectMemory", () => {
  it("returns an empty summary for no events", () => {
    const summary = projectMemory("demo", []);
    expect(summary.eventCount).toBe(0);
    expect(summary.lastUpdated).toBeNull();
    expect(summary.decisions).toEqual([]);
    expect(summary.openBugs).toEqual([]);
    expect(summary.openTodos).toEqual([]);
  });

  it("accumulates decisions and notes in order", () => {
    const events: MemoryEvent[] = [
      event(1, "decision_recorded", { title: "Use Postgres", rationale: "Simplicity" }),
      event(2, "note_added", { title: "Heads up", body: "CI is flaky on Fridays" }),
    ];
    const summary = projectMemory("demo", events);
    expect(summary.decisions).toHaveLength(1);
    expect(summary.decisions[0].title).toBe("Use Postgres");
    expect(summary.notes[0].body).toBe("CI is flaky on Fridays");
  });

  it("moves a bug from open to resolved once a bug_resolved event arrives", () => {
    const events: MemoryEvent[] = [
      event(1, "bug_reported", { bugId: "BUG-1", title: "Crash on save", description: "NPE in save handler" }),
      event(2, "bug_resolved", { bugId: "BUG-1", resolution: "Added null check" }),
    ];
    const summary = projectMemory("demo", events);
    expect(summary.openBugs).toHaveLength(0);
    expect(summary.resolvedBugs).toHaveLength(1);
    expect(summary.resolvedBugs[0].resolution).toBe("Added null check");
  });

  it("keeps a bug open if no resolution event exists yet", () => {
    const events: MemoryEvent[] = [
      event(1, "bug_reported", { bugId: "BUG-2", title: "Slow query", description: "N+1 on dashboard load" }),
    ];
    const summary = projectMemory("demo", events);
    expect(summary.openBugs).toHaveLength(1);
    expect(summary.resolvedBugs).toHaveLength(0);
  });

  it("moves a TODO from open to completed once a todo_completed event arrives", () => {
    const events: MemoryEvent[] = [
      event(1, "todo_added", { todoId: "T-1", title: "Write MCP server" }),
      event(2, "todo_completed", { todoId: "T-1" }),
    ];
    const summary = projectMemory("demo", events);
    expect(summary.openTodos).toHaveLength(0);
    expect(summary.completedTodos).toHaveLength(1);
  });

  it("ignores a resolution/completion event that references an unknown id", () => {
    const events: MemoryEvent[] = [event(1, "bug_resolved", { bugId: "BUG-404", resolution: "n/a" })];
    const summary = projectMemory("demo", events);
    expect(summary.openBugs).toHaveLength(0);
    expect(summary.resolvedBugs).toHaveLength(0);
  });

  it("sets lastUpdated to the timestamp of the final event", () => {
    const events: MemoryEvent[] = [
      event(1, "note_added", { title: "a", body: "b" }, "2026-01-01T00:00:00.000Z"),
      event(2, "note_added", { title: "c", body: "d" }, "2026-02-15T12:00:00.000Z"),
    ];
    const summary = projectMemory("demo", events);
    expect(summary.lastUpdated).toBe("2026-02-15T12:00:00.000Z");
  });
});

describe("renderSummaryAsMarkdown", () => {
  it("only renders sections that have content", () => {
    const summary = projectMemory("demo", [
      { id: 1, projectId: "demo", eventType: "todo_added", payload: { todoId: "T-1", title: "Ship it" }, actor: null, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const md = renderSummaryAsMarkdown(summary);
    expect(md).toContain("Open TODOs");
    expect(md).toContain("Ship it");
    expect(md).not.toContain("Architecture Decisions");
    expect(md).not.toContain("Open Bugs");
  });
});
