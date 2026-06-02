---
schema: harness/v1
kind: run
id: run.active.task-0020-atelier-m5-m6.worklog
title: "TASK-0020 Atelier M5-M6 Worklog"
status: active
summary: Worklog for Atelier M5-M6 implementation.
tags:
  - harness
  - run
  - atelier
---

# Worklog: TASK-0020 Atelier M5-M6

## Notes

- Loaded canonical harness model, repository policy, workflow/role registries, Atelier product spec, and ROADMAP M5-M6.
- Confirmed the working tree was clean before mutable work.
- Created the run with `atelier run init` and kept it in the main workspace as requested.
- Implemented close gate in `src/core/runs.ts`.
- Implemented knowledge proposal lifecycle in `src/core/knowledge.ts`.
- Added CLI commands, Nx targets, exports, README coverage, and fixture tests.
- Fixed Atelier `index` target output path from `.harness/generated` to `{workspaceRoot}/.harness/generated` after Nx rejected the original output declaration.
