---
schema: harness/v1
kind: run
id: run.task-0018-atelier-m0-m1-app.plan
title: "Plan: Atelier M0/M1 App"
status: active
summary: Implementation plan for the initial Atelier app and doctor.
tags:
  - run
  - plan
  - atelier
---

# Plan: Atelier M0/M1 App

## Run

TASK-0018-atelier-m0-m1-app

## Role Assignment

- Primary role: Repo Ops Engineer
- Supporting roles: Implementer
- Reviewer role: self-review

## Knowledge Loaded

- Required: repository policy, Nx policy, git policy, repo map, Nx monorepo notes, Atelier spec and roadmap.
- Optional: existing linter CLI and Castalia app patterns.
- Skipped with reason: completed run history beyond task numbering; not needed for implementation.

## Investigation

- Affected files: new `product/apps/atelier/**` and run artifacts.
- Existing conventions: CLI projects use app-local `project.json` with `nx:run-commands`; TypeScript tooling under Bun uses package-local scripts and `tsconfig.bun.json`.
- Current behavior: no `atelier` Nx project exists.
- Uncertain areas: app vs tooling placement was clarified by owner; product app location is now required.

## Strategy

Create a CLI-first app under `product/apps/atelier` with a small core:

- `schema.ts` for document and diagnostic types.
- `frontmatter.ts` for permissive frontmatter parsing.
- `docs.ts` for harness Markdown discovery, hashing, and link extraction.
- `doctor.ts` for M1 diagnostics.
- `cli.ts` for `doctor`, `doctor --json`, and help output.

Add focused Bun tests for parser and doctor behavior. Register Nx targets manually because installed generators do not include a suitable JS application generator.

## File-Level Impact

| File | Planned change |
| --- | --- |
| `product/apps/atelier/project.json` | Register Nx app targets. |
| `product/apps/atelier/package.json` | Define CLI scripts and build/typecheck/test. |
| `product/apps/atelier/tsconfig*.json` | Configure Bun TypeScript app. |
| `product/apps/atelier/src/**` | Implement M0/M1 CLI core and tests. |
| `harness/runs/active/TASK-0018-atelier-m0-m1-app/**` | Record run evidence. |

## Public API Impact

New app-local CLI only. No existing API is changed.

## Boundary Impact

The app lives under `product/apps/atelier`. It reads repository files but does not become a source of truth. No product package depends on it.

## Validation

- `bun nx show project atelier --json`
- `bun nx run atelier:typecheck`
- `bun nx run atelier:test`
- `bun nx run atelier:doctor -- --json`

## Rollback

Remove `product/apps/atelier` and this active run directory.

## Non-Goals

- GUI
- MCP
- context preview
- run init
- generated indexes
