# Repository Structure

This document describes the visible repository layout for agents and humans.
Do not treat it as a substitute for inspecting the current tree before making a
change.

## Workspace

tenzyudotcom is a Bun + Nx monorepo.

- Package manager: `bun@1.3.10`, declared in `package.json`.
- Nx workspace apps directory: `product/apps`.
- Nx workspace libraries directory: `product/packages`.
- Repository engineering and harness files live under `repo-ops/`.
- The AI organization operating layer lives under `harness/ai-org/`.
- Human-and-AI-readable repository contracts live under `docs/`.

## Applications

| Nx project | Path | Responsibility |
| --- | --- | --- |
| `web` | `product/apps/web` | Next.js web product, site routes, public assets, app-local UI composition |
| `skin-workbench` | `product/apps/osu-skin-workbench` | osu! skin workbench frontend and Tauri desktop shell |

## Packages

| Nx project | Package | Path | Responsibility |
| --- | --- | --- | --- |
| `ui` | `@tenzyu/ui` | `product/packages/ui` | Shared React UI primitives, styling contract, stories, package boundary checks |
| `osu-skin-core` | `@tenzyu/osu-skin-core` | `product/packages/osu-skin-core` | Runtime-pure osu! skin domain, classification, project contracts |
| `linter` | `@tenzyu/linter` | `product/packages/linter` | Repository policy and workspace boundary lint rules |
| `ui-react` | `@tenzyu/ui-react` | `product/packages/ui-react` | TODO: confirm ownership before treating as stable; current project has no targets |

## Supporting Areas

| Path | Responsibility |
| --- | --- |
| `docs/` | Human-facing repository structure, architecture, quality gates, and durable product contracts |
| `harness/ai-org/` | AI role, workflow, task, memory, ADR, tool guardrail, and handoff standards |
| `harness/ai-org/knowledge/design-docs/` | LLM-facing architecture rule index, granular rules, and repair references |
| `harness/ai-org/exec-plans/` | Active and completed execution plans |
| `harness/knowledge/product-specs/` | Product and route-specific requirements |
| `harness/legacy/ai-org/workflows/` | Legacy workflow references that are not AI-org canonical workflows |
| `harness/knowledge/references/` | External tool and verification references |
| `harness/observations/audits/` | Opt-in AI reports and audits |
| `repo-ops/scripts/` | Repository automation such as docs compilation and dependency policy checks |
| `product/apps/osu-skin-workbench/src-tauri/` | Rust/Tauri native shell for the workbench app |

## Dependency Direction

- Apps may depend on packages.
- Packages must not depend on apps.
- Runtime-pure packages must not import DOM, React, Tauri, Node runtime APIs, or app packages.
- Shared UI must expose public components through package exports, not app source paths.
- Web route-local `_features` code must not become a shared dependency unless promoted into an approved shared location.

## Maintenance Notes

- Update this file when project roots, ownership, or package responsibilities change.
- Mark uncertain areas as `TODO` or `Assumption` rather than inventing facts.
- Prefer Nx project queries for project data. If Nx cannot load, record the failure in task verification and fall back to visible config files.
