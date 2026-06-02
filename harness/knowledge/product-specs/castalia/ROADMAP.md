---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
id: knowledge.product-spec.castalia-roadmap
title: Castalia Roadmap
status: active
summary: Castalia implementation roadmap from Rust Linux MVP through launcher and authoring milestones.
tags:
  - castalia
  - roadmap
  - product-spec
---

# Castalia Roadmap

## v0.1 Rust Linux MVP

- Rust CLI
- Markdown prompt store
- frontmatter metadata
- aliases/tags search
- `render`, `copy`, `rofi`, `validate`, `init`
- rofi rows with prompt title and body preview
- form slots through rofi prompts
- Nix flake package and app

## v0.2 Prompt authoring stability

- stricter schema validation
- better error messages
- conflict-safe ids
- `castalia new`
- `castalia edit`
- `castalia inspect`

Implemented in `product/apps/castalia` as CLI authoring support while preserving
plain Markdown prompt files as the source of truth.

## v0.2.5 Castalia launcher

Replace `rofi` as the primary launch surface with a Castalia-owned launcher.
The reason is practical: `rofi -dmenu` is good for prompt selection, but it is a
poor fit for filling slot values with longer text. The product should not force
`--set`-style multiline input through a UI that was not built for that job.

This also keeps Castalia from baking Linux-only launcher assumptions into its
core workflow. v0.2.5 only needs to ship on Linux, but the launcher should avoid
design choices that block future Windows and macOS support.

`rofi` should not remain as a supported Castalia launch path after v0.2.5. The
replacement launcher becomes the primary use-time surface; the CLI remains the
scriptable fallback.

Launcher behavior:

- start from a keybind or command with a `rofi`-like fast search experience
- show prompt title plus a short summary or body preview
- select a prompt by id, alias, title, tag, or preview text
- if the prompt has no slots, render and copy immediately
- if the prompt has slots, collect slot values before rendering
- copy the rendered prompt to the clipboard
- keep prompt management out of scope; prompt management belongs to v0.3

Slot input defaults to Castalia's own UI. Editor integration exists as an escape
hatch for users who want Vim bindings, custom key layouts, or their normal
editor environment:

- copy-only fast path for prompts that do not need user input
- Castalia-owned slot editor UI for low-friction form filling
- `$EDITOR`/`$VISUAL` slot editing path for users who want Vim bindings or their
  normal editor environment
- clipboard-first slot values where prompt metadata declares `source:
  clipboard`

Implementation direction:

- add a launcher-specific Rust source file, for example `castalia-cli/src/launcher.rs`
- keep launcher UI separate from CLI command dispatch
- reuse `castalia-core` for prompt loading, search, rendering, and validation
- introduce a small config surface for slot input mode and copy behavior
- do not add prompt library management features in the launcher
- avoid Tauri for this launcher unless a later evaluation proves it can satisfy
  the launcher's memory and startup constraints
- optimize for `rofi`-like startup: run on demand, open immediately, copy, then
  exit; do not introduce a daemon
- choose the smallest Linux UI stack that can support fast search, prompt
  selection, multiline slot editing, clipboard copy, keyboard navigation, and
  predictable packaging

Implemented in `product/apps/castalia` as a lightweight Linux GUI launcher in
`castalia-cli/src/launcher.rs`, using `eframe`/`egui` without Tauri or WebView.
It replaces `castalia rofi` as the supported launch path while keeping CLI
commands as scriptable fallbacks. The earlier terminal-native implementation is
kept only behind `castalia launch-tui` as a non-default fallback.

## v0.3 Tauri desktop editor

- file-backed prompt editor
- metadata editor
- render preview
- validation panel
- import/export

## v0.4 Sync-ready workflows

- documented Syncthing layout
- Git-backed prompt history guidance
- conflict file convention

## v0.5 Android copy app

- prompt search
- copy to clipboard
- import prompt directory

## v0.6 Android share target

- receive shared text
- render prompt with shared text as slot value

## v0.7 Android IME / dedicated input layer

Only after the copy/share app proves the workflow.
