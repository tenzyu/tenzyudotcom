---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-readme-md-document-atelier-release-output-director-6c9da47260.handoff
title: "RUN-product-apps-atelier-readme-md-document-atelier-release-output-director-6c9da47260 Handoff"
status: active
summary: "Handoff for Atelier README command usage updates."
tags:
  - harness
  - run
---

# Handoff

## Summary

Updated `product/apps/atelier/README.md` so usage reflects the new direct Atelier runner instead of Nx target invocations.

## Changed

- Commands now use `atelier ...` inside the root dev shell.
- Commands outside the dev shell use `nix run .#atelier -- ...`.
- Development checks use package-local Bun scripts.
- Release staging directory is documented as `product/apps/atelier/release/`.
- GUI and MCP are listed in current scope, not Non-Goals.

## Validation

Passed:

- README search confirmed no `bun nx run atelier` / `nx run atelier` usage examples remain.
- `nix develop -c atelier --help`
- `nix run .#atelier -- help`
- `nix develop -c bun nx run atelier:doctor -- --json`

## Remaining Risk

- Existing unrelated doctor diagnostics remain in harness historical/compiled docs.
