import { beforeEach, describe, expect, it } from "vitest";
import { MemoryService } from "../src/domain/memoryService.js";
import { InMemoryEventRepository } from "../src/infra/inMemoryEventRepository.js";

// These tests exercise the exact same MemoryService the MCP server calls,
// but against InMemoryEventRepository instead of Postgres — demonstrating
// that swapping the storage adapter never requires touching the service
// or its tests (Dependency Inversion Principle in practice).

describe("MemoryService", () => {
  let service: MemoryService;

  beforeEach(() => {
    service = new MemoryService(new InMemoryEventRepository());
  });

  it("records a decision and surfaces it in the project summary", async () => {
    await service.recordDecision("proj-1", { title: "Use MCP", rationale: "Provider-agnostic" }, "claude-code");
    const summary = await service.getProjectMemory("proj-1");
    expect(summary.decisions).toHaveLength(1);
    expect(summary.decisions[0].title).toBe("Use MCP");
  });

  it("full bug lifecycle: report then resolve moves it out of openBugs", async () => {
    await service.reportBug("proj-1", { bugId: "BUG-1", title: "Crash", description: "NPE" });
    let summary = await service.getProjectMemory("proj-1");
    expect(summary.openBugs).toHaveLength(1);

    await service.resolveBug("proj-1", { bugId: "BUG-1", resolution: "Fixed null check" });
    summary = await service.getProjectMemory("proj-1");
    expect(summary.openBugs).toHaveLength(0);
    expect(summary.resolvedBugs).toHaveLength(1);
  });

  it("keeps memory scoped per project", async () => {
    await service.addNote("proj-1", { title: "A", body: "Project 1 note" });
    await service.addNote("proj-2", { title: "B", body: "Project 2 note" });

    const summary1 = await service.getProjectMemory("proj-1");
    const summary2 = await service.getProjectMemory("proj-2");

    expect(summary1.notes).toHaveLength(1);
    expect(summary2.notes).toHaveLength(1);
    expect(summary1.notes[0].body).toBe("Project 1 note");
  });

  it("search finds events whose payload contains the search term", async () => {
    await service.addNote("proj-1", { title: "Deploy", body: "Uses GitHub Actions" });
    await service.addNote("proj-1", { title: "Testing", body: "Uses Vitest" });

    const results = await service.searchMemory("proj-1", "vitest");
    expect(results).toHaveLength(1);
    expect(results[0].eventType).toBe("note_added");
  });

  it("renders a markdown summary suitable for injecting into an AI session", async () => {
    await service.addTodo("proj-1", { todoId: "T-1", title: "Write tests" });
    const markdown = await service.getProjectMemoryAsMarkdown("proj-1");
    expect(markdown).toContain("# Project Memory: proj-1");
    expect(markdown).toContain("Write tests");
  });
});
