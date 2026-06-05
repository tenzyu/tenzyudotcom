# .atelier-bootstrap

This directory contains the four Atelier v0 bootstrap tools plus a shared
library and tests. It is the **tooling** root; the **generated output**
root is `.atelier/v0/**`.

```txt
.atelier-bootstrap/
  lib/            # shared library (paths, NDJSON, types, results)
  indexer/        # deterministic zero-token repo indexer
  reader/         # LLM-bounded reader (cheap sample, attention, deep-read)
  transformer/    # md-to-code transform layer
  executor/       # packet execution, evidence, handoffs, blockers
  operation/      # end-to-end operational verification
  tests/          # shared test fixtures
```

## Command surface

Each component has its own `cli.ts`. Root-level adapter commands
(`bun ./atelier.ts <command>`, `bun run atelier:<command>`) dispatch to
them. The dispatch table is documented in `atelier.ts` at the repo root.

| Component | Commands |
| --- | --- |
| indexer | `scan`, `index`, `affected`, `update`, `render`, `validate` |
| reader | `sample`, `brief`, `attention`, `deep-read`, `llm:jobs`, `llm:accept`, `render`, `validate` |
| transformer | `transform`, `task:derive`, `test-contract:derive`, `packet:template`, `recommend`, `render`, `validate` |
| executor | `packet:create`, `packet:context`, `packet:run`, `test:run`, `evidence:add`, `handoff:validate`, `packet:complete`, `packet:reject`, `packet:block`, `execution:ready`, `render`, `validate` |
| operation | `ready`, `verify`, `render` |

## Tests

```bash
bun test ./.atelier-bootstrap/<component>/src/tests/<component>.test.ts
```

Tests use subprocess execution so the lib's `ATELIER_V0` constants do not
leak between the host cwd and the fixture cwd.

## Output model

All generated output goes to `.atelier/v0/`:

```txt
.atelier/v0/facts/         # deterministic facts (no LLM)
.atelier/v0/objects/       # NDJSON AtelierObject records
.atelier/v0/edges/         # NDJSON edges.ndjson
.atelier/v0/indexes/       # by-path, by-kind, by-hash, by-object, stale
.atelier/v0/briefs/        # project brief, hypotheses, llm jobs, proposals
.atelier/v0/transforms/    # md-to-code model, packets, views
.atelier/v0/runs/          # ledger, evidence, handoffs, blockers
.atelier/v0/operation/     # atelier.operational-review/v1
.atelier/v0/views/         # generated Markdown views
```

## Hard rules enforced by validators

- `bun run validate` for every component must fail on:
  - duplicate object ids
  - edges referencing missing objects
  - source units pointing to missing files
  - source ref hash mismatches
  - LLM-derived records without source refs or provenance
  - deep-read touching all source units
  - views missing the generated marker
- `bun run validate` for the executor must fail on:
  - handoff files_changed outside allowed_files
  - evidence without command or raw output
  - packet completion without evidence
- The operation `ready` command aggregates every component's validate
  output into a single `atelier.operational-review/v1` report.

## Legacy

The legacy `harness/knowledge/implementation-control/atelier/**` is not
touched. It is not active truth. Future migration work should be tracked
in `harness/bootstrap/atelier-build/REVIEW_LEDGER.md` when needed.
