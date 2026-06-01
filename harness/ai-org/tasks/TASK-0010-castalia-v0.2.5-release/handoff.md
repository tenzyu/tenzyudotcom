# Handoff: TASK-0010

## Task Summary

Implemented Castalia v0.2.5 as a lightweight terminal-native launcher release.

## What Changed

- Added `product/apps/castalia/crates/castalia-cli/src/launcher.rs`.
- Added `castalia launch` with:
  - searchable prompt selection
  - title and preview rows
  - built-in single-line and multiline slot input
  - `--slot-input ui|editor|clipboard-first`
  - `$VISUAL`/`$EDITOR` escape hatch for slot values
  - `--query`, `--set`, and `--no-copy` support for direct launch/testing
- Removed `castalia rofi` as a supported command path; it now returns an
  explicit v0.2.5 removal error.
- Updated Nx targets so `dev` and `launch` use `castalia launch`; removed the
  old `rofi` target.
- Removed `rofi` from the Nix package wrapper inputs.
- Bumped Castalia version metadata to `0.2.5`.
- Updated Castalia README and product specs to describe `castalia launch`.
- Fixed the `nix-build` target output path for current Nx validation.

## Why It Changed

The owner decided v0.2.5 should stop depending on `rofi`, default to
Castalia-owned slot input, avoid Tauri overhead, stay Linux-only for now, and
keep `$EDITOR`/`$VISUAL` as the keybinding escape hatch. The terminal-native
launcher is the smallest implementation that satisfies those constraints without
introducing a daemon.

## Affected Files

- `product/apps/castalia/crates/castalia-cli/src/launcher.rs`
- `product/apps/castalia/crates/castalia-cli/src/main.rs`
- `product/apps/castalia/crates/castalia-core/src/lib.rs`
- `product/apps/castalia/project.json`
- `product/apps/castalia/Cargo.toml`
- `product/apps/castalia/Cargo.lock`
- `product/apps/castalia/nix/package.nix`
- `product/apps/castalia/README.md`
- `docs/product-specs/castalia/README.md`
- `docs/product-specs/castalia/ARCHITECTURE.md`
- `docs/product-specs/castalia/ROADMAP.md`
- `harness/ai-org/tasks/TASK-0010-castalia-v0.2.5-release/*`

## Validation Result

Passed:

- `bun nx run castalia:check`
- `bun nx run castalia:clippy`
- `bun nx run castalia:validate`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- `bun nx run castalia:nix-build`
- `git diff --check`
- direct launch smoke checks for `tc.pir`, `tc.db`, temporary prompt store UI
  and editor slot paths
- PTY interactive launcher check for search, select, multiline slot input, and
  render
- expected failure for removed `castalia rofi`

## Remaining Risks

- The launcher is terminal-native. A Hyprland keybind should invoke it through a
  terminal emulator such as `kitty --class castalia-launcher castalia launch`.
- Terminal raw mode depends on `stty` and `/dev/tty`.
- Editor slot mode writes a temporary file and deletes it after reading; a crash
  during editing could leave a temporary slot file behind.

## Follow-Up Tasks

- Decide whether a future graphical backend is still needed after using the
  terminal-native launcher.
- Consider adding a dedicated terminal UI integration test harness if launcher
  behavior grows.
- Consider documenting a concrete Hyprland window rule for the launcher terminal
  class.

## Memory Updates Made Or Proposed

No durable memory update was made.
