# DevMemory prototype plan

Version 1, 17 October 2026. Owner: Deny Shabtheswar. Supervisor: Ajeevan Sivanandhan.
Architecture: `docs/architecture/DevMemory_Architecture.drawio` (PNG beside it). Project facts: `docs/PROJECT_CONTEXT.md`.

## 1. Goal and fixed dates

Build the conflict-aware, multi-writer project memory in small, always-working steps on top of the existing proof of concept (PoC).

| Date | Milestone | What must exist |
|---|---|---|
| 20 Oct 2026 | **M0 Setup** | Tools installed, repo on GitHub (private), PoC running, both agents connected over MCP |
| 2 Nov 2026 | **M1 PP demo slice** (freeze) | Two agents write to one memory; a candidate conflict is flagged and shown. Demo video recorded 2 to 3 Nov |
| 5 Nov 2026 | PP slides + ethics form submitted | Demo slide (screenshots) in the deck |
| 9 to 26 Nov 2026 | PP live presentation and viva | Live demo, with the recorded video as backup |
| 28 Jan 2027 | **M2 IPD** | All Must requirements R1 to R7 working and tested |
| 5 Apr 2027 | **M3 Final** | Should requirements R8, R9, FR10; experiments C0 to C3 and A1; results |

Rules for every milestone: all tests pass; nothing in `memory_events` is ever updated or deleted; every new behaviour has a unit test; results are never invented, and the demo is always called an early prototype, not results.

## 2. M0 Setup (17 to 20 Oct)

The user installs tools (Git, Node.js 24 LTS (D11), Python 3.12, Docker Desktop with WSL 2, Cursor). Claude Code then does the rest from VS Code:

1. Check versions: `git --version`, `node -v` (24.x), `npm -v`, `python --version` (3.12), `docker --version`, `docker compose version`.
2. In `DevMemory/`: `npm install`, copy `.env.example` to `.env`, `docker compose up -d` (PostgreSQL 16 in Docker; no native PostgreSQL), `npm run db:migrate`, `npm test` (13 tests pass), `npm run demo` (full MCP round trip).
3. `git init`, `.gitattributes` with `* text=auto eol=lf`, first commit "Import proof of concept". Publish to GitHub as a **private** repository (VS Code Source Control: Publish Branch). The user clicks the publish button.
4. Connect both agents to the **same** server and the **same** database:
   - Claude Code: project-scoped `.mcp.json` at the repo root (Claude Code asks once for approval of project servers).
   - Cursor: `.cursor/mcp.json` in the repo.
   - Both start the stdio server with `DATABASE_URL` pointing at the Docker PostgreSQL on `localhost:5432`.
5. From each agent, call `get_project_memory` once. Record the exact `clientInfo.name` and version each client sends during the MCP handshake (needed for actor tagging in M1). Do not assume the names; read them.

Done when: tests green, demo green, both agents can read and write the same project memory, repo pushed.

## 3. M1 PP demo slice (21 Oct to 2 Nov)

### 3.1 What the audience will see (60 to 75 seconds)
1. **Claude Code** records a decision: "Auth module: keep stateless JWT access tokens", concerning `src/auth/`.
2. **Cursor** records a decision: "Auth module: replace JWT with server-side sessions", concerning `src/auth/`.
3. DevMemory flags a **candidate conflict**: both decisions concern the same component and come from different agents. Nothing is overwritten.
4. A new Claude Code session calls `get_project_memory`. The memory now says "1 conflict needs review" and shows both decisions, who wrote each, and when.
5. The read-only dashboard shows the conflict with provenance (agent, session, time) and the signals that raised it.

### 3.2 Scope
In: actor, session and time on every write (R1, first version); decision subject fields; candidate-conflict flagging between different agents using two simple signals; flag-for-review policy only; conflicts section in the project memory; one read-only dashboard page.
Out (later milestones): the contradiction / refinement / unrelated classifier, embeddings, Git-derived component graph, the other three policies, redaction, benchmark harness. These are not shown as working in the PP.

### 3.3 Tasks and acceptance tests

| ID | Task | Acceptance test |
|---|---|---|
| M1.1 | **Actor and session tagging.** Read `clientInfo` (name, version) from the MCP handshake; map to a normalised actor (`claude-code`, `cursor`, `scripted`, else `unknown`) with a small mapping table; one session id (UUID) per server process; store raw client name and version too. Migration adds `session_id`, `client_name`, `client_version` columns (existing rows keep nulls). | Unit tests for the mapping; manual check that a write from Claude Code stores actor `claude-code` and a write from Cursor stores `cursor`. |
| M1.2 | **Decision subject.** `record_decision` accepts optional `files: string[]` and `component?: string` (zod). A folder rule in `devmemory.config.json` maps files to a component (for example `src/auth/**` to `auth`). | Unit tests: files map to the right component; explicit `component` wins. |
| M1.3 | **Candidate conflict v0.** After each `decision_recorded`, compare it with earlier, still-open decisions in the same project **written by a different actor**. Raise a candidate when (a) the component is the same, or (b) lexical similarity of title + rationale (TF-IDF cosine, the planned lexical baseline) is at or above a configurable threshold. Append a `conflict_flagged` event `{conflictId, eventIds, signals: {sameComponent, lexicalScore}, policy: "flag-for-review", status: "needs_review"}`. Never modify the original events. | Unit tests: different actors + same component flags; same actor does not flag (cross-agent only in v0); different components + low similarity does not flag; the log only grows. |
| M1.4 | **Projection.** The projector derives open conflicts from `conflict_flagged` events (pure function). `get_project_memory` adds a "Conflicts needing review" section listing both decisions, actor, time and signals. | Projector unit tests; Markdown snapshot test. |
| M1.5 | **`list_conflicts` MCP tool** (read-only). | Tool returns the open conflicts for a project. |
| M1.6 | **Read-only API.** `GET /api/projects/:id/conflicts`, `GET /api/projects/:id/events`. No write routes. | API tests against the in-memory adapter. |
| M1.7 | **Dashboard page** (React + Vite, read-only): conflict cards side by side with agent, session, time, signals and status; event timeline for provenance. Text contrast meets WCAG 2.2 AA; agent identity is shown in text, not colour alone. | Opens locally; a manual accessibility check (contrast, keyboard focus). |
| M1.8 | **Demo kit.** `npm run demo:reset` creates a clean `demo-shop` project; `docs/demo/PP_DEMO_SCRIPT.md` has the exact prompts for both agents. | Full demo runs three times in a row from reset without errors. |
| M1.9 | **Recording.** 60 to 90 second screen recording (Windows: Win+Alt+R with Xbox Game Bar, or OBS) and 2 to 3 screenshots for the slide. | Video plays offline from the laptop. |

