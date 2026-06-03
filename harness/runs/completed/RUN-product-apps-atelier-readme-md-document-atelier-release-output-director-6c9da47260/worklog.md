---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-readme-md-document-atelier-release-output-director-6c9da47260.worklog
title: "RUN-product-apps-atelier-readme-md-document-atelier-release-output-director-6c9da47260 Worklog"
status: active
summary: "Worklog for Atelier README command usage updates."
tags:
  - harness
  - run
---

# Worklog

- Replaced README command examples that routed through Nx with direct `atelier ...` usage.
- Added `nix run .#atelier -- ...` examples for usage outside the dev shell.
- Kept development checks as package-local `bun run typecheck` and `bun run test`.
- Documented `product/apps/atelier/release/` as the ignored binary staging directory.
- Added GUI and MCP to current scope and removed them from Non-Goals.
