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

## Future Tauri app

The desktop app should use the same file format and schema. It can either call `castalia-core` through a Rust workspace dependency or shell out to the CLI initially. The app should provide:

- prompt list/search
- prompt editor
- frontmatter editor
- validation result panel
- preview/render panel
- sync-status hints, without owning sync
