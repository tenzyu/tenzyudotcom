# osu! Skin Tools

Browser-based tools for editing and extracting osu! skin assets.

This project targets osu!lazer-oriented skin workflows. It intentionally separates stable-only assets into a `stable` scope instead of treating them as first-class editing targets.

## Features

- Open a local browser editor with `nix run`
- Import a main skin from an `.osk` archive or extracted skin folder
- Add other skins as asset sources and mix assets into the project
- Browse assets by `scope > category > group`
- Edit mode with two aligned Project / Asset columns and thumbnail previews
- Preview mode for Lazer-first song select and gameplay mockups for std, taiko, catch, and mania
- Preview image groups directly on rows, including simple frame animation for `name-0`, `name-1`, ... sequences
- Preview audio groups with browser playback controls
- Edit project `skin.ini` and JSON layout files
- Delete project assets and asset sources
- Restore individual groups from the imported main skin
- Undo recent edit operations and inspect undo history
- Validate common skin issues such as missing assets, @2x-only assets, animation gaps, and missing `skin.ini` references
- Export both a flat skin folder and an `.osk`
- Export project backups and import them on another machine
- Use the standalone extractor CLI for mode-based asset extraction

## Quick Start

```sh
nix run
```

This starts a local server and opens the editor in your browser. If the browser does not open automatically, the command prints the local URL.

The editor can choose `.osk` files or skin folders through a native dialog. Manual path entry also works.

## Editor Workflow

1. Choose a main skin from the left panel.
2. Import it as a project.
3. Add one or more asset skins.
4. Select a source from the header.
5. Browse by scope and category.
6. Use `Edit` to select asset rows and mix files into the project.
7. Use `Preview` to inspect the current Project as a Lazer-first song select or gameplay screen.
8. Click asset rows to select groups.
9. Use selection helpers such as `Select visible`, `Select missing`, and `Select warnings` for bulk work.
10. Use `Copy selected assets` to mix them into the project.
11. Use `Export` to write:
   - `exports/<project-id>/flat/`
   - `exports/<project-id>.osk`
   - `exports/<project-id>/diff/`
   - `exports/<project-id>.backup.zip`

The main skin is automatically added as an asset source. Use `Restore from main` on a row when you want to revert that group without manually finding the original files.

Warnings are advisory. They are meant to catch likely broken exports while keeping import/export non-destructive. Ignored warning state is stored in the project manifest.

Backups contain the editor project, not just a flat osu! skin folder. Use `Import backup` with the backup zip when moving a project to another machine or recovering a project after experiments.

Projects are stored in:

```text
skin-editor-projects/
```

Imported skins and generated exports are ignored by git through `.gitignore`.

## Classification Model

Assets are organized as:

```text
scope / category / group
```

Examples:

```text
std / default-numbers / default
std / hit-circles / hitcircle
taiko / playfield-upper / taiko-slider
taiko / shaker / spinner-warning
mania / notes / mania-note1
catch / fruits / fruit-apple
stable / ranking / ranking-a
configs / skin-ini / skin
```

Current scopes:

- `std`
- `mania`
- `catch`
- `taiko`
- `interface`
- `fonts`
- `configs`
- `sounds`
- `stable`
- `extras`

## Extractor CLI

The extractor remains available as a named Nix app:

```sh
nix run .#extract -- summary skins/tenzyu.osk
nix run .#extract -- list skins/tenzyu .osk --mode mania --strict
nix run .#extract -- extract skins/tenzyu.osk /tmp/tenzyu-mania --mode mania
```

Supported modes:

```text
osu, taiko, catch, mania
```

## Development

Enter the development shell:

```sh
nix develop
```

Run checks:

```sh
bun run check
nix flake check
```

Run the editor without opening a browser:

```sh
nix run .#editor -- --no-open
```

Build the React editor:

```sh
nix develop -c npm run build:editor
```

Run the editor check:

```sh
nix run .#editor -- --check
```

## Repository Layout

```text
tools/
  editor/                  React + Vite browser UI
  editor-dist/             Generated editor build output (ignored)
  osu-skin-editor.ts      Local web server and editor API
  osu-skin-extract.ts     Extractor CLI
  skin-lib.ts             Shared classification/import/export helpers
  shared/                 Frontend/backend API types
flake.nix                 Nix apps and dev shell
package.json              Bun scripts
```

## Asset Notice

This repository is for the tool source code. User-provided skins, `.osk` files, generated projects, and exports should stay out of git:

```text
skins/
skin-editor-projects/
exports/
```
