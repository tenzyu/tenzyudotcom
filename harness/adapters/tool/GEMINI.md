---
schema: harness/v1
kind: adapter
id: adapter.tool.gemini
title: Tool Gemini Adapter
status: active
summary: Generator source for Gemini root adapter routing through Atelier.
tags:
  - harness
  - adapter
  - gemini
---

# Adapter: GEMINI.md

Root `GEMINI.md` should route Gemini through Atelier.

Required behavior:

- start non-trivial work with `atelier run init`
- read generated `context.md`
- avoid manual broad search of `harness/knowledge/**`
- finish with `atelier run close <RUN-ID>`
- use `atelier knowledge propose` for new durable knowledge

Do not duplicate the complete knowledge base in this adapter.
