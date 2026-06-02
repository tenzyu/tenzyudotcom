# Plan: TASK-0010

## Implementation Strategy

Use a terminal-native launcher implemented in Rust with the standard library and
ANSI terminal control. This avoids Tauri and GUI crate overhead while preserving
the desired lifecycle: start from a keybind or command, handle selection and
slot input, copy, then exit.

The launcher will live in `castalia-cli/src/launcher.rs` and remain separate
from command dispatch in `main.rs`.

## Command Shape

- `castalia launch [--prompt-dir <dir>] [--slot-input ui|editor|clipboard-first] [--query <query>] [--set key=value] [--no-copy]`
- Default slot input mode: `ui`.
- `CASTALIA_SLOT_INPUT_MODE` can set the default when no flag is passed.
- `--query` allows direct prompt resolution, useful for scripted launch paths
  and verification.
- `--no-copy` prints rendered output instead of touching the clipboard.

## UI Behavior

- Prompt selection uses a short-lived alternate-screen terminal UI.
- Search filters prompt ids, aliases, titles, tags, descriptions, and previews.
- Rows show id, title, and body preview.
- Arrow keys or Ctrl-N/Ctrl-P move selection.
- Enter selects.
- Escape cancels.
- Slot UI supports single-line and multiline input.
- Multiline slots submit with Ctrl-D and cancel with Escape.
- Editor mode writes a temporary slot document, opens `$VISUAL`/`$EDITOR`, reads
  values back, then deletes the temporary file.

## Boundary Impact

- `castalia-core` remains the prompt model and rendering authority.
- Clipboard helpers remain in the CLI boundary.
- Prompt management stays out of scope.
- The `rofi` adapter is removed from supported command dispatch and packaging.

## Validation Strategy

- Rust unit tests where logic is pure enough.
- Nx command smoke checks for direct `launch --query ... --no-copy`.
- Expected failure check for `castalia rofi`.
- `bun nx run castalia:verify`
- `bun nx run castalia:build`

## Known Tradeoff

The first v0.2.5 launcher is terminal-native rather than a graphical X11/Wayland
window. This is the smallest implementation that satisfies low memory,
immediate startup, self-owned slot UI, editor escape hatch, and no daemon. A
future graphical backend can be added behind the same `launcher.rs` boundary if
needed.
