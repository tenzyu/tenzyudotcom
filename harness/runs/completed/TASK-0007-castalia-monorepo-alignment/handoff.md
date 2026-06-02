# Handoff: TASK-0007

## Task Summary

Aligned castalia with monorepo validation while preserving its Rust-only app
shape and avoiding a fake app-local `package.json`.

## What Changed

- Dependency policy now skips `product/apps/*` and `product/packages/*`
  directories that do not contain `package.json`.
- Dependency policy resolves Bun `catalog:` entries from the root workspace
  catalog before checking standard dependency versions.
- Updated standard dependency versions in the policy to match the current root
  catalog.
- Fixed castalia Nx run/validate targets to call Cargo package `castalia`.
- Made castalia prompt validation target use checked-in `prompts`.
- Applied Rust formatting, derived default enum variants, and fixed clippy
  `io_other_error`.
- Added a Rust unit test for comma-separated frontmatter arrays.
- Added slots to checked-in form prompts and replaced prose placeholders with
  `{{slot}}` markers.

## Why It Changed

Castalia is an Nx app but not a Node package. Monorepo checks should understand
that distinction, while castalia-specific Nx targets still need to be runnable
and hermetic.

## Affected Files

- `repo-ops/scripts/check-dependency-policy.ts`
- `product/apps/castalia/project.json`
- `product/apps/castalia/crates/castalia-core/src/lib.rs`
- `product/apps/castalia/crates/castalia-cli/src/main.rs`
- `product/apps/castalia/prompts/tc.card.md`
- `product/apps/castalia/prompts/tc.pir.md`
- `product/apps/castalia/prompts/tc.ps.md`
- `product/apps/castalia/prompts/tc.pub.md`
- `harness/runs/completed/TASK-0007-castalia-monorepo-alignment*`

## Validation Result

Passed:

- `bun run policy:deps`
- `bun nx run castalia:verify`
- `bun nx run castalia:validate`
- `bun nx run castalia:run -- render tc.pir --prompt-dir prompts --set change=test`
- `bun run verify:workspace`
- `bun nx run linter:check`
- `git diff --check`

## Remaining Risks

- The dependency policy script still has no dedicated unit test harness.
- `castalia:run`, `castalia:dev`, and `castalia:rofi` remain user-environment
  oriented targets; only `validate` and `verify` are pinned to repo prompts.

## Follow-Up Tasks

- Add focused tests for `check-dependency-policy.ts` if repo policy behavior
  becomes more complex.

## Memory Updates Made Or Proposed

No durable memory update was made. Proposed: add castalia ownership to
`harness/knowledge/repo-map.md` once its long-term owner role is decided.
