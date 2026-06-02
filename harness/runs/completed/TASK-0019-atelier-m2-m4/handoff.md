# Handoff: Atelier M2-M4

## Changed

- Implemented M2 index compiler with generated files under `.harness/generated`.
- Implemented M3 context preview with required, optional, skipped, diagnostics, budget estimate, and next command output.
- Implemented M4 run init with deterministic default run IDs, `brief.md`, `context.md`, and `context.manifest.json`.
- Added Nx targets for the new commands.
- Added focused tests and updated Atelier README.

## Risks

- Context selection is intentionally heuristic for M3. It uses current frontmatter plus body sections named `Required knowledge` and `Optional knowledge`; richer selector semantics can wait for later milestones.
- `run init` does not implement M5 close/status gates.

## Follow-Up

- M5 should add manifest hash checking and completion gates.
