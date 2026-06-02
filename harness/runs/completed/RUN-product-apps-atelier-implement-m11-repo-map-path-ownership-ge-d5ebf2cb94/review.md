# Review

## Summary

M11 (repo-map + path-ownership generation) and M12 (optional semantic expansion) shipped in `product/apps/atelier`. M11 builds deterministic facts from the filesystem tree and role selectors. M12 adds recall (deterministic TF, no embeddings) that only contributes to `plan.semantic.*` and never to required context.

## Test evidence

- `bun test`: 63/63 pass (226 expects, +16 from M11/M12)
- `bun run typecheck`: clean
- `bun nx run atelier:check`: passes
- `bun nx run atelier:repo-map`: produces 7 projects, 7 ownership entries, 1110 files
- `opencode mcp list`: `atelier` connected

## Coverage

- 6 `repo-map.test.ts` tests (workspace markers, project detection, file classification, role matching, path-ownership index, lookup)
- 6 `semantic.test.ts` tests (disabled, enabled hits, unknown terms, duplicate detection, maxResults)
- 1 `index-context-run.test.ts` (full index roundtrip still works)
- 1 `mcp.test.ts` (`atelier_index` writes the new outputs, `atelier_context_plan` returns semantic field)
- 2 `gui.test.ts` (`GET /api/repo-map`, `GET /api/path-ownership`)

## Files added

- `product/apps/atelier/src/core/repo-map.ts` (M11)
- `product/apps/atelier/src/core/semantic.ts` (M12)
- `product/apps/atelier/src/__tests__/repo-map.test.ts`
- `product/apps/atelier/src/__tests__/semantic.test.ts`

## Files modified

- `product/apps/atelier/src/core/indexer.ts` — `repo-map.json` and `path-ownership.json` added to `GeneratedFileName`
- `product/apps/atelier/src/core/owner.ts` — fast lookup from generated cache; new `harness-repo-map` source
- `product/apps/atelier/src/core/context.ts` — `plan.semantic.{enabled,hits,unknownTerms}` when `options.semantic === true`
- `product/apps/atelier/src/core/knowledge.ts` — `duplicateCandidatesWithSemantic` exported
- `product/apps/atelier/src/core/mcp.ts` — `atelier_context_plan` gains `semantic` and `semanticMaxResults`
- `product/apps/atelier/src/core/gui.ts` — `GET /api/repo-map` and `GET /api/path-ownership`
- `product/apps/atelier/src/index.ts` — exports new modules
- `product/apps/atelier/src/cli.ts` — `atelier repo map` subcommand and usage line
- `product/apps/atelier/project.json` — `repo-map` Nx target
- `harness/knowledge/product-specs/atelier/ROADMAP.md` — M11/M12 status: shipped

## Risk

- M11 filesystem walker ignores `node_modules`, `.git`, `.harness`, etc. Cap is 5000 files per walk; for the current repo this is 1110 files. Increase if needed.
- M12 is deterministic TF (no embeddings, no semantic similarity model). The terms are tokenized; stop words and short tokens are dropped. A future M12.1 can swap the scoring function for embeddings without changing the API surface.
- Manual ownership parsed from `harness/knowledge/repo-map.md` is regex-based and matches the existing markdown table format. If the table format changes, `extractManualOwnershipFromRepoMap` must be updated.

## Rollback

Revert commit; generated `repo-map.json` and `path-ownership.json` will simply be missing and `repoOwner` falls back to dynamic resolution.
