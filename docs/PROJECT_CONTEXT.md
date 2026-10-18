# DevMemory: project source of truth (consolidated 17 Oct 2026)

Use this file as the working context for every next step (presentation script, prototype, IPD, dissertation).
Later decisions override earlier ones. Items under "Open" are not decided; ask, never assume.

## People and module
- Student: Deny Shabtheswar. IIT ID 20241003, UoW ID W2152967, IIT email shabtheswar.20241003@iit.ac.lk.
- Degree: BSc (Hons) Computer Science. Module 6COSC023C Computer Science Final Project 2026/27 (IIT with University of Westminster).
- Supervisor: Ajeevan Sivanandhan (title Mr./Dr. not confirmed; email seen: ajeevan.s@iit.ac.lk).
- Module leader emails: Guhanathan Poravi.

## Assessment dates (official)
- Formative: email current PP slides + supporting evidence to the supervisor by Mon 19 Oct 2026 (no central collection).
  Evidence list: slides; literature evidence (papers, survey matrix); problem/gap analysis; technical investigations
  (datasets, technology comparisons, feasibility); methodology work; prototype code / early results.
- PP summative: slides + signed ethics form by 5 Nov 2026 via Blackboard / Google Form (ethics form "yet to receive from UoW").
  Missing ethics, slides or viva means PP = 0. No written PP report.
- PP live: 20-minute presentation + 20-minute viva, 9 to 26 Nov 2026. PP marks 3 Dec 2026.
- IPD: 28 Jan 2027. Final report + code + recorded demo: 5 Apr 2027. Final viva: 19 Apr to 14 May 2027.

## Final project direction
DevMemory: "Detecting and Resolving Cross-Agent Memory Conflicts in Multi-Writer AI Project Memory, with a Controlled Repeat-Failure Benchmark".
A conflict-aware, multi-writer, event-sourced project memory served over MCP, written by independent AI coding agents
from different vendors (Claude Code and Cursor), plus a seeded, reproducible benchmark that measures repeat-failure prevention.

Problem statement: memory systems for AI coding agents either assume one writer or share memory among one platform's agents
without detecting contradictions between stored facts. When independent agents write to one project memory, contradictory
facts are stored and served undetected, and no controlled benchmark measures whether the memory prevents repeated failures.

Main RQ: How can a shared, event-sourced project memory written by multiple independent AI coding agents detect and resolve
conflicting facts, and how effectively does it prevent repeated failures compared with single-writer and naive multi-writer memory?
- SRQ1 Detection: what conflicting/overlapping memory arises, and how reliably can it be detected automatically?
- SRQ2 Resolution: which policy (last-write-wins, recency-weighted, flag-for-review, LLM-as-judge) best agrees with humans, at what cost (false positives, latency, tokens)?
- SRQ3 Structure: does linking events to files/components improve detection over textual and semantic similarity alone?
- H1: naive multi-writer memory accumulates more stale/contradictory facts than single-writer or conflict-aware memory.
- H2: heuristic policies agree with humans less often than an LLM judge but at far lower latency and cost (a trade-off).
- H3: structural signals raise precision more than recall.
(PPRS draft still uses RQ1-RQ4: RQ1 benchmark, RQ2 detection, RQ3 resolution, RQ4 structure. Same content.)

Aim: analyse, design, develop and evaluate a conflict-aware, multi-writer project memory for AI coding agents that detects and
resolves conflicting facts recorded by independent agents, and measure its effect on repeated failures through a controlled, reproducible benchmark.

Objectives O1-O6 (RO1-RO13 in backup B1 / PPRS Table 2): O1 literature + existing systems; O2 requirements from literature,
existing systems, prototype and expert interviews; O3 design (multi-writer memory, detection layer, 4 policies, benchmark protocol);
O4 implement on the existing core; O5 evaluate 4 configurations + ablation on a held-out split; O6 analyse and report (dissertation, released benchmark, paper draft).

Gaps -> contributions:
- G1 no cross-vendor coding-agent memory detects conflicts between independent writers -> C1 conflict-aware multi-writer memory on an event-sourced MCP core.
- G2 no controlled, peer-reviewed repeat-failure measure (single-agent attempts self-reported/inconclusive) -> C2 seeded reproducible multi-writer repeat-failure benchmark.
- G3 conflict studies ignore project structure; similarity alone near chance (AUROC 0.59) -> C3 evidence on file/component signals.
- G4 no comparison of resolution policies vs human judgement and cost -> C4 four-policy comparison (agreement vs latency vs tokens).
Wording rule: "based on the literature reviewed and the search strategy used, limited evidence was found..." Never "nobody has done this".

