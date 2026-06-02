# Plan: Atelier M2-M4

## Role Assignment

- Primary role: `role.domain.harness-engineer`
- Supporting roles: `role.domain.repo-ops-engineer`
- Reviewer role: `role.core.reviewer`

## Knowledge Loaded

- Required: `harness/canon/model.md`, `harness/README.md`, `harness/adapters/root/AGENTS.md`, `harness/knowledge/product-specs/atelier/ROADMAP.md`, `harness/knowledge/product-specs/atelier/README.md`
- Role examples: workflow and role frontmatter in `harness/actions/**`
- Skipped: completed run history, unrelated product specs

## Strategy

Implement shared core operations first, then thin CLI routing:

- M2: compile stable JSON files from loaded Markdown documents plus doctor diagnostics.
- M3: select workflow, roles, phase docs, pinned docs, policy docs, and selector-matched knowledge with explicit reasons.
- M4: materialize the context preview into `brief.md`, `context.md`, and `context.manifest.json`.

## Validation

- `bun nx run atelier:check`
- `bun nx run atelier:build`
- `bun nx run atelier:doctor -- --json`
- `bun run policy:deps`
- `git diff --check`
