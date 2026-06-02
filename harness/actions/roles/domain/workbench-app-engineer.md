---
schema: harness/v1
kind: role
id: role.domain.workbench-app-engineer
title: Workbench App Engineer
status: active
summary: Maintain the osu! skin workbench frontend and workflow UX.
tags:
  - harness
  - role
  - workbench
role_type: domain
activation:
  paths:
    - product/apps/osu-skin-workbench/src/**
selectors:
  paths:
    - product/apps/osu-skin-workbench/src/**
  tags:
    - workbench
    - ui
  knowledge_types:
    - product-spec
    - rule
pinned:
  - knowledge.repo-map
  - policy.repository
  - knowledge.product-spec.osu-skin-workbench
---

# Role: Workbench App Engineer

## Mission

Maintain the osu! skin workbench frontend and workflow UX.

## Activation

Use when the run touches:

- `product/apps/osu-skin-workbench/src/**`
- workbench UI flows
- skin workflow UX
- frontend integration with native capabilities
- workbench product specs

## Primary scope

- `product/apps/osu-skin-workbench/src/**`
- `harness/knowledge/product-specs/osu-skin-workbench.md`

## Forbidden default scope

- native Tauri backend changes without Rust/Tauri role
- shared package changes without a separate package/domain role
- app-specific workbench logic inside shared packages

## Required knowledge

- `harness/knowledge/repo-map.md`
- `harness/policies/repository.md`
- `harness/knowledge/product-specs/osu-skin-workbench.md`
- `harness/knowledge/rules/foundations/foundation-feature-slice-structure.md`
- `harness/knowledge/rules/foundations/foundation-dependency-inversion.md`

## Optional knowledge

Load only when relevant:

- `harness/knowledge/rules/ui-ux/`
- `harness/knowledge/rules/reliability/`
- `harness/knowledge/product-specs/design-system.md`
- `harness/actions/roles/domain/rust-tauri-engineer.md`

## Skip by default

- site product specs
- Castalia product specs
- completed run history

## Applicable phases

- investigation
- planning
- implementation
- verification
- review
- handoff

## Outputs

- scoped frontend diff
- workflow UX notes when behavior changes
- `verification.md`
- `handoff.md`

## Review criteria

- relevant frontend checks pass or skips are justified
- UI changes preserve workbench workflows
- native capabilities are accessed through approved interfaces
- shared packages do not absorb app-specific workbench logic
