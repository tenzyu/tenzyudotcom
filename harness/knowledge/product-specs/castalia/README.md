---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
id: knowledge.product-spec.castalia
title: Castalia Product Spec
status: active
summary: Local-first prompt and skill launcher product specification.
tags:
  - castalia
  - product-spec
  - prompt-launcher
---

# Castalia Product Spec

Castalia is a local-first prompt and skill launcher. It reduces the friction between deciding to use an AI workflow and placing the right prompt invocation into an input field.

## MVP goal

A Linux user can press a Hyprland keybind, select a prompt in `castalia launch`,
optionally fill form slots, and copy the rendered prompt to the clipboard.

## Non-goals for MVP

- Android IME
- browser extension
- cloud sync
- account system
- prompt marketplace
- team collaboration
- prompt analytics
- AI prompt optimization
- Castalia-owned Hyprland/Home Manager options

## Success condition

```text
mod + p -> castalia launch -> select tc.pir -> fill change -> clipboard contains rendered prompt
```
