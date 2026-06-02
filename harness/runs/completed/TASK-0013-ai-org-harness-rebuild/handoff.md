# Handoff: TASK-0013

## Summary

Consolidated the LLM-facing harness into `harness/ai-org/`, added the root operating guide, added focused agent/workflow/skill files, moved ADRs and related harness docs, and updated path references that were still pointing at the old `docs/` layout.

## What Changed

- Added `harness/canon/legacy/root-HARNESS.md` as the top-level operating guide.
- Added new AI-org roles for task intake, work, review, and ADR distillation.
- Added `task-lifecycle.md` and `adr-distillation.md` workflows.
- Added Git, Nx, and `@tenzyu/linter` guardrail skills.
- Moved LLM-facing docs into `harness/ai-org/` and removed `repo-ops/harness`.
- Moved ADRs into `harness/knowledge/decisions/adr/`.
- Updated repo docs and repo-ops scripts to use the new paths.
- Recorded the consolidation decision as ADR 0004.

## Why It Changed

The repository harness had split across multiple roots, which made context loading and agent handoff expensive. The owner chose to consolidate all LLM-facing material under `harness/ai-org/` and to move ADRs there as well.

## Affected Files

- `harness/canon/legacy/root-HARNESS.md`
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `README.md`
- `PLANS.md`
- `harness/knowledge/structure.md`
- `harness/policies/repository.md`
- `harness/knowledge/product-specs/site/architecture.md`
- `harness/knowledge/product-specs/site/lint-symbol-ownership.md`
- `harness/canon/legacy/ai-org-readme.md`
- `harness/canon/charter.md`
- `harness/knowledge/index.md`
- `harness/knowledge/repo-map.md`
- `harness/knowledge/decisions/README.md`
- `harness/knowledge/decisions/adr/*`
- `harness/actions/roles/*`
- `harness/actions/workflows/*`
- `harness/policies/tools/*`
- `harness/ai-org/exec-plans/*`
- `harness/ai-org/knowledge/design-docs/*`
- `harness/knowledge/references/*`
- `harness/observations/audits/*`
- `harness/knowledge/specs/docs/*`
- `repo-ops/scripts/compile-agents-md.ts`
- `repo-ops/scripts/compile-agents-md.test.ts`
- `repo-ops/scripts/docs-rename.ts`
- `repo-ops/scripts/docs-rename.test.ts`
- `repo-ops/scripts/migrate-notes-threading.ts`
- `repo-ops/scripts/migrate-notes-threading.test.ts`
- `product/packages/linter/src/rules/*.ts`

## Validation

- `git diff --check` passed.
- `bun run policy:deps` passed.
- `bun run test:scripts` passed.
- `bun nx run linter:check` passed after worktree dependencies were installed.
- `bun nx run-many -t check` loaded the graph after `bun install`, then failed on existing project issues in `osu-skin-core`, `skin-workbench`, and `web`.

## Remaining Risks

- Some old-path references may still exist in historical completed plans or product docs that intentionally preserve history.
- Broad `run-many -t check` is still red because of project issues outside this harness task.

## Follow-Up Tasks

- Fix or separately triage existing broad check failures in `osu-skin-core`, `skin-workbench`, and `web`.
- Decide whether any remaining human-facing docs should point to the new harness reference roots.
- Consider adding an index file for `harness/policies/tools/` if future tool guardrails grow.

## Memory Updates

- Made: ADR 0004 and memory index updates for the new LLM-facing roots.
- Proposed: none.
