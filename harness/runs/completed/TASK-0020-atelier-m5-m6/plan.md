---
schema: harness/v1
kind: run
id: run.active.task-0020-atelier-m5-m6.plan
title: "TASK-0020 Atelier M5-M6 Plan"
status: active
summary: Plan for implementing Atelier run close and knowledge proposal promotion.
tags:
  - harness
  - run
  - atelier
---

# Plan: TASK-0020 Atelier M5-M6

## Scope

- Implement `atelier run close RUN-ID` as a completion gate.
- Implement `atelier knowledge propose`, `promote`, and `reject`.
- Wire core APIs, CLI, Nx targets, README, exports, tests, and generated indexes.

## Non-goals

- No GUI or MCP server.
- No automatic promotion from raw run logs.
- No migration of historical completed runs.

## Approach

1. Add explicit run/knowledge diagnostic codes.
2. Extend run core with close-time artifact, manifest hash, review, skipped-check, proposal, and doctor relevance checks.
3. Add knowledge proposal core for draft proposal creation, promotion into `harness/knowledge`, provenance recording, rejection archive, duplicate warnings, role impact preview, and index regeneration.
4. Add focused fixture tests and run Nx validation.
