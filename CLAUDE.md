# DevMemory: instructions for Claude Code

This repository is Deny Shabtheswar's BSc (Hons) Computer Science final-year project (IIT with the University of Westminster, module 6COSC023C, 2026/27). Supervisor: Ajeevan Sivanandhan.

**DevMemory** is a conflict-aware, multi-writer, event-sourced project memory served over MCP. Independent AI coding agents from different vendors (Claude Code and Cursor) write to one memory; DevMemory detects and resolves conflicting facts, and a seeded benchmark measures whether it prevents repeated failures.

## Read before any task
1. `docs/PROJECT_CONTEXT.md`: the source of truth (research questions, requirements R1 to R9, design choices, dates).
2. `docs/PROTOTYPE_PLAN.md`: milestones M0 to M3 and the current task list.
3. `docs/DECISIONS.md`: decisions already made. Add an entry for every new design decision.
4. `docs/architecture/DevMemory_Architecture.png`: the three-layer architecture.

## Non-negotiable rules
- Never change a research decision (requirements, signals, policies, metrics, configurations C0 to C3 and A1, technologies) without asking the user first.
- `memory_events` is append-only: never UPDATE or DELETE events. Resolutions and conflicts are new events.
- Similarity means "same subject", never "agreement".
- Every new behaviour gets a Vitest test; run `npm test` before every commit; keep all tests green.
- Never invent results or numbers. The PP demo is an "early prototype", not results.
- No real secrets in the repo. `.env` stays git-ignored. Real agent sessions only on the author's own repositories.
- Ask before adding a new dependency, a new service, or anything that costs money (for example LLM API calls).
- Keep explanations simple: the user is a student and will defend every choice in a viva.

## Environment
- Windows 11, VS Code with the Claude Code extension, PowerShell.
- Node.js 22, TypeScript, MCP TypeScript SDK 1.30, Vitest 4, PostgreSQL 16 in Docker Compose (no native PostgreSQL), Python 3.12 (embedding service and analysis, later).
- Docker Desktop must be running before `docker compose up -d`.

## Commands
- `npm install` · `docker compose up -d` · `npm run db:migrate` · `npm test` · `npm run demo` · `npm run build`

## Current milestone
M0 Setup, then M1 PP demo slice (freeze 2 Nov 2026). See `docs/PROTOTYPE_PLAN.md`.

## Git
- One branch per task (`m1/actor-tagging`), small commits with clear messages, merge only with green tests.
- When this file or the plan changes, say so in the commit message.
