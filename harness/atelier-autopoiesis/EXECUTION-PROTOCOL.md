# Execution Protocol

This file specifies the internal control loop for OpenCode agents. It is not a user checklist.

## Loop invariant

The loop is active while any evaluator P0/P1 defect exists and no true product-author blocker exists.

## Control cycle

```txt
0. Coordinator creates/refreshes a compact resume checkpoint and dispatches token forecaster when telemetry is large or unknown.
1. Mission compiler builds or refreshes a capability map from MISSION.md and repository state using bounded inventory/slice reads.
2. Evaluator produces structured findings with severity, capability id, affected code/state, and required proof.
3. Coordinator groups findings into non-overlapping implementation work orders.
4. Runtime implementers patch code, tests, schemas, commands, docs-as-contract, and generated fixtures where allowed.
5. Red-team reviewer attempts to prove the patch is a false completion.
6. Evaluator reruns static and command checks.
7. Token forecaster estimates remaining completion cost before phase finalization.
8. Coordinator either dispatches repairs or completes only on evaluator pass and budget-valid forecast.
```

The coordinator must not outsource the loop to the user.

## Work-order shape

Every implementation work order must be machine-readable and bounded:

```json
{
  "schema": "atelier.autopoiesis-work-order/v1",
  "work_order_id": "wo:<stable-id>",
  "capability_ids": ["C2", "C4"],
  "evaluator_finding_ids": ["AP-P0-001"],
  "objective": "Implement lifecycle promotion policy with validator-backed no-direct-acceptance rule.",
  "allowed_files": [],
  "forbidden_files": [
    "harness/atelier-autopoiesis/MISSION.md",
    "harness/atelier-autopoiesis/EVALUATION-SPEC.md",
    "harness/atelier-autopoiesis/AUTONOMY-CONTRACT.md",
    ".env",
    ".env.*"
  ],
  "required_runtime_behavior": [],
  "required_negative_controls": [],
  "required_commands": [],
  "acceptance_evidence": [],
  "mission_excerpt": [],
  "capability_excerpt": [],
  "read_surface": {
    "preferred_symbols": [],
    "required_file_slices": [],
    "full_read_allowlist": [],
    "generated_state_policy": "query_or_summary_only"
  },
  "token_budget": {
    "input_soft_cap": 3000000,
    "output_soft_cap": 350000,
    "test_run_cap": 4,
    "full_file_read_cap": 5
  }
}
```

## Implementation report shape

```json
{
  "schema": "atelier.autopoiesis-implementer-report/v1",
  "work_order_id": "wo:<id>",
  "status": "completed|partial|blocked",
  "capability_ids": [],
  "files_changed": [],
  "commands_run": [],
  "commands_not_run": [],
  "runtime_evidence": [],
  "negative_controls_added": [],
  "remaining_defects": [],
  "blockers": []
}
```

## Evaluator report shape

```json
{
  "schema": "atelier.autopoiesis-evaluation/v1",
  "status": "pass|fail|blocked",
  "evaluated_at": "ISO-8601",
  "capability_results": [],
  "blocking_defects": [],
  "warnings": [],
  "commands_run": [],
  "commands_not_run": [],
  "evidence": [],
  "next_work_orders": []
}
```

## Token forecast phase

Before accepting a phase's generated files as final, coordinator must dispatch `atelier-token-forecaster` and attach its `atelier.token-forecast/v1` report to the evaluator context. This is required even if tests pass.
