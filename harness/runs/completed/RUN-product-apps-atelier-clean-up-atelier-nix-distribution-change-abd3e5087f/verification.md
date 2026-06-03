---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-clean-up-atelier-nix-distribution-change-abd3e5087f.verification
title: "RUN-product-apps-atelier-clean-up-atelier-nix-distribution-change-abd3e5087f Verification"
status: active
summary: "Verification for Atelier Nix distribution cleanup."
tags:
  - harness
  - run
---

# Verification

## Commands

- `nix build .#atelier`: passed. Root package now builds the local dogfood runner, not the release binary.
- `nix eval --raw .#packages.x86_64-linux.atelier-release.passthru.releaseTag`: passed, returned `atelier-v0.1.0`.
- `nix eval --raw .#packages.x86_64-linux.atelier-release.passthru.archiveLabel`: passed, returned `linux-x64`.
- `nix flake check --no-build`: passed.
- `nix shell nixpkgs#actionlint -c actionlint .github/workflows/release-atelier.yml`: passed.
- Local temp-file check for the workflow hash replacement perl expression: passed; it replaced `lib.fakeHash` with a quoted SRI-style hash.
- `nix develop -c bun nx run atelier:typecheck`: passed.
- `nix develop -c bun nx run atelier:test`: passed, 64 tests.
- `nix develop -c bun nx run atelier:doctor -- --json`: command passed.

## Known Existing Diagnostics

- `atelier:doctor` still reports five pre-existing broken links in `harness/knowledge/rules/compiled/AGENTS.md`.
- `atelier:doctor` still reports historical completed-run warnings unrelated to this release packaging cleanup.

## Not Run

- `nix build .#atelier-release` was intentionally not run. Release hashes are still `lib.fakeHash` until the dispatch workflow builds real release archives and updates `product/apps/atelier/nix/package.nix`.
