# Plan: TASK-0022 frontmatter contract alignment

## Strategy

1. Normalize current harness frontmatter according to owner decisions.
2. Strip generated frontmatter from completed run Markdown so historical run history is not schema-migrated.
3. Update Atelier doctor diagnostics to enforce the source contract going forward.
4. Update root/tool adapters to make Atelier the primary entrypoint for non-trivial work.
5. Update the Atelier product spec and roadmap only where existing text conflicts with the new contract.
6. Preserve useful legacy metadata under `x.legacy`.

## Validation

- Static inspection of modified TypeScript.
- YAML/frontmatter inspection with Python.
- Grep checks for top-level legacy fields, scalar tags, and removed legacy paths outside completed run history.
- Bun/Nx validation could not be run in this environment because `bun` is not installed.