Freeze on 2 Nov: after that only bug fixes until the PP live presentation.

## 4. M2 IPD: Must requirements (16 Nov 2026 to 20 Jan 2027, buffer to 27 Jan)

| Requirement | Work |
|---|---|
| R1 | Actor, session and time mandatory on every write; the scripted MCP client identifies as `scripted`. |
| R2, FR3 | Detection v1 for decision, bug and TODO events: type-aware heuristics (for example a resolved bug reported again, a completed TODO re-added, two decisions on one component); candidate pairs; classification into contradiction / refinement / unrelated. The classification method is chosen in the design phase (WP3) and recorded in `docs/DECISIONS.md`; it is tuned on the dev split only. |
| R3 | Embedding service (Python, Sentence-Transformers `all-MiniLM-L6-v2`, run locally in Docker Compose) used only as a "same subject" signal; `all-mpnet-base-v2` as a sensitivity check; TF-IDF as the lexical baseline. Component graph from Git commit file paths (event to file to component) in a PostgreSQL edge table. |
| R4 | `ResolutionPolicy` interface with four implementations: last-write-wins, recency-weighted, flag-for-review, LLM-as-judge (version-pinned Claude model, temperature 0, cached, order-swapped prompts, spending cap; local open-weight fallback). |
| R5 | Benchmark harness v1: seeded repositories, scripted two-identity histories, injected conflicts and repeat failures, deterministic replay through the scripted MCP client, configurations C0 to C3, fixed dev/test split by repository. |
| R6 | Resolutions appended as `conflict_resolved` events; an audit view shows the full chain. |
| R7 | Default-on secret redaction before storage (common key and token formats plus an entropy check), with tests. |

Also in this period (from the schedule): annotation guide and pilot, corpus construction (WP5), round 1 expert interviews after ethics approval (WP2), dissertation chapters started (WP8).

## 5. M3 Final (Feb to 5 Apr 2027)

R8 latency (p50, p95) and tokens per policy against a budget; R9 full dashboard (conflicts, policy outcomes, provenance, benchmark metrics); FR10 result export; ablation A1; experiments on the held-out split; Python analysis (Wilson intervals, Cohen's kappa, figures); round 2 expert review; versioned release of the benchmark dataset and code.

## 6. Repository layout

```
DevMemory/
  CLAUDE.md                   rules and pointers for Claude Code
  README.md
  docs/                       PROJECT_CONTEXT.md, PROTOTYPE_PLAN.md, DECISIONS.md, architecture/, demo/
  src/domain/                 types, memory service, projector (pure)
  src/infra/                  PostgreSQL and in-memory repositories
  src/mcp/                    MCP server and tools
  src/detection/              candidate generation, signals, classifier        (M1 starts here)
  src/resolution/             policy interface and policies                     (M1: flag-for-review)
  src/graph/                  file and component mapping                        (M1: folder rule)
  src/redaction/              secret redaction                                  (M2)
  src/api/                    read-only HTTP API                                (M1)
  dashboard/                  React + Vite read-only dashboard                  (M1)
  embedding-service/          Python embedding service                          (M2)
  benchmark/                  harness, seeded histories, configurations         (M2)
  analysis/                   Python statistics and figures                     (M3)
  db/                         schema and migrations
  test/                       Vitest tests
  docker-compose.yml, .env.example, .mcp.json, .cursor/mcp.json
```

## 7. Ways of working

- Two-week iterations; review progress with the supervisor every two weeks.
- One branch per task (`m1/actor-tagging`), small commits, merge only when tests pass.
- Every design decision that changes the research (signals, thresholds, classifier, policies, metrics) is written in `docs/DECISIONS.md` with the date and reason, and copied into the dissertation later.
- No real secrets in the repo; `.env` is git-ignored. Real Claude Code and Cursor sessions only on the author's own repositories.
- Log the Claude Code and Cursor versions used for every recorded session.
- Keep a short GenAI use log (what Claude Code wrote, how it was checked) for the module's AI disclosure.

## 8. Risks for the demo

| Risk | Fallback |
|---|---|
| Docker or the database fails on the day | Recorded video; start Docker Desktop before the session and run `npm run demo:reset` once |
| A client changes behaviour after an update | Record client versions; do not update Claude Code or Cursor in the week before the presentation |
| No internet in the room (agents need it) | Recorded video plus screenshots on the slide |
| Not enough time in 20 minutes | Demo is 60 to 75 seconds; skip to screenshots if behind time |
