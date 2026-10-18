# PP demo script (60 to 75 seconds)

Status: plan. The exact prompts are finalised when M1 is built (by 2 Nov 2026).

## Before the presentation
1. Start Docker Desktop and wait for "Engine running".
2. In the DevMemory folder: `docker compose up -d`, then `npm run demo:reset` (creates a clean `demo-shop` project).
3. Open VS Code (Claude Code) and Cursor side by side, both on the `demo-shop` folder, both connected to DevMemory.
4. Open the dashboard in the browser on the Conflicts page.
5. Keep the recorded video ready in case anything fails.

## On stage
| Time | Action | What to say |
|---|---|---|
| 0:00 | Claude Code: "Record a decision for the auth module: keep stateless JWT access tokens. It concerns src/auth/." | "Claude Code records a decision about the auth module." |
| 0:15 | Cursor: "Record a decision for the auth module: replace JWT with server-side sessions. It concerns src/auth/." | "Cursor, from a different vendor, records the opposite decision about the same module." |
| 0:30 | Show the tool reply in Cursor: candidate conflict flagged. | "DevMemory does not overwrite either one. It flags a candidate conflict for review." |
| 0:40 | New Claude Code session: "What does the project memory say?" | "In the next session the agent is warned instead of trusting a stale decision." |
| 0:55 | Dashboard: conflict card with both decisions, agent, time and signals. | "The dashboard shows who wrote what, when, and why it was flagged. This is an early prototype, not results." |
