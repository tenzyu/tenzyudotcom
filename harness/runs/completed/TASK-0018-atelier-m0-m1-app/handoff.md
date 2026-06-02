---
schema: harness/v1
kind: run
id: run.task-0018-atelier-m0-m1-app.handoff
title: Handoff
status: active
summary: Handoff for the initial Atelier app and doctor slice.
tags:
  - run
  - handoff
  - atelier
---

# Handoff

## Run Summary

Created the first `product/apps/atelier` implementation as a Bun/TypeScript CLI app. The initial product slice covers permissive harness Markdown parsing and `atelier doctor`.

## Assigned Roles

- Repo Ops Engineer
- Implementer

## Required Knowledge Loaded

- Harness model and root adapter instructions.
- Repository, Git, and Nx policies.
- Repo map and Nx monorepo notes.
- Atelier product spec and roadmap.

## What Changed

- Added `product/apps/atelier` with package metadata, Nx project targets, README, TypeScript configs, CLI entrypoint, core parser/doctor modules, and tests.
- Added run records for this implementation.
- Added harness frontmatter to current authored harness documents where the ID, kind, title, and status were clear from context.
- Updated product and repo maps to include Atelier at `product/apps/atelier`.

## Why It Changed

The Atelier spec calls for a CLI-first, file-backed control plane for harness integrity. The owner clarified that this new product should live under `product/apps`, so the implementation was placed at `product/apps/atelier`.

## Affected Files

- `product/apps/atelier/README.md`
- `product/apps/atelier/package.json`
- `product/apps/atelier/project.json`
- `product/apps/atelier/tsconfig.json`
- `product/apps/atelier/tsconfig.build.json`
- `product/apps/atelier/src/**`
- `harness/runs/active/TASK-0018-atelier-m0-m1-app/**`

## Validation Result

Passed:

- `bun nx show project atelier --json`
- `bun nx run atelier:typecheck`
- `bun nx run atelier:test`
- `bun nx run atelier:doctor -- --json`
- `bun nx run atelier:build`
- `bun nx run atelier:check`
- `bun run policy:deps`
- `git diff --check`

Latest `atelier doctor --json` result:

- 233 documents
- 0 errors
- 144 warnings

## Remaining Risks

- `atelier doctor` still reports warnings for old `harness/ai-org` references, broken links in generated/template docs, and loose completed run history without IDs.
- `--fix` is accepted but dry behavior only; no automatic fixes are implemented yet.
- M2 index generation, M3 context preview, and M4 run init are not implemented in this slice.

## Follow-Up Tasks

- Decide policy for completed run history IDs.
- Repair remaining old `harness/ai-org` references and generated/template broken links.
- Implement `atelier index` and generated `.harness/generated/*.json` files.
- Implement role-routed context preview.
- Implement run init and context manifests.

## Knowledge Updates Made Or Proposed

No durable knowledge update proposed. The app placement preference came directly from the owner during the run and is reflected in the run artifacts.
