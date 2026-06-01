# Handoff: TASK-0013

## Task Summary

Adjusted Castalia's supported GUI launcher to request a more launcher-like native window and documented the tiling-window-manager rule needed when app-side hints are insufficient.

## What Changed

- Updated `run_egui_app` in `launcher.rs` to configure the root viewport with:
  - stable window title
  - Wayland app id `com.tenzyu.castalia.launcher`
  - smaller fixed launcher dimensions
  - centered eframe native option
  - non-resizable, non-maximized window
  - borderless decorations
  - X11 dialog window type
- Updated Castalia README to describe the launcher as a small centered dialog-style window.
- Added Hyprland `windowrulev2` examples for local float/center handling by stable title.
- Updated Castalia architecture docs with the launcher window behavior and WM limitation.
- Created TASK-0013 task records: brief, worklog, verification, and handoff.

## Why It Changed

The current GUI is treated as a normal tiled window by the window manager. The desired product experience is closer to `rofi`: invoke a temporary launcher that appears near the center, accepts input, and exits.

## Affected Files

- `product/apps/castalia/crates/castalia-cli/src/launcher.rs`
- `product/apps/castalia/README.md`
- `docs/product-specs/castalia/ARCHITECTURE.md`
- `harness/ai-org/tasks/TASK-0013-castalia-floating-centered-launcher/*`

## Validation Result

Passed:

- `bun nx run castalia:fmt`
- `bun nx run castalia:check`
- `bun nx run castalia:clippy`
- `bun nx run castalia:test`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- `git diff --check`
- noninteractive `castalia launch --query tc.pir --set change=test --no-copy --prompt-dir prompts`

Manual GUI smoke did not reach a visible Castalia window in this local worktree environment because dev/release GUI launch failed before window creation with runtime graphics issues. The exact failures are recorded in `verification.md`.

## Remaining Risks

- Hyprland/Wayland may still tile or refuse to client-center the window without explicit user-side rules.
- The documented Hyprland rule was not verified against a visible Castalia client in this session due to local graphical runtime failures.
- The stable app id helps Wayland identity, but Hyprland examples currently match title because Xwayland/native identity details can differ.

## Follow-Up Tasks

- Run packaged Castalia in the target Hyprland session and confirm the launcher appears floating and centered.
- If title matching is fragile, add or package a stable desktop entry/app id and update docs to prefer class/app-id matching.
- Investigate why local dev GUI launch failed with glutin config selection after resolving `libxkbcommon-x11.so`.

## Memory Updates Made Or Proposed

No durable memory update was made.
