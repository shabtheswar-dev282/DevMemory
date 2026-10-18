# Decision log

Short records of design decisions and why they were made. Newest at the bottom. Copy into the dissertation (methodology and implementation chapters) when relevant.

| # | Date | Decision | Why | Alternatives rejected |
|---|---|---|---|---|
| D1 | Aug 2026 | Event sourcing: append-only `memory_events`; current state is a pure projection | Full history kept; conflicting writes are both preserved, so a conflict can be detected instead of lost to an overwrite | Mutable state tables |
| D2 | Aug 2026 | MCP as the integration layer between agents and memory | Any MCP client (Claude Code, Cursor) uses the same tools without vendor-specific code | Per-vendor adapters |
| D3 | Aug 2026 | Ports and adapters: PostgreSQL adapter for production, in-memory adapter for tests | Domain logic independent of storage; fast tests without a database | Direct database calls in the service |
| D4 | Oct 2026 | PostgreSQL 16 with an edge table for the component graph | One transactional store; the graph is small enough for SQL joins; the core already uses PostgreSQL | Neo4j, EventStoreDB, SQLite |
| D5 | Oct 2026 | Semantic signal: all-MiniLM-L6-v2 run locally (Sentence-Transformers); all-mpnet-base-v2 as a sensitivity check; TF-IDF as the lexical baseline | Corpus stays local; no per-call cost; no network latency confound; deterministic | Hosted embedding API |
| D6 | Oct 2026 | LLM judge: version-pinned Claude model via API, temperature 0, cached, order-swapped prompts; local open-weight model as fallback | Agreement with humans, reproducibility, cost cap, position-bias control | Unpinned or hosted-only judge |
| D7 | Oct 2026 | Writers: Claude Code and Cursor (two vendors over MCP) plus a scripted MCP client for deterministic replay | Real cross-vendor writes, plus reproducible benchmark runs | Copilot agent mode, Windsurf, Codex |
| D8 | Oct 2026 | Read-only dashboard in React + Vite (TypeScript) | Same language as the core; no login or writes needed | Streamlit, Grafana |
| D9 | 17 Oct 2026 | PostgreSQL runs in Docker Compose; no native PostgreSQL install | One-command reproducible setup (NFR6); avoids port 5432 clashes | Native Windows install |
| D10 | 17 Oct 2026 | PP demo (M1) uses two simple signals: same component (folder rule) and TF-IDF lexical similarity; flag-for-review only; cross-agent pairs only | Small, reliable slice in time for 5 Nov; embeddings, Git graph, classifier and other policies follow in M2 | Showing unfinished components |
| D11 | 18 Oct 2026 | Runtime: Node.js 24 LTS instead of Node.js 22 | Already installed (v24.13.1); supported until April 2028, so it covers the final viva (Node 22 reaches end-of-life on 30 Apr 2027); all dependencies support it; no code change | Reinstalling Node.js 22 |
| D12 | 18 Oct 2026 | MCP TypeScript SDK 1.32.1 instead of 1.30.0 (`npm audit fix`, plus six transitive packages) | Fixes a high-severity SDK advisory (GHSA-6qxp-vccf-f47h) and six transitive advisories; `npm audit` reports 0 vulnerabilities; all tests, the build and the demo pass unchanged. The affected code (OAuth client, HTTP transport) is not used by DevMemory, so this is hygiene, not a functional change | Staying on 1.30 with known advisories |
