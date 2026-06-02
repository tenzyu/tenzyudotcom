---
schema: harness/v1
kind: run
id: run.active.task-0019-atelier-m2-m4.brief
title: Atelier M2-M4 Brief
status: active
summary: Implement Atelier M2 index compiler, M3 context preview, and M4 run init.
tags:
  - atelier
  - run
  - implementation
---

# Brief: Atelier M2-M4

## Request

Implement `harness/knowledge/product-specs/atelier/ROADMAP.md` milestones M2 through M4.

## Scope

- Add `atelier index` and `atelier index --check`.
- Add `atelier context preview`.
- Add `atelier run init`.
- Keep Atelier under `product/apps/atelier`.
- Do not create a separate worktree.

## Non-Goals

- Do not implement M5+.
- Do not add GUI, MCP, vector search, or automatic knowledge promotion.
- Do not rewrite completed run history.
