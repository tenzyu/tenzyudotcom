# Worklog: TASK-0008

## 2026-06-02

- Confirmed current Castalia v0.1 commands and Nx targets exist.
- Confirmed `bun nx run castalia:validate`, `castalia:run -- list`, and
  `castalia:run -- render tc.pir --prompt-dir prompts --set change=test` pass
  before v0.2 implementation.
- Confirmed `bun nx run castalia:verify` passes before v0.2 implementation.
- Noted current `init` sample list omits checked-in `tc.wr.md`.
- Added `ValidationReport`/`ValidationIssue` support in `castalia-core`.
- Made frontmatter parsing stricter for unknown keys, unknown modes/sources, and
  invalid boolean values.
- Added validation checks for safe ids, body/slot consistency, duplicate slots,
  duplicate ids, duplicate aliases, and id/alias conflicts.
- Added `castalia inspect`, `castalia new`, and `castalia edit`.
- Updated `init` samples to include `tc.wr.md`.
- Verified `new`, `inspect`, and `validate` against a temporary prompt store in
  `/tmp`.
- Initial non-interactive `edit` check used `EDITOR=true`, but the environment
  still had `VISUAL` set to Neovim. The spawned editor was killed and the check
  was rerun with both `VISUAL=true` and `EDITOR=true`.
- Bumped Castalia Cargo and Nix package version metadata to `0.2.0` and reran
  `castalia:verify`, `castalia:build`, and `git diff --check`.
