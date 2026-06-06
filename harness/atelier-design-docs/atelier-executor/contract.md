# CONTRACT: atelier-executor

## ExecutionPacket schema

```ts
type ExecutionPacket = AtelierObjectBase & {
  kind: "execution_packet";
  packet_id: string;
  task_id: string;
  status: "draft" | "active" | "completed" | "rejected" | "blocked" | "stale";
  required_anchor_ids: string[];
  required_relation_ids: string[];
  required_object_ids: string[];
  allowed_files: string[];
  forbidden_files: string[];
  test_contract_ids: string[];
  evidence_expectations: string[];
  handoff_schema: "atelier.subagent-handoff/v1";
};
```

## EvidenceRecord schema

```ts
type EvidenceRecord = AtelierObjectBase & {
  kind: "evidence_record";
  evidence_id: string;
  packet_id: string;
  task_id: string;
  test_contract_id?: string;
  command?: string;
  status: "passed" | "failed" | "skipped" | "blocked" | "unknown";
  raw_output_ref?: string;
  diff_ref?: string;
  file_hashes?: Record<string, string>;
  handoff_ref?: string;
  created_at: string;
};
```

## Handoff schema

```ts
type SubagentHandoff = {
  schema: "atelier.subagent-handoff/v1";
  run_id: string;
  packet_id: string;
  task_id: string;
  files_changed: string[];
  tests_written: string[];
  gate_results: Record<string, "passed" | "failed" | "skipped" | "blocked">;
  evidence_paths: string[];
  blockers: Array<{
    blocker_id: string;
    severity: "P0" | "P1" | "P2";
    reason: string;
  }>;
  summary?: string;
};
```

## Validation must fail if

- packet allowed_files are empty;
- allowed_files and forbidden_files overlap;
- handoff files_changed includes files outside allowed_files;
- tests_written includes files outside allowed_files;
- evidence claims `passed` without runtime proof;
- evidence lacks `test_contract_id` when satisfying a TestContract;
- evidence command/output does not correspond to the referenced contract;
- packet is completed while any required TestContract is blocked/empty/nonexistent;
- duplicate packet ids have conflicting current state;
- generated views are used as readiness proof.

## Passed evidence proof

`status: "passed"` requires at least one of:

```txt
command + raw_output_ref
command + captured stdout/stderr artifact
diff_ref + file_hashes
validated handoff_ref
```

Prose summary alone is invalid.
