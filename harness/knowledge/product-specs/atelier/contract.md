---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-contract
title: Atelier Command Contract
status: active
tags:
  - product:atelier
  - subject:contract
  - domain:harness
---

# Atelier Command Contract

Atelier manages typed artifacts for external LLM runners. The canonical model is:

- `task`: durable work item or intent artifact under `harness/tasks/`.
- `run`: portable, resumable task capsule under `harness/runs/active/` or `harness/runs/completed/`. The Run Plane materializes and inspects capsules; it does not own the LLM execution runtime.
- `context plan`: read-only resolver that selects context without mutating files, task state, or run state.

## Removed Commands

Active CLI, MCP, GUI, docs, output, retry, recovery, and next-command surfaces must not advertise or emit these commands:

```txt
atelier run init
atelier run status
atelier run close
atelier context render
atelier context expand
atelier index
atelier knowledge
atelier repo map
atelier repo owner
atelier generate
```

Do not add compatibility aliases unless a future contract explicitly permits them.

## Context Surface

`atelier context plan` is read-only. It must not create runs, create tasks, or mutate task state. JSON output includes `surface`, `taskId`, `effects`, and `nextActions`. Plain output prints copy-pasteable next actions with `<task-id>` and `<run-id>` placeholders when the IDs are not yet known.

## Task Surface

Task artifacts use `kind: task` and are first-class graph artifacts. Task lifecycle events are task-specific: `task_created`, `task_assigned`, `task_split`, and `task_closed`.

## Run Surface

`atelier run create --task <task-id>` materializes a resumable capsule and does not invoke an LLM or edit source code.

The canonical reading order for the capsule is fixed and is the same for CLI, MCP, GUI, and adapter docs:

```txt
manifest.json
handoff.md
brief.md
plan.md
context.md
verification.md
review.md
worklog.md
artifacts.md
```

Run commands are:

```bash
atelier run create --task <task-id>
atelier run list [--status active|completed]
atelier run inspect <run-id>
atelier run resume <run-id>
atelier run handoff <run-id> --append <text>
atelier run verify <run-id> --list
atelier run verify <run-id> --record "<check-id>::<status>::<note>"
atelier run complete <run-id>
```

`atelier run list` is read-only and returns run capsules filtered by status. `atelier run resume` returns a portable resume prompt that any external LLM runner or human operator can read.

## Run Surface Effects

`atelier run create` writes a new capsule under `harness/runs/active/<run-id>/` and emits `run_created`. `atelier run handoff` and `atelier run verify --record` append to the active capsule and update the manifest. `atelier run complete` enforces completion gates, moves the capsule to `harness/runs/completed/<run-id>/`, and emits `run_completed`. No Run surface command invokes an LLM or edits source code.

## Run Events

- `run_created`: a resumable run capsule was materialized under `harness/runs/active/<run-id>/`.
- `run_completed`: a run capsule passed completion gates and was moved to `harness/runs/completed/<run-id>/`.
- `run_started`: deprecated legacy v1 lifecycle event. Readers may accept historical records, but new Run surface code must not emit it.
