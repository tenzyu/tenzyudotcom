# BLK-FIXTURE-ALIAS-001

```yaml
blocker_id: BLK-FIXTURE-ALIAS-001
date: 2026-06-04T00:00:00Z
date_closed: 2026-06-04T01:00:00Z
classification: missing_oracle
severity: P1
blocking_scope: phase_blocking
affected_invariants:
  - AT-INV-069
affected_dag_nodes:
  - DAG-02A
  - DAG-03
source_specs:
  - harness/knowledge/product-specs/atelier/CONTRACT_TEST_MATRIX.md
description: Fixture alias registry has not been completed. Fixture/code packets cannot use TBD fixture aliases or placeholder commands as acceptance proof.
safe_interpretation_available: true
independent_work_to_continue:
  - DAG-02A fixture alias registry
  - DAG-02 traceability expansion
human_escalation_required: false
product_specs_touched: false
status: closed
resolution_packet_id: at-ctrl-006
resolution_artifacts:
  - harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-2026-06-04.yaml
  - product/apps/atelier/src/__tests__/fixture-alias-consistency.test.ts
  - product/apps/atelier/src/__tests__/fixtures/<fixture_id>/{input,expected,README,command} placeholder scaffolding for every pending fixture
  - harness/knowledge/implementation-control/atelier/state/validations/VG-045-2026-06-04.md
  - harness/knowledge/implementation-control/atelier/state/validations/at-ctrl-006-acceptance-2026-06-04.md
resolution_summary: |
  The fixture alias registry is now concrete. It enumerates 45
  fixture_id rows (24 from the v5.1 layout in CONTRACT_TEST_MATRIX.md
  §1a; 16 from the structured gate records; 3 from the DAG-02 join
  table; 2 meta-fixtures). Every row has a `command_file`,
  `input_path`, `expected_path`, `gate_id`, `provenance`, and
  `last_verified_at`. The 40 `pending_command_implementation` rows
  have placeholder `command.ts` files that fail closed
  (real, fail-closed implementations; not compatibility aliases).
  VG-045 is now executable: its command is
  `bun nx run atelier:test -- --testPathPattern=fixture-alias-consistency`
  and its proof artifact is at
  `state/validations/VG-045-2026-06-04.md`. The full
  `bun nx run atelier:check` passes (122 tests, 0 failures).
```
