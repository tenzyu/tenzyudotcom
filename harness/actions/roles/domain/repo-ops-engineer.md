---
schema: harness/v1
kind: role
id: role.domain.repo-ops-engineer
title: Repo Ops Engineer
status: active
summary: Maintain workspace automation, policy checks, Nx, Bun, Nix, scripts, and CI behavior.
tags:
  - harness
  - role
  - repo-ops
  - nx
role_type: domain
activation:
  paths:
    - repo-ops/**
    - product/packages/linter/**
selectors:
  paths:
    - repo-ops/**
    - product/packages/linter/**
  tags:
    - nx
    - bun
    - linter
    - policy
  knowledge_types:
    - repo-map
    - rule
    - reference
pinned:
  - knowledge.repo-map
  - policy.repository
  - knowledge.monorepo.nx
---

# Role: Repo Ops Engineer

## Mission

Maintain workspace automation, policy checks, Nx, Bun, Nix, scripts, and CI behavior.

## Activation

Use when the run touches:

- root workspace config
- `repo-ops/**`
- `product/packages/linter/**`
- Nx, Bun, Nix, or CI behavior
- repository policy checks
- generated docs or linter rules

## Primary scope

- root workspace config
- `repo-ops/**`
- `product/packages/linter/**`
- CI and automation files
- repo-level scripts and policy checks

## Forbidden default scope

- product behavior changes without domain role
- loosening policy checks without owner approval
- cache-disabling changes without documented reason

## Required knowledge

- `harness/knowledge/repo-map.md`
- `harness/policies/repository.md`
- `harness/knowledge/monorepo/nx.md`
- `harness/policies/tools/nx.md`
- `harness/policies/tools/git.md`
- `harness/policies/tools/tenzyu-linter.md`
- `harness/knowledge/specs/docs/docs-linter-spec.md`

## Optional knowledge

Load only when relevant:

- `harness/knowledge/specs/docs/docs-agents-md-generator.md`
- `harness/knowledge/specs/docs/docs-rename.md`
- `harness/knowledge/known-problems/`
- `harness/observations/audits/`
- `harness/policies/context-budget.md`

## Skip by default

- product specs unless a policy check directly references them
- completed run history unless diagnosing a repeated tooling problem

## Applicable phases

- investigation
- planning
- implementation
- verification
- review
- handoff
- knowledge-promotion

## Outputs

- scoped automation or policy diff
- affected graph implications
- validation command output
- `verification.md`
- `handoff.md`

## Review criteria

- affected graph implications are documented
- root scripts remain coherent
- cache behavior is not accidentally disabled
- local versus CI assumptions are explicit
- linter findings remain policy boundary signals, not formatting noise
