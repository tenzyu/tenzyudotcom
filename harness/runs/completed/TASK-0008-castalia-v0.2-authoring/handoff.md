# Handoff: TASK-0008

## Task Summary

Implemented Castalia v0.2 prompt authoring stability for the existing Rust
Linux CLI.

## What Changed

- Added validation report types and directory-level validation in
  `castalia-core`.
- Made frontmatter parsing stricter for unknown keys, unknown modes/sources, and
  invalid boolean values.
- Added checks for safe prompt ids, duplicate ids, duplicate aliases, id/alias
  conflicts, duplicate slots, empty bodies, and undefined `{{slot}}` markers.
- Added `castalia inspect <query>`.
- Added `castalia new <id>` with no-overwrite file creation and conflict checks.
- Added `castalia edit <query>` using `$VISUAL` or `$EDITOR`, followed by
  validation.
- Updated `init` to include the checked-in `tc.wr.md` sample.
- Bumped Castalia Cargo and Nix package metadata to `0.2.0`.
- Updated Castalia product and app documentation for v0.2 authoring behavior.
- Added task brief, plan, worklog, verification, and handoff records.

## Why It Changed

The roadmap defines v0.2 as prompt authoring stability before desktop editor,
sync, Android, or browser work. These changes keep Markdown prompt files as the
source of truth while making authoring safer from the CLI.

## Affected Files

- `product/apps/castalia/crates/castalia-core/src/lib.rs`
- `product/apps/castalia/crates/castalia-cli/src/main.rs`
- `product/apps/castalia/Cargo.toml`
- `product/apps/castalia/Cargo.lock`
- `product/apps/castalia/nix/package.nix`
- `product/apps/castalia/README.md`
- `docs/product-specs/castalia/ARCHITECTURE.md`
- `docs/product-specs/castalia/ROADMAP.md`
- `harness/ai-org/tasks/TASK-0008-castalia-v0.2-authoring/*`

## Validation Result

Passed:

- `bun nx run castalia:fmt`
- `bun nx run castalia:check`
- `bun nx run castalia:validate`
- `bun nx run castalia:clippy`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- representative `castalia:run` smoke checks for `inspect`, `render`, `new`,
  `validate`, and `edit`
- expected-failure checks for unsafe ids and id/alias conflicts
- `git diff --check`

## Remaining Risks

- CLI argument parsing is still a small hand-written parser. This is acceptable
  for the current command set, but a future expansion may justify `clap`.
- `edit` executes `$VISUAL` or `$EDITOR` as a command without parsing embedded
  arguments such as `code --wait`.
- No dedicated CLI integration test harness exists yet.

## Follow-Up Tasks

- Add a CLI integration test harness if Castalia grows more authoring commands.
- Consider supporting editor commands with arguments if the intended editor is
  commonly configured that way.
- Run `castalia:nix-build` before publishing a Nix flake artifact if the release
  process requires proving the wrapped package output.

## Memory Updates Made Or Proposed

No durable repo memory update was made. Proposed: add Castalia ownership to
`harness/ai-org/memory/repo-map.md` once its long-term owner role is decided.
