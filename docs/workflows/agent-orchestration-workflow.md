---
name: harness-subagent-orchestration-workflow
description: Standard orchestration flow for delegating ready plans to subagents.
summary: Defines intake, delegation, review, and archive rules so different sessions make the same operational decisions.
read_when:
  - When routing a new task
  - When delegating a ready plan
  - When reviewing and integrating subagent output
skip_when:
  - When the plan and assignee are already fixed and only implementation remains
user-invocable: false
---

# Subagent Orchestration Workflow

The orchestrator is the control plane.
Use `docs/exec-plans/active/*.md` as the active workspace.
Treat `execution-ready: true` as the signal that a plan can be delegated.
The goal is decision consistency across different sessions and models.

## Core Principles

- **Managerial Orchestrator**: prioritize planning, delegation, review, integration, and archive.
- **Plan-First Execution**: do not start significant work from chat alone.
- **Backlog Continuity**: write progress and next steps back into the plan.
- **Progressive Disclosure**: start from `AGENTS.md` and only open the next needed document.

## Document Split

- [plan-authoring-workflow](./plan-authoring-workflow.md): draft or promote plans
- [exec-plan-contract](./exec-plan-contract.md): ready-plan contract
- This document: delegate, review, archive

## 1. Intake Protocol (受付)

When a request arrives, decide in this order:

1. **Context Discovery**: open `AGENTS.md` and identify the domain or workflow.
2. **Plan Collision Check**: scan `active/*.md` for overlapping work.
3. **Inquiry vs. Directive**:
   - **Inquiry**: return findings and recommendations without creating a ready plan.
   - **Directive**: create or promote a plan using [plan-authoring-workflow](./plan-authoring-workflow.md).
4. **Continuity Update**: if a relevant active plan exists, update progress and next steps before ending the session.

## 2. Delegation Protocol (委譲)

Only delegate plans from `docs/exec-plans/active/*.md` that satisfy [exec-plan-contract](./exec-plan-contract.md) and have `execution-ready: true`.

- **1 Task = 1 Plan**: one plan should map to one bounded work item.
- **Strict Scope**: make `allowed file scope` explicit.
- **Verification First**: define the exact verification command before handoff.

## 3. Review & Integration Checklist (レビューと統合)

Review subagent output against these checks:

- [ ] **Plan Alignment**: `Goal` and `Deliverables` are satisfied.
- [ ] **Architecture Check**: placement follows [Rules Index](../design-docs/rules/*.md).
- [ ] **Quality Check**: boundary validation and quality rules are respected.
- [ ] **Design Check**: UI changes follow [Rules: Token-first Styling](../design-docs/rules/design-token-first.md).
- [ ] **Verification Result**: required commands passed and logs are available.
- [ ] **Doc Gardening**: durable docs were updated when code changes required it.

## 4. Completion & Archive Protocol (完了と記録)

When `Completion Signal` is satisfied:

1. **Fact Recording**: append what was verified and why the task is done.
2. **Metadata Update**: rewrite frontmatter into completed-tense history.
3. **Move to Completed**: move the file from `active/` to `completed/`.
4. **Promote Gaps**: add newly discovered open issues to `tech-debt-tracker.md`.

`docs/exec-plans/completed/*.md` is a work-log area, not the canonical rule source.

## Failure Handling (不一致の解消)

If the result does not satisfy the checklist:

1. resend with the missing requirements and the supporting doc paths
2. if the plan itself was incomplete, fix the plan before re-delegating
