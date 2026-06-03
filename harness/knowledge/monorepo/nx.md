---
schema: harness/v1
kind: knowledge
knowledge_type: reference
pattern: simple
id: knowledge.monorepo.nx
title: Nx Monorepo Operations
status: active
summary: Nx project names, task conventions, cache boundaries, and dependency policy.
tags:
  - nx
  - bun
  - monorepo
  - repo-ops
  - domain:nix
  - framework:bun
  - subject:repo-ops
  - kind:reference
  - status:active
affordances:
  declared: [context]
---

# Nx monorepo operations

## Purpose

This workspace uses Nx as the task graph and cache layer. Package managers still own installation, and each project still owns its local script implementation. Nx owns orchestration: dependency order, affected project selection, and cache boundaries.

## Project names

| Nx project | Path | Role |
| --- | --- | --- |
| `web` | `product/apps/web` | Next.js application |
| `skin-workbench` | `product/apps/osu-skin-workbench` | Tauri + Vite desktop application |
| `ui` | `product/packages/ui` | Shared UI package and CSS runtime layers |
| `linter` | `product/packages/linter` | Architecture and repository policy CLI |
| `osu-skin-core` | `product/packages/osu-skin-core` | Pure TypeScript skin-domain library |
| `osu-skin-node` | `product/packages/osu-skin-node` | Node/server-side skin filesystem library |

## Daily commands

```bash
bun install
bun run build
bun run check
bun run test
bun run lint
bun run graph
```

App-specific commands remain as compatibility aliases, but new automation should prefer Nx project names:

```bash
bun nx run web:dev
bun nx run skin-workbench:dev
bun nx run ui:build
bun nx run-many -t check
bun nx affected -t build
```

## Dependency order

`web` and `skin-workbench` depend on `ui`. `skin-workbench` also depends on the skin-domain packages. Build targets use `dependsOn: ["^build"]`, so Nx builds dependency libraries before applications.

This is important because app CSS imports `@tenzyu/ui/styles.css` and `@tenzyu/ui/workbench.css`, which are emitted into `product/packages/ui/dist` by `ui:build`.

## Cache boundaries

Targets that produce deterministic artifacts are cacheable:

- `build`
- `build-vite`
- `typecheck`
- `lint`
- `test`
- `check`
- `verify`

Long-running or local-only targets are not cacheable:

- `dev`
- `dev-overlay`
- `start`
- `start-intlayer`
- `clean`
- `format`

## Adding a new package

1. Add a local `project.json` beside the package.
2. Set `name`, `root`, `sourceRoot`, `projectType`, and `tags`.
3. Use `nx:run-commands` unless the package has a strong reason to adopt a framework-specific executor.
4. Add `implicitDependencies` when a project imports workspace packages through runtime-only paths that Nx cannot infer reliably.
5. Keep root `package.json` scripts generic. Do not add one root script per package unless it is a human-facing compatibility alias.

## Dependency policy

Literal `latest` dependency ranges are forbidden. Use a concrete semver range or an exact version.

```bash
bun run policy:deps
```
