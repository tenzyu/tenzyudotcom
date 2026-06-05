# Atelier Bootstrap Design Pack

This pack defines the first implementation shape for `atelier-*` bootstrap tooling.

Atelier is an artifact graph / transformation control plane for coding agents. Its purpose is not to let agents freely explore a repository. Its purpose is to convert human-written Markdown, specs, governance, reviews, skills, checks, and source files into computable artifacts, then assemble task-scoped attention and transformation packets for agents.

## Components

```txt
.atelier-bootstrap/
  indexer/      # deterministic repo/source indexing and affected detection
  reader/       # cheap semantic sampling, task-scoped attention, deep read jobs
  transformer/  # md-to-code transform models, tasks, test contracts, packet templates
  executor/     # packet execution, test/evidence/handoff/blocker loop

.atelier/v0/
  facts/        # zero-token facts
  objects/      # NDJSON AtelierObject records
  edges/        # NDJSON relations between objects
  indexes/      # lookup indexes and stale maps
  briefs/       # project brief and hypotheses
  transforms/   # md-to-code model, packets, views
  runs/         # evidence, handoffs, blockers, ledgers
  views/        # generated human-readable views
```

## Core principle

```txt
Do not make the agent explore.
Make Atelier assemble what the agent must consume, transform, and verify.
```

## Storage decision

Use NDJSON for v0. SQLite may be introduced later after object and edge schemas stabilize.

## Naming decision

Do not use `canonical` as the broad storage concept. Use `objects`, `edges`, `indexes`, `state/runs`, and generated `views`.

## Legacy decision

Legacy implementation-control root documents are not active truth. They should be quarantined, migrated into objects/transform records when needed, audited, and hard-deleted after migration proof.
