# Handoff: TASK-0011

## Task Summary

Completed the Castalia v0.2.5 correction so `castalia launch` is treated as a
standalone lightweight Linux GUI launcher, not a terminal UI.

## What Changed

- Confirmed the GUI implementation is present in `HEAD` at `a504184
  feat(castalia): introduce GUI launcher for Castalia and remove TUI dependency`.
- Kept the terminal fallback as `castalia launch-tui`; the supported path is
  `castalia launch`.
- Updated the Nix package wrapper to include GUI runtime dynamic libraries.
- Added Nix-packaged Noto CJK font availability via `CASTALIA_GUI_FONT_PATH` so
  Japanese prompt text renders in the egui launcher.
- Updated task worklog, verification, and handoff records.

## Why It Changed

The owner clarified that the terminal-native launcher was not the intended
product. The correct v0.2.5 release must provide a standalone Linux GUI
launcher, not a terminal application.

## Affected Files

- `product/apps/castalia/crates/castalia-cli/src/launcher.rs`
- `product/apps/castalia/crates/castalia-cli/src/main.rs`
- `product/apps/castalia/crates/castalia-cli/Cargo.toml`
- `product/apps/castalia/Cargo.lock`
- `product/apps/castalia/nix/package.nix`
- `product/apps/castalia/project.json`
- `product/apps/castalia/README.md`
- `harness/knowledge/product-specs/castalia/ARCHITECTURE.md`
- `harness/knowledge/product-specs/castalia/ROADMAP.md`
- `harness/runs/completed/TASK-0010-castalia-v0.2.5-release/handoff.md`
- `harness/runs/completed/TASK-0011-castalia-v0.2.5-gui-launcher-correction*`

## Validation Result

Passed:

- `bun nx run castalia:check`
- `bun nx run castalia:clippy`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- `bun nx run castalia:nix-build`
- non-interactive `castalia launch --query tc.pir --set change=test --no-copy`
- manual GUI open/close smoke test under Hyprland/Xwayland

## Remaining Risks

- The GUI uses `eframe`/`egui`; it is lighter than Tauri/WebView but still pulls
  a larger runtime surface than the old terminal implementation.
- Dev launches outside the Nix wrapper rely on local `fc-match` font discovery
  or `CASTALIA_GUI_FONT_PATH` for Japanese rendering.

## Follow-Up Tasks

- Consider adding automated window smoke coverage if Castalia GUI behavior grows.
- Consider switching from Xwayland fallback to native Wayland after confirming
  all required Wayland dynamic libraries are reliably available in dev and
  packaged environments.

## Memory Updates Made Or Proposed

No durable memory update was made.
