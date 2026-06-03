---
schema: harness/v1
kind: workflow
id: workflow.design-session
title: Design Session
status: active
summary: Problem → Direction → Design → Implementation → Close. Use when a design-first approach is needed before implementation.
tags:
  - harness
  - workflow
  - design-session
callable: true
phases:
  - phase.intake
  - phase.design-direction
  - phase.design-detailing
  - phase.implementation
  - phase.verification
  - phase.handoff
required_phases:
  - phase.intake
  - phase.design-direction
  - phase.design-detailing
  - phase.implementation
  - phase.verification
  - phase.handoff
conditional_phases: []
---

# Workflow: Design Session

Use this workflow when a problem requires design exploration, trade-off analysis, and structured decision-making before implementation.

## Purpose

Convert a human request or problem statement into a designed solution through explicit direction-setting, detailed design, implementation, verification, and handoff.

Use this instead of `workflow.isolated-run` when:

- the approach is unclear or contested
- multiple design directions exist and need comparison
- the change has architectural or cross-boundary implications
- trade-offs must be documented in ADR form
- the cost of early implementation is high

## Step 1: Assign roles

Choose:

- one primary role for the domain
- zero or more supporting roles
- one reviewer role when the design has non-trivial impact

## Step 2: Load role-routed context

Load only:

- this workflow
- assigned role files
- required knowledge listed by assigned roles
- policies named by assigned roles or phases
- phase files named below
- source files identified during investigation

## Step 3: Create or select a run folder

```txt
harness/runs/active/<RUN-ID>/
```

Required records:

```txt
brief.md
plan.md
worklog.md
verification.md
handoff.md
```

## Step 4: Execute phases

Required phases (in order):

- `../phases/intake.md` — capture problem, constraints, scope
- `../phases/design-direction.md` — explore directions, choose approach
- `../phases/design-detailing.md` — detailed design decisions and specifications
- `../phases/implementation.md` — implement the design
- `../phases/verification.md` — verify correctness
- `../phases/handoff.md` — handoff with documentation

## Completion standard

A design session is not complete until:

- the problem is bounded in brief.md with scope and non-goals
- design directions were explored and the chosen direction is documented in plan.md
- detailed design decisions are recorded (inline or as ADR candidates)
- implementation stays within the designed scope
- verification evidence exists
- handoff records what changed, why, trade-offs, risks, and follow-ups
- durable knowledge updates were made or explicitly marked unnecessary
