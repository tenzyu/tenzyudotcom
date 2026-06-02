---
schema: harness/v1
kind: knowledge
knowledge_type: repo-map
id: knowledge.product-map
title: Product Map
status: active
summary: Visible products and shared product infrastructure in the repository.
tags:
  - product
  - repo-map
  - architecture
---

# Product Map

This map lists visible products in the current repository.

## Products

| Product | Path | Notes |
| --- | --- | --- |
| tenzyu.com web | `product/apps/web` | Next.js site and public web surface |
| osu! skin workbench | `product/apps/osu-skin-workbench` | Tauri desktop app for osu! skin workflows |
| Atelier | `product/apps/atelier` | CLI-first harness control plane and doctor |

## Shared Product Infrastructure

| Area | Path | Notes |
| --- | --- | --- |
| Shared UI | `product/packages/ui` | First AI organization pilot area |
| osu! skin domain | `product/packages/osu-skin-core` | Runtime-pure domain and project contracts |
| Repository policy tooling | `product/packages/linter` | Boundary and repository rule checks |

## TODO

- Confirm whether `product/packages/ui-react` is a stable product package or an in-progress experiment.
