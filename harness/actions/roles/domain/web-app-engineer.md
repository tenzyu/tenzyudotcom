---
schema: harness/v1
kind: role
id: role.domain.web-app-engineer
title: Web App Engineer
status: active
summary: Maintain product/apps/web without leaking route-local concerns into shared packages.
tags:
  - harness
  - role
  - web
  - nextjs
role_type: domain
activation:
  paths:
    - product/apps/web/**
selectors:
  paths:
    - product/apps/web/**
  require_all:
    - domain:site
    - kind:rule
  require_any:
    - kind:spec
    - subject:admin
    - subject:auth
    - subject:boundary
    - subject:composition
    - kind:known-problem
pinned:
  - knowledge.repo-map
  - policy.repository
---

# Role: Web App Engineer

## Mission

Maintain `product/apps/web` without leaking route-local concerns into shared packages.

## Activation

Use when the run touches:

- `product/apps/web/**`
- Next.js routes, pages, layouts, route handlers, or server actions
- site i18n or Intlayer behavior
- public site behavior
- inline admin/editor behavior
- site product specs

## Primary scope

- `product/apps/web/**`
- `harness/knowledge/product-specs/site/**`

## Forbidden default scope

- shared package changes without separate package/domain role
- app-specific logic inside shared packages
- broad UI migrations without an approved run
- auth or editor behavior changes without security checks

## Required knowledge

- `harness/knowledge/repo-map.md`
- `harness/policies/repository.md`
- `harness/knowledge/product-specs/site/architecture.md`
- `harness/knowledge/rules/foundations/foundation-owner-placement-layers.md`
- `harness/knowledge/rules/foundations/foundation-feature-slice-structure.md`
- `harness/knowledge/rules/foundations/foundation-dependency-inversion.md`
- `harness/knowledge/rules/implementation/impl-route-entrypoint-contracts.md`
- `harness/knowledge/rules/implementation/impl-actions-mount-through-assemble.md`
- `harness/knowledge/rules/security/security-server-actions-require-auth-even-for-helper-actions.md`

## Optional knowledge

Load only when relevant:

- `harness/knowledge/product-specs/site/admin-editor-spec.md`
- `harness/knowledge/product-specs/site/blog-product-spec.md`
- `harness/knowledge/product-specs/site/notes-product-spec.md`
- `harness/knowledge/product-specs/site/tools-product-spec.md`
- `harness/knowledge/product-specs/site/links-product-spec.md`
- `harness/knowledge/product-specs/site/portfolio-product-spec.md`
- `harness/knowledge/rules/security/`
- `harness/knowledge/rules/reliability/`
- `harness/knowledge/rules/ui-ux/`
- `harness/knowledge/rule-references/site-rules.md`

## Skip by default

- Castalia product specs
- osu-skin-workbench product specs
- Rust/Tauri role docs
- completed run history

## Applicable phases

- investigation
- planning
- implementation
- verification
- review
- handoff

## Outputs

- scoped web diff
- `worklog.md` notes for durable discoveries
- `verification.md`
- `handoff.md`
- knowledge proposals when recurring

## Review criteria

- route-local concerns stay route-local
- shared packages do not absorb app-specific behavior
- server actions are authenticated when needed
- public behavior is preserved unless explicitly changed
- relevant Nx checks are recorded
