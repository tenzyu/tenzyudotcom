# TASK-0013: Make Castalia Launcher Floating And Centered

## Background

Castalia v0.2.5 replaced the supported `rofi` launch path with `castalia launch`, a short-lived Castalia-owned Linux GUI. The current GUI opens as a normal application window, so window managers can tile it. This differs from the expected `rofi`-like launcher feel.

## Problem

When `castalia launch` is tiled, it feels like a regular app rather than an invoked launcher. The desired interaction is a floating window that appears near the center of the screen, accepts search/slot input, then exits after copy or cancel.

## Goal

Make the supported Castalia GUI launcher request and document a floating, centered, launcher-like window experience.

## Scope

- Investigate the current `eframe`/`egui` launcher window behavior in Castalia.
- Configure app-side window hints/options that improve launcher behavior, including initial size, centering, title/class identity, decorations/resizability, and any supported floating/dialog-style hints.
- Preserve the existing short-lived launcher flow, prompt search, slot input, clipboard behavior, Japanese font handling, and Xwayland fallback behavior unless a change is explicitly justified.
- Add or update Castalia documentation for any window-manager rule needed to guarantee floating/centered behavior under tiling WMs such as Hyprland.
- Record manual verification steps for a tiling window-manager environment.

## Allowed Files

- `product/apps/castalia/crates/castalia-cli/src/launcher.rs`
- `product/apps/castalia/crates/castalia-cli/src/main.rs` only if CLI-visible launcher behavior or help text must change.
- `product/apps/castalia/crates/castalia-cli/Cargo.toml` and `product/apps/castalia/Cargo.lock` only if a narrowly justified GUI/window hint dependency or feature is required.
- `product/apps/castalia/nix/**` only if runtime packaging changes are required by the GUI/window behavior.
- `product/apps/castalia/README.md`
- `harness/knowledge/product-specs/castalia/**`
- `harness/runs/completed/TASK-0013-castalia-floating-centered-launcher**`

## Forbidden Files

- `product/packages/ui/**`
- `product/apps/web/**`
- `product/apps/osu-skin-workbench/**`
- Prompt schema, rendering, storage, validation, and authoring code unless directly required by launcher behavior.
- External Hyprland/Home Manager/nixfiles configuration outside Castalia-owned docs.
- Broad GUI rewrites or replacement of the current backend without a separate plan.

## Non-Goals

- Do not restore `rofi` as the supported launcher path.
- Do not introduce a daemon or resident background process.
- Do not implement v0.3 prompt management features.
- Do not migrate to Tauri/WebView for this task.
- Do not guarantee identical behavior across every Linux window manager when the compositor/window manager does not allow clients to force floating or position.

## Constraints

- Keep the launcher lightweight and process-on-demand.
- Keep `castalia launch` as the supported path.
- Castalia may document window-manager rules but must not own the user's WM configuration.
- Prefer app-side fixes first; treat WM rules as the fallback when client-side hints cannot force behavior.
- Maintain existing validation targets through Nx/Bun.
- Assumption: the primary target environment includes a tiling Linux WM, likely Hyprland, but the implementation should remain generally Linux-friendly.

## Role Assignment

- Chief of Staff: intake and scope definition.
- Rust/Tauri Engineer: implementation of Rust GUI/window behavior.
- Test Engineer: validation commands and manual tiling-WM smoke test notes.
- Reviewer: check scope, launcher UX requirements, and task artifacts before handoff.

## Worktree Isolation

Implementation must apply `harness/actions/workflows/worktree-task-isolation.md` before mutable product work.

Recommended implementation branch: `ai/castalia/floating-centered-launcher`.
Recommended external worktree path: `/home/tenzyu/Documents/.worktrees/tenzyudotcom/castalia-floating-centered-launcher`.
Expected merge target: current main development branch.
Cleanup expectation: remove the worktree and task branch after review and merge, or preserve findings in task artifacts if abandoned.

## Validation Commands

- `bun nx run castalia:fmt`
- `bun nx run castalia:check`
- `bun nx run castalia:clippy`
- `bun nx run castalia:test`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- Manual smoke: run `bun nx run castalia:launch` under the target tiling WM and verify the launcher appears floating and centered, or document the exact WM rule needed to make it so.

## Acceptance Criteria

- `castalia launch` opens with a launcher-like size rather than a normal large application layout.
- The launcher appears floating and centered in the target tiling WM environment when supported by app-side hints or by the documented WM rule.
- The implementation preserves prompt search, keyboard selection, slot editing, copy/cancel, and process-exit behavior.
- The launcher remains independent of `rofi` and does not require a terminal emulator.
- Documentation clearly states any compositor/window-manager limitation and provides a minimal example rule when app-side control is insufficient.
- Verification notes include automated command results and a manual tiling-WM launcher smoke result.

## Risks

- Wayland compositors often restrict client-side window positioning and floating control, so app-side centering may be impossible without WM rules.
- Xwayland and native Wayland may expose different window identity/hint behavior.
- Overfitting to one WM may reduce portability.
- Changing window decorations/resizability may affect usability for long slot forms.

## Open Questions

- Is Hyprland the required reference WM for acceptance, or should another tiling WM also be checked?
- Should the window be borderless like `rofi`, or is a decorated floating dialog acceptable?
- Should `castalia launch` ship a stable window class/app-id specifically for WM rules?
