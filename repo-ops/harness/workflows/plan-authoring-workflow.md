---
name: harness-plan-authoring-workflow
description: How to draft plan files for backlog tracking or execution-ready delegation.
summary: Defines when to create a backlog note versus a ready plan and keeps the initial skeleton small.
read_when:
  - When drafting a new plan
  - When promoting a backlog note into a ready plan
skip_when:
  - When a suitable plan already exists and only implementation remains
user-invocable: false
---

# Plan Authoring Workflow

This repo uses plan files instead of a top-level `PLANS.md`.
Use `docs/exec-plans/active/*.md` for both tracking notes and execution-ready plans.
Treat `execution-ready: true` as a logical state, not a required directory split.
Update active plans whenever meaningful progress or decisions happen.

## Role Split

- This document: how to start a plan
- [exec-plan-contract](./exec-plan-contract.md): required sections for ready plans
- [agent-orchestration-workflow](./agent-orchestration-workflow.md): delegation, review, archive flow

## 1. Intake

Before writing a plan, collect:

- a one-line task summary
- the done condition
- the file scope or subsystem
- the needed verification
- whether it is ready now or only worth tracking as backlog

If file placement is unclear, check [Rules: 6-Layer Ownership](../design-docs/rules/ownership-model-layers.md) and [Rules: Path & Feature Semantics](../design-docs/rules/path-feature-semantics.md) first.

## 2. Decide The Type

Use a tracking note when:

- you want to keep a short follow-up or debt note
- file scope or verification is still unclear
- the task is not ready for delegation
- the next session only needs a resumable reminder

Use a ready plan when:

- you want to delegate immediately
- done condition, scope, and verification are known
- the handoff should live in the file, not in chat

Use [exec-plan-contract](./exec-plan-contract.md) for the ready-plan contract.

## 3. Author The Frontmatter

Both shapes need:

- `name`
- `description`
- `summary`
- `read_when`
- optional `skip_when`
- optional `user-invocable`

Only ready plans should add `execution-ready: true`.

## 4. Start From A Small Skeleton

Tracking note skeleton:

```md
---
name: <task-name>
description: <what is being tracked>
summary: <why this note exists>
read_when:
  - <when to read>
skip_when:
  - <when not to read>
user-invocable: false
---

# <Title>

<short status, unresolved point, next decision>
```

Ready plan skeleton:

```md
---
name: <task-name>
description: <what will be executed>
summary: <why this task matters>
read_when:
  - <when to read>
skip_when:
  - <when not to read>
user-invocable: false
execution-ready: true
---

# <Title>

## Goal

- <outcome-based done condition>

## Scope

- <allowed file scope or subsystem>

## Deliverables

- <what must exist when done>

## Task Breakdown

- <main step 1>
- <main step 2>

## Subagent Contract

- plan path: `docs/exec-plans/active/<task>.md`
- allowed file scope:
  - `<scope>`
- required verification:
  - `nix develop -c <command>`
- return format:
  - changed files
  - verification result
  - unresolved risks

## Verification

- `nix develop -c <command>`

## Completion Signal

- <what lets the orchestrator close the task>
```

## 5. Review Before Delegation

Before delegation, check:

- the file alone makes the goal and done condition clear
- the note is resumable in another session
- `allowed file scope` and `required verification` do not depend on chat
- a backlog note was not promoted too early
- the plan will still read clearly after moving to `completed`

## 6. Promote Or Archive

- Keep tracking notes in `active/` until they are ready.
- Promote readiness by adding `execution-ready: true`, not by forcing a directory move.
- After completion, move the file to `completed/` using [agent-orchestration-workflow](./agent-orchestration-workflow.md).
- Treat completed plans as work logs, not canonical rules.
