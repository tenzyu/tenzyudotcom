# Latest Review: Atelier Relation Kernel Readiness

## Status

The current target is not merely Operational Atelier v0. The immediate target is Relation Kernel v0.

Treat the current artifact as:

```txt
repository census + object storage + demo transform pipeline
```

until relation generation and relation consumption are proven.

## Positive findings

Directionally correct structure:

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
```

Good decisions already accepted:

- tooling/output split exists;
- NDJSON-first direction exists;
- objects/edges/indexes exist;
- indexer/reader/transformer/executor/operation are separated;
- canonical is not the root storage concept;
- implementation-control is not the root concept;
- repo tree is only an entry projection, not the core.

## P0 blockers

### P0-001: Edges are not meaningful enough

A graph made only or mostly of `contains` edges is not a relation kernel.

Required repair:

- add deterministic relation generation where safe;
- add reader relation proposals where semantic inference is needed;
- validate relation endpoints and provenance;
- fail relation readiness if no accepted non-`contains` relations exist.

### P0-002: Source ranges / anchors are not first-class enough

Path-only source refs are insufficient for transformer and Explore projection.

Required repair:

- introduce SourceAnchor or equivalent;
- include `path`, optional `start_line` / `end_line`, `content_hash`, `selector_strategy`, `provenance_kind`, `confidence`, and `status`;
- generate anchors for files and at least one narrower deterministic kind such as markdown sections or code symbols.

### P0-003: Reader must emit relation proposals, not prose-only understanding

The reader must not stop at project briefs or knowledge summaries.

Required repair:

- emit schema-bound `RelationProposal` records;
- each proposal must cite source anchors or source refs;
- proposal confidence must be `hypothesis` or `inferred` until accepted;
- proposals must never become execution truth without acceptance.

### P0-004: Transformer must consume accepted relations

The transformer must not rely only on path heuristics or toy samples.

Required repair:

- derive ImplementationTask / TestContract / EditBoundary from accepted relation graph;
- preserve source anchor trace;
- fail readiness for blocked/empty test contracts;
- fail readiness when task/test/evidence relation mapping is absent.

### P0-005: Packet/evidence correspondence must be strict

Runtime evidence must correspond to the contract it satisfies.

Required repair:

- `passed` evidence requires command/raw output/diff/file hashes/validated handoff;
- evidence must point to the relevant packet and test contract;
- unrelated test output must not satisfy a contract.

## P1 blockers

### P1-001: Build artifacts must be excluded by default

Build outputs and metadata must not become attention or relation candidates unless explicitly requested.

Default exclusions:

```txt
.git/**
node_modules/**
dist/**
build/**
coverage/**
target/**
.rmeta
*.rmeta
```

### P1-002: Explore must be projection-only

Do not build Explore as a separate graph. If inspect/related/impact commands are implemented, they must read the shared relation graph.

### P1-003: Operation must distinguish scaffold pass from relation-kernel pass

Directory existence, object count, and view generation are insufficient.

Readiness must prove anchors, non-contains relations, accepted relation consumption, packet/test/evidence correspondence, and stale/affected behavior.

## Required reviewer stance

Reviewer must fail if:

- graph has only `contains` relations;
- path-only refs are treated as enough for relation-kernel pass;
- reader emits prose but no schema-bound relation proposals;
- transformer creates tasks without accepted relation trace;
- evidence is accepted without runtime proof and contract correspondence;
- generated views are treated as truth;
- Explore duplicates the graph instead of projecting from it.

## Target status

Relation Kernel pass requires:

```txt
indexer anchors: pass
indexer deterministic relations: pass
reader relation proposals: pass
relation acceptance/validation: pass
transformer consumes accepted relations: pass
executor evidence correspondence: pass
operation ready/verify: pass
reviewer: pass
```
