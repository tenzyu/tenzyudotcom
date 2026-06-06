# Atelier Bootstrap Design Pack

This pack defines the current LLM context for implementing Atelier's Relation Kernel.

## Current goal

```txt
Upgrade atelier-bootstrap from repository census + demo transform pipeline into a Relation Kernel.
```

The relation kernel is the shared substrate for:

```txt
indexer      -> deterministic source anchors and deterministic relations
reader       -> schema-bound semantic relation proposals
transformer  -> md-to-code tasks/contracts/packets derived from accepted relations
executor     -> packet/evidence lifecycle bound to relations
operation    -> strict review of relation, transform, packet, and evidence invariants
Explore      -> future UI/API projection over the same relation graph
```

Repo tree is not the core. Repo tree is only one projection. The core is an inspectable relation graph connecting source ranges, semantic objects, transform outputs, packets, test contracts, evidence, blockers, and generated views.

## Required component docs

Each boundary has three documents:

```txt
harness/atelier-design-docs/atelier-<component>/goal.md
harness/atelier-design-docs/atelier-<component>/contract.md
harness/atelier-design-docs/atelier-<component>/review.md
```

Use them as follows:

```txt
goal.md     -> implementation direction
contract.md -> strict machine/behavior contract
review.md   -> reviewer checklist and fail conditions
```

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
  anchors/
  edges/
  indexes/
  briefs/
  transforms/
  runs/
  views/
  operation/
```

`anchors/` may be implemented as its own directory or as an object family inside `objects/`, but the model must distinguish source anchors from semantic objects.

## Non-negotiable concepts

- `.atelier-bootstrap/**` is tooling.
- `.atelier/v0/**` is generated output/state.
- SourceAnchor is first-class.
- Relation is first-class.
- `contains` alone is not a sufficient graph.
- Reader proposals are not execution truth until accepted.
- Transformer consumes accepted relations, not path heuristics alone.
- Explore must be a projection over relations, not a separate graph.
- Generated views are not truth.
- Evidence is runtime fact, not prose.

## Goal-plugin invocation

Use a short `/goal` invocation and rely on file mentions:

```txt
/goal @atelier-coordinator Follow @harness/atelier-design-docs/GOAL-OPERATIONAL-ATELIER.md. Use component goal.md, contract.md, and review.md. Dispatch subagents aggressively when boundaries do not overlap.
```

Do not define a custom `command.goal` that shadows the goal plugin.
