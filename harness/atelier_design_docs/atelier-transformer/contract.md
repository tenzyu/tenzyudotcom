# CONTRACT: atelier-transformer

## ImplementationTask schema

```ts
type ImplementationTask = AtelierObjectBase & {
  kind: "implementation_task";
  task_id: string;
  title: string;
  goal: string;
  source_object_ids: string[];
  source_refs: SourceRef[];
  required_knowledge_object_ids: string[];
  allowed_files: string[];
  forbidden_files: string[];
  acceptance_criteria: string[];
  risk_notes: string[];
  status: "draft" | "ready" | "blocked" | "stale";
};
```

## TestContract schema

```ts
type TestContract = AtelierObjectBase & {
  kind: "test_contract";
  test_contract_id: string;
  task_id: string;
  test_framework: "vitest" | "bun-test" | "jest" | "unknown";
  target_files: string[];
  test_files: string[];
  expected_behavior: string[];
  negative_cases: string[];
  command: string;
  status: "draft" | "ready" | "blocked" | "stale";
};
```

## EditBoundary schema

```ts
type EditBoundary = AtelierObjectBase & {
  kind: "edit_boundary";
  task_id: string;
  allowed_files: string[];
  forbidden_files: string[];
  allowed_operations: Array<"create" | "modify" | "delete">;
  requires_user_approval: boolean;
};
```

## PacketTemplate schema

```ts
type PacketTemplate = AtelierObjectBase & {
  kind: "packet_template";
  task_id: string;
  required_source_refs: SourceRef[];
  required_object_ids: string[];
  allowed_files: string[];
  forbidden_files: string[];
  test_contract_ids: string[];
  evidence_expectations: string[];
  subagent_contract: string;
};
```

## TransformRecommendation schema

```ts
type TransformRecommendation = AtelierObjectBase & {
  kind: "transform_recommendation";
  source_object_id: string;
  recommendation_type:
    | "lint-candidate"
    | "test-candidate"
    | "skill-candidate"
    | "docs-candidate"
    | "packet-constraint"
    | "review-candidate";
  reason: string;
  proposed_output_kind: string;
  confidence: "hypothesis" | "inferred" | "validated";
  status: "proposed" | "accepted" | "rejected" | "stale";
};
```

## Packet generation rules

Packet structure is deterministic primary.

Deterministic fields:

```txt
packet_id
required_source_refs
required_object_ids
allowed_files
forbidden_files
test_contract_ids
evidence_expectations
```

LLM-assisted fields:

```txt
task summary
implementation hints
risk notes
ambiguity explanation
```

## Validation

`bun run validate` must fail if:

- a task references missing source objects;
- a task has empty allowed_files;
- a task has no acceptance criteria;
- a test contract has no executable command;
- a packet template has no test contract unless explicitly marked no-test-required;
- allowed_files include product specs;
- forbidden_files are missing;
- a recommendation references a missing source object;
- transform views are stale.

## Invariants

- Transformer does not write product code.
- Transformer does not create runtime evidence.
- Transformer output is consumed by executor.
- Transform views are generated.