## Required features (final)
Must (IPD, 28 Jan 2027):
- R1/FR1 accept writes from 2+ independent MCP clients; every event tagged with agent, session and time.
- R2/FR2 flag candidate conflicts among decision, bug and TODO events before they are served as context.
- FR3 classify candidate pairs: contradiction / refinement / unrelated.
- R3 detection combines type-aware heuristics + semantic similarity + file/component links; similarity is "same subject", never "agreement".
- R4/FR4 four interchangeable resolution policies on identical conflicts: last-write-wins, recency-weighted, flag-for-review, LLM-as-judge.
- R5/FR5 deterministic replay of seeded histories with fixed dev/test splits through the configurations.
- R6/FR6 append-only auditable history; resolutions are appended as events, nothing deleted.
- R7/FR7 default-on redaction of credentials and secrets before storage.
Should (final, 5 Apr 2027):
- R8/FR8 write latency (p50, p95) and token cost per policy against a configurable budget.
- R9/FR9 read-only dashboard: conflicts, each policy's outcome, provenance, benchmark metrics.
- FR10 export results for statistical analysis.
Could: FR11 ingest real sessions from additional MCP clients. Won't: FR12 automatic source-code repair after a resolution.
Non-functional: NFR1 reproducibility (M); NFR2 auditability/provenance (M); NFR3 privacy, corpus and embeddings local, secrets redacted (M);
NFR4 extensibility, a new policy = one class behind the shared interface (S); NFR5 p95 write latency reported vs budget (S);
NFR6 one-command setup with Docker Compose (S); NFR7 dashboard WCAG 2.2 AA (S); NFR8 LLM token spend capped per run (S).

## Architecture and technology (final choices)
- Writers: Claude Code and Cursor over MCP (two vendors), plus a scripted MCP client for deterministic replay.
- MCP server (TypeScript, official MCP SDK 1.30) -> MemoryService -> EventRepository port -> PostgreSQL adapter (prod) / in-memory adapter (tests).
- Memory: append-only memory_events log with actor; current state = pure projection function.
- Component graph: edge table in PostgreSQL (event > file > component), built from commit file paths (Git). Not Neo4j.
- Semantic signal: all-MiniLM-L6-v2 run locally with Sentence-Transformers; all-mpnet-base-v2 as sensitivity check; TF-IDF as lexical baseline.
- LLM judge: version-pinned Claude model via API, temperature 0, cached, order-swapped prompts (position bias); local open-weight model as fallback.
- Baselines: last-write-wins and recency-weighted (CRDT / deterministic).
- Benchmark harness: seeded repositories, scripted two-agent histories, injected conflicts and repeat failures; runs C0-C3 + A1.
- Dashboard: React + Vite (TypeScript), read-only. Analysis: Python 3.12 (pandas, SciPy, Matplotlib). Tests: Vitest 4.
- Runtime: Node.js 24 LTS (changed from 22 on 18 Oct 2026, D11), TypeScript; Docker Compose; Git/GitHub; Zotero, Word, draw.io for writing.
- Hardware: 16 GB RAM, 8-core CPU, 256 GB SSD; GPU optional. Metered costs: LLM API (capped), AI client plans.
- Hardest part: telling a genuine contradiction from a refinement or deliberate supersession in free text by different agents.

## Existing proof of concept (built and verified, Aug 2026)
devmemory.zip: MCP server with 8 tools (get_project_memory, record_decision, report_bug, resolve_bug, add_todo, complete_todo,
add_note, search_memory); 6 event types (decision_recorded, bug_reported, bug_resolved, todo_added, todo_completed, note_added);
tables projects + memory_events (JSONB payload, nullable actor, pg_trgm search index); ports-and-adapters; pure projector;
13 passing unit tests (8 projector + 5 service); demo client end-to-end through MCP and PostgreSQL; Docker Compose; MCP SDK ^1.30, TypeScript ^7, Vitest ^4, zod, pg.
Still to build: mandatory actor/session/time tagging; component graph; detection layer (heuristics, embeddings, graph, classifier);
4 policies behind one interface; redaction; seeded corpus, annotation guide, harness; latency/token reporting; dashboard.

## Research method (final)
- Pragmatism; deductive; mixed methods; experiment within design science (Hevner et al., 2004) plus interviews and archival research; cross-sectional.
- Development: iterative and incremental, two-week iterations, MoSCoW; design OOADM (policies behind one interface). Waterfall and Scrum rejected.
- Data: seeded repositories (own or permissively licensed), scripted two-identity histories, injected repeat-failure and cross-agent conflict
  scenarios (MemConflict-style injection), plus a few real Claude Code/Cursor sessions on the author's own repositories.
- Validation: provenance/licence per repo; annotation guide + pilot; second annotator on a stratified sample, Cohen's kappa;
  split by repository (tune on dev, report on held-out test); class balance reported; dataset versioned and released.
- Configurations: C0 no memory; C1 single-writer (PROJECTMEM-style); C2 naive multi-writer; C3 DevMemory conflict-aware; A1 = C3 without component graph.
- Metrics: repeat failures prevented per injected attempt; stale/contradictory facts served; detection P/R/F1; false-positive rate vs history length;
  resolution agreement with human-preferred resolution; latency p50/p95; tokens per write; kappa. Proportions with 95% Wilson intervals.
  Detection/resolution measured directly; latency isolated from harness scheduling; negative results reported.
