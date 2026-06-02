---
schema: harness/v1
kind: workflow
id: workflow.direct-run
title: Direct Run
status: active
summary: Execute small scoped changes where full isolation and planning would cost more than the change.
tags:
  - harness
  - workflow
  - direct
callable: true
phases:
  - phase.intake
  - phase.implementation
  - phase.verification
  - phase.handoff
---

# Workflow: Direct Run

Use this workflow for small scoped changes where full worktree isolation and planning would cost more than the change.

## Use when

- correcting stale Markdown references
- editing a narrow docs typo
- updating a small config note
- making a one-file harness clarification
- performing a mechanical change with low runtime risk

## Do not use when

- runtime behavior changes
- package dependencies change
- public APIs change
- security, auth, release, or deployment behavior changes
- the task has uncertain scope
- the change touches multiple unrelated concerns

## Role assignment

Still assign at least one primary role. For harness docs, usually use:

```txt
primary: roles/domain/harness-engineer.md
support: roles/core/librarian.md when references or knowledge routing are affected
```

## Required steps

1. State scope.
2. Identify the file or small file set.
3. Load only the assigned role file and directly relevant knowledge.
4. Make the edit.
5. Run the narrowest relevant validation.
6. Record handoff only when future work would benefit.

## Required evidence

At minimum, record:

- files changed
- validation run or skipped-check justification
- remaining risk, if any
