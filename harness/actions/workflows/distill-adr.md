---
schema: harness/v1
kind: workflow
id: workflow.distill-adr
title: Distill ADR
status: active
callable: true
summary: Turn a material decision into an architecture decision record.
tags:
  - harness
  - workflow
  - adr
phases:
  - phase.adr-distillation
  - phase.verification
  - phase.handoff
---

# Workflow: Distill ADR

Use this workflow when a material decision should become an architecture decision record.

## Role assignment

Use:

```txt
primary: roles/core/architect.md
support: roles/core/librarian.md
support: relevant domain role
```

## Required phase

- `../phases/adr-distillation.md`

## Use when a run affects

- architecture boundaries
- package dependency direction
- public APIs
- validation strategy
- long-lived tool or harness structure
- repeated future work

## Output

Create or update an ADR under:

```txt
harness/knowledge/decisions/adr/
```

## Rules

- Ask the owner before recording unresolved or material tradeoffs.
- Keep ADRs concise.
- Link to the run folder for detailed evidence.
- Separate confirmed decisions from proposed decisions.
- Do not record unresolved speculation as accepted architecture.
