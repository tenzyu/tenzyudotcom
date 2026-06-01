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

## Hyprland usage

Castalia intentionally does not expose `programs.castalia.hyprland.*`. Bind it from your Hyprland layer:

```nix
(modBind "p" (luaExec "pkill rofi || castalia rofi --replace"))
```

The tool composes like `rofi -show drun` or `cliphist list | rofi -dmenu` rather than owning compositor configuration.
