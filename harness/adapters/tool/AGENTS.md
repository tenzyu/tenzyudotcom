---
schema: harness/v1
kind: adapter
id: adapter.tool.agents
title: Tool AGENTS Adapter
status: active
summary: Generator source for Codex-style root adapter routing through Atelier.
tags:
  - harness
  - adapter
  - agents
---

# Adapter: AGENTS.md

Root `AGENTS.md` should route Codex-style agents through Atelier.

Required behavior:

- start non-trivial work with the generated exact `atelier run init --workflow ... --role ... --path ... --intent ...` entrypoint
- read generated `context.md`
- avoid manual broad search of `harness/knowledge/**`
- finish with `atelier run close <RUN-ID>`
- use `atelier knowledge propose` for new durable knowledge

Do not duplicate long policy text in root adapters.
