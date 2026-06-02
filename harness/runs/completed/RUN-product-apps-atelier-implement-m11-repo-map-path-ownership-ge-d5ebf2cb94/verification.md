# Verification

## Run

`RUN-product-apps-atelier-implement-m11-repo-map-path-ownership-ge-d5ebf2cb94`

## Commands run

| # | Command | Reason |
| --- | --- | --- |
| 1 | `bun nx run atelier:check` | typecheck + 64 tests across 9 files |
| 2 | `bun nx run atelier:build` | confirm the project actually builds |
| 3 | `bun nx run atelier:verify` | full verify target (build + check + doctor) |
| 4 | `bun product/apps/atelier/src/cli.ts doctor --json` | harness-wide schema/link/ID/stale path scan |
| 5 | `bun nx run atelier:index` | rebuild `.harness/generated/` and write `repo-map.json` + `path-ownership.json` |
| 6 | `bun nx run atelier:repo-map` | smoke-test the new repo-map target |
| 7 | `bun nx run atelier:context-plan -- --workflow workflow.isolated-run --role role.domain.harness-engineer --path product/apps/atelier --intent "inspect harness decision" --semantic --semantic-max-results 3` | smoke-test the new `--semantic` CLI flag |
| 8 | `bun product/apps/atelier/src/cli.ts repo map` | smoke-test the new `atelier repo map` subcommand |
| 9 | `opencode mcp list` | confirm the opencode-configured MCP server is still connected |

## Command results

