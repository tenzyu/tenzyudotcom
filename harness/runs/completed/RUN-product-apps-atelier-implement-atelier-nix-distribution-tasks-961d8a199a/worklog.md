---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-implement-atelier-nix-distribution-tasks-961d8a199a.worklog
title: "RUN-product-apps-atelier-implement-atelier-nix-distribution-tasks-961d8a199a Worklog"
status: active
summary: "Worklog for Atelier Nix distribution wiring."
tags:
  - harness
  - run
---

# Worklog

## Scope Adjustment

- Initial run scope targeted `product/apps/atelier`.
- Investigation showed `nix develop` fails before Atelier can run because the root dev shell pulls `product/apps/atelier/nix/package.nix`, whose release URL is not published yet.
- Expanded the touched file set to root `flake.nix` and `nix/packages.nix` to keep the external release package separate from monorepo dogfooding.

## Findings

- `product/apps/atelier/nix/package.nix` remains the external fixed-output release package for sandboxed consumers.
- Root dev shells used `packageSets.all` / `repoOpsShell`, which included the release package and therefore failed on the unpublished `atelier-v0.1.0` artifact.
- A root-local runner can execute the current checkout through Bun without changing the external subflake default package.

## Changes

- Added a root flake `atelierLocal` runner that finds the repository root and executes `product/apps/atelier/src/cli.ts` from the current checkout.
- Wired root dev shell package sets to use `atelierLocal` instead of the fixed-output release package.
- Kept the release binary package available as `packages.atelier` and `packages.atelier-release`; added `packages.atelier-dev` for the local runner.
- Pointed root `apps.atelier` at the local runner and added `apps.atelier-release` for explicit release-binary execution.
- Documented the three Nix distribution modes in `product/apps/atelier/README.md`.
