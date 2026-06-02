# Worklog: TASK-0021 Atelier Context Pack

## Notes

- Accepted the pasted ChatGPT response as the new correct specification.
- Added `ContextMode` with `compact`, `full`, and `linked`.
- Updated run init rendering so `context.md` contains an Agent Contract, scope, compiled required context, expansion policy, steps, verification, artifacts, diagnostics, and close command.
- Added `atelier context expand RUN-ID DOC-ID-OR-PATH`.
- Updated product spec, roadmap, README, CLI, exports, Nx target, and tests.

## Context Expansions

- Expanded context `harness/knowledge/product-specs/atelier/ROADMAP.md` via `atelier context expand TASK-0021-atelier-context-pack knowledge.product-spec.atelier-roadmap`.
- Expanded context `harness/knowledge/product-specs/castalia/README.md` via `atelier context expand TASK-0021-atelier-context-pack knowledge.product-spec.castalia`.
