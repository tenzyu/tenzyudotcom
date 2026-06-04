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

Root `GEMINI.md` should route Gemini through Atelier context planning before
broad manual harness discovery.

Required behavior:

- start non-trivial work with `atelier context plan --workflow ... --role ... --path ... --intent ...`
- use the plan to choose relevant context, risks, and validation commands
- avoid manual broad search of `harness/knowledge/**`
- let the external runner edit the repository directly
- finish with normal repository validation such as `bun nx run <project>:check`
- write durable Markdown notes only when handoff, review, migration, or decision records are useful
- for durable handoff, materialize a run capsule via `atelier task create` then
  `atelier run create --task <task-id>`, and use `atelier run resume <run-id>` as
  the next-agent prompt
- reference the Run Plane's 7 subcommands and the canonical capsule reading
  order: `manifest.json → handoff.md → brief.md → plan.md → context.md →
  verification.md → review.md → worklog.md → artifacts.md`

Do not duplicate the complete knowledge base in this adapter.
