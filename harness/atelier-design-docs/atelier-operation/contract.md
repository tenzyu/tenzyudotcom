# CONTRACT: atelier-operation

## Required command groups

Equivalent names are allowed only if documented and reviewer-approved.

```bash
bun run atelier:index
bun run atelier:relations:index
bun run atelier:relations:validate
bun run atelier:index:validate

bun run atelier:attention -- --task "<task>"
bun run atelier:relations:propose -- --attention <id>
bun run atelier:reader:validate

bun run atelier:transform:md-to-code
bun run atelier:transform:validate

bun run atelier:packet:create
bun run atelier:packet:context
bun run atelier:evidence:add
bun run atelier:executor:validate

bun run atelier:ready
bun run atelier:verify
```

## Ready must fail if

- no SourceAnchor or equivalent exists;
- no accepted non-`contains` relation exists;
- relation endpoints do not resolve;
- no non-empty task-scoped AttentionSet exists;
- reader proposals bypass schema validation;
- transformer ready tasks lack accepted relation trace;
- ready TestContracts are empty, blocked, or nonexistent;
- allowed/forbidden files overlap;
- packet context requires broad repository exploration;
- passed evidence lacks runtime proof;
- evidence does not correspond to the referenced TestContract;
- packet lifecycle current state is conflicting;
- validation is sample/quick-only;
- generated views are used as truth.

## Reviewer output schema

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
    affected_component: "indexer" | "reader" | "transformer" | "executor" | "operation" | "config" | "goal-plugin";
    affected_record: string;
    reason: string;
    recommended_next_action: string;
  }>;
  warnings: string[];
  verified_invariants: string[];
  open_questions: string[];
};
```

## Pass condition

Pass only if:

```txt
anchors exist
non-contains accepted relations exist
reader proposals are schema-bound
transformer consumes accepted relations
packet/test/evidence correspondence is strict
affected/stale behavior exists
generated views are not truth
reviewer returns status: pass
```
