<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

# Validation Gate Registry

| Gate | Severity | Executable | Fixture | Purpose |
| --- | --- | --- | --- | --- |
| VG-000 | P2 | yes | N/A | Discover project and targets |
| VG-001 | P0 | yes | N/A | No product-spec edits against HEAD |
| VG-002 | P1 | yes | N/A | Static project check |
| VG-003 | P1 | yes | N/A | Type/static validation |
| VG-004 | P1 | yes | all-assigned-fixtures | Fixture layout validation |
| VG-005 | P1 | yes | artifact_graph_golden_v1 | Artifact graph golden fixture |
| VG-006 | P1 | yes | graph_endpoint_matrix_v1 | Graph endpoint compatibility |
| VG-007 | P0 | yes | atelier_deletion_regeneration_v1 | .atelier deletion/regeneration |
| VG-008 | P1 | yes | verification_record_v1 | Verification record schema |
| VG-009 | P1 | yes | verification_map_derivation_v1 | Required verification map derivation |
| VG-010 | P0 | yes | completion_truth_table_v1 | Completion truth table |
| VG-011 | P0 | yes | run_lifecycle_state_machine_v1 | Run lifecycle state machine |
| VG-012 | P1 | yes | forced_close_lifecycle_v1 | Forced close lifecycle |
| VG-013 | P0 | yes | durable_acceptance_v1 | Durable acceptance |
| VG-014 | P0 | yes | accepted_evidence_lifecycle_v1 | Accepted evidence lifecycle |
| VG-015 | P0 | yes | context_plan_readonly_v1 | Context plan read-only |
| VG-016 | P1 | yes | context_budget_v1 | Context budget traversal guard |
| VG-017 | P1 | yes | resolution_decision_v1 | Resolution decision record |
| VG-018 | P1 | yes | surface_inventory_v1 | Active surface inventory |
| VG-019 | P1 | yes | run_verify_surface_record_v1 | Run verify surface record |
| VG-020 | P1 | yes | run_packet_v1 | Run packet reading order |
| VG-021 | P1 | yes | adapter_semantic_equivalence_v1 | Adapter semantic equivalence |
| VG-022 | P1 | yes | adapter_packet_portability_v1 | Adapter packet portability |
| VG-023 | P0 | yes | adapter_runtime_parity_v1 | Adapter runtime parity |
| VG-024 | P1 | yes | decision_ref_primary_target_v1 | Decision_ref primary target |
| VG-025 | P1 | yes | transform_maturity_v1 | Transform maturity transition |
| VG-026A | P0 | yes | write_authority_minimum_v1 | Minimum write authority hard-block |
| VG-026B | P1 | yes | write_authority_v1 | Full write authority matrix fixture |
| VG-027 | P1 | yes | drift_v1 | Drift detection |
| VG-028 | P1 | yes | hpo_state_evidence_v1 | HPO state evidence table |
| VG-029 | P0 | yes | coverage_v1 | Contract coverage |
| VG-030 | P0 | yes | e2e_mvp_wedge_v1 | End-to-end MVP wedge |
| VG-031 | P0 | yes | e2e_full_product_v1 | End-to-end full product flows |
| VG-032 | P0 | yes | adapter_parity_no_lock_in_v1 | Adapter parity no-lock-in audit |
| VG-033 | P0 | yes | generated_state_regeneration_v1 | Generated-state regeneration |
| VG-034 | P1 | yes | packet-specific-negative-cases | Negative tests |
| VG-035 | P0 | yes | release_readiness_v1 | Release readiness |
| VG-036 | P0 | yes | N/A | Product spec hash baseline check |
| VG-037 | P0 | yes | N/A | Immutable control-doc diff check |
| VG-038 | P1 | yes | test_integrity_audit_v1 | Test integrity / no weakening |
| VG-039 | P1 | yes | stale_command_grep_v1 | Stale command grep |
| VG-040 | P1 | yes | task_run_boundary_event_v1 | Task/run boundary event test |
| VG-041 | P0 | yes | run_lifecycle_event_v1 | Run lifecycle event test |
| VG-042 | P1 | yes | verification_status_schema_v1 | Verification status schema test |
| VG-043 | P0 | yes | policy_decision_hard_block_v1 | Policy decision hard-block schema |
| VG-044 | P1 | yes | privacy_redaction_boundary_v1 | Privacy/redaction boundary |
| VG-045 | P1 | yes | fixture_alias_registry_v1 | Fixture alias consistency |
| VG-046 | P1 | yes | parallel_conflict_check_v1 | Parallel-packet conflict detection |
