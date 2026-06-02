# Plan: TASK-0011

## Problem Statement

TASK-0010 optimized correctly for low overhead, short process lifetime, and no
Tauri daemon-like behavior, but it implemented the wrong UI class. The result is
a TUI that must be launched inside a terminal emulator. That is not a `rofi`
replacement from the user's perspective.

The correct target is:

- Linux GUI window
- `rofi`-like quick launcher feel
- no background service
- no terminal emulator requirement
- low memory/startup overhead
- self-owned slot input UI

## Required Correction

Treat the TASK-0010 TUI as rejected for the supported v0.2.5 launch surface.
Before implementing, choose one of these handling strategies:

1. Remove the TUI implementation entirely.
2. Keep the TUI only as an internal fallback behind a non-default command such
   as `castalia launch-tui`.
3. Reuse only its pure logic, such as slot document parsing, while replacing the
   UI layer.

Recommended: option 3. Keep reusable command/data flow where useful, but make
`castalia launch` a GUI.

## GUI Backend Candidates

### Candidate A: `winit` + `softbuffer` + small custom renderer

Pros:

- Native Linux window without WebView/Tauri.
- No daemon.
- Cross-platform architecture remains possible later.
- Lower conceptual weight than GTK/Tauri.
- Custom UI can be tightly scoped to search list, slot editor, and copy action.

Cons:

- Need to implement text layout, input, selection, and rendering.
- Japanese text rendering and IME can become non-trivial.
- A proper font/text stack may require additional crates.

### Candidate B: `egui`/`eframe`

Pros:

- Much faster to build a usable launcher GUI.
- Text input and multiline fields are readily available.
- Good keyboard handling and immediate-mode UI.
- No WebView/Tauri.

Cons:

- Heavier than a custom raw window.
- Need to measure startup and memory before accepting.
- Visual feel may need work to feel `rofi`-like and not like a desktop app.

### Candidate C: GTK4

Pros:

- Mature Linux GUI controls and text input.
- Good IME/text behavior.

Cons:

- Heavier dependency and packaging surface.
- Less aligned with "smallest possible launcher".

### Candidate D: `iced`

Pros:

- Native Rust GUI, no WebView.
- Higher-level widgets than raw `winit`.

Cons:

- Likely more framework than needed.
- Startup/memory should be measured before selection.

## Recommended Backend

Start with `egui`/`eframe` unless measurement shows unacceptable overhead.

Reasoning:

- The real risk is spending too much time hand-rolling text input and Unicode
  rendering in a launcher whose core job is prompt friction reduction.
- The owner explicitly values low overhead, but not at the cost of delivering a
  terminal UI. `egui` is a practical midpoint: much lighter than Tauri/WebView,
  much faster to ship than a fully custom renderer.
- If `egui` proves too heavy after measurement, fall back to `winit` +
  `softbuffer` with a text rendering plan.

## Implementation Shape

- Keep `castalia-core` unchanged except for helpers that are genuinely reusable.
- Add GUI launcher code under `castalia-cli/src/launcher/` or
  `castalia-cli/src/gui_launcher.rs`.
- Keep command dispatch in `main.rs`.
- Make `castalia launch` call the GUI launcher.
- If keeping the TUI temporarily, expose it only as `castalia launch-tui` or
  remove it from command dispatch entirely.
- Preserve non-interactive smoke path for tests, for example:
  `castalia launch --query tc.pir --set change=test --no-copy`.
- Keep `$EDITOR`/`$VISUAL` slot mode available from GUI slot screen.

## GUI UX Requirements

- First focused control is search.
- Rows show prompt title and preview; id/aliases/tags can be secondary metadata.
- Keyboard:
  - type to search
  - up/down moves selection
  - Enter selects prompt or submits slot form
  - Escape cancels and exits
- No-slot prompt:
  - render and copy immediately after selection
  - exit
- Slot prompt:
  - show one screen with slot labels and inputs
  - support multiline slot input
  - submit renders, copies, exits
  - editor escape hatch opens `$VISUAL`/`$EDITOR` when selected/configured

## Measurement Requirement

Before claiming v0.2.5 complete, measure or at least record:

- cold-ish startup behavior observed locally
- process exits after copy/cancel
- no long-running Castalia process remains
- release binary builds
- package build still works

Exact memory measurement can be approximate for the first correction, but if
`egui` feels heavy, capture that as a blocker and switch backend.

## Verification Plan

- `bun nx run castalia:check`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- `bun nx run castalia:nix-build`
- GUI smoke test on Linux:
  - open `castalia launch`
  - search prompt
  - select prompt
  - fill slot
  - confirm clipboard or `--no-copy` output path
- Confirm `ps` has no resident Castalia process after exit.
- Confirm `castalia rofi` is not the supported path.

## Documentation Fixes

- Update TASK-0010 handoff or add a correction note that the terminal-native
  launcher was a rejected interpretation, not a successful v0.2.5 GUI release.
- Product README must say GUI launcher only after GUI implementation exists.
- ROADMAP should keep v0.2.5 as GUI launcher, not TUI.

## Open Questions

None for product direction. The remaining decision is technical: prove `egui`
startup/memory is acceptable, or choose a lower-level GUI stack.
