---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-clean-up-atelier-nix-distribution-change-abd3e5087f.handoff
title: "RUN-product-apps-atelier-clean-up-atelier-nix-distribution-change-abd3e5087f Handoff"
status: active
summary: "Handoff for Atelier Nix distribution cleanup."
tags:
  - harness
  - run
---

# Handoff

## Run Summary

Cleaned up the Atelier Nix distribution path so root development uses local source, external distribution remains fixed-output release binary, and the GitHub workflow can build/hash/update/tag/release from one artifact set.

## Assigned Roles

- Primary: `role.domain.harness-engineer`

## Required Knowledge Loaded

- Generated context for this run
- `product/apps/atelier/README.md`
- `product/apps/atelier/nix/package.nix`
- `product/apps/atelier/flake.nix`
- root `flake.nix`
- `nix/packages.nix`
- `.github/workflows/release-atelier.yml`

## What Changed

- Root `packages.atelier`, `apps.atelier`, dev shells, and checks now use the local source runner.
- Release binary consumption is explicit as `packages.atelier-release` / `apps.atelier-release`, and the app subflake remains the external consumer surface.
- `product/apps/atelier/nix/package.nix` now reads version from `package.json`, avoids the deprecated `system` arg, uses archive labels, and holds CI-replaced fake hashes.
- `.github/workflows/release-atelier.yml` is dispatch-only and can publish without a second rebuild:
  - build/hash all four platform archives,
  - update `package.nix`,
  - commit the hash update only when publishing,
  - tag that exact commit,
  - upload the exact archives used for the hashes.
- CI build output goes to `product/apps/atelier/release/atelier`, and `product/apps/atelier/release/` is ignored.
- Removed the stray app-root binary and the obsolete local hash helper script.
- README documents the three distribution modes and the release workflow.

## Why It Changed

The previous shape mixed local dogfooding with release consumption and left manual steps where non-reproducible Bun compile output could drift from pinned Nix hashes. The new shape makes the common local path work without release assets and makes official publishing a single workflow_dispatch operation.

## Affected Files

- `.github/workflows/release-atelier.yml`
- `.gitignore`
- `flake.nix`
- `nix/packages.nix`
- `product/apps/atelier/README.md`
- `product/apps/atelier/nix/package.nix`
- `harness/runs/active/RUN-product-apps-atelier-clean-up-atelier-nix-distribution-change-abd3e5087f/*`

## Validation Result

Passed:

- `nix build .#atelier`
- `nix eval --raw .#packages.x86_64-linux.atelier-release.passthru.releaseTag`
- `nix eval --raw .#packages.x86_64-linux.atelier-release.passthru.archiveLabel`
- `nix flake check --no-build`
- `nix shell nixpkgs#actionlint -c actionlint .github/workflows/release-atelier.yml`
- hash replacement temp-file check
- `nix develop -c bun nx run atelier:typecheck`
- `nix develop -c bun nx run atelier:test`
- `nix develop -c bun nx run atelier:doctor -- --json`

## Remaining Risks

- `atelier-release` still cannot build until real GitHub Release archives exist and CI replaces `lib.fakeHash`.
- The release workflow itself has only been statically checked locally; it still needs a real GitHub Actions dispatch.
- Existing harness doctor diagnostics remain outside this task.

## Follow-up Tasks

To publish `atelier-v0.1.0`, run `.github/workflows/release-atelier.yml` with:

- `tag`: `atelier-v0.1.0`
- `update_package_nix`: `true`
- `publish_release`: `true`

The workflow should commit the generated hashes, create the tag on that commit, and publish the archives. No manual artifact download or hash paste should be required.

For a dry run, use:

- `tag`: empty
- `update_package_nix`: `true`
- `publish_release`: `false`

That uploads the archives, hash files, and updated `package.nix` as workflow artifacts without pushing a commit or tag.

## Knowledge Updates

- Durable project-facing release guidance was added to `product/apps/atelier/README.md`.
