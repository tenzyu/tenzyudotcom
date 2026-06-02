# Castalia Architecture

## Boundary

Castalia owns prompt storage, parsing, rendering, selection, and clipboard copy. It does not own the window manager, Home Manager options, ChatGPT Projects, or synchronization.

## Current components

```text
product/apps/castalia/
  Cargo.toml
  crates/
    castalia-core/
      prompt schema, parser, renderer, search matching
    castalia-cli/
      command dispatch, launcher UI, clipboard adapter
```

## Source of truth

Plain Markdown files with YAML-like frontmatter are the source of truth. Any future Tauri app must edit these files rather than hiding prompt bodies inside app state.

## Search model

A prompt can be found by:

- exact `id`
- exact alias
- substring match across title, aliases, tags, description, and body preview

This enables `tc.pir`, `pir`, and `implementation` to reach the same prompt.

## Launcher

`castalia launch` is the supported prompt-use surface as of v0.2.5. It is a
short-lived Linux GUI launcher that starts on demand, shows searchable prompt
rows, collects slot values when needed, copies the rendered prompt, and exits.
It requests a small centered dialog-style window with a stable title so tiling
window managers can apply local float/center rules when client-side hints are
not enough.

The launcher is separated into `castalia-cli/src/launcher.rs`. It reuses
`castalia-core` for prompt loading, search, validation, and rendering; it does
not manage prompt files.

`castalia launch-tui` exists only as a non-default fallback for the rejected
terminal-native implementation. It is not the supported v0.2.5 launch surface.

`castalia rofi` is no longer a supported launch path. CLI commands such as
`render`, `copy`, `inspect`, `new`, `edit`, and `validate` remain available for
scripted workflows.

## Form slots

Slots are declared in frontmatter and rendered from `{{slot_name}}` markers.
The launcher asks for manual slot values in its built-in UI by default.
`source: clipboard` slots are filled from the clipboard when possible.

Slot input can be configured as `ui`, `editor`, or `clipboard-first`. The
`editor` mode opens `$VISUAL` or `$EDITOR` as an escape hatch for users who want
their normal key bindings.

## Validation model

`castalia validate` loads every Markdown prompt it can parse and reports
schema, slot, id, alias, and tag issues across the whole prompt directory.
Unknown frontmatter keys, unknown slot keys, invalid boolean values, and unknown
`mode`/`source` values are parse errors. Parsed prompts are additionally checked
for safe ids, empty bodies, duplicate ids, duplicate aliases, id/alias conflicts,
duplicate slots, and `{{slot}}` references without matching slot declarations.

Prompt ids are intentionally filename-safe: ASCII letters, numbers, `.`, `_`,
and `-`, with no leading/trailing `.` and no `..` segment.

## Authoring commands

The v0.2 CLI owns basic file-backed prompt authoring:

- `castalia new <id>` creates `<id>.md` without overwriting existing files and
  refuses ids that conflict with existing ids or aliases.
- `castalia edit <query>` resolves a prompt, opens it with `$VISUAL` or
  `$EDITOR`, then validates after the editor exits.
- `castalia inspect <query>` prints resolved metadata, slots, preview, path, and
  validation status.

## Future Tauri app

The desktop app should use the same file format and schema. It can either call `castalia-core` through a Rust workspace dependency or shell out to the CLI initially. The app should provide:

- prompt list/search
- prompt editor
- frontmatter editor
- validation result panel
- preview/render panel
- sync-status hints, without owning sync
