---
schema: harness/v1
kind: knowledge
knowledge_type: repo-map
id: knowledge.architecture
title: Architecture
status: active
summary: Stable repository architecture, product boundaries, and AI organization architecture.
tags:
  - architecture
  - repository
  - boundaries
---

# Architecture

This repository is organized around product applications, reusable packages,
repository operations, and a Markdown-based AI organization layer.

## Primary Boundaries

Applications are product surfaces. Packages are reusable implementation units.
Repository operations are automation and policy. `harness` is the
operating layer for AI agents.

```txt
product/apps/*          -> product applications
product/packages/*      -> reusable libraries and tooling
repo-ops/*              -> repository operations and harness engineering
docs/*                  -> repository and product contracts
harness/*        -> AI organization workflow, roles, memory, templates
```

## Dependency Rules

- Apps may depend on packages.
- Packages must not depend on application code.
- `@tenzyu/osu-skin-core` must stay runtime-pure.
- `@tenzyu/ui` must not depend on app routing, app i18n, product domain logic, Tauri APIs, or app-local CSS patches for base correctness.
- Tauri/native capabilities must be isolated behind explicit interfaces.
- Public component API changes require migration notes.
- Large rewrites require an ExecPlan before implementation.

## Product Areas

### `web`

`product/apps/web` owns the tenzyu.com web product. It may compose shared
packages, site components, assets, routing, SEO, and app-local feature code.

### `skin-workbench`

`product/apps/osu-skin-workbench` owns the desktop workbench UI and native Tauri
shell. Rust code under `src-tauri` owns native filesystem and shell behavior.

### `@tenzyu/ui`

`product/packages/ui` owns shared UI primitives, tokens, stories, and package
boundary checks. It is the first AI organization pilot area because Storybook and
component contracts make review and validation visible.

### `@tenzyu/osu-skin-core`

`product/packages/osu-skin-core` owns runtime-pure osu! skin domain logic and
contracts. It must remain usable without app, DOM, React, Tauri, or Node runtime
dependencies.

### `@tenzyu/linter`

`product/packages/linter` owns repository policy checks. It is part of the
quality gate surface for boundary enforcement.

## AI Organization Architecture

`harness` is the canonical source for how AI agents work in this repo.
Root files such as `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` are adapters that
route tools to the canonical files. They must not become separate memory stores.

The standard task flow is:

```txt
Intake -> Investigation -> ExecPlan -> Implementation -> Verification -> Review -> Handoff -> Memory Update
```

The human owner owns problem framing, priorities, constraints, approval, and
final product judgment. Agents own decomposition, investigation, implementation,
verification, review, documentation, and durable memory maintenance inside their
assigned scope.

## Known Unknowns

- `product/packages/ui-react` exists in the current tree with no declared Nx targets. Confirm its intended ownership before using it as a stable dependency.
- Nx project queries currently need verification in the local environment before docs rely on inferred target data.
