# CONTRACT: atelier-transformer

## ImplementationTask schema

```ts
type ImplementationTask = AtelierObjectBase & {
  kind: "implementation_task";
  task_id: string;
  title: string;
  source_anchor_ids: string[];
  source_relation_ids: string[];
  required_object_ids: string[];
  status: "candidate" | "ready" | "blocked" | "stale";
  blocker_ids: string[];
};
```

## TestContract schema

```ts
type TestContract = AtelierObjectBase & {
  kind: "test_contract";
  contract_id: string;
  task_id: string;
  target_files: string[];
  test_files: string[];
  command: string;
  source_relation_ids: string[];
  status: "candidate" | "ready" | "blocked" | "stale";
  evidence_requirements: Array<"command_output" | "raw_output_ref" | "diff_ref" | "file_hashes" | "validated_handoff">;
};
```

## EditBoundary schema

```ts
type EditBoundary = AtelierObjectBase & {
  kind: "edit_boundary";
  task_id: string;
  allowed_files: string[];
  forbidden_files: string[];
  rationale_relation_ids: string[];
};
```

## PacketTemplate schema

```ts
type PacketTemplate = AtelierObjectBase & {
  kind: "packet_template";
  task_id: string;
  required_anchor_ids: string[];
  required_object_ids: string[];
  required_relation_ids: string[];
  allowed_files: string[];
  forbidden_files: string[];
  test_contract_ids: string[];
  evidence_expectations: string[];
  search_policy: "none" | "bounded" | "explicit_approval";
  unresolved_reference_policy: "block" | "ask" | "ignore";
};
```

## Validation must fail if

- a ready task has no source anchor trace;
- a ready task has no accepted relation trace;
- a ready TestContract has empty `target_files`, empty `test_files`, or missing `command`;
- a ready TestContract references nonexistent test files;
- `allowed_files` and `forbidden_files` overlap;
- broad `product/**` is allowed without a narrowed accepted packet rationale;
- design docs or product specs are implementation edit targets;
- packet template requires broad repository search;
- transformer output is based only on sample fixtures.
