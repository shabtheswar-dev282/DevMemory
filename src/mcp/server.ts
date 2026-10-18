import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemoryService } from "../domain/memoryService.js";

/**
 * Builds the DevMemory MCP server. This is the "AI Provider Abstraction
 * Layer" from the project proposal: every AI client that speaks MCP
 * (Claude Code, Claude Desktop, Cursor, and others) gets the same tools
 * and therefore reads and writes the same underlying project memory —
 * no per-provider integration code required.
 */
export function buildMcpServer(memory: MemoryService): McpServer {
  const server = new McpServer({ name: "devmemory", version: "0.1.0" });

  const projectIdSchema = z.string().min(1).describe("Stable identifier for the project, e.g. a repo slug");
  const actorSchema = z.string().optional().describe("Which AI client or person is recording this");

  server.registerTool(
    "get_project_memory",
    {
      title: "Get project memory",
      description:
        "Fetch the current project memory (architecture decisions, open bugs, open TODOs, notes) as " +
        "compact Markdown, ready to paste into a new AI session. Call this FIRST at the start of any " +
        "session on a project you don't already have full context on.",
      inputSchema: { project_id: projectIdSchema },
    },
    async ({ project_id }) => {
      const markdown = await memory.getProjectMemoryAsMarkdown(project_id);
      return { content: [{ type: "text", text: markdown }] };
    }
  );

  server.registerTool(
    "record_decision",
    {
      title: "Record an architecture decision",
      description: "Record an architecture or design decision so future AI sessions and teammates know why it was made.",
      inputSchema: {
        project_id: projectIdSchema,
        title: z.string().min(1).describe("Short name for the decision, e.g. 'Use Postgres for event log'"),
        rationale: z.string().min(1).describe("Why this decision was made"),
        actor: actorSchema,
      },
    },
    async ({ project_id, title, rationale, actor }) => {
      await memory.recordDecision(project_id, { title, rationale }, actor);
      return { content: [{ type: "text", text: `Recorded decision: "${title}"` }] };
    }
  );

  server.registerTool(
    "report_bug",
    {
      title: "Report a bug",
      description: "Record a known bug so it isn't rediscovered or re-debugged from scratch in a future session.",
      inputSchema: {
        project_id: projectIdSchema,
        bug_id: z.string().min(1).describe("Short stable id for the bug, e.g. 'BUG-12'"),
        title: z.string().min(1),
        description: z.string().min(1),
        actor: actorSchema,
      },
    },
    async ({ project_id, bug_id, title, description, actor }) => {
      await memory.reportBug(project_id, { bugId: bug_id, title, description }, actor);
      return { content: [{ type: "text", text: `Recorded bug ${bug_id}: "${title}"` }] };
    }
  );

  server.registerTool(
    "resolve_bug",
    {
      title: "Resolve a bug",
      description: "Mark a previously reported bug as resolved and record how it was fixed.",
      inputSchema: {
        project_id: projectIdSchema,
        bug_id: z.string().min(1),
        resolution: z.string().min(1).describe("How the bug was fixed"),
        actor: actorSchema,
      },
    },
    async ({ project_id, bug_id, resolution, actor }) => {
      await memory.resolveBug(project_id, { bugId: bug_id, resolution }, actor);
      return { content: [{ type: "text", text: `Resolved bug ${bug_id}` }] };
    }
  );

  server.registerTool(
    "add_todo",
    {
      title: "Add a TODO",
      description: "Add a pending task to the project's memory.",
      inputSchema: {
        project_id: projectIdSchema,
        todo_id: z.string().min(1).describe("Short stable id for the task, e.g. 'TODO-7'"),
        title: z.string().min(1),
        actor: actorSchema,
      },
    },
    async ({ project_id, todo_id, title, actor }) => {
      await memory.addTodo(project_id, { todoId: todo_id, title }, actor);
      return { content: [{ type: "text", text: `Added TODO ${todo_id}: "${title}"` }] };
    }
  );

  server.registerTool(
    "complete_todo",
    {
      title: "Complete a TODO",
      description: "Mark a pending task as completed.",
      inputSchema: {
        project_id: projectIdSchema,
        todo_id: z.string().min(1),
        actor: actorSchema,
      },
    },
    async ({ project_id, todo_id, actor }) => {
      await memory.completeTodo(project_id, { todoId: todo_id }, actor);
      return { content: [{ type: "text", text: `Completed TODO ${todo_id}` }] };
    }
  );

  server.registerTool(
    "add_note",
    {
      title: "Add a note",
      description: "Record a free-form note — anything worth remembering that isn't a decision, bug, or TODO.",
      inputSchema: {
        project_id: projectIdSchema,
        title: z.string().min(1),
        body: z.string().min(1),
        actor: actorSchema,
      },
    },
    async ({ project_id, title, body, actor }) => {
      await memory.addNote(project_id, { title, body }, actor);
      return { content: [{ type: "text", text: `Added note: "${title}"` }] };
    }
  );

  server.registerTool(
    "search_memory",
    {
      title: "Search project memory",
      description: "Full-text search over a project's raw event history (decisions, bugs, TODOs, notes).",
      inputSchema: {
        project_id: projectIdSchema,
        query: z.string().min(1),
      },
    },
    async ({ project_id, query }) => {
      const results = await memory.searchMemory(project_id, query);
      if (results.length === 0) {
        return { content: [{ type: "text", text: `No memory events match "${query}".` }] };
      }
      const lines = results.map(
        (e) => `- [${e.eventType}] ${new Date(e.createdAt).toISOString()}: ${JSON.stringify(e.payload)}`
      );
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  return server;
}

/**
 * Logs the name and version the client sends in the MCP handshake
 * (`clientInfo`) once initialisation completes. Logged as JSON so the
 * exact strings are visible; stderr only, because stdout carries the
 * protocol. M0 uses this to read what Claude Code and Cursor send,
 * which M1.1 maps to normalised actors.
 */
export function logClientOnConnect(server: McpServer, log: (message: string) => void = console.error): void {
  server.server.oninitialized = () => {
    const client = server.server.getClientVersion();
    log(`[devmemory] client connected: ${JSON.stringify({ name: client?.name, version: client?.version })}`);
  };
}