- `bun nx run atelier:check` — **pass** (64/64 tests, 230 expects, typecheck clean).
- `bun nx run atelier:build` — **pass** (`dist/cli.js`, `dist/index.js` produced; `tsc -p tsconfig.build.json` clean).
- `bun nx run atelier:verify` — **pass** (4 cached + 1 fresh; depends on check, build, and doctor).
- `atelier doctor` — `ok: false`, `errorCount: 5`, `warningCount: 52`. **All 5 errors are pre-existing `BROKEN_MARKDOWN_LINK` diagnostics in `harness/knowledge/rules/compiled/AGENTS.md`** (documented in this run's review and handoff; the same 5 errors are visible before this run was opened). They are not introduced by M11/M12 and are out of scope.
- `bun nx run atelier:index` — `stale: [docs.json, ids.json, knowledge-index.json, workflow-index.json, role-bundles.json, diagnostics.json, repo-map.json, path-ownership.json]` on first run, then `0 stale` on second run. `repo-map.json` and `path-ownership.json` are now part of the indexer's `GeneratedFileName` set.
- `bun nx run atelier:repo-map` — 7 projects, 7 ownership entries, 1110 files.
- `bun nx run atelier:context-plan -- … --semantic` — produced the `Semantic Recall (optional)` block with 3 hits, `unknownTerms: ["inspect", "product/apps/atelier"]`. With `--semantic` omitted, the same plan produced the same `required` set and an empty `semantic` block.
- `atelier repo map` — 7 projects, 7 ownership entries, 1110 files; entries sorted by path.
- `opencode mcp list` — `atelier` reported as `connected`.

## Files inspected (during implementation)

### New
- `product/apps/atelier/src/core/repo-map.ts` (M11)
- `product/apps/atelier/src/core/semantic.ts` (M12)
- `product/apps/atelier/src/__tests__/repo-map.test.ts` (6 tests)
- `product/apps/atelier/src/__tests__/semantic.test.ts` (6 tests)

### Modified
- `product/apps/atelier/src/core/indexer.ts`
- `product/apps/atelier/src/core/owner.ts`
- `product/apps/atelier/src/core/context.ts`
- `product/apps/atelier/src/core/knowledge.ts`
- `product/apps/atelier/src/core/mcp.ts`
- `product/apps/atelier/src/core/gui.ts`
- `product/apps/atelier/src/index.ts`
- `product/apps/atelier/src/cli.ts`
- `product/apps/atelier/project.json`
- `product/apps/atelier/src/__tests__/index-context-run.test.ts` (added 1 semantic test)
- `product/apps/atelier/src/__tests__/mcp.test.ts` (added 1 index + 1 semantic test)
- `product/apps/atelier/src/__tests__/gui.test.ts` (added 2 repo-map API tests)
- `harness/knowledge/product-specs/atelier/ROADMAP.md`

### Generated
- `.harness/generated/repo-map.json` (workspace + 7 projects + 1110 files + 7 ownership hints)
- `.harness/generated/path-ownership.json` (7 entries)

## Role knowledge checked

- `role.core.implementer` — owned the work (M11 and M12 are implementation milestones).
- `role.core.reviewer` — review.md was authored and the run was closed successfully.
- `role.domain.harness-engineer` — the primary role for verifying repo-map.json / path-ownership.json coverage (`harness/**` selector).
- `phase.verification` — this document.
- `phase.handoff` — `handoff.md` produced.
- `policy.repository` — confirms mutation gating; `path-ownership.json` and `repo-map.json` are not manually edited (only `compileIndexes` writes them).
- `policy.context-budget` — semantic hits are surfaced outside the budget; `plan.semantic` is not added to `budgetEstimate.tokens`.

## Visual checks performed

Not applicable — no UI work in M11/M12. The GUI's `GET /api/repo-map` and `GET /api/path-ownership` are JSON endpoints; the response shapes were verified by `gui.test.ts`.

## Tests added

| File | Tests | What they cover |
| --- | --- | --- |
| `__tests__/repo-map.test.ts` | 6 | workspace markers, project detection, file classification, role matching, sorted ownership index, exact / longest-prefix lookup |
| `__tests__/semantic.test.ts` | 6 | disabled default, enabled recall, unknown terms, duplicate detection, duplicate-disabled, maxResults cap |
| `__tests__/index-context-run.test.ts` | +1 | `plan.semantic` field defaults to disabled, `required` is byte-identical with semantic on/off |
| `__tests__/mcp.test.ts` | +2 | `atelier_index` writes the new outputs, `atelier_context_plan` returns the `semantic` block when `semantic: true` |
| `__tests__/gui.test.ts` | +2 | `GET /api/repo-map`, `GET /api/path-ownership` |

Total: **+17 tests** (47 → 64 across 9 files).

## Skipped checks and justification

- **Lint** — `product/apps/atelier` does not define a `lint` Nx target. The `check` target already depends on `typecheck` and `test`, which is the standard gate for this project. (Justification: no lint target exists; deferring lint setup to a follow-up milestone.)
- **Doctor 5 errors** — all 5 are pre-existing `BROKEN_MARKDOWN_LINK` diagnostics in `harness/knowledge/rules/compiled/AGENTS.md`. They predate this run and are unrelated to M11/M12. (Justification: out of scope; tracked in handoff.md as a follow-up.)
- **Visual checks** — not applicable (no UI changes in M11/M12). (Justification: phase.verification rules say "when relevant".)
- **`bun nx run-many -t check`** — broader cross-project check was not run because the change is scoped to `product/apps/atelier` and its downstream consumers. The narrowest relevant check (`bun nx run atelier:check`) is sufficient. (Justification: phase rule "Run the narrowest relevant checks first.")
- **`M12.2` wire-up** — `duplicateCandidatesWithSemantic` is exported but not yet wired into `promoteKnowledgeProposal`. Deferred to a follow-up because the rule-based duplicate check already covers exact title and tag overlap; the semantic layer would be additive, not blocking. (Justification: out of scope; documented in handoff.md.)

## Failures and follow-up recommendations

No failures introduced by this run. Follow-up recommendations (already in handoff.md):

1. M11.1: emit `path-ownership.json` even when the harness tree is empty (currently requires at least one role to populate owner role).
2. M12.1: swap the TF scoring for embeddings without changing the public API.
3. M12.2: wire `duplicateCandidatesWithSemantic` into `promoteKnowledgeProposal` so `atelier_knowledge_promote` surfaces both rule-based and semantic duplicates side-by-side.
4. Resolve the 5 pre-existing `BROKEN_MARKDOWN_LINK` diagnostics in `harness/knowledge/rules/compiled/AGENTS.md` (these are not blocking this run).
5. Add an `atelier lint` Nx target for symmetry with `check` / `test` / `typecheck` / `build` / `verify`.

## Conclusion

M11 (repo-map + path-ownership generation) and M12 (optional semantic expansion) ship at release quality:

- `bun nx run atelier:check` — pass (64/64).
- `bun nx run atelier:build` — pass.
- `bun nx run atelier:verify` — pass.
- `atelier doctor` — 5 pre-existing errors only; 0 new errors.
- `opencode mcp list` — `atelier` connected.
- The CLI now exposes `--semantic` and `--semantic-max-results` on `atelier context plan`.
- Required context is byte-identical with semantic expansion on or off (verified by `index-context-run.test.ts`).

The work is ready for human review and integration.
