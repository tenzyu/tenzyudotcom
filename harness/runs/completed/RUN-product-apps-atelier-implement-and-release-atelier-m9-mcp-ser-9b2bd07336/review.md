# Review

## Summary

M9 (MCP server) and M10 (GUI) shipped in `product/apps/atelier`. Same core as CLI; mutations gated by `confirm: true` or `--allow-mutations`.

## Test evidence

- `bun test`: 47/47 pass (180 expects)
- `bun run typecheck`: clean
- `bun nx run atelier:check`: passes

## Coverage

- 8 MCP transport/tool tests (`src/__tests__/mcp.test.ts`)
- 11 GUI HTTP API tests (`src/__tests__/gui.test.ts`)
- 4 repo-owner resolver tests (`src/__tests__/owner.test.ts`)

## Risk

- Doctor reports 5 pre-existing `BROKEN_MARKDOWN_LINK` errors in `harness/knowledge/rules/compiled/AGENTS.md` (unrelated to M9/M10).
- MCP server uses a `registerTool` shim to bridge workspace `zod@4.4.3` and SDK internal `zod@4.3.6`. If the SDK is bumped, re-verify the shim still compiles.

## Rollback

Revert commit; no migration or schema change required.
