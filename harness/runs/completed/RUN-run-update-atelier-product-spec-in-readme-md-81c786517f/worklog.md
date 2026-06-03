# Worklog: RUN-run-update-atelier-product-spec-in-readme-md-81c786517f

## Findings

- Target files are the Atelier product spec files under `harness/knowledge/product-specs/atelier/README.md` and `harness/knowledge/product-specs/atelier/ROADMAP.md`; root `ROADMAP.md` does not exist.
- Existing Atelier implementation already shipped the v1 Markdown-backed harness compiler surface through doctor, index, context plan/render, run lifecycle, proposal/promotion, MCP, GUI, repo map, and semantic expansion.
- `.harness/generated` is ignored and used as rebuildable cache. Durable v2 Artifact Graph/Event Log state should therefore live under tracked `harness/atelier/`.

## Changes

- Repositioned Atelier as an Agentic Software Development Control Plane.
- Made `Git working tree + Atelier Artifact Graph + Event Log` the canonical system-state model.
- Added the v2 kernel: Artifact Graph, Event Log, Reconciler, Selector, Policy Engine, Materializer, and Trace.
- Added plane model: Knowledge, Governance, Verification, Task/Product, Swarm, Runtime, and Human Product Owner UI.
- Reframed Knowledge Cards and Markdown frontmatter as the v1 Knowledge Plane implementation, not the final center of the product.
- Added Artifact, Edge, ownership modes, Reconciler risk actions, deletion semantics, deterministic-to-human decision hierarchy, Control Mechanism registry, Governance, Agent Loop, Swarm, and Artifact Graph UI requirements.
- Reworked ROADMAP so M0-M12 remain the shipped v1 baseline and M13-M20 define the next implementable control-plane roadmap.

## Verification Notes

- `bun nx run atelier:check` passed.
- `bun nx run atelier:doctor` passed with 0 errors; existing warnings/info remain.
- `bun nx run atelier:index-check` initially failed because generated indexes were stale after spec edits.
- `bun nx run atelier:index` refreshed ignored generated indexes.
- `bun nx run atelier:index-check` then passed.
- `bun run policy:deps` passed.
- `bun nx affected -t check` initially failed with sandbox `EPERM`; rerun with escalation.
- Escalated `bun nx affected -t check` failed only at `web:check` due existing TypeScript config issue: `product/apps/web/tsconfig.json` uses deprecated `baseUrl` without `ignoreDeprecations: "6.0"`. This is outside the documentation change.
