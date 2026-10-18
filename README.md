# DevMemory

A provider-agnostic, event-sourced project memory server for AI coding agents, exposed over the
[Model Context Protocol (MCP)](https://modelcontextprotocol.io) — so Claude Code, Cursor, Claude Desktop,
and any other MCP-capable client read and write the **same** project memory.

This is the Weeks 3–6 milestone from the project proposal: the memory core and the first MCP server,
verified with a real client against a real Postgres database (not just type-checked).

## Why it's built this way

- **Event sourcing.** The `memory_events` table is an append-only log — decisions, bugs, TODOs, and
  notes are never overwritten, only appended to. Current state (e.g. "is this bug still open?") is
  *derived* by replaying the log in `src/domain/projector.ts`, a pure function with no I/O. This
  mirrors how git itself works, and it means the full history of a project's reasoning is never lost.
- **Ports & Adapters (Hexagonal Architecture).** `src/domain/eventRepository.ts` defines a storage
  interface. `PostgresEventRepository` is the production adapter; `InMemoryEventRepository` is a test
  adapter. `MemoryService` and the MCP tools depend only on the interface, never on Postgres directly —
  this is the Dependency Inversion Principle from the proposal's "Clean Architecture / SOLID" goals,
  applied concretely rather than just asserted.
- **MCP as the provider abstraction layer**, instead of writing custom integration code per AI vendor.
  Any client that speaks MCP gets the same 8 tools automatically.

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│ Claude Code │     │   Cursor    │     │  (future) Web UI  │
└──────┬──────┘     └──────┬──────┘     └─────────┬─────────┘
       │  MCP               │  MCP                 │  HTTP (future)
       └──────────┬─────────┘                      │
                   ▼                                ▼
           ┌───────────────┐               ┌─────────────────┐
           │  MCP Server    │──────────────▶│  MemoryService   │
           │ (src/mcp)      │               │ (src/domain)     │
           └───────────────┘               └────────┬─────────┘
                                                      ▼
                                          ┌────────────────────────┐
                                          │ EventRepository (port)  │
                                          └───────┬─────────┬──────┘
                                                   ▼         ▼
                                        PostgresEventRepository   InMemoryEventRepository
                                             (production)              (tests)
```

## Quick start

```bash
npm install

# start Postgres (or point .env at an existing instance — see .env.example)
docker compose up -d
cp .env.example .env

npm run db:migrate     # applies db/schema.sql
npm test                # 13 unit tests, no database required
npm run demo             # starts the MCP server and drives it with a real client
```

`npm run demo` records a decision, a bug, a TODO, resolves the bug, then fetches
`get_project_memory` and prints the rendered Markdown — a full round trip through MCP and Postgres.
Run this before a supervisor demo to confirm everything still works end to end.

## Connecting a real AI client

**Claude Desktop / Claude Code** — add to your MCP config (`claude_desktop_config.json` or
equivalent):

```json
{
  "mcpServers": {
    "devmemory": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/devmemory/src/index.ts"],
      "env": { "DATABASE_URL": "postgres://postgres:devmemory@localhost:5432/devmemory" }
    }
  }
}
```

**Cursor** — Settings → MCP → Add new MCP server, using the same command/args/env as above.

Once connected, start a session with: *"Call get_project_memory for project my-repo before we start."*
Every subsequent `record_decision` / `report_bug` / `add_todo` call from that session — or from a
different AI client pointed at the same project id — becomes visible to the next session immediately.

## Project structure

```
src/
  domain/            # pure business logic — no MCP, no Postgres
    types.ts          # event and payload types
    projector.ts       # event log -> current-state summary (pure function)
    memoryService.ts    # use cases: recordDecision, reportBug, getProjectMemory, ...
    eventRepository.ts   # storage interface (port)
  infra/              # adapters
    db.ts               # Postgres connection pool
    postgresEventRepository.ts   # production storage adapter
    inMemoryEventRepository.ts    # test storage adapter
  mcp/
    server.ts          # registers the 8 MCP tools, calls MemoryService
  index.ts             # entrypoint: wires everything together, starts stdio transport
db/schema.sql          # event log schema
scripts/
  migrate.ts            # applies schema.sql
  demo-client.ts          # drives the MCP server as a real client, end to end
test/
  projector.test.ts      # pure unit tests, no I/O
  memoryService.test.ts    # service-layer tests against InMemoryEventRepository
```

## Available MCP tools

| Tool | Purpose |
|---|---|
| `get_project_memory` | Fetch current memory as compact Markdown — call at the start of every session |
| `record_decision` | Record an architecture/design decision and why it was made |
| `report_bug` | Record a known bug |
| `resolve_bug` | Mark a bug resolved and record the fix |
| `add_todo` | Add a pending task |
| `complete_todo` | Mark a task done |
| `add_note` | Record a free-form note |
| `search_memory` | Full-text search over the raw event history |

## What's next (per the proposal timeline)

- **Weeks 7–9:** Knowledge graph layer — model relationships between files, modules, decisions, and
  tasks on top of this same event log, without changing `MemoryService`'s public API.
- **Weeks 10–12:** Web dashboard — timeline and graph visualization, reading through a small HTTP API
  placed in front of `MemoryService` (the domain layer needs no changes to support this).
- **Weeks 13–14:** Second AI-client integration (e.g. Cursor alongside Claude Code) and the
  token/time-cost evaluation study described in the proposal.

## License

MIT — matching the license of the closest prior art (PROJECTMEM), so this can be shared and cited
as coursework or open-sourced later without ambiguity.
