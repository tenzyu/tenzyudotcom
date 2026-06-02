---
schema: harness/v1
kind: workflow
id: workflow.issue-to-run
title: Issue To Run
status: active
summary: Convert an issue, request, or vague problem into a bounded executable run.
tags:
  - harness
  - workflow
  - intake
callable: true
phases:
  - phase.intake
  - phase.investigation
  - phase.planning
  - phase.handoff
---

# Workflow: Issue To Run

Convert an issue, request, or vague problem into a bounded executable run.

## Role assignment

Start with the likely domain role. Add `roles/core/architect.md` when scope or boundaries are unclear. Add `roles/governance/cost-controller.md` when the request would otherwise trigger broad exploration.

## Required phases

- `../phases/intake.md`
- `../phases/investigation.md`, when the scope cannot be bounded from the request
- `../phases/planning.md`, when implementation strategy is needed before edits

## Inputs

- issue title and body, or human request
- labels, if present
- linked discussions or decisions
- relevant repository knowledge selected by assigned roles

## Outputs

Create or update:

```txt
harness/runs/active/<RUN-ID>/brief.md
harness/runs/active/<RUN-ID>/plan.md  # when non-trivial
```

## Ready standard

A run is ready only when scope, non-goals, validation, allowed files, forbidden files, constraints, risk, and completion criteria are clear.

Unclear requests are not implementation-ready.
