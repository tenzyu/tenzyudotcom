---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952.handoff
title: "RUN-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952 Handoff"
status: active
summary: "Atelier packaged as nix derivation; exposed via root flake and per-app subflake"
tags:
  - harness
  - run
  - handoff
---

# Handoff

## Summary

Atelier is now distributable as a Nix derivation. Built with
`bun build --compile`, it produces a single self-contained binary at
`$out/bin/atelier` (no runtime bun required). Exposed via the root
`flake.nix` (`packages/apps/checks.atelier`) and a dedicated subflake at
`product/apps/atelier/flake.nix`, mirroring castalia's pattern.

## Role Assignment

- Primary role: `role.domain.repo-ops-engineer`
- Supporting roles: none
- Reviewer role: none (mechanical, evidence-backed packaging change)

## Knowledge Loaded

- Required: nx monorepo, repo-map, repository policy, git/nx/tenzyu-linter
  guardrails, docs-linter spec.
- Optional: none expanded.
- Skipped with reason: completed-run history skipped per default context;
  context-budget policy did not match.

## What Changed

- New `product/apps/atelier/nix/package.nix` — `stdenvNoCC.mkDerivation`
  using `bun build --compile --minify ./src/cli.ts --outfile atelier`,
  installing to `$out/bin/atelier`.
- New `product/apps/atelier/flake.nix` — subflake pinned to
  `nixpkgs/release-26.05`, exposes `packages/apps/checks` for
  `x86_64-linux`, `aarch64-linux`, `x86_64-darwin`, `aarch64-darwin`.
- Updated root `flake.nix` — added `atelier = pkgs.callPackage ...` and
  surfaced it in `packages`, `apps`, and `checks` alongside `castalia`.
  Updated the inline comment to read `product/apps/<name>` to cover both
  apps.

## Why It Changed

The README and harness ownership map identify atelier as the local control
plane that other automation (and external consumers, via the subflake)
should be able to run reproducibly without a bootstrapped TS toolchain.
Packaging it the same way castalia is packaged gives one consistent
"binary in `$out/bin`" surface for every CLI we ship.

## Affected Files

- `flake.nix`
- `product/apps/atelier/flake.nix` (new)
- `product/apps/atelier/nix/package.nix` (new)

## Validation

- `nix build .#atelier` — pass
- `nix build ./product/apps/atelier#atelier` — pass
- `nix run .#atelier -- doctor --json --project-root .` — pass (binary runs;
  doctor surfaces pre-existing harness diagnostics)
- `nix flake check --no-build` — `all checks passed`
- `bun nx run atelier:check` — pass (typecheck + 24 tests)

Full evidence in `verification.md`.

## Remaining Risks

- `bun build --compile` embeds the bun runtime, so the resulting binary is
  large (~100 MB) and tied to the host platform's bun build. Cross-system
  builds will require system-specific bun packages from nixpkgs.
- The root flake's `apps.*` entries (both castalia and atelier) lack
  `meta`. `nix flake check` warns but does not fail.
- `bun nx run atelier:run-close` for this run reports `blocked` due to a
  pre-existing global doctor diagnostic:
  `harness/knowledge/specs/docs/docs-rename.md:32 BROKEN_MARKDOWN_LINK`.
  That file is outside this run's scope (atelier nix packaging) and was
  not modified here. The close gate cannot pass any run until this
  upstream doctor finding is resolved.

## Follow-Up Tasks

- Optional: add `meta` to `apps.castalia` and `apps.atelier` in the root
  flake to silence the `nix flake check` warning.
- Optional: extend the subflake to support `darwin` builds in CI once a
  darwin runner is available.
- Optional: consider pinning a non-minified compile or stripping additional
  bun runtime assets if binary size becomes a concern for distribution.
- Required (separate run, outside packaging scope): resolve the
  pre-existing `BROKEN_MARKDOWN_LINK` in
  `harness/knowledge/specs/docs/docs-rename.md:32` (or fix the doctor so
  it ignores inline-code link examples) so that future runs can pass the
  close gate.

## Knowledge Updates

- Made: none.
- Proposed: none.
- Not needed because: the packaging shape simply mirrors the existing
  castalia precedent. No durable cross-run knowledge was discovered that
  is not already captured by the castalia files acting as the canonical
  example.
