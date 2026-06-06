---
name: atelier-design-docs
description: Use the Atelier design docs, component contracts, and reviewer files to implement the Relation Kernel.
---

# atelier-design-docs

Use this skill when working on Atelier bootstrap, relation kernel, context assembly, md-to-code transform, packet/evidence lifecycle, or operation verification.

## Required docs

```txt
harness/atelier-design-docs/GOAL-OPERATIONAL-ATELIER.md
harness/atelier-design-docs/REVIEW-LATEST.md
harness/atelier-design-docs/OPEN-QUESTIONS.md
harness/atelier-design-docs/README.md
harness/atelier-design-docs/atelier-indexer/goal.md
harness/atelier-design-docs/atelier-indexer/contract.md
harness/atelier-design-docs/atelier-indexer/review.md
harness/atelier-design-docs/atelier-reader/goal.md
harness/atelier-design-docs/atelier-reader/contract.md
harness/atelier-design-docs/atelier-reader/review.md
harness/atelier-design-docs/atelier-transformer/goal.md
harness/atelier-design-docs/atelier-transformer/contract.md
harness/atelier-design-docs/atelier-transformer/review.md
harness/atelier-design-docs/atelier-executor/goal.md
harness/atelier-design-docs/atelier-executor/contract.md
harness/atelier-design-docs/atelier-executor/review.md
harness/atelier-design-docs/atelier-operation/goal.md
harness/atelier-design-docs/atelier-operation/contract.md
harness/atelier-design-docs/atelier-operation/review.md
harness/atelier-design-docs/ADRs/*.md
```

## Current thesis

```txt
Repo tree is not the core.
Relation graph is the core.
Transformer and Explore are projections over the same relation substrate.
```

## Non-negotiable concepts

- `.atelier-bootstrap/**` is tooling.
- `.atelier/v0/**` is generated output/state.
- SourceAnchor is first-class.
- Relation is first-class.
- `contains` alone is not enough.
- Reader proposals require validation/acceptance.
- Transformer consumes accepted relations.
- Evidence is runtime fact, not prose.
- Views are generated, not truth.

## Required operational proof

Relation Kernel pass requires proof of:

1. anchors beyond path-only file refs;
2. accepted non-`contains` relations;
3. schema-bound reader relation proposals;
4. transformer output derived from accepted relation trace;
5. packet/test/evidence correspondence;
6. strict ready/verify checks;
7. reviewer pass.
