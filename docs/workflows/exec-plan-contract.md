---
name: harness-exec-plan-contract
description: Minimum contract for a plan that can be handed directly to a subagent.
summary: Separates backlog notes from execution-ready plans and defines the required ready-plan sections.
read_when:
  - When creating a ready plan
  - When preparing a plan for delegation
skip_when:
  - When only reading historical completed logs
user-invocable: false
---

# Exec-Plan Contract

This repo uses plan files as the working equivalent of `PLANS.md`.
`docs/exec-plans/active/*.md` holds both notes and delegation-ready plans.
Readiness is a plan state expressed by `execution-ready: true`.
This document defines only the minimum contract for ready plans.

## Role Split

- [plan-authoring-workflow](./plan-authoring-workflow.md): choose the plan shape and draft it
- This document: required sections for ready plans
- [agent-orchestration-workflow](./agent-orchestration-workflow.md): delegate, review, archive

## Plan Shapes

There are two active plan shapes.

- backlog note
  - keeps a follow-up, debt item, or resumable note
- ready plan
  - can be handed directly to a subagent
  - has `execution-ready: true` in frontmatter

Only ready plans are delegation-ready.

## Required Sections

A ready plan must contain the sections below.

## Goal

- Write the done condition as an outcome.

## Scope

- Define the allowed file scope or subsystem boundary.

## Deliverables

- List the required outputs.

## Task Breakdown

- List the main steps.

## Subagent Contract

- plan path
- allowed file scope
- required verification
- expected return format

## Verification

- List the commands that must run.
- If the repo depends on a dev shell, include the wrapper such as `nix develop -c ...`.
- If execution is blocked, write the blocking condition explicitly.

## Completion Signal

- State what lets the orchestrator close the task.

## Writing Rules

- Keep `1 task = 1 file`.
- Keep active plans current enough to resume in another session.
- Do not bury handoff details only in chat.
- Promote reusable decisions into durable docs.
- Do not force a backlog note into ready shape too early.
- Treat `docs/exec-plans/completed/*.md` as work logs, not canonical rules.
