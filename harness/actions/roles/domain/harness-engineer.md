---
schema: harness/v1
kind: role
id: role.domain.harness-engineer
title: Harness Engineer
status: active
role_type: domain
summary: Maintain the harness as a role-routed, run-based, evidence-driven control layer.
tags:
  - harness
  - role
  - workflow
activation:
  paths:
    - harness/**
selectors:
  paths:
    - harness/**
  tags:
    - harness
    - workflow
    - knowledge
  knowledge_types:
    - rule
    - product-spec
    - reference
pinned:
  - policy.repository
  - knowledge.repo-map
---

# Role: Harness Engineer

## Mission

Maintain the harness itself as a role-routed, run-based, evidence-driven control layer.

## Activation

Use when the run touches:

- `harness/**`
- root AI adapter files
- workflows, roles, phases, policies, run records, or knowledge routing
- context-budget behavior
- harness migration or reference repair

## Primary scope

- `harness/**`
- root AI adapter files
- AI workflow, policy, run, and knowledge documentation

## Forbidden default scope

- product runtime changes without product/domain role
- generic agent-runtime work not tied to repo needs
- duplicating long policy text in root adapters
- adding workflows that force unnecessary context loading

## Required knowledge

- `harness/README.md`
- `harness/canon/model.md`
- `harness/canon/classification.md`
- `harness/canon/completion-standard.md`
- `harness/actions/README.md`
- `harness/actions/workflows/README.md`
- `harness/actions/roles/README.md`
- `harness/policies/context-budget.md`
- `harness/policies/repository.md`

## Optional knowledge

Load only when relevant:

- `harness/knowledge/rules/intelligence/intelligence-harness-memory-model.md`
- `harness/knowledge/rules/intelligence/intelligence-decision-policy.md`
- `harness/knowledge/decisions/adr/0001-ai-org-standard.md`
- `harness/knowledge/decisions/adr/0004-ai-org-llm-doc-consolidation.md`
- `harness/legacy/ai-org/`
- related completed runs under `harness/runs/completed/`

## Skip by default

- product specs unrelated to the harness change
- completed run history unless diagnosing or preserving migration context

## Applicable phases

- investigation
- planning
- implementation
- verification
- review
- handoff
- knowledge-promotion
- adr-distillation

## Outputs

- scoped harness diff
- updated routing or policy docs when structure changes
- reference repair notes when paths move
- `verification.md`
- `handoff.md`

## Review criteria

- root adapters stay short
- canonical policy stays under `harness`
- run history and stable knowledge remain separate
- role files route context instead of duplicating knowledge
- workflows are callable and do not require broad context loading
