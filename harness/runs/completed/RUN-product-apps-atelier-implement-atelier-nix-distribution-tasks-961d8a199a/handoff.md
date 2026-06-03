---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-implement-atelier-nix-distribution-tasks-961d8a199a.handoff
title: "RUN-product-apps-atelier-implement-atelier-nix-distribution-tasks-961d8a199a Handoff"
status: active
summary: "Handoff for Atelier Nix distribution wiring."
tags:
  - harness
  - run
---

# Handoff

## Run Summary

Separated Atelier's external release package from monorepo dogfooding so `nix develop` no longer depends on unpublished GitHub release assets.

## Assigned Roles

- Primary: `role.domain.harness-engineer`

## Required Knowledge Loaded

- Generated run context for `RUN-product-apps-atelier-implement-atelier-nix-distribution-tasks-961d8a199a`
- `product/apps/atelier/README.md`
- `product/apps/atelier/flake.nix`
- `product/apps/atelier/nix/package.nix`
- Root `flake.nix`
- `nix/packages.nix`

## What Changed

- Added a root flake `atelierLocal` runner that executes the current checkout's `product/apps/atelier/src/cli.ts`.
- Root dev shell package sets now receive the local runner instead of the fixed-output release package.
- Root `apps.atelier` now uses the local runner; `apps.atelier-release` remains available for explicit release-binary execution.
- Root `packages.atelier` and `packages.atelier-release` continue to expose the external fixed-output release package; `packages.atelier-dev` exposes the local runner.
- `product/apps/atelier/README.md` now documents the three Nix distribution modes: external release, local dogfood, and future explicit source-build/bun2nix path.

## Why It Changed

The root dev shell previously included the release package, so `nix develop` tried to fetch `atelier-v0.1.0` from GitHub Releases and failed while the release assets were unpublished. Development needs the latest source before release, while external consumers need the fixed-output binary package.

## Affected Files

- `flake.nix`
- `nix/packages.nix`
- `product/apps/atelier/README.md`
- `harness/runs/active/RUN-product-apps-atelier-implement-atelier-nix-distribution-tasks-961d8a199a/*`

## Validation Result

Passed:

- `nix build .#atelier-dev`
- `nix run .#atelier -- doctor --json`
- `nix develop -c bun nx run atelier:typecheck`
- `nix develop -c bun nx run atelier:test`
- `nix flake check --no-build`
- `nix develop -c atelier --help`
- `nix eval --raw .#packages.x86_64-linux.atelier-release.pname`
- `nix develop -c bun nx run atelier:doctor -- --json`

## Remaining Risks

- `packages.atelier` / `packages.atelier-release` still cannot build until the `atelier-v0.1.0` release artifacts are published and hashes are updated.
- `atelier doctor` still reports pre-existing broken links in `harness/knowledge/rules/compiled/AGENTS.md` and historical-run warnings unrelated to this change.
- The bun2nix/source-build path is documented but not implemented as a package; it should stay explicit until `bun build --compile` output reproducibility is proven.

## Follow-up Tasks

- Publish the four platform release artifacts and update `product/apps/atelier/nix/package.nix` hashes.
- If source-build packaging is needed, generate and commit bun2nix's `bun.nix` and add a separate non-default source-build package.

## Knowledge Updates

- No stable knowledge promoted. Distribution-mode guidance was added directly to `product/apps/atelier/README.md`.
