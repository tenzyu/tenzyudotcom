---
schema: harness/v1
kind: canon
id: workflows.registry
title: Workflow Registry
status: active
summary: Callable workflow registry and invocation sequence for harness runs.
tags:
  - harness
  - workflows
  - registry
---

# Workflow Registry

Use this file as the callable workflow entrypoint.

## Default choice

| Situation | Call |
| --- | --- |
| Non-trivial mutable work | `isolated-run.md` |
| Small scoped docs/config/reference fix | `direct-run.md` |
| Investigation only | `investigation-only.md` |
| Independent review | `review-change.md` |
| Review findings already exist | `review-to-merge.md` |
| Issue or request needs run conversion | `issue-to-run.md` |
| Completed run needs PR packaging | `run-to-pr.md` |
| Durable lesson or decision should be promoted | `promote-knowledge.md` |
| Architecture decision should become ADR | `distill-adr.md` |

## Required invocation sequence

1. Select one workflow from this registry.
2. Assign one primary role from `../roles/`.
3. Add supporting roles only when their knowledge bundle or review criteria are needed.
4. Load role files before broad knowledge exploration.
5. Load required knowledge listed by the assigned roles.
6. Execute only the phases named by the workflow.

## Rule

Workflows are callable. Roles route context. Phases are lifecycle modules.

Do not call phase files directly unless a workflow explicitly names them.

## References

- roles: `../roles/`
- phases: `../phases/`
- artifact templates: `../artifacts/templates/`
