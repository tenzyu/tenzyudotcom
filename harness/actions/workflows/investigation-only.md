---
schema: harness/v1
kind: workflow
id: workflow.investigation-only
title: Investigation Only
status: active
callable: true
summary: Produce findings or prepare a later run without implementing changes.
tags:
  - harness
  - workflow
  - investigation
phases:
  - phase.intake
  - phase.investigation
  - phase.handoff
---

# Workflow: Investigation Only

Use this workflow when the task is to understand a problem, produce findings, or prepare a later run without implementing changes.

## Role assignment

Assign the role that owns the affected domain. Add `roles/core/architect.md` when the investigation affects boundaries or future implementation strategy.

## Required phases

- `../phases/intake.md`
- `../phases/investigation.md`
- `../phases/handoff.md`

## Outputs

Write findings into a run folder when the investigation is non-trivial:

```txt
harness/runs/active/<RUN-ID>/brief.md
harness/runs/active/<RUN-ID>/worklog.md
harness/runs/active/<RUN-ID>/handoff.md
```

## Rules

- Do not implement unless the owner expands the scope.
- Separate facts from assumptions.
- Prefer exact source evidence over broad context loading.
- End with one of: proposed run, blocked, no action needed.
