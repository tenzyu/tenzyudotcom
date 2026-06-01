# Castalia

Castalia is a local-first invocation layer for personal AI workflows.

It stores prompts as plain Markdown files, lets Linux users select them through `rofi`, renders simple form slots, and copies the result to the clipboard. The MVP is intentionally Linux-first and CLI-first so it can be bound from Hyprland without Castalia owning window-manager configuration.

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
castalia rofi --replace
castalia validate
```

## Prompt store

By default Castalia reads:

```text
~/.local/share/castalia/prompts/*.md
```

Override with:

```sh
CASTALIA_PROMPT_DIR=/path/to/prompts castalia rofi --replace
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

Use the same composition style as `rofi -show drun` and `cliphist`:

```nix
(modBind "p" (luaExec "pkill rofi || castalia rofi --replace"))
```
