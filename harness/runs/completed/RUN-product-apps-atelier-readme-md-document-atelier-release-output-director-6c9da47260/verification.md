---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-readme-md-document-atelier-release-output-director-6c9da47260.verification
title: "RUN-product-apps-atelier-readme-md-document-atelier-release-output-director-6c9da47260 Verification"
status: active
summary: "Verification for Atelier README command usage updates."
tags:
  - harness
  - run
---

# Verification

- `rg -n "bun nx run atelier|nx run atelier" product/apps/atelier/README.md`: no matches.
- `nix develop -c atelier --help`: passed.
- `nix run .#atelier -- help`: passed.
- `nix develop -c bun nx run atelier:doctor -- --json`: passed with existing repository diagnostics unrelated to this README update.
