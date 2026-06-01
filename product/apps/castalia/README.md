# Castalia

Castalia is a local-first invocation layer for personal AI workflows.

It stores prompts as plain Markdown files, lets Linux users select them through
the short-lived `castalia launch` GUI, renders simple form slots, and copies the
result to the clipboard. The launcher is intentionally Linux-first,
low-overhead, and process-on-demand so it can be bound from Hyprland without
Castalia owning window-manager configuration.

## Principles

1. local-first
2. plain text as source of truth
3. no account required
4. no vendor lock-in
5. prompt body is data, not app state
6. Linux first
7. Android later
8. browser extension last, if ever
9. sync is user-owned: Syncthing / Git
10. AI workflow is invoked, not pasted manually

## Commands

```sh
castalia init
castalia list
castalia render tc.pir --set 'change=flake input follows cleanup'
castalia copy tc.pir --set 'change=flake input follows cleanup'
castalia launch
castalia launch --query tc.pir --set 'change=flake input follows cleanup'
castalia validate
castalia inspect tc.pir
castalia new my.prompt --title 'My Prompt' --tag personal
castalia edit tc.pir
```

## Prompt store

By default Castalia reads:

```text
~/.local/share/castalia/prompts/*.md
```

Override with:

```sh
CASTALIA_PROMPT_DIR=/path/to/prompts castalia launch
```

## Prompt format

```md
---
id: tc.pir
title: Pre-Implementation Review
aliases: [pir, review]
tags: [thinking-compiler, implementation]
mode: form
slots:
  - name: change
    label: 変更内容
    multiline: true
    required: true
---

TC:pir

変更:
{{change}}
```

## Prompt authoring

Castalia v0.2 includes basic prompt authoring commands while keeping Markdown
files as the source of truth:

```sh
castalia new my.prompt --title 'My Prompt' --alias mine --tag personal
castalia inspect my.prompt
castalia edit my.prompt
castalia validate
```

`new` refuses unsafe ids and existing id/alias conflicts. `edit` opens the
resolved prompt with `$VISUAL` or `$EDITOR`, then validates the prompt store
after the editor exits. `validate` reports all discovered schema and conflict
issues instead of stopping at the first invalid file.

## Launcher

Castalia v0.2.5 replaces the supported `rofi` path with `castalia launch`.
The launcher opens a standalone lightweight GUI window, starts on demand, and
exits after rendering and copying. It does not run as a daemon and does not
require `rofi` or a terminal emulator for the supported path.

```sh
castalia launch
castalia launch --query tc.pir --slot-input ui
castalia launch --query tc.pir --slot-input editor
castalia launch --query tc.pir --set 'change=test' --no-copy
```

Slot input defaults to Castalia's own UI. Use `--slot-input editor` or
`CASTALIA_SLOT_INPUT_MODE=editor` to open `$VISUAL` or `$EDITOR` for slot
values. `clipboard-first` fills missing slot values from the clipboard before
falling back to the built-in UI.

`castalia launch-tui` is retained as a non-default fallback while v0.2.5 settles,
but it is not the supported launcher surface.

## Castalia nixfiles integration

Castalia does not expose or own Hyprland/Home Manager options. Install the package from the `castalia` flake from `tenzyudotcom`, then bind the command in your existing Hyprland layer.

### Flake input example

```nix
castalia = {
  url = "github:tenzyu/tenzyudotcom/develop?dir=product/apps/castalia";
  inputs.nixpkgs.follows = "nixpkgs";
};
```

### Home Manager package example

```nix
{ inputs, pkgs, ... }: {
  home.packages = [
    inputs.castalia.packages.${pkgs.system}.castalia
  ];
}
```

## Hyprland bind example

Bind `castalia launch` directly from your window manager. For example:

```nix
(modBind "p" (luaExec "castalia launch"))
```
