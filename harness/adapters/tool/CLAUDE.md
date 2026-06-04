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

Root `CLAUDE.md` should route Claude Code through Atelier context planning before
broad manual harness discovery.

Required behavior:

- start non-trivial work with `atelier context plan --workflow ... --role ... --path ... --intent ...`
- use the plan to choose relevant context, risks, and validation commands
- avoid manual broad search of `harness/knowledge/**`
- let the external runner edit the repository directly
- finish with normal repository validation such as `bun nx run <project>:check`
- write durable Markdown notes only when handoff, review, migration, or decision records are useful

Tool-local memory is not the repository source of truth.
