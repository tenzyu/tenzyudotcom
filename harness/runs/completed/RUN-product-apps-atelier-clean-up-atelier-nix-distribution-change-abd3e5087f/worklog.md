---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-clean-up-atelier-nix-distribution-change-abd3e5087f.worklog
title: "RUN-product-apps-atelier-clean-up-atelier-nix-distribution-change-abd3e5087f Worklog"
status: active
summary: "Worklog for Atelier Nix distribution cleanup."
tags:
  - harness
  - run
---

# Worklog

## Scope Adjustment

- Initial scope targeted `product/apps/atelier`.
- Expanded to root `flake.nix`, `nix/packages.nix`, `.gitignore`, and `.github/workflows/release-atelier.yml` because the requested cleanup covered dev-shell behavior, release publishing, and generated binary placement.

## Findings

- The previous local helper `repo-ops/scripts/build-atelier.sh` duplicated CI behavior and still required manual hash transfer.
- The generated `product/apps/atelier/atelier` binary was a 98 MB local build artifact and should not live directly under the app root.
- Tag-push release workflows can rebuild a different binary from the one used to compute `package.nix` hashes, which is a poor fit while `bun build --compile` is not proven byte-reproducible.
- Root `packages.atelier` should be dogfood-friendly like root `apps.atelier`; external consumers already have the app subflake as the stable release surface.

## Changes

- Removed the local generated binary and the one-off hash helper script.
- Ignored `product/apps/atelier/release/` for generated binaries.
- Moved CI build output to `product/apps/atelier/release/atelier` while keeping release tarballs shaped as a top-level `atelier` binary for Nix installation.
- Reworked `.github/workflows/release-atelier.yml` as a dispatch-only workflow:
  - validates Atelier,
  - builds four platform archives,
  - computes SRI hashes,
  - updates `product/apps/atelier/nix/package.nix`,
  - commits hash updates only when publishing,
  - tags that exact commit,
  - uploads the exact built archives to GitHub Releases.
- Updated root `packages.atelier` to use the local source runner; release binary is explicit as `packages.atelier-release`.
- Updated `product/apps/atelier/nix/package.nix` to derive version from `package.json`, use `stdenvNoCC.hostPlatform.system`, expose `passthru`, and keep fake hashes until CI replaces them.
- Updated `product/apps/atelier/README.md` with the current distribution and release workflow.
