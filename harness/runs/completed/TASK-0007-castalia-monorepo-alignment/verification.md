# Verification: TASK-0007

## Commands Run

- `cargo fmt --all` from `product/apps/castalia`
- `bun run policy:deps`
- `bun nx run castalia:verify`
- `bun nx run castalia:validate`
- `bun nx run castalia:run -- render tc.pir --prompt-dir prompts --set change=test`
- `bun run verify:workspace`
- `bun nx run linter:check`
- `bun nx show project castalia --json`
- `git diff --check`

## Command Results

- Initial `bun run policy:deps` after skipping missing package files failed on
  existing `catalog:` dependencies because the policy compared literal
  `catalog:` values against stale standard versions.
- Initial `bun nx run castalia:verify` after project target fixes failed on
  clippy `io_other_error`.
- Final `bun run policy:deps`: passed.
- Final `bun nx run castalia:verify`: passed. It ran Rust fmt check, cargo
  check, clippy with `-D warnings`, cargo tests, and repo prompt validation.
- `bun nx run castalia:validate`: passed with `ok: 8 prompt(s) in prompts`.
- `bun nx run castalia:run -- render tc.pir --prompt-dir prompts --set change=test`:
  passed and rendered `test` into the `{{change}}` slot.
- `bun run verify:workspace`: passed.
- `bun nx run linter:check`: passed with 28 tests.
- `bun nx show project castalia --json`: confirmed run/validate targets resolve
  to `cargo run -p castalia`.
- `git diff --check`: passed.

## Files Inspected

- `AGENTS.md`
- `harness/policies/repository.md`
- `harness/canon/charter.md`
- `harness/knowledge/repo-map.md`
- `harness/actions/roles/implementer.md`
- `harness/actions/roles/repo-ops-engineer.md`
- `harness/actions/workflows/implementation.md`
- `harness/actions/workflows/verification.md`
- `harness/actions/workflows/handoff.md`
- `repo-ops/scripts/check-dependency-policy.ts`
- `product/apps/castalia/project.json`
- `product/apps/castalia/Cargo.toml`
- `product/apps/castalia/crates/castalia-cli/Cargo.toml`
- `product/apps/castalia/crates/castalia-core/src/lib.rs`
- `product/apps/castalia/prompts/*.md`

## Visual Checks Performed

Not applicable.

## Tests Added Or Not Added

- Added a Rust unit test for comma-separated alias/tag frontmatter without
  brackets.
- No repo-ops unit test was added because the dependency policy script currently
  has no dedicated test harness; behavior is covered by running
  `bun run policy:deps` against the live workspace.

## Skipped Checks And Justification

- Full `bun nx run-many -t check` was not run. The change touched castalia and
  repo-ops policy; `castalia:verify`, `verify:workspace`, and `linter:check`
  cover the affected surfaces more directly.

## Failures And Follow-Up Recommendations

- No remaining verification failures.
- Follow-up: consider adding unit tests for `check-dependency-policy.ts` if this
  script grows additional branch logic.