- Expert interviews ONLY (decided 16 Oct 2026, supervisor's advice; no survey, no brainstorming): 5-8 experts (engineers using 2+ AI coding tools;
  LLM-agent researchers); semi-structured, 30-40 min, online; round 1 late Nov-Dec 2026 validates requirements; round 2 Mar 2027 reviews dashboard
  and sample resolutions; information sheet, signed consent, recording only with permission, pseudonyms P1-P8, recordings deleted after transcription,
  withdrawal until anonymisation; thematic analysis (Braun and Clarke, 2006); Davis et al. (2006) supports interviews. Only after ethics approval.

## LESP / EDI / sustainability (final)
- BCS Code of Conduct mapping; PDPA No. 9 of 2022 (Sri Lanka) and DPA 2018 (UK); licences recorded; default-on redaction; own repos only for real sessions.
- Wrong automatic resolution -> append-only history, flag-for-review, provenance on dashboard. Over-reliance -> human review, stated limitations.
- Protocol fixed before experiments; GenAI use disclosed (Consensus, NotebookLM, Claude) with register (B10).
- EDI: small purposive interview sample, composition reported; English-only events; LLM-judge bias checked; WCAG 2.2 AA; open-source stack.
- Sustainability: local CPU embeddings; judge only on candidates, cached, capped; small repos; tokens and latency first-class metrics.
- SDG 9.5 and SDG 8.2 only. Out of scope: memory poisoning (Ju et al., 2026), inter-agent leakage (El Yagoubi et al., 2026).

## Schedule (deck slide 19)
WP1 lit review Sep-Nov 2026 (+updates Jan-Mar); WP2 requirements/ethics/interviews Oct 1-Nov 5 and Nov 23-Dec 23; WP3 design and protocol Nov 9-Dec 31;
WP4 Must build Nov 16-Jan 20 (+buffer to Jan 27); WP5 corpus and annotation Dec 1-Feb 15; WP6 Should build Feb 1-Mar 10; WP7 experiments and
expert review Feb 15-Mar 20 (+buffer to Apr 3); WP8 dissertation Jan 4-Apr 3; WP9 assessment prep. Top risk: time (16).

## Deliverables produced so far (outputs folder)
DevMemory_PP_Presentation_v2.pptx/.pdf (36 slides: 25 main incl. 3 reference slides and Thank-you, + B1-B11; speaker-note timings 0:00-20:00;
navy/charcoal/gold design, Cambria/Calibri); PPRS_DevMemory_v2.docx; paper map artifact https://claude.ai/artifact/NNvEmMEbp8CezBRkQgL257
(56 verified refs, 55 cited in deck, 46 in PPRS); devmemory.zip (PoC); phase-0-feasibility-report.md.
Build sources in scratchpad/pp: build_deck_v2.js, refs.js, build_map.py, tools/*.

## Decisions of 17 Oct 2026
- The PP live presentation will include a small working prototype demo (milestone M1, freeze 2 Nov): Claude Code and Cursor write
  opposite decisions about one component; DevMemory flags a candidate conflict (same component or TF-IDF similarity, cross-agent only,
  flag-for-review); the next session sees it; a read-only dashboard page shows provenance. Always called "early prototype, not results".
  A demo slide is added to the deck after the proposed-solution slide; recorded video as backup.
- Development happens in a separate Claude Code session (VS Code on the user's Windows laptop) inside the DevMemory repo, guided by
  CLAUDE.md, docs/PROJECT_CONTEXT.md (this file), docs/PROTOTYPE_PLAN.md and docs/DECISIONS.md. This chat keeps documents
  (script, ethics form, PPRS/dissertation, viva prep, formative pack).
- Environment: Windows; VS Code + Claude Code installed; installing Git, Node.js 22, Python 3.12, Docker Desktop (WSL 2), Cursor via winget;
  PostgreSQL 16 runs in Docker Compose (no native install). GitHub repo to be published as private from VS Code by the user.
- Presentation script: word-for-word script plus short cue cards per slide; about 18 minutes of speaking to leave margin in the 20.
- Formative evidence pack for the supervisor: prepare on 18 Oct (due Mon 19 Oct).
- Architecture: three layers (presentation, functionality, database), docs/architecture/DevMemory_Architecture.drawio/.png.

## Decisions of 18 Oct 2026
- Runtime is Node.js 24 LTS, not 22 (D11): the laptop already had v24.13.1; 24 is supported until April 2028, past the final viva,
  while 22 reaches end-of-life on 30 Apr 2027. The deck/PPRS tech-stack line and the architecture PNG still say 22 and need updating.

## Open (ask, do not assume)
- Ethics form: waiting for the UoW form. Need Part B, exemplar consent form and information sheet, Code of Practice; applicant/supervisor details; interview specifics.
- Supervisor title; second annotator identity; PPRS title-page placeholders; whether PPRS RQs should be aligned to the deck structure.
- "Starter Pack" email (15 Oct) zip not readable here.
