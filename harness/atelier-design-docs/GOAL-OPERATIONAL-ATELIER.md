Use this file as the objective for the OpenCode goal plugin.

# GOAL: Atelier Relation Kernel v0

Upgrade `atelier-bootstrap` from repository census + demo transform pipeline into a Relation Kernel.

Do not implement GUI first. Do not make Explore a separate system. Build the shared relation substrate from which transformer, packets, impact analysis, and future Explore can all be projected.

## Core thesis

```txt
Repository artifacts
  -> deterministic SourceAnchors
  -> deterministic and proposed Relations
  -> accepted relation graph
  -> transformer projection
  -> execution packets
  -> runtime evidence
  -> operation/reviewer validation
  -> generated views / future Explore projection
```

Repo tree is an entry view, not the product core. The product core is relation generation, acceptance, traversal, stale detection, and projection.

## Required behavior

1. `indexer` emits SourceAnchors for files and, where cheap/deterministic, markdown sections, code symbols, test files, package scripts, and explicit references.
2. `indexer` emits deterministic Relations beyond `contains` when safely derivable.
3. `reader` emits schema-bound KnowledgeObject, SemanticClaim, AttentionSet, and RelationProposal records.
4. `reader` output remains hypothesis/inferred until accepted by deterministic validation or explicit accept command.
5. `transformer` consumes accepted relations to derive ImplementationTask, TestContract, EditBoundary, PacketTemplate, and ExecutionPacket candidates.
6. `executor` records packet lifecycle and runtime-backed evidence mapped to the relevant task/test/evidence relations.
7. `operation` fails readiness when relation, anchor, packet, contract, or evidence invariants are missing.
8. `explore` command/API may be added only as a projection over the same relation graph.

## Current P0 repair target

The previous graph shape was mostly object storage plus `contains` edges. That is not enough.

Operational progress requires proving:

```txt
selected path or range
  -> related anchors / objects
  -> accepted relation types
  -> transform outputs
  -> packet / test contract / evidence or blocker
```

## Required command surface

Equivalent names are allowed only if documented and reviewer-approved.

```bash
bun run atelier:index
bun run atelier:relations:index
bun run atelier:relations:validate
bun run atelier:affected
bun run atelier:index:render
bun run atelier:index:validate

bun run atelier:sample
bun run atelier:attention -- --task "<task>"
bun run atelier:relations:propose -- --attention <id>
bun run atelier:deep-read -- --attention <id>
bun run atelier:reader:validate

bun run atelier:transform:md-to-code
bun run atelier:transform:validate
bun run atelier:transform:render

bun run atelier:packet:create
bun run atelier:packet:context
bun run atelier:packet:complete
bun run atelier:evidence:add
bun run atelier:executor:validate

bun run atelier:ready
bun run atelier:verify
bun run atelier:render
```

Optional projection commands:

```bash
bun run atelier:explore:inspect -- --ref "path[:Lx-Ly]"
bun run atelier:explore:related -- --ref "path[:Lx-Ly]"
bun run atelier:explore:impact -- --ref "path[:Lx-Ly]"
```

## Parallelism policy

The coordinator should dispatch implementer subagents aggressively when edit boundaries do not overlap.

Safe default workstreams:

```txt
indexer     SourceAnchor + deterministic relations + affected
reader      relation proposals + attention/deep-read contracts
transformer accepted relation -> task/contract/packet projection
executor    packet lifecycle + evidence correspondence
operation   strict readiness/review/verify
```

Serialize when files or dependencies overlap.

## Completion policy

The goal is complete only when `atelier-reviewer` returns `status: pass` and strict `atelier:ready` / `atelier:verify` or exact documented equivalents genuinely pass.

If work remains, the coordinator must not emit a goal marker. Let the plugin continue.

If a decision requires user/product-author input, the coordinator must ask a precise open question and end with `[goal:blocked]`.

## Goal-plugin constraint

Only `atelier-coordinator` may emit final-line markers:

```txt
[goal:complete]
[goal:blocked]
```

Implementer and reviewer subagents must never emit goal markers.
