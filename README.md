# osu! Skin Tools

Browser-based tools for editing and extracting osu! skin assets.

This project targets osu!lazer-oriented skin workflows. It intentionally separates stable-only assets into a `stable` scope instead of treating them as first-class editing targets.

## Features

- Open a local browser editor with `nix run`
- Import a main skin from an `.osk` archive or extracted skin folder
- Add other skins as asset sources and mix assets into the project
- Browse assets by `scope > category > group`
- Preview image groups directly on cards, including simple frame animation for `name-0`, `name-1`, ... sequences
- Edit project `skin.ini` and JSON layout files
- Delete project assets and asset sources
- Export both a flat skin folder and an `.osk`
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
6. Click asset cards to select groups.
7. Use `Copy selected assets` to mix them into the project.
8. Use `Export` to write:
   - `exports/<project-id>/flat/`
   - `exports/<project-id>.osk`

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

Run the editor check:

```sh
nix run .#editor -- --check
```

## Repository Layout

```text
tools/
  osu-skin-editor.ts      Local web server and editor API
  osu-skin-extract.ts     Extractor CLI
  skin-lib.ts             Shared classification/import/export helpers
  editor-static/          Browser UI
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
