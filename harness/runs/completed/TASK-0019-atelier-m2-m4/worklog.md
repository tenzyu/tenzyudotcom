---
schema: harness/v1
kind: run
id: run.active.task-0019-atelier-m2-m4.worklog
title: Atelier M2-M4 Worklog
status: active
summary: Worklog for implementing Atelier M2 through M4.
tags:
  - atelier
  - worklog
---

# Worklog: Atelier M2-M4

## 2026-06-02

- Confirmed existing Atelier app has M0/M1 doctor support only.
- Confirmed current role metadata uses `selectors` and `pinned`; required and optional knowledge are currently described in Markdown body lists.
- Added `core/indexer.ts` for M2 generated indexes and stale checks.
- Added `core/context.ts` for M3 workflow/role/path/intent context preview.
- Added `core/runs.ts` for M4 run initialization and context manifest generation.
- Extended `src/cli.ts` with `index`, `context preview`, and `run init`.
- Added Nx targets for `index`, `index-check`, `context-preview`, and `run-init`.
- Added tests for M2 through M4 and generated `.harness/generated/*.json`.
