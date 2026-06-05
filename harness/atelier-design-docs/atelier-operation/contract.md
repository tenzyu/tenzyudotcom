# PARENT CONTRACT: Operational Atelier v0 Verification

This file is for the reviewer model. It checks whether all `atelier-*` components together behave as an operational artifact graph / transformation control plane.

## Required command groups

The following commands or exact documented equivalents must exist:

```bash
# indexer
bun run atelier:index
bun run atelier:affected
bun run atelier:index:validate

# reader
bun run atelier:sample
bun run atelier:attention -- --task "<task>"
bun run atelier:deep-read -- --attention <attention_id>
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

## Verification checklist

### A. Directory layout

Must exist:

```txt
.atelier-bootstrap/indexer
.atelier-bootstrap/reader
.atelier-bootstrap/transformer
.atelier-bootstrap/executor
.atelier-bootstrap/operation
.atelier/v0/facts
.atelier/v0/objects
.atelier/v0/edges
.atelier/v0/indexes
.atelier/v0/briefs
.atelier/v0/transforms/md-to-code
.atelier/v0/runs
.atelier/v0/views
```

### B. Object graph

Must verify:

- objects are NDJSON;
- edges are NDJSON;
- object ids are unique;
- edges reference existing objects;
- source refs include path and hash;
- stale propagation exists;
- indexes by path/kind/hash/object exist;
- strict validation checks all relevant objects/edges by default.

### C. Reader behavior

Must verify:

- project brief is hypothesis-only;
- LLM jobs use schema-bound proposal contracts;
- at least one non-empty task-scoped attention set exists;
- deep read does not read all source units by default;
- LLM-derived objects carry provenance.

### D. Transformer behavior

Must verify:

- md-to-code transform exists;
- at least one implementation task is derived from `harness/atelier-design-docs/**`;
- implementation tasks have allowed_files and forbidden_files;
- test contracts have executable commands or explicit blocker records;
- packet templates include evidence expectations;
- transform recommendations are deduped or duplicate-detected.

### E. Executor behavior

Must verify:

- files are changed only through packets;
- product specs are never changed;
- evidence is command output, test output, diff reference, file hash, or validated handoff;
- `passed` evidence without runtime proof fails;
- packet completion requires evidence;
- duplicate/conflicting packet lifecycle current state fails;
- handoff schema rejects prose-only reports.

### F. Views

Must verify generated views exist:

```txt
.atelier/v0/views/index/**
.atelier/v0/views/objects/**
.atelier/v0/transforms/md-to-code/views/**
.atelier/v0/views/runs/**
.atelier/v0/views/operation/**
```

Each generated view must include:

```md
<!-- GENERATED FILE. DO NOT EDIT DIRECTLY. -->
```

Views are explanatory only. They cannot satisfy readiness by themselves.

## Reviewer output schema

The reviewer must output JSON:

```ts
type AtelierOperationalReview = {
  schema: 'atelier.operational-review/v1'
  status: 'pass' | 'fail' | 'blocked'
  commands_run: string[]
  commands_not_run: string[]
  blocking_defects: Array<{
    defect_id: string
    severity: 'P0' | 'P1' | 'P2'
    blocking: boolean
    affected_component:
      | 'indexer'
      | 'reader'
      | 'transformer'
      | 'executor'
      | 'operation'
    affected_record: string
    reason: string
    recommended_next_action: string
  }>
  warnings: string[]
  verified_invariants: string[]
}
```

## Pass condition

Pass only if:

- all four bootstrap tools and operation verifier exist;
- `.atelier/v0` is populated;
- object graph validates strictly;
- non-empty task-scoped attention works;
- md-to-code transform works from design docs;
- executor can run a packet or report exact blockers;
- evidence cannot be faked through prose;
- packet lifecycle current state is consistent;
- views are generated;
- legacy is not active truth.
