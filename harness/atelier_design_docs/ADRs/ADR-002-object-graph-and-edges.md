# ADR-002: Atelier Object Graph and Edges

## Status

Accepted for v0 design.

## Decision

Atelier v0 uses an object graph.

Objects are stored as NDJSON under:

```txt
.atelier/v0/objects/**
```

Edges are stored separately as NDJSON under:

```txt
.atelier/v0/edges/edges.ndjson
```

## Rationale

Separate edges allow GUI graph rendering, affected propagation, stale tracking, and transform recommendation without loading full object bodies.

## Key distinction

`SourceUnit` is the mechanical chunk. `KnowledgeObject` is the semantic chunk. Both are Atelier Objects.
