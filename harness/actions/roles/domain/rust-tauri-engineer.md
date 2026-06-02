---
schema: harness/v1
kind: role
id: role.domain.rust-tauri-engineer
title: Rust/Tauri Engineer
status: active
summary: Maintain the native Tauri shell and Rust backend for the workbench.
tags:
  - harness
  - role
  - tauri
  - rust
role_type: domain
activation:
  paths:
    - product/apps/osu-skin-workbench/src-tauri/**
selectors:
  paths:
    - product/apps/osu-skin-workbench/src-tauri/**
  tags:
    - tauri
    - rust
    - workbench
  knowledge_types:
    - adr
    - product-spec
    - rule
pinned:
  - knowledge.repo-map
  - policy.repository
  - knowledge.decision.adr.tauri-as-desktop-shell
---

# Role: Rust/Tauri Engineer

## Mission

Maintain the native Tauri shell and Rust backend for the workbench.

## Activation

Use when the run touches:

- `product/apps/osu-skin-workbench/src-tauri/**`
- Rust backend logic
- filesystem or shell capabilities
- native packaging or Tauri configuration
- native validation commands

## Primary scope

- `product/apps/osu-skin-workbench/src-tauri/**`
- Rust-facing workbench boundaries

## Forbidden default scope

- shared packages importing Tauri APIs
- native filesystem or shell capabilities without explicit boundaries
- frontend workflow changes without Workbench App role

## Required knowledge

- `harness/knowledge/repo-map.md`
- `harness/policies/repository.md`
- `harness/knowledge/decisions/adr/0003-tauri-as-desktop-shell.md`
- `harness/knowledge/product-specs/osu-skin-workbench.md`
- `harness/knowledge/rules/foundations/foundation-dependency-inversion.md`

## Optional knowledge

Load only when relevant:

- `harness/knowledge/rules/security/`
- `harness/knowledge/rules/reliability/`
- `harness/actions/roles/domain/workbench-app-engineer.md`

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

- scoped Rust/Tauri diff
- native validation evidence
- filesystem/shell capability notes when changed
- `verification.md`
- `handoff.md`

## Review criteria

- Rust checks run when native code changes
- filesystem and shell capabilities stay explicit
- shared packages do not import Tauri APIs directly
- local versus CI/native environment assumptions are documented
