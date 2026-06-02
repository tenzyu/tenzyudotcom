---
schema: harness/v1
kind: workflow
id: workflow.isolated-run
title: Isolated Run
status: active
summary: Execute non-trivial mutable work through one bounded run with evidence and handoff.
tags:
  - harness
  - workflow
  - isolated-run
callable: true
phases:
  - phase.intake
  - phase.worktree-isolation
  - phase.investigation
  - phase.planning
  - phase.implementation
  - phase.verification
  - phase.review
  - phase.handoff
  - phase.knowledge-promotion
  - phase.adr-distillation
---

# Workflow: Isolated Run

Use this workflow for non-trivial mutable work.

## Purpose

Convert a human request into one bounded run executed through assigned roles, selected knowledge, lifecycle phases, verification evidence, and handoff.

## Step 1: Assign roles

Choose:

- one primary role
- zero or more supporting roles
- one reviewer role when risk is non-trivial
- one governance role when cost, release, or policy concerns are material

Examples:

```txt
Web route fix:
  primary: roles/domain/web-app-engineer.md
  support: roles/core/implementer.md
  review: roles/core/reviewer.md

Nx or CI issue:
  primary: roles/domain/repo-ops-engineer.md
  support: roles/governance/cost-controller.md when context cost is high
  review: roles/core/reviewer.md

Harness restructuring:
  primary: roles/domain/harness-engineer.md
  support: roles/core/architect.md
  review: roles/core/reviewer.md

Workbench native issue:
  primary: roles/domain/rust-tauri-engineer.md
  support: roles/core/implementer.md
  review: roles/core/reviewer.md
```

## Step 2: Load role-routed context

Load only:

- this workflow
- assigned role files
- required knowledge listed by assigned roles
- policies named by assigned roles or phases
- phase files named below
- source files identified during investigation

Do not load all `harness/knowledge`. Do not load completed runs by default.

## Step 3: Create or select a run folder

Use:

```txt
harness/runs/active/<RUN-ID>/
```

Required records for non-trivial work:

```txt
brief.md
worklog.md
verification.md
handoff.md
```

Add `plan.md` when the change is broad, risky, cross-boundary, or non-obvious.
Add `review.md` when independent review is requested or risk warrants it.

## Step 4: Execute phases

Required phases:

- `../phases/intake.md`
- `../phases/worktree-isolation.md`
- `../phases/investigation.md`
- `../phases/planning.md`, when non-trivial strategy is needed
- `../phases/implementation.md`
- `../phases/verification.md`
- `../phases/review.md`, when required
- `../phases/handoff.md`
- `../phases/knowledge-promotion.md`, only when durable knowledge exists
- `../phases/adr-distillation.md`, only when a material decision should become ADR

## Completion standard

A run is not complete until:

- scope and non-goals are explicit
- assigned roles are recorded
- required role knowledge was checked or skipped with reason
- changed files stay inside scope
- relevant validation ran or skipped checks are justified
- verification evidence exists
- handoff records what changed, why, risks, and follow-ups
- durable knowledge updates were made or explicitly marked unnecessary
