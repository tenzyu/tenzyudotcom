# Work Order Compiler

This document tells the coordinator how to convert evaluator defects into implementation work. The user must not be asked to do this conversion.

## Input

Evaluator defects matching:

```json
{
  "defect_id": "AP-P0-C4-002",
  "severity": "P0",
  "capability_id": "C4",
  "reason": "no runtime query surface for agents",
  "required_repair": "add query command/API for active requirements, decisions, checks, permissions, findings, stale, conflicts, evidence"
}
```

## Output

A bounded work order:

```json
{
  "schema": "atelier.autopoiesis-work-order/v1",
  "work_order_id": "wo:c4-query-runtime:<hash>",
  "capability_ids": ["C4", "C5"],
  "evaluator_finding_ids": ["AP-P0-C4-002"],
  "objective": "Implement the runtime query surface used by task-local packets.",
  "allowed_files": [
    ".atelier-bootstrap/**",
    "product/apps/atelier/**",
    "package.json",
    "nx.json"
  ],
  "forbidden_files": [
    "harness/atelier-autopoiesis/MISSION.md",
    "harness/atelier-autopoiesis/EVALUATION-SPEC.md",
    "harness/atelier-autopoiesis/AUTONOMY-CONTRACT.md",
    "harness/knowledge/product-specs/**",
    ".env",
    ".env.*"
  ],
  "required_runtime_behavior": [
    "query active requirements/accepted decisions/required checks/permissions/open findings/stale/conflicts/evidence by task or scope",
    "query output is JSON and includes source anchors and authority state"
  ],
  "required_negative_controls": [
    "stale/proposed records are excluded from accepted decisions unless explicitly requested",
    "generated views do not appear as authority sources"
  ],
  "required_commands": [
    "bun run atelier:query -- --kind active-requirements --scope .",
    "bun run atelier:packet:create -- --task autopoiesis-smoke",
    "bun run atelier:packet:validate"
  ],
  "acceptance_evidence": [
    "new or updated tests/fixtures proving query filtering and packet contents",
    "evaluator no longer reports AP-P0-C4-002/AP-P0-C5-001"
  ]
}
```

## Compiler rules

### Rule 1: Preserve mission authority

Do not narrow a defect to match the existing implementation. Broaden the implementation until it satisfies the mission.

### Rule 2: Group by shared primitive, not by document section

Examples:

```txt
lifecycle + promotion + materialization -> one coherent state-transition primitive
query runtime + packet generator -> one coherent operational packet primitive
stale + drift + conflict -> one coherent invalidation/conflict primitive
```

### Rule 3: Work orders must include negative controls

A work order that only adds happy-path output is invalid. It must include at least one way the evaluator can prove false completion is rejected.

### Rule 4: If commands are missing, implement commands

Do not mark commands missing as a permanent blocker unless the repository lacks any CLI entrypoint.

### Rule 5: If the old architecture is too narrow, refactor

The older Relation Kernel may be retained as a substrate, but it is not allowed to cap the target. Add missing modules/types/commands when necessary.
