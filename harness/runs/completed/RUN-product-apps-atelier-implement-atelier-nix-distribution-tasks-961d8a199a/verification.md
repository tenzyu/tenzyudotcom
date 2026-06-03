---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-implement-atelier-nix-distribution-tasks-961d8a199a.verification
title: "RUN-product-apps-atelier-implement-atelier-nix-distribution-tasks-961d8a199a Verification"
status: active
summary: "Verification for Atelier Nix distribution wiring."
tags:
  - harness
  - run
---

# Verification

## Commands

- `nix build .#atelier-dev`: passed.
- `nix run .#atelier -- doctor --json`: passed and executed the local source runner without requiring the unpublished release artifact. The doctor report still has pre-existing diagnostics: 5 broken-link errors in `harness/knowledge/rules/compiled/AGENTS.md` plus historical-run warnings.
- `nix develop -c bun nx run atelier:typecheck`: passed.
- `nix develop -c bun nx run atelier:test`: passed, 64 tests.
- `nix flake check --no-build`: passed. The release package still evaluates, while checks use the local runner.
- `nix develop -c atelier --help`: passed.
- `nix eval --raw .#packages.x86_64-linux.atelier-release.pname`: passed, returned `atelier`.
- `nix develop -c bun nx run atelier:doctor -- --json`: passed. The current report has the same pre-existing 5 broken-link errors and 52 warnings; no new warning from this run's `worklog.md`.

## Known Existing Diagnostics

- `harness/knowledge/rules/compiled/AGENTS.md` has five broken relative links under `./references/*`.
- Several completed historical run files still have frontmatter or old legacy-path references.

## Not Re-run

- `nix build .#atelier-release` was intentionally not run because `atelier-v0.1.0` release assets are still unpublished and expected to 404 until the release workflow publishes them.
