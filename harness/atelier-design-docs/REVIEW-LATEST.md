# Latest Review: Operational Atelier v0 Readiness

## Status

The current artifact is not yet Operational Atelier v0.

Treat it as:

```txt
Atelier v0 Bootstrap Skeleton
```

It has a good directory skeleton and object graph direction, but operational behavior is not yet proven.

## Positive findings

The following structure is directionally correct:

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
  transforms/md-to-code/
  runs/
  views/
  operation/
```

Good decisions:

- tooling/output split exists;
- NDJSON-first direction exists;
- objects/edges/indexes exist;
- indexer/reader/transformer/executor/operation are separated;
- canonical is not the core storage concept;
- implementation-control is demoted from root concept.

## P0 blockers

### P0-001: `operation ready` is too shallow

`atelier:ready` must not pass by checking only directory existence, source unit counts, or project brief shape.

Required repair:

- `atelier:ready` must fail unless task-scoped attention, md-to-code transform, packet/evidence lifecycle, and reviewer contract all pass.

### P0-002: Empty attention sets must fail readiness

Atelier's core value is task-scoped attention assembly.

`attention sets = 0` cannot be operational pass.

Required repair:

- create at least one real task-scoped attention set from a task such as:

```txt
harden operation ready so scaffold pass cannot be reported as operational pass
```

- ready must fail if no non-empty attention set exists.

### P0-003: Evidence cannot pass without runtime proof

`EvidenceRecord.status = passed` must require runtime proof.

Accepted proof kinds:

```txt
command output
raw stdout/stderr reference
diff reference
file hash snapshot
validated handoff
```

`raw_output: none` with `status: passed` must fail.

### P0-004: Duplicate/conflicting packet lifecycle must fail

A packet id cannot be both `active` and `completed` in current state.

Required repair:

- implement a packet lifecycle reducer;
- make readiness fail on duplicate/conflicting current statuses.

### P0-005: Strict validation must be default

`validate` must be strict full validation.

If sample validation is needed, name it explicitly:

```txt
validate:quick
```

Required repair:

- full object/edge validation by default;
- sample/quick mode must never power operational pass.

## P1 blockers

### P1-001: md-to-code must use design docs, not toy sample only

The transformer must derive at least one implementation task from:

```txt
harness/atelier-design-docs/**
```

Toy examples such as `src/main.ts` are allowed as fixtures, but cannot be the only operational proof.

### P1-002: Transform recommendations need dedupe

Duplicate recommendations from the same `KnowledgeObject` and recommendation type should be merged or reported as duplicates.

### P1-003: Reviewer must be first-class

The reviewer must return `atelier.operational-review/v1` JSON and must be the only authority for operational pass.

### P1-004: Views are not proof

Generated views may explain machine state, but they cannot satisfy readiness by themselves.

### P1-005: Affected propagation must be real enough for v0

A changed `SourceUnit` should mark dependent objects/transforms/views stale through edges or indexes.

## Required reviewer stance

Reviewer must fail if:

- pass is based on scaffold existence;
- no attention set exists;
- evidence lacks runtime proof;
- packet lifecycle has conflicting statuses;
- strict full validation is absent;
- md-to-code uses only sample fixtures;
- generated views are treated as truth.

## Target status

Operational pass requires:

```txt
indexer strict validate: pass
reader attention/deep-read: pass
transformer md-to-code from design docs: pass
executor packet/evidence lifecycle: pass
operation ready/verify: pass
reviewer: pass
```
