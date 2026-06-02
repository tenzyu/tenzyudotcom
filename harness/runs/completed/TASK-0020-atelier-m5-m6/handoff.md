---
schema: harness/v1
kind: run
id: run.active.task-0020-atelier-m5-m6.handoff
title: "TASK-0020 Atelier M5-M6 Handoff"
status: active
summary: Handoff for Atelier M5-M6 implementation.
tags:
  - harness
  - run
  - atelier
---

# Handoff: TASK-0020 Atelier M5-M6

## Changed

- Added `run close` completion gate for required artifacts, context manifest hashes, doctor errors affecting selected context, verification, handoff, review, skipped checks, and open knowledge proposals.
- Added knowledge proposal creation, promotion, and rejection.
- Added CLI, package scripts, Nx targets, exports, README docs, tests, and regenerated indexes.

## Validation

- `bun nx run atelier:check`
- `bun nx run atelier:build`
- `bun nx run atelier:index`
- `bun nx run atelier:index-check`

## Risk

- `run close` uses text heuristics for skipped-check and review-trigger detection. It is explicit enough for M5, but future milestones may want structured artifact metadata.

## Knowledge proposals

- None.
