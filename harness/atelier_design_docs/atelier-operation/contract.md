# PARENT CONTRACT: Operational Atelier v0 Verification

This file is for the reviewer model. It checks whether all `atelier-*` components together behave as an operational artifact graph / transformation control plane.

## Required command groups

The following commands or equivalent capabilities must exist:

```bash
# indexer
atelier-indexer scan
atelier-indexer index
atelier-indexer affected
atelier-indexer update
atelier-indexer validate

# reader
atelier-reader sample
atelier-reader brief
atelier-reader attention --task "<task>"
atelier-reader deep-read --attention <attention_id>
atelier-reader validate

# transformer
atelier-transformer transform --target md-to-code
atelier-transformer task:derive --attention <attention_id>
atelier-transformer test-contract:derive --task <task_id>
atelier-transformer packet:template --task <task_id>
atelier-transformer validate

# executor
atelier-executor packet:create --task <task_id>
atelier-executor packet:context --packet <packet_id>
atelier-executor test:run --packet <packet_id>
atelier-executor handoff:validate --file <handoff_json>
atelier-executor evidence:add
atelier-executor validate
```

Names may differ, but capabilities must be present and documented.

## Verification checklist

### A. Directory layout

Must exist:

```txt
.atelier-bootstrap/indexer
.atelier-bootstrap/reader
.atelier-bootstrap/transformer
.atelier-bootstrap/executor
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
- indexes by path/kind/hash/object exist.

### C. Reader behavior

Must verify:

- project brief is hypothesis-only;
- LLM jobs use JSONL contracts;
- attention sets are task-scoped;
- deep read does not read all source units by default;
- LLM-derived objects carry provenance.

### D. Transformer behavior

Must verify:

- md-to-code transform exists;
- implementation tasks have allowed_files and forbidden_files;
- test contracts have executable commands;
- packet templates include evidence expectations;
- transform recommendations are represented as objects.

### E. Executor behavior

Must verify:

- product files are changed only through packets;
- product specs are never changed;
- evidence is command output, test output, diff reference, file hash, or validated handoff;
- packet completion requires evidence;
- handoff schema rejects prose-only reports.

### F. Views

Must verify generated views exist:

```txt
.atelier/v0/views/index/**
.atelier/v0/views/objects/**
.atelier/v0/transforms/md-to-code/views/**
.atelier/v0/views/runs/**
```

Each generated view must include:

```md
<!-- GENERATED FILE. DO NOT EDIT DIRECTLY. -->
```

### G. Legacy

Must verify:

- legacy implementation-control root docs are not active truth;
- migrated legacy records have provenance;
- hard deletion or quarantine has been audited;
- no active transform depends on deleted legacy prose.

## Reviewer output schema

The reviewer must output JSON:

```ts
type AtelierOperationalReview = {
  schema: "atelier.operational-review/v1";
  status: "pass" | "fail" | "blocked";
  commands_run: string[];
  commands_not_run: string[];
  blocking_defects: Array<{
    defect_id: string;
    severity: "P0" | "P1" | "P2";
    blocking: boolean;
    affected_component: "indexer" | "reader" | "transformer" | "executor" | "operation";
    affected_record: string;
    reason: string;
    recommended_next_action: string;
  }>;
  warnings: string[];
  verified_invariants: string[];
};
```

## Pass condition

Pass only if:

- all four bootstrap tools exist;
- `.atelier/v0` is populated;
- object graph validates;
- task-scoped attention works;
- md-to-code transform works;
- executor can run a packet or report exact blockers;
- evidence cannot be faked through prose;
- views are generated;
- legacy is not active truth.
