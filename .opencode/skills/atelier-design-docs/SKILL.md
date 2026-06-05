---
name: atelier-design-docs
description: Use the Atelier design documents to implement atelier-indexer, atelier-reader, atelier-transformer, atelier-executor, and atelier-operation.
---

# atelier-design-docs

Use this skill when the user mentions `atelier-design-docs` or asks to build `atelier-*`.

## Source documents

The design docs are expected to exist in one of these locations:

```txt
atelier-design-docs/
docs/atelier-design-docs/
harness/knowledge/atelier-design/
```

If multiple exist, prefer the most specific existing directory in this order:

1. `atelier-design-docs/`
2. `docs/atelier-design-docs/`
3. `harness/knowledge/atelier-design/`

Required files:

```txt
README.md

atelier-indexer/goal.md
atelier-indexer/contract.md

atelier-reader/goal.md
atelier-reader/contract.md

atelier-transformer/goal.md
atelier-transformer/contract.md

atelier-executor/goal.md
atelier-executor/contract.md

atelier-operation/goal.md
atelier-operation/contract.md

ADRs/*.md
```

## Target architecture

Implement the Atelier bootstrap tools and output structure described in the design docs.

Target tooling root:

```txt
.atelier-bootstrap/
  indexer/
  reader/
  transformer/
  executor/
```

Target output root:

```txt
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

Do not place generated runtime output under `.atelier-bootstrap/**`.

`.atelier-bootstrap/**` is tooling only.

## Conceptual model

Atelier is an Object Graph runtime for coding-agent attention and artifact transformation.

It indexes a repository without spending LLM tokens, builds lightweight project hypotheses, assembles task-scoped attention, deep-reads only what a task needs, transforms object graph records into implementation tasks, packets, checks, skills, linters, tests, and views, and records execution evidence back into the graph.

Core object families:

```txt
SourceFact
SourceUnit
SourceRef
KnowledgeObject
SemanticClaim
AttentionSet
TransformModel
ExecutionPacket
EvidenceRecord
```

Do not use `canonical/**` as a root concept. Use:

```txt
objects/
edges/
indexes/
state or runs/
views/
```

## Component responsibilities

### atelier-indexer

Must produce deterministic, zero-token / low-token repository observations.

It owns:

```txt
SourceFact
SourceUnit
SourceRef
SourceEdge
affected detection initially
```

It must not use LLMs for source facts, line refs, hashes, or file graph.

### atelier-reader

Must produce hypothesis and task-scoped reading outputs.

It owns:

```txt
ProjectBrief
ProjectHypothesis
AttentionSet
DeepReadFinding
KnowledgeObject
SemanticClaim
```

LLM use is allowed here, but output must be schema-bound and marked with confidence/provenance.

### atelier-transformer

Must transform Atelier objects into md-to-code artifacts.

It owns:

```txt
ImplementationTask
TestContract
EditBoundary
PacketTemplate
TransformRecommendation
```

LLM may produce proposals. CLI must validate and accept.

### atelier-executor

Must execute packets and record evidence.

It owns:

```txt
ExecutionPacket
Handoff
EvidenceRecord
Blocker
RunLedger
```

Evidence must be runtime fact, not prose.

### atelier-operation

Must verify that all components are operational together.

It owns:

```txt
end-to-end verification
reviewer contract
operational readiness
```

## Build order

Implement in this order:

1. `atelier-indexer`
2. `atelier-reader`
3. `atelier-transformer`
4. `atelier-executor`
5. `atelier-operation`

Do not jump to later components if an earlier component cannot produce or validate its contract outputs.

## Required behavior

The resulting system must support:

```bash
# indexer
bun run atelier:index
bun run atelier:affected
bun run atelier:index:render
bun run atelier:index:validate

# reader
bun run atelier:sample
bun run atelier:attention -- --task "<task>"
bun run atelier:deep-read -- --attention <id>
bun run atelier:reader:validate

# transformer
bun run atelier:transform:md-to-code
bun run atelier:transform:validate
bun run atelier:transform:render

# executor
bun run atelier:packet:create
bun run atelier:packet:context
bun run atelier:packet:complete
bun run atelier:evidence:add
bun run atelier:executor:validate

# operation
bun run atelier:ready
bun run atelier:verify
bun run atelier:render
```

Equivalent names are acceptable only if documented and covered by tests.

## Non-goals

Do not implement the final GUI.
Do not implement a database. Use NDJSON for now.
Do not use SQLite yet.
Do not place output under `.atelier-bootstrap/**`.
Do not resurrect `harness/knowledge/implementation-control` as the primary architecture.
Do not treat `implementation-control` as the core concept. It is a transform output, not the root abstraction.
Do not edit product specs unless the design docs explicitly require it.
