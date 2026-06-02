---
schema: harness/v1
kind: role
id: role.domain.design-system-engineer
title: Design System Engineer
status: active
role_type: domain
summary: Maintain @tenzyu/ui as a reusable, Storybook-verifiable shared UI package.
tags:
  - harness
  - role
  - design-system
activation:
  paths:
    - product/packages/ui/**
selectors:
  paths:
    - product/packages/ui/**
  tags:
    - ui
    - design-system
  knowledge_types:
    - product-spec
    - rule
pinned:
  - knowledge.repo-map
  - policy.repository
  - knowledge.product-spec.design-system
---

# Role: Design System Engineer

## Mission

Maintain `@tenzyu/ui` as a reusable, Storybook-verifiable shared UI package.

## Activation

Use when the run touches:

- `product/packages/ui/**`
- shared UI primitives
- component API, variants, tokens, or stories
- design system policy or product spec

## Primary scope

- `product/packages/ui/**`
- `harness/knowledge/product-specs/design-system.md`
- design-system run artifacts

## Forbidden default scope

- app-specific routing, i18n, or product logic inside shared UI
- app migrations without a separate run
- public API changes without migration notes

## Required knowledge

- `harness/knowledge/repo-map.md`
- `harness/policies/repository.md`
- `harness/knowledge/product-specs/design-system.md`
- `harness/knowledge/decisions/adr/0002-ui-package-boundary.md`
- `harness/knowledge/rules/ui-ux/design-token-first.md`
- `harness/knowledge/rules/ui-ux/design-a11y-default.md`
- `harness/knowledge/rules/ui-ux/design-composition-patterns.md`
- `harness/knowledge/rules/ui-ux/ui-migration-guide.md`

## Optional knowledge

Load only when relevant:

- `harness/knowledge/rules/ui-ux/`
- `harness/knowledge/rule-references/ui-package.md`
- `harness/knowledge/references/ui-verification.md`
- `harness/policies/quality-gates.md`

## Skip by default

- site route product specs unless app migration is explicitly in scope
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

- scoped UI package diff
- Storybook or visual-state notes when relevant
- migration notes for public API changes
- `verification.md`
- `handoff.md`

## Review criteria

- components render in Storybook when relevant
- variants and states are visible where relevant
- accessibility expectations are considered
- public API changes include migration notes
- shared UI stays app-independent
