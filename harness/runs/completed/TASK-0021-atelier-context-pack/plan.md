---
schema: harness/v1
kind: run
id: run.active.task-0021-atelier-context-pack.plan
title: "TASK-0021 Atelier Context Pack Plan"
status: active
summary: Plan for implementing compiled context packs and expansion logging.
tags:
  - harness
  - run
  - atelier
---

# Plan: TASK-0021 Atelier Context Pack

## Scope

- Treat the provided ChatGPT answer as the source of truth for Atelier context generation.
- Make `context.md` a compiled agent-readable context pack instead of a link list.
- Add context modes: `compact`, `full`, and `linked`, with `compact` as default.
- Add context expansion logging through manifest, context, and worklog records.
- Update specs, README, CLI, exports, Nx targets, and tests.

## Non-goals

- No vector search.
- No MCP server.
- No generated semantic summaries beyond deterministic extraction and excerpts.
- No migration of historical run contexts.
