# Verification

## Test & typecheck

- `bun test`: 47/47 pass (180 expects)
- `bun run typecheck`: clean
- `bun nx run atelier:check`: passes

## New test files

- `src/__tests__/mcp.test.ts` — 8 tests (MCP transport, all 12 tools, mutation safety)
- `src/__tests__/gui.test.ts` — 11 tests (static assets, /api/* endpoints, mutation safety)
- `src/__tests__/owner.test.ts` — 4 tests (Nx project + role selector resolution)

## Acceptance check (M9)

- [x] MCP tools call the same core as CLI. `src/core/mcp.ts` calls `initRun`, `closeRun`, `runStatus`, `proposeKnowledge`, etc. — no parallel implementation.
- [x] MCP server is launched via `atelier mcp` (stdio), registered in `.agent/mcp.json` as the `atelier` server.
- [x] 12 tools exposed: `atelier_doctor`, `atelier_index`, `atelier_context_plan`, `atelier_run_init`, `atelier_run_status`, `atelier_run_close`, `atelier_knowledge_propose`, `atelier_knowledge_promote`, `atelier_knowledge_reject`, `atelier_id_rename`, `atelier_repo_owner`, `atelier_generate`.
- [x] MCP `atelier_context_plan` returns the same plan as CLI `atelier context plan`.
- [x] MCP `atelier_run_init` writes the same `brief.md`, `context.md`, `context.manifest.json` as CLI.
- [x] Mutation safety: every mutating tool requires `confirm: true` unless the server was started with `--allow-mutations`. Verified by `mcp.test.ts`.
- [x] Failure messages are actionable (e.g. "Mutation refused: 'atelier_run_init' requires confirm=true...").

## Acceptance check (M10)

- [x] GUI server launched via `atelier gui` (Bun.serve, 127.0.0.1).
- [x] Static assets in `product/apps/atelier/src/gui/` (no build step): `index.html`, `app.js`, `styles.css`.
- [x] 5 screens: Doctor, Role Bundles, Context Plan, Knowledge Inbox, ID Rename.
- [x] JSON API at `/api/*` for programmatic access.
- [x] GUI does not become source of truth: all reads/writes go through core; no client-side persistence.
- [x] Mutation safety: identical to MCP — `confirm: true` or `--allow-mutations`.

## Notes

- Doctor reports 5 pre-existing `BROKEN_MARKDOWN_LINK` errors in `harness/knowledge/rules/compiled/AGENTS.md` (unrelated to M9/M10).
- MCP / GUI test runs use `mkdtempSync` for hermetic PROJECT_ROOT. The shared fixture seeds `harness/actions/{workflows,roles}/**`, `harness/policies/**`, and `product/apps/atelier/package.json`.
- `runMcpServer` keeps the process alive via `transport.onclose` + SIGINT/SIGTERM signals so the CLI does not need to call `process.exit` (which would race the stdio transport).
- Zod dual-version mismatch between workspace `zod@4.4.3` and the SDK's internal `zod@4.3.6` is bridged by a `registerTool` shim that casts at the SDK boundary.
