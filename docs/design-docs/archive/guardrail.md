---
name: harness-guardrails-summary
description: Short operational guard summary for orchestrators and workers.
summary: Points readers to the canonical guardrails and keeps only the minimum routing and execution rules here.
read_when:
  - Before implementation, review, or refactoring
  - When aligning orchestrator and worker responsibilities
skip_when:
  - When the canonical deep guardrails are already open
user-invocable: false
---

# Guardrails (GUARDRAILS)

This file is a short summary for LLMs.
The canonical guard rules live in [guardrails.md](./guardrails.md).

## Role Split

- orchestrator
  - classify requests
  - create or update plans
  - gather missing constraints when needed
  - hand scope and verification to workers
  - decide when to archive completed work and promote durable rules
- worker
  - change only the allowed file scope
  - implement, verify, and report inside the plan and guardrail boundary
  - avoid burying reusable rules inside completed logs

## Input Guard

- Use [architecture.md](./architecture.md) for the summary and [structure-rules.md](./structure-rules.md) for canonical placement rules.
- If structural decisions depend on missing user constraints, ask before implementation.
- If a new noun, route, workflow, or runtime has no documented decision rule yet, update docs first.

## Execution Guard

- Active plans are living artifacts and should stay current enough for another session to resume.
- Only plans marked with `execution-ready: true` are delegation-ready.
- Keep notes, debt, and ready plans in `../exec-plans/active/` until the structure needs to harden.
- Completed plans are work logs, not the canonical rule source.
- Run the verification commands written in the plan.
- Do not revert unrelated changes.

## Where To Go Next

- Canonical guardrails: [guardrails.md](./guardrails.md)
- Canonical placement rules: [structure-rules.md](./structure-rules.md)
- Plan drafting: [../../workflows/plan-authoring-workflow.md](../../workflows/plan-authoring-workflow.md)
- Execution-ready contract: [../../workflows/exec-plan-contract.md](../../workflows/exec-plan-contract.md)
- Delegation flow: [../../workflows/agent-orchestration-workflow.md](../../workflows/agent-orchestration-workflow.md)
