---
schema: harness/v1
kind: canon
id: actions.index
title: Actions
status: active
summary: Entry point for harness workflows, roles, phases, and artifact templates.
tags:
  - harness
  - actions
  - index
---

# Actions

Actions define how AI-assisted work moves through the harness.

Start here:

1. `workflows/README.md` — choose the callable workflow.
2. `roles/README.md` — assign the smallest safe role set.
3. Load only the knowledge listed by the assigned roles.
4. Use `phases/` as lifecycle modules when the workflow asks for them.
5. Use `artifacts/templates/` for run record output shapes.

## Directory contract

```txt
workflows/ = callable entrypoints
roles/     = context routing profiles and responsibility boundaries
phases/    = lifecycle modules
artifacts/ = output shapes
```

## Core rule

Roles are not personas. A role is a context selector.

```txt
Role = scope + required knowledge + optional knowledge + allowed actions + outputs + review criteria
```

Do not load all `harness/knowledge` by default. Assign roles first, then load only the knowledge named by those roles plus the workflow and phase files needed for the run.

## Phase rule

A phase is a lifecycle step. It should define common procedure, not product-specific context.

If a role only exists to execute one phase, inline that responsibility into the phase file. Keep only roles that can be assigned independently or own a durable domain boundary.

## Role assignment rule

Each non-trivial run should identify:

- primary role
- supporting roles, when needed
- reviewer role, when risk is non-trivial
- governance role, when cost, release, or policy concerns are material

## Stable flow

```txt
request
  -> workflow selection
  -> role assignment
  -> role knowledge loading
  -> phase execution
  -> observation evidence
  -> handoff
  -> knowledge promotion, only when durable
```
