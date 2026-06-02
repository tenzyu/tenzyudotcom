# Handoff: TASK-0009

## Task Summary

Added Castalia v0.2.5 roadmap and planning notes for replacing the primary
`rofi` launch surface with a Castalia-owned launcher.

## What Changed

- Added `v0.2.5 Castalia launcher` to
  `harness/knowledge/product-specs/castalia/ROADMAP.md`.
- Captured launcher rationale, user experience, boundaries, implementation
  direction, simulation, risks, and interview questions in this task folder.
- Recorded owner decisions: do not keep `rofi`, default slot input to Castalia
  UI, keep `$EDITOR` as an escape hatch, avoid Tauri unless it satisfies strict
  startup/memory goals, and target Linux only for v0.2.5.

## Why It Changed

`rofi` is useful for prompt selection but poorly suited to collecting longer
slot values. A first-party lightweight Linux launcher should reduce prompt-use
friction while avoiding assumptions that block future Windows and macOS support.

## Affected Files

- `harness/knowledge/product-specs/castalia/ROADMAP.md`
- `harness/runs/completed/TASK-0009-castalia-v0.2.5-launcher-planning*`

## Validation Result

Passed:

- `git diff --check`

No code validation was run because this task intentionally did not implement the
launcher.

## Remaining Risks

- Exact lightweight Linux UI stack is still undecided.
- Removal/deprecation mechanics for the existing `castalia rofi` command still
  need an implementation plan.
- Temporary-file handling for `$EDITOR` slot input still needs a concrete design.

## Follow-Up Tasks

- Evaluate lightweight Linux UI options against memory, startup time, keyboard
  behavior, multiline editing, and packaging.
- Write an implementation plan before changing source code.

## Memory Updates Made Or Proposed

No durable memory update was made.
