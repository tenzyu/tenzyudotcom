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
      command dispatch, rofi adapter, clipboard adapter
```

## Source of truth

Plain Markdown files with YAML-like frontmatter are the source of truth. Any future Tauri app must edit these files rather than hiding prompt bodies inside app state.

## Search model

A prompt can be found by:

- exact `id`
- exact alias
- substring match across title, aliases, tags, description, and body preview

This enables `tc.pir`, `pir`, and `implementation` to reach the same prompt.

## Rofi adapter

`castalia rofi --replace` prints one visible row per prompt:

```text
id<TAB>title [aliases] #tags — body preview
```

This keeps `rofi` searchable while preserving a stable id as the first token for selection resolution.

## Form slots

Slots are declared in frontmatter and rendered from `{{slot_name}}` markers. The rofi adapter asks for manual slot values with `rofi -dmenu`. `source: clipboard` slots are filled from the clipboard when possible.

Rofi is not a multiline editor. Multiline slots are supported by paste/manual input, but a future dedicated launcher or Tauri UI should provide a real multiline editor.

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
