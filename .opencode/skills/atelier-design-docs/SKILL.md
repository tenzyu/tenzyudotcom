---
name: atelier-design-docs
description: Use the Atelier design docs and latest review to build Operational Atelier v0.
---

# atelier-design-docs

Use this skill when the user mentions `atelier-design-docs` or asks to build `atelier-*`.

## Required docs

```txt
harness/atelier-design-docs/GOAL-OPERATIONAL-ATELIER.md
harness/atelier-design-docs/REVIEW-LATEST.md
harness/atelier-design-docs/README.md
harness/atelier-design-docs/atelier-indexer/goal.md
harness/atelier-design-docs/atelier-indexer/contract.md
harness/atelier-design-docs/atelier-reader/goal.md
harness/atelier-design-docs/atelier-reader/contract.md
harness/atelier-design-docs/atelier-transformer/goal.md
harness/atelier-design-docs/atelier-transformer/contract.md
harness/atelier-design-docs/atelier-executor/goal.md
harness/atelier-design-docs/atelier-executor/contract.md
harness/atelier-design-docs/atelier-operation/goal.md
harness/atelier-design-docs/atelier-operation/contract.md
harness/atelier-design-docs/ADRs/*.md
```

## Latest review is authoritative

`harness/atelier-design-docs/REVIEW-LATEST.md` overrides older optimistic readiness claims.

The current artifact should be treated as:

```txt
Atelier v0 Bootstrap Skeleton
```

until the reviewer verifies true operational behavior.

## Core architecture

```txt
.atelier-bootstrap/
  indexer/
  reader/
  transformer/
  executor/
  operation/

.atelier/v0/
  facts/
  objects/
  edges/
  indexes/
  briefs/
  transforms/
  runs/
  views/
  operation/
```

## Non-negotiable concepts

- `.atelier-bootstrap/**` is tooling.
- `.atelier/v0/**` is output/state.
- Use NDJSON first.
- `canonical/**` is not the root architecture.
- `implementation-control` is not the root concept; it is at most a transform output.
- `SourceUnit` is the mechanical chunk.
- `KnowledgeObject` is the semantic chunk.
- `EvidenceRecord` is runtime fact, not prose.
- Views are generated, not truth.

## Required operational proof

Operational pass requires proof of:

1. strict index validation;
2. non-empty task-scoped attention;
3. md-to-code task derived from `harness/atelier-design-docs`, not toy sample only;
4. packet creation/context from that task;
5. runtime-backed evidence;
6. no duplicate/conflicting packet lifecycle state;
7. strict `atelier:ready` and `atelier:verify` checks;
8. reviewer pass.
