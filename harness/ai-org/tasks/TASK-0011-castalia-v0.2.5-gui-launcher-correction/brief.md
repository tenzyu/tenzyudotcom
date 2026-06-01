# TASK-0011: Correct Castalia v0.2.5 To A Lightweight GUI Launcher

## Context

TASK-0010 implemented `castalia launch` as a terminal-native TUI. That does not
meet the owner's v0.2.5 requirement. The intended product is a Linux launcher
GUI with a `rofi`-like feel: fast to open, short-lived, not daemonized, low
memory, and capable of collecting slot values in Castalia-owned UI.

The owner confirmed the issue after trying the implementation:

> This is TUI. What I wanted is a super-lightweight Linux launcher GUI like
> rofi.

## Goal

Correct the v0.2.5 implementation plan so `castalia launch` becomes a
lightweight Linux GUI launcher, not a terminal UI.

## Scope

- Decide how to handle the TASK-0010 TUI implementation.
- Select a lightweight Linux GUI backend.
- Plan the corrected implementation before writing code.
- Update product docs after implementation to avoid claiming TUI as the release
  launcher.

## Non-Goals

- Do not use Tauri for the v0.2.5 launcher unless no lighter viable option is
  found.
- Do not add prompt management features; v0.3 owns prompt management.
- Do not restore `rofi` as the final supported launch path.
- Do not target Windows or macOS in v0.2.5.

## Acceptance Criteria

- `castalia launch` opens a standalone GUI window, not a terminal UI.
- The GUI opens on demand and exits after copy/cancel.
- The GUI shows prompt title and preview/summary.
- Prompt search and keyboard selection work without `rofi`.
- Slot filling happens in Castalia-owned GUI by default.
- `$EDITOR`/`$VISUAL` remains available as an escape hatch.
- `rofi` is not required at runtime.
- Documentation describes the GUI accurately.
