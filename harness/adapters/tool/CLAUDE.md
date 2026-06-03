---
schema: harness/v1
kind: adapter
id: adapter.tool.claude
title: Tool Claude Adapter
status: active
summary: Generator source for Claude root adapter routing through Atelier.
tags:
  - harness
  - adapter
  - claude
---

# Adapter: CLAUDE.md

Root `CLAUDE.md` should route Claude Code through Atelier.

Required behavior:

- start non-trivial work with the generated exact `atelier run init --workflow ... --role ... --path ... --intent ...` entrypoint
- read generated `context.md`
- avoid manual broad search of `harness/knowledge/**`
- finish with `atelier run close <RUN-ID>`
- use `atelier knowledge propose` for new durable knowledge

Tool-local memory is not the repository source of truth.
