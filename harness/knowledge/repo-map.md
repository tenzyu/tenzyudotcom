---
schema: harness/v1
kind: knowledge
knowledge_type: repo-map
pattern: simple
id: knowledge.repo-map
title: Repository Map
status: active
summary: Stable repository ownership, boundaries, and validation memory.
tags:
  - repository
  - repo-map
  - ownership
  - domain:harness
  - kind:repo-map
  - subject:ownership
  - status:active
affordances:
  declared: [context]
---

# Repository Map

This memory summarizes stable repository ownership. Inspect the current tree
before editing because this file may lag behind active work.

## Workspace

- Root package manager: Bun.
- Task runner: Nx, invoked through Bun.
- Apps root: `product/apps`.
- Packages root: `product/packages`.
- AI organization root: `harness`.
- Repository operations root: `repo-ops`.
- Legacy repo-ops harness content was moved into `harness/legacy/ai-org/docs`; `harness/legacy/ai-org/docs` is a redirect only.

## Projects

| Project | Path | Owner role |
| --- | --- | --- |
| `atelier` | `product/apps/atelier` | Repo Ops Engineer / Harness Engineer |
| `web` | `product/apps/web` | Web App Engineer |
| `skin-workbench` | `product/apps/osu-skin-workbench` | Workbench App Engineer and Rust/Tauri Engineer |
| `castalia` | `product/apps/castalia` | Repo Ops Engineer / local AI workflow owner |
| `ui` | `product/packages/ui` | Design System Engineer |
| `osu-skin-core` | `product/packages/osu-skin-core` | Architect / domain package owner |
| `linter` | `product/packages/linter` | Repo Ops Engineer |

## Boundary Memory

- Apps may depend on packages.
- Packages must not depend on apps.
- `@tenzyu/osu-skin-core` is runtime-pure.
- `@tenzyu/ui` owns shared UI primitives and must not absorb app-specific logic.
- Tauri/native behavior belongs under the workbench native boundary.
- Repository validation and policy automation belongs under `repo-ops` or `@tenzyu/linter`.

## Validation Memory

- Use `bun nx run <project>:<target>` for project checks.
- Use `bun nx run-many -t check` for broad checks when scope warrants it.
- Use `bun run policy:deps` for dependency policy validation.
- Record Nx loading failures in task verification instead of silently switching tools.
