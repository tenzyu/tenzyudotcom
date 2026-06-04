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
- `run`: portable, resumable execution capsule under `harness/runs/active/` or `harness/runs/completed/`.
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

`atelier context plan` is read-only. It must not create runs, create tasks, or mutate task state. JSON output includes `surface`, `taskId`, `effects`, and `nextActions`.

## Task Surface

Task artifacts use `kind: task` and are first-class graph artifacts. Task lifecycle events are task-specific: `task_created`, `task_assigned`, `task_split`, and `task_closed`.

## Run Surface

`atelier run create --task <task-id>` materializes a resumable capsule and does not invoke an LLM or edit source code. A run capsule contains:

```txt
manifest.json
brief.md
context.md
plan.md
handoff.md
worklog.md
verification.md
review.md
artifacts.md
```

Run commands are:

```bash
atelier run create --task <task-id>
atelier run inspect <run-id>
atelier run resume <run-id>
atelier run handoff <run-id> --append <text>
atelier run verify <run-id> --list
atelier run verify <run-id> --record "<check-id>::<status>::<note>"
atelier run complete <run-id>
```

## Run Events

- `run_created`: a resumable run capsule was materialized under `harness/runs/active/<run-id>/`.
- `run_completed`: a run capsule passed completion gates and was moved to `harness/runs/completed/<run-id>/`.
- `run_started`: deprecated legacy v1 lifecycle event. Readers may accept historical records, but new Run surface code must not emit it.
