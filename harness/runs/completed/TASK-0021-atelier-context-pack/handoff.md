# Handoff: TASK-0021 Atelier Context Pack

## Changed

- Added `compact`, `full`, and `linked` context modes, with `compact` as default.
- Changed `run init` so `context.md` becomes an agent-readable compiled context pack.
- Added `atelier context expand RUN-ID DOC-ID-OR-PATH` with manifest, context, and worklog recording.
- Updated product spec, roadmap, README, CLI, exports, Nx target, and tests.

## Validation

- `bun nx run atelier:check`
- `bun nx run atelier:build`
- `bun nx run atelier:context-expand -- TASK-0021-atelier-context-pack knowledge.product-spec.castalia`
- `bun nx run atelier:index`
- `bun nx run atelier:index-check`
- `bun nx run atelier:doctor -- --json`
- `bun run policy:deps`
- `git diff --check`

## Risk

- Compact mode uses deterministic section extraction and truncation. It reduces manual context scanning but is not a semantic compressor.
- This task does not migrate older `context.md` files already created before the spec change.

## Knowledge proposals

- None.
