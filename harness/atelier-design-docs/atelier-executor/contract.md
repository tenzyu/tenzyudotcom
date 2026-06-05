# CONTRACT: atelier-executor

## ExecutionPacket schema

```ts
type ExecutionPacket = AtelierObjectBase & {
  kind: "execution_packet";
  packet_id: string;
  task_id: string;
  status: "draft" | "active" | "completed" | "rejected" | "blocked" | "stale";
  required_source_refs: SourceRef[];
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
  gate_id?: string;
  command?: string;
  status: "passed" | "failed" | "skipped" | "blocked" | "unknown";
  raw_output_ref?: string;
  diff_ref?: string;
  file_hashes?: Record<string, string>;
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

`summary` is optional and must be ≤ 80 characters.

## Blocker schema

```ts
type Blocker = AtelierObjectBase & {
  kind: "blocker";
  blocker_id: string;
  packet_id: string;
  task_id: string;
  severity: "P0" | "P1" | "P2";
  reason: string;
  source_refs?: SourceRef[];
  recommended_next_action: string;
  status: "open" | "resolved" | "wontfix";
};
```

## Ledger event schema

```ts
type RunLedgerEvent = {
  schema: "atelier.run-ledger-event/v1";
  event_id: string;
  created_at: string;
  event_type:
    | "packet_created"
    | "packet_started"
    | "test_run"
    | "evidence_recorded"
    | "handoff_received"
    | "packet_completed"
    | "packet_rejected"
    | "packet_blocked";
  subject_id: string;
  refs: string[];
  status?: string;
};
```

## Validation

`bun run validate` must fail if:

- packet allowed_files are empty;
- handoff files_changed includes files outside allowed_files;
- tests_written includes files outside allowed_files;
- gate result references unknown gate/test contract;
- evidence claims passed without raw output or command reference;
- packet is completed without required evidence;
- product specs were modified;
- executor writes outside allowed files;
- run views are stale.

## Invariants

- Evidence is not prose.
- Evidence is runtime fact.
- Completion is impossible without evidence.
- Executor does not mutate source/knowledge/transform records except run state and evidence.
