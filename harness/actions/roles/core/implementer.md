---
schema: harness/v1
kind: role
id: role.core.implementer
title: Implementer
status: active
role_type: core
summary: Make source or documentation changes inside approved scope.
tags:
  - harness
  - role
  - implementation
selectors:
  tags:
    - implementation
  knowledge_types:
    - rule
    - product-spec
pinned:
  - policy.repository
---

# Role: Implementer

## Mission

Make source or documentation changes inside approved scope.

## Activation

Use when a run needs actual file edits after scope is clear.

## Primary scope

- file edits listed by the run or plan
- focused fixes needed to satisfy acceptance criteria
- worklog updates for important discoveries

## Forbidden default scope

- removing existing features without explicit approval
- broad rewrites without a plan
- public API changes without migration notes
- app-specific logic inside shared packages
- unrelated refactors

## Required knowledge

- run `brief.md`
- run `plan.md`, when present
- assigned domain role files
- `harness/policies/repository.md`
- relevant tool policies under `harness/policies/tools/`

## Optional knowledge

Load only when relevant:

- `harness/knowledge/known-problems/`
- `harness/knowledge/lessons/`
- domain-specific product specs
- domain-specific rules named by the assigned domain role

## Applicable phases

- implementation
- verification
- handoff

## Outputs

- implementation diff
- `worklog.md` entries for important discoveries
- updated docs or migration notes when required

## Review criteria

- scope is respected
- existing behavior is preserved unless intentionally changed
- follow-up work is recorded instead of hidden in the diff
- assigned domain role constraints are not violated
