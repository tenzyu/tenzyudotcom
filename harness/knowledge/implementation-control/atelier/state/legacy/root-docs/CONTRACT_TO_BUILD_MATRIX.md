---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-contract-to-build-matrix
title: Atelier Contract To Build Matrix
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Contract To Build Matrix

## Purpose

This matrix maps implementation-relevant product-spec claims to build artifacts. Every executable claim receives an invariant ID. Strategic or descriptive claims are classified as `positioning_constraint`, `future_goal`, or `non_executable_context` and do not become code tasks until a normative contract, schema, fixture, or roadmap phase makes them executable.

Classifications used: `normative_invariant`, `schema_requirement`, `surface_requirement`, `fixture_requirement`, `lifecycle_requirement`, `permission_requirement`, `derived_state_requirement`, `adapter_requirement`, `verification_requirement`, `hpo_requirement`, `transformation_requirement`, `trace_review_requirement`, `runtime_resolution_requirement`, `swarm_requirement`, `positioning_constraint`, `future_goal`, `non_executable_context`.

## Required Section-Level Join Table Columns

The table below is the initial invariant inventory. Before implementation packets beyond repository inventory and fixture scaffolding, `DAG-02` must expand executable rows into a machine-readable join table with these columns:

```yaml
required_columns:
  - invariant_id
  - dag_node_id
  - source_sections
  - exact_assertion
  - owned_fields_or_enums
  - closed_enum_values
  - negative_cases
  - fixture_id
  - validation_gate_ids
  - allowed_files_ref
  - proof_level
  - phase_scope
  - deferral_state
  - current_contract_testability
  - required_for_pg_f
  - waiver_id
  - waiver_expiry
  - owner_role
  - traceability_status
  - blocker_id
```

## Row Shape (Enforced by Join Table)

Every row in the join table must satisfy the following shape. The join-table state file in `state/traceability/dag-02-join-table-<date>.yaml` is the machine-readable authority; the matrix below is the human-readable index.

| Column | Required | Description |
|---|---|---|
| `invariant_id` | yes | `AT-INV-NNN` or `infrastructure_support` |
| `dag_node_id` | yes | `DAG-NN` or `DAG-NN_to_DAG-MM` |
| `source_sections` | yes | list of `path#section` references into product specs |
| `exact_assertion` | yes | one-sentence normative claim |
| `owned_fields_or_enums` | yes | list of fields, enums, or N/A |
| `closed_enum_values` | yes | list of allowed values or N/A |
| `negative_cases` | yes | list of invalid cases that must fail closed |
| `fixture_id` | yes | fixture name or `oracle_gap` with reason |
| `validation_gate_ids` | yes | list of `VG-NNN` gate IDs |
| `allowed_files_ref` | yes | exact file globs |
| `proof_level` | yes | `recorded validation proof`, `machine-readable join table plus coverage proof`, `fixture alias proof required`, etc. |
| `phase_scope` | yes | `PG-0`, `PG-0B`, `PG-1`, `PG-2`, `PG-3`, `PG-4`, `PG-5`, `PG-6`, `PG-F` |
| `deferral_state` | yes | one of: `concrete`, `deferred_until_phase: <PG-id>`, `blocked_by_missing_fixture: <fixture_id>`, `blocked_by_product_gap: <spec_section>`, `waived_by_product_governance: <waiver_id>` |
| `current_contract_testability` | yes | `executable`, `partial_control_record_only`, `not_yet_executable` |
| `required_for_pg_f` | yes | boolean |
| `waiver_id` | conditional | present iff `deferral_state` is `waived_by_product_governance` |
| `waiver_expiry` | conditional | present iff `deferral_state` is `waived_by_product_governance` |
| `owner_role` | yes | role from `SUBAGENT_ROLE_CATALOG.md` |
| `traceability_status` | yes | `concrete`, `blocked_until_field_split`, `blocked_until_fixture_alias_registry` |
| `blocker_id` | yes | `null` or a `BLK-*` reference |

## Rejection Rules

A row in the join table is rejected if:

- any column is `TBD`, `derive`, `future fixture`, or any other placeholder;
- `source_sections` is empty;
- `exact_assertion` is empty;
- `fixture_id` is empty unless `deferral_state` is `blocked_by_missing_fixture` or `blocked_by_product_gap` with explicit reason;
- `deferral_state` is `waived_by_product_governance` and `waiver_id` is missing;
- `deferral_state` is `waived_by_product_governance` and `waiver_expiry` is in the past;
- a product-code packet references a row with `deferral_state != concrete`;
- a product-code packet references a row with `traceability_status != concrete`;
- a product-code packet references a row with a non-null `blocker_id` that is not `closed` in `state/blockers/**`.

Broad rows such as graph schema, active surfaces, verification schema, HPO states, adapter packets, write authority, runtime resolution, and swarm coordination must be split into field-level or fixture-level rows before implementation acceptance.

The current executable `DAG-02` join table is persisted at `harness/knowledge/implementation-control/atelier/state/traceability/dag-02-join-table-2026-06-04.yaml`. Product code packets remain blocked unless their assigned rows in that file satisfy every row shape column, have `traceability_status: concrete`, and have no open `blocker_id`.

## Matrix

| Invariant ID | Classification | Source spec | Normative claim | Implementation module | Schema | Fixture | Test | CLI/API surface | Completion condition | Dependency IDs | Blocker behavior |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AT-INV-001 | positioning_constraint | `Ideal.md`, `contract.md`, `POSITIONING.md` | Atelier is a repository-native artifact alignment layer and must not become a coding agent/runtime/IDE/CI/task manager/prompt library/docs tool | Architecture boundaries | N/A | boundary review fixture | contract coverage plus architecture lint when available | All surfaces | No module owns external agent execution; forbidden category checks pass | None | Record boundary blocker if implementation requires runtime ownership |
| AT-INV-002 | normative_invariant | `Ideal.md`, `contract.md` | Repository remains source of truth; product truth is source artifacts plus accepted durable evidence | Artifact/evidence services | Artifact class schema | deletion regeneration | `atelier_deletion_regeneration_fixture` | graph, run verify, run complete | Product truth rebuilds without `.atelier` | AT-INV-010 | Block graph/evidence tracks only |
| AT-INV-003 | derived_state_requirement | `contract.md`, `GRAPH_SEMANTICS.md` | `.atelier/**` contains derived state only and must not be sole product truth | Derived-state storage | Artifact class schema | deletion regeneration | `atelier_deletion_regeneration_fixture` | scan, graph, context, run | Deleting `.atelier` loses only cache/debug/working state | AT-INV-002 | Block storage/promotion packets |
| AT-INV-004 | normative_invariant | `GRAPH_SEMANTICS.md` | Every artifact belongs to exactly one class: source, accepted_durable_evidence, derived | Graph kernel | Node class enum | graph golden | `artifact_graph_golden_fixture` | graph JSON | Class is required and exclusive on every node | None | Block graph kernel |
| AT-INV-005 | schema_requirement | `GRAPH_SEMANTICS.md` | Node schema requires id, kind, class, path, hash, owner, authority | Graph kernel | graph_node | graph golden | `artifact_graph_golden_fixture` | `atelier graph --json` | All required fields present and canonical | AT-INV-004 | Block graph JSON consumers |
| AT-INV-006 | schema_requirement | `GRAPH_SEMANTICS.md` | Artifact identity is primary authored id, secondary kind/scope/slug, location observation, or ephemeral content hash | Identity resolver | graph_node identity fields | graph golden | `artifact_graph_golden_fixture` | graph JSON | Move/rename preserves logical identity | AT-INV-005 | Block graph and attention |
| AT-INV-007 | lifecycle_requirement | `GRAPH_SEMANTICS.md` | Move/rename emits `moved/supersedes` relations, not unrelated identity mints | Identity resolver | graph_edge | graph golden | `artifact_graph_golden_fixture` | graph JSON | Moved fixture links old/new identity | AT-INV-006 | Block stale/reconciliation paths |
| AT-INV-008 | schema_requirement | `GRAPH_SEMANTICS.md` | Canonical kind catalog is closed; experimental kinds are `exp.*` | Graph validator | kind enum | endpoint matrix | `graph_kind_endpoint_compatibility_fixture` | graph JSON | Unknown canonical kinds rejected; disconnected `exp.*` tolerated | AT-INV-005 | Block strict graph validation |
| AT-INV-009 | schema_requirement | `GRAPH_SEMANTICS.md` | Edge catalog and endpoint compatibility matrix are exhaustive and type-closed | Graph validator | edge schema | endpoint matrix | `graph_kind_endpoint_compatibility_fixture` | graph JSON | Invalid endpoints emit violation event | AT-INV-008, AT-INV-030 | Block graph consumers |
| AT-INV-010 | schema_requirement | `GRAPH_SEMANTICS.md` | Graph hash is deterministic, timestamp-free, stable for unchanged inputs | Graph serializer | canonical graph JSON | graph golden | `artifact_graph_golden_fixture` | graph JSON | Rebuild produces byte-identical hash | AT-INV-005, AT-INV-009 | Block attention freshness and regeneration |
| AT-INV-011 | derived_state_requirement | `GRAPH_SEMANTICS.md` | Graph can regenerate from source artifacts, accepted durable evidence, documented external inputs | Graph builder | graph input manifest | deletion regeneration | `atelier_deletion_regeneration_fixture` | scan, graph | Post-deletion graph equals pre-deletion graph | AT-INV-010 | Block completion of graph phase |
| AT-INV-012 | normative_invariant | `GRAPH_SEMANTICS.md` | Stale nodes remain visible with `stale=true` and `stale_reason`, excluded from default traversal | Stale detector | stale fields | graph golden, drift | `artifact_graph_golden_fixture`, `drift_detection_fixture` | graph status, reconcile | Stale fixture reports stale reason | AT-INV-010 | Continue non-stale work |
| AT-INV-013 | schema_requirement | `GRAPH_SEMANTICS.md` | Graph-internal authority resolves conflicts by authority, class, recency and emits conflict event | Authority resolver | authority fields, event | graph golden | `artifact_graph_golden_fixture` | graph status | Fixture conflict resolves documented direction | AT-INV-030 | Block only authority-dependent traversal |
| AT-INV-014 | verification_requirement | `VERIFICATION_SCHEMA.md` | Check registry entries conform to minimum schema | Verification registry | check schema | verification record | `verification_record_schema_fixture` | controls/check registry API if present | Active checks register required fields | AT-INV-005 | Block required-map derivation |
| AT-INV-015 | verification_requirement | `VERIFICATION_SCHEMA.md` | Required verification map is derived from task acceptance criteria and active check bindings; policy term contributes zero entries in v5.1 | Verification engine | required map | verification_map_derivation | `required_verification_map_derivation_fixture` | context plan, run create | Map is closed at task creation | AT-INV-014 | Block attention/run create packets |
| AT-INV-016 | verification_requirement | `VERIFICATION_SCHEMA.md` | Verification record schema is closed and durable_path must be outside `.atelier` | Verification records | verification_record | verification_record | `verification_record_schema_fixture` | run verify | Invalid records rejected | AT-INV-014 | Block run verify |
| AT-INV-017 | verification_requirement | `VERIFICATION_SCHEMA.md` | `passed` requires evidence refs | Verification validator | verification_record | verification_record | `verification_record_schema_fixture` | run verify | Passed without evidence rejected | AT-INV-016 | Block completion gate |
| AT-INV-018 | verification_requirement | `VERIFICATION_SCHEMA.md` | Status lattice is closed: passed, failed, skipped, unavailable, not-run, unknown | Verification validator | status enum | verification_record | `verification_record_schema_fixture` | run verify, run complete | Unknown status rejected | AT-INV-016 | Block gate if status ambiguous |
| AT-INV-019 | verification_requirement | `VERIFICATION_SCHEMA.md` | Skip/unavailable reason codes are controlled | Verification validator | reason enums | verification_record | `verification_record_schema_fixture` | run verify | Invalid reason degrades/rejects per spec | AT-INV-018 | Block or dirty per truth table |
| AT-INV-020 | verification_requirement | `VERIFICATION_SCHEMA.md` | `deferred_by_accepted_decision` requires `decision_ref` to accepted `decision_record` | Decision-ref validator | decision_record ref | decision_ref_primary_target | `decision_ref_primary_target_fixture` | run verify | Transform receipt is rejected as primary decision_ref | AT-INV-019, AT-INV-005 | Block skip-derived dirty behavior |
| AT-INV-021 | verification_requirement | `VERIFICATION_SCHEMA.md` | Hard block is union of failed required/blocking, not-run/unknown, blocking unavailable, active block policy, unmet precondition, missing evidence, adapter violation | Completion gate | gate state | completion truth table | `completion_truth_table_fixture` | run complete | Every hard-block scenario emits terminal block | AT-INV-018, AT-INV-050 | Block run completion |
| AT-INV-022 | verification_requirement | `VERIFICATION_SCHEMA.md` | Completion truth table is sole authority on closure state | Completion gate | truth table | completion truth table | `completion_truth_table_fixture`, `verification_gate_completion_fixture` | run complete | Clean/dirty/block/force rows match exactly | AT-INV-021 | Block run lifecycle integration |
| AT-INV-023 | lifecycle_requirement | `contract.md`, `VERIFICATION_SCHEMA.md` | `completed_dirty` is terminal non-success reviewable, not success | Completion/HPO projection | closure enum | completion truth table, HPO evidence | `completion_truth_table_fixture`, `hpo_state_evidence_table_fixture` | run complete, HPO | Dirty never emits success wording | AT-INV-022 | Block UI/surface release |
| AT-INV-024 | lifecycle_requirement | `contract.md` | Task lifecycle is distinct from run lifecycle; task close emits `task_closed`, never run completion | Task service | task events | lifecycle fixture | `task_run_boundary_event_test` placeholder | task close | Task closure cannot emit run events | AT-INV-030 | Block task/run integration |
| AT-INV-025 | lifecycle_requirement | `contract.md`, `EVENT_MODEL.md` | Run lifecycle states and events include created, resumed, blocked_waiting, run_blocked_terminal, completed_clean, completed_dirty, forced_closed | Run service | run event schema | run lifecycle | `run_lifecycle_state_machine_fixture` | run create/list/inspect/resume/complete/force-close | State machine accepts valid and rejects invalid transitions | AT-INV-030, AT-INV-022 | Block run surfaces |
| AT-INV-026 | lifecycle_requirement | `contract.md`, `EVENT_MODEL.md` | `blocked_waiting` is non-terminal and may resume; cannot force-close directly | Run service | run event schema | run lifecycle | `run_lifecycle_state_machine_fixture` | run force-close | Force-close from waiting returns invariant violation | AT-INV-025 | Block force-close only |
| AT-INV-027 | lifecycle_requirement | `contract.md`, `EVENT_MODEL.md` | `run_blocked_terminal` is terminal and may emit only `run_forced_closed` | Run service | run event schema | forced close | `forced_close_lifecycle_fixture` | run complete, run force-close | Blocked terminal never emits run_completed_* | AT-INV-025 | Block terminal lifecycle |
| AT-INV-028 | lifecycle_requirement | `contract.md`, `SURFACES.md` | `atelier run force-close` permitted only from `run_blocked_terminal` and emits `run_forced_closed` | CLI/run service | force-close JSON | forced close | `forced_close_lifecycle_fixture` | run force-close | Invalid states return `ATELIER-INVARIANT-VIOLATION` | AT-INV-027 | Block force-close surface |
| AT-INV-029 | lifecycle_requirement | `EVENT_MODEL.md` | Event enum is closed; new code must not emit `run_started` or legacy `run_blocked` | Event service | event enum | run lifecycle | `run_lifecycle_state_machine_fixture` | all event emitters | Legacy tolerated only by readers | AT-INV-030 | Block event writers |
| AT-INV-030 | schema_requirement | `EVENT_MODEL.md` | Event identity requires stable event_id, actor_id, timestamps, source/evidence refs, durable_location, correlation_id, redaction_state | Event service | event schema | durable acceptance | `durable_acceptance_fixture` | all event JSON outputs | Events validate against schema | None | Block lifecycle/event packets |
| AT-INV-031 | lifecycle_requirement | `EVENT_MODEL.md`, `VERIFICATION_SCHEMA.md` | Durable evidence promotion requires both durable write outside `.atelier` and matching `artifact_accepted` event with same correlation_id | Evidence promotion | event + evidence schema | durable acceptance | `durable_acceptance_fixture`, `accepted_evidence_lifecycle_fixture` | run verify, transform accept | Either condition alone is insufficient | AT-INV-016, AT-INV-030 | Block evidence acceptance |
| AT-INV-032 | lifecycle_requirement | `EVENT_MODEL.md` | Durable terminal run events survive `.atelier` deletion | Event durability | event durable_location | accepted evidence | `accepted_evidence_lifecycle_fixture` | run complete, run force-close | Terminal events written durably | AT-INV-025, AT-INV-031 | Block run close release |
| AT-INV-033 | schema_requirement | `EVENT_MODEL.md` | Redacted events replace fields with placeholders and list redacted fields | Event redaction | redaction_state | privacy boundary deferred | `privacy_redaction_boundary_fixture` placeholder | adapters/traces | Boundary implemented; full privacy model deferred | AT-INV-030 | Record deferred oracle gap if full labels needed |
| AT-INV-034 | surface_requirement | `SURFACES.md` | Active CLI command inventory is exact; removed commands must not appear in active surfaces | CLI registry | command inventory | surface_inventory | `active_surface_inventory_test` | CLI/MCP/GUI/prompts/README | Help and surfaces match inventory | None | Block surface phase |
| AT-INV-035 | surface_requirement | `SURFACES.md` | Long-form flags only; `--json` is canonical machine-readable flag; errors use `ATELIER-` prefix | CLI parser | CLI schema | surface_inventory | `active_surface_inventory_test` | CLI | Invalid flags not advertised; errors prefixed | AT-INV-034 | Block affected command |
| AT-INV-036 | surface_requirement | `SURFACES.md` | Priority JSON output shapes are exact and snake_case; additional fields forbidden | CLI JSON serializers | JSON schemas | surface_inventory | `active_surface_inventory_test` | context plan, run complete, run force-close, run verify, graph | JSON field set matches spec | AT-INV-034 | Block command release |
| AT-INV-037 | surface_requirement | `SURFACES.md`, `VERIFICATION_SCHEMA.md` | `atelier run verify --record --from <verification-record.json> --json` accepts full record and emits paired verification_recorded + artifact_accepted events | CLI/run verify | verification_record JSON | run verify surface | `run_verify_surface_record_fixture` | run verify | Full-record validation passes and events correlate | AT-INV-016, AT-INV-031, AT-INV-036 | Block verification surface |
| AT-INV-038 | surface_requirement | `SURFACES.md` | MCP tools mirror CLI command path with `atelier_` prefix and no removed commands | MCP registry | tool schemas | surface_inventory | `active_surface_inventory_test` | MCP | Tool list equals active surface subset | AT-INV-034 | Block MCP parity |
| AT-INV-039 | surface_requirement | `SURFACES.md` | GUI labels map to canonical surfaces and must not imply extra capabilities | GUI label map | label mapping | surface_inventory/HPO | `active_surface_inventory_test`, `hpo_state_evidence_table_fixture` | HPO UI | Labels expose canonical name where parity matters | AT-INV-034, AT-INV-060 | Block UI release |
| AT-INV-040 | adapter_requirement | `ADAPTER_CONTRACT.md` | Adapter translates canonical packet/result and does not own execution | Adapter core | adapter interfaces | adapter fixtures | `adapter_packet_portability_fixture` | run export | No adapter launches hidden execution as product truth | AT-INV-044 | Block adapter track |
| AT-INV-041 | adapter_requirement | `ADAPTER_CONTRACT.md` | Canonical packet input fields are required; missing fields are adapter errors | Adapter validator | canonical_packet | packet portability | `adapter_packet_portability_fixture` | run export | Missing field returns adapter error | AT-INV-040 | Block adapter packet export |
| AT-INV-042 | adapter_requirement | `ADAPTER_CONTRACT.md` | Canonical result fields are required, including diff even when empty | Adapter validator | canonical_result | packet/runtime parity | `adapter_packet_portability_fixture`, `adapter_runtime_parity_fixture` | adapter result import | Empty diff is meaningful and present | AT-INV-040 | Block adapter result handling |
| AT-INV-043 | adapter_requirement | `ADAPTER_CONTRACT.md` | Capability descriptor declares adapter capabilities and forbidden aliases | Adapter registry | capability descriptor | packet/runtime parity | `adapter_packet_portability_fixture` | adapter registry/run export | Descriptor exists for every adapter | AT-INV-040 | Block adapter registration |
| AT-INV-044 | adapter_requirement | `ADAPTER_CONTRACT.md` | Adapter forbidden behaviors are rejected: mutate packet/result, invent verification, hide state, alias removed commands, promote implicitly | Adapter core/governance | adapter policy | adapter fixtures | `adapter_packet_portability_fixture`, `adapter_runtime_parity_fixture` | run export/import | Forbidden behavior test cases fail closed | AT-INV-034 | Block adapter track |
| AT-INV-045 | adapter_requirement | `ADAPTER_CONTRACT.md` | Semantic equivalence normalization is field-wise and shared by Stage 0 and Stage 1 fixtures | Adapter parity oracle | normalized result | semantic equivalence | `adapter_semantic_equivalence_fixture` | test utility/API | Normalized field sets compare equal | AT-INV-042 | Block parity claims |
| AT-INV-046 | adapter_requirement | `ADAPTER_CONTRACT.md`, `ROADMAP.md` | Stage 0 packet portability is proven by human-shell + noop-reference only and does not prove runtime agnosticism | Generic adapters | adapter descriptors | packet portability | `adapter_packet_portability_fixture` | run export | `packet_portability_claim` asserted only after fixture passes | AT-INV-045 | Block MVP 1B claim |
| AT-INV-047 | adapter_requirement | `ADAPTER_CONTRACT.md`, `ROADMAP.md` | Runtime agnosticism is proven only by real-runtime adapter pair passing runtime parity | Real adapters | adapter descriptors | runtime parity | `adapter_runtime_parity_fixture` | adapter registry | `runtime_agnosticism_claim` asserted after Phase 2C only | AT-INV-046 | Mark claim as product goal until passed |
| AT-INV-048 | adapter_requirement | `ADAPTER_CONTRACT.md` | Adapter error schema uses closed `ATELIER-*` error codes | Adapter validator | adapter_error | adapter fixtures | `adapter_packet_portability_fixture` | run export/import | Unknown error code rejected | AT-INV-040 | Block adapter error handling |
| AT-INV-049 | derived_state_requirement | `ADAPTER_CONTRACT.md` | Adapter output has per-field class split; runtime observations derived, candidates promoted only by acceptance | Adapter output store | output class schema | durable acceptance | `durable_acceptance_fixture` | run export/import, run verify | Adapter cannot create accepted evidence implicitly | AT-INV-031, AT-INV-044 | Block adapter/evidence integration |
| AT-INV-050 | permission_requirement | `WRITE_AUTHORITY_MATRIX.md` | Actors and surfaces may write/promote only authorized artifact classes | Write authority guard | authority matrix | write_authority | `write_authority_matrix_fixture` placeholder | all mutating commands | Unauthorized write rejected | AT-INV-004 | Block mutating surfaces |
| AT-INV-051 | permission_requirement | `WRITE_AUTHORITY_MATRIX.md` | Context planner must not create tasks, runs, source artifacts, or accepted durable evidence | Context planner | effect profile | context readonly | `context_plan_readonly_fixture` | context plan | `mutated=false`, `created_run=false`, `created_task=false` | AT-INV-050 | Block attention planner |
| AT-INV-052 | permission_requirement | `WRITE_AUTHORITY_MATRIX.md` | Runtime adapters and validators may produce candidates/evidence but may not promote their own output | Adapter/validator guard | authority matrix | write_authority, durable acceptance | `write_authority_matrix_fixture`, `durable_acceptance_fixture` | adapter import, run verify | Promotion requires human or explicit command | AT-INV-031, AT-INV-050 | Block promotion path |
| AT-INV-053 | derived_state_requirement | `RUN_PACKET_MODEL.md` | Working run packets and working handoffs live under `.atelier/runs/**` and are derived | Run packet store | packet class schema | run packet | `run_packet_reading_order_fixture`, deletion regen | run create/resume/handoff | Working state is not product truth | AT-INV-003 | Block run packet storage |
| AT-INV-054 | lifecycle_requirement | `RUN_PACKET_MODEL.md` | Exported packet/handoff is source candidate; accepted handoff/terminal summary is accepted durable evidence | Run packet export/promotion | packet class schema | durable acceptance | `durable_acceptance_fixture` | run export | Export does not imply acceptance | AT-INV-031, AT-INV-053 | Block export/promotion |
| AT-INV-055 | lifecycle_requirement | `contract.md`, `RUN_PACKET_MODEL.md` | Normal LLM-readable run packet order begins `handoff.md`, then brief, plan, context, verification, review, worklog, artifacts; manifest is not normal first read | Run resume/export | packet manifest | run packet | `run_packet_reading_order_fixture` | run resume/export | Resume prompt uses canonical order | AT-INV-053 | Block run resume/export |
| AT-INV-056 | normative_invariant | `contract.md` | Context plan is read-only and may report selected artifacts, exclusions, reading order, injection mode, resolution decisions, next actions, stale/missing artifacts | Attention planner | context_plan JSON | context readonly | `context_plan_readonly_fixture` | context plan | No source/task/run/index hidden mutation | AT-INV-051 | Block attention planner |
| AT-INV-057 | schema_requirement | `contract.md` | Resolution decision record has id, input_signals, candidates, decision_reason, resolution_type, resolver_identity, rejected, budget_delta, recorded_at | Attention planner | resolution_decision_record | resolution decision | `resolution_decision_record_fixture` | context plan | Every used decision is recorded | AT-INV-056 | Block semantic/hybrid selection |
| AT-INV-058 | schema_requirement | `contract.md`, `SURFACES.md` | Context budget reports artifact slots, token estimates, limit, and policy; hard overrun is plan-time error | Attention planner | context_budget | context budget | `context_budget_traversal_guard_fixture` | context plan | Budget fields present and enforced | AT-INV-056 | Block context plan output |
| AT-INV-059 | verification_requirement | `ROADMAP.md`, `contract.md` | Attention v1 co-emits required verification map | Attention/verification integration | required map | context + verification fixtures | `context_plan_readonly_fixture`, `required_verification_map_derivation_fixture` | context plan | Plan includes derived map without mutation | AT-INV-015, AT-INV-056 | Block Phase 1C |
| AT-INV-060 | hpo_requirement | `HPO_STATE_MODEL.md` | HPO state set is closed and displayed entities may carry multiple states | HPO projection | hpo_state enum | HPO evidence | `hpo_state_evidence_table_fixture` | HPO API/UI | No unknown states; all applicable states shown | AT-INV-022, AT-INV-030 | Block HPO projection |
| AT-INV-061 | hpo_requirement | `HPO_STATE_MODEL.md` | Each HPO state requires evidence; state without evidence is invalid | HPO projection | evidence table | HPO evidence | `hpo_state_evidence_table_fixture` | HPO API/UI | Missing evidence prevents state claim | AT-INV-060 | Block UI release |
| AT-INV-062 | hpo_requirement | `HPO_STATE_MODEL.md` | UI must not make forbidden claims, especially verification/success claims for dirty, blocked, forced_closed, unverified | HPO UI | forbidden claims map | HPO evidence | `hpo_state_evidence_table_fixture` | HPO UI | Forbidden copy absent by structure | AT-INV-061 | Block UI release |
| AT-INV-063 | hpo_requirement | `HPO_STATE_MODEL.md` | Allowed human actions depend on current state; UI does not transition state directly | HPO UI/action guard | action map | HPO evidence | `hpo_state_evidence_table_fixture` | HPO UI/API | Disallowed actions hidden/rejected | AT-INV-060 | Block HPO actions |
| AT-INV-064 | hpo_requirement | `HPO_STATE_MODEL.md` | Partial/redacted/synthetic evidence displays uncertainty explicitly | HPO projection/UI | uncertainty schema | HPO evidence | `hpo_state_evidence_table_fixture` | HPO UI | Uncertainty messages present | AT-INV-033, AT-INV-061 | Continue non-redacted HPO work if redaction deferred |
| AT-INV-065 | transformation_requirement | `contract.md` | Transformation maturity levels 0-6 are ordered and cannot jump levels | Transformation service | maturity schema | transform maturity | `transform_maturity_transition_fixture` | transform candidate/propose/accept surfaces | Illegal jumps rejected | AT-INV-031 | Block transformation pilots |
| AT-INV-066 | transformation_requirement | `contract.md`, `EVENT_MODEL.md` | Level 3 to 4 acceptance requires accepted actor, evidence, receipt, `artifact_accepted` event | Transformation service | transition/event schema | transform maturity, accepted evidence | `transform_maturity_transition_fixture`, `accepted_evidence_lifecycle_fixture` | transform accept | Acceptance event and receipt exist | AT-INV-031, AT-INV-065 | Block deterministic/enforced promotion |
| AT-INV-067 | transformation_requirement | `contract.md` | Level 4 to 5 needs deterministic output schema and stable content hash; Level 5 to 6 needs enforcement mechanism/severity | Transformation/enforcement | deterministic artifact schema | transform maturity | `transform_maturity_transition_fixture` | transform promote/enforce | Deterministic/enforced states prove required evidence | AT-INV-066 | Block enforcement |
| AT-INV-068 | fixture_requirement | `CONTRACT_TEST_MATRIX.md` | Every normative `must` maps to test, fixture-only check, or waiver | Contract audit | coverage map | coverage | `contract_coverage_test` | test command | Coverage gaps reported | All executable invariants | Block phase completion, not independent implementation |
| AT-INV-069 | fixture_requirement | `CONTRACT_TEST_MATRIX.md` | Fixtures use the v5.1 layout and include input/expected/README/command | Fixture tree | fixture layout | all fixtures | fixture validation gate | N/A | Every fixture directory has required files | AT-INV-068 | Block fixture gate |
| AT-INV-070 | fixture_requirement | `EXAMPLES.md` | Six golden flows ground context, completion, transformation, adapter portability, force-close, accepted evidence | E2E fixtures | flow fixtures | examples-derived fixtures | integration tests | CLI/API flows | Golden flows pass without spec edits | AT-INV-022, AT-INV-046, AT-INV-066 | Block E2E convergence for matching flow |
| AT-INV-071 | future_goal | `ROADMAP.md`, `POSITIONING.md` | Broad reconciliation beyond narrow Phase 1E is deferred to Phase 3+ | Reconciliation | drift schema | drift | `drift_detection_fixture` | reconcile | Narrow drift passes before broad expansion | AT-INV-012, AT-INV-034 | Do not block MVP except narrow drift if selected |
| AT-INV-072 | future_goal | `ROADMAP.md` | Transformation pilots come after accepted evidence lifecycle | Transformation pilots | maturity schema | transform maturity | `transform_maturity_transition_fixture` | transform surfaces | Phase 3 begins only after Phase 1D | AT-INV-031, AT-INV-065 | Block transformation track only |
| AT-INV-073 | future_goal | `ROADMAP.md` | HPO UI comes after graph, verification, drift semantics, and transformation are stable | HPO UI | HPO projection schema | HPO evidence | `hpo_state_evidence_table_fixture` plus UI gates | HPO UI | UI displays real evidence, not decoration | AT-INV-060, AT-INV-071, AT-INV-072 | Block UI track only |
| AT-INV-074 | future_goal | `ROADMAP.md` | Swarm coordination comes after stable graph/verification/HPO-adjacent semantics | Swarm coordination | packet protocol | swarm fixtures later | swarm integration placeholders | subagent packet surfaces | Multi-agent outputs are not canonical by default | AT-INV-002, AT-INV-068 | Waived until Phase 5; do not block earlier phases |
| AT-INV-075 | non_executable_context | `POSITIONING.md` | Market evidence and adjacent category examples explain why Atelier exists | N/A | N/A | N/A | N/A | N/A | Shapes non-goals only | None | Never convert market evidence into code behavior |
| AT-INV-076 | permission_requirement | `contract.md`, `WRITE_AUTHORITY_MATRIX.md`, `VERIFICATION_SCHEMA.md` | `policy_decision` has a minimum schema and active blocking decisions contribute to `hard_block` | Governance/verification boundary | policy_decision + gate state | policy decision hard block | `policy_decision_hard_block_fixture` | run complete, write authority | Active block policy decision prevents clean completion | AT-INV-021, AT-INV-050 | Block mutating and completion packets |
| AT-INV-077 | trace_review_requirement | `contract.md`, `EVENT_MODEL.md`, `RUN_PACKET_MODEL.md` | Trace records and review records are classified artifacts and become durable evidence only through explicit acceptance | Trace/review services | trace/review record classes | trace review acceptance | fixture TBD by DAG-02 | review/handoff surfaces | Raw traces/reviews are not product truth until accepted | AT-INV-031, AT-INV-054 | Block trace/review DAG nodes if spec lacks oracle |
| AT-INV-078 | runtime_resolution_requirement | `ADAPTER_CONTRACT.md`, `GRAPH_SEMANTICS.md`, `ROADMAP.md` | Runtime capability descriptors and runtime-specific config are graph-managed artifacts with provenance; hidden runtime config is not product truth | Runtime resolver | capability/config provenance schema | runtime resolution | fixture TBD by DAG-02 | adapter registry/run export | Adapter selection is replaceable and provenance-visible | AT-INV-043, AT-INV-047 | Block runtime routing only |
| AT-INV-079 | swarm_requirement | `ROADMAP.md`, `RUN_PACKET_MODEL.md`, `ADAPTER_CONTRACT.md` | Swarm role routing creates bounded packets with specs, invariants, files, validations, handoff, and does not canonize subagent output | Swarm packet generator | packet protocol | swarm packet fixture | fixture TBD by DAG-02 | subagent packet surfaces | Generated packets satisfy packet protocol and preserve product truth boundaries | AT-INV-046, AT-INV-074 | Block swarm dispatch only |
| AT-INV-080 | swarm_requirement | `GRAPH_SEMANTICS.md`, `VERIFICATION_SCHEMA.md`, `ROADMAP.md` | Parallel outputs conflict through graph/verification state, not hidden runtime state | Conflict detector | conflict record | parallel conflict fixture | fixture TBD by DAG-02 | merge/review surfaces | Conflicting concurrent outputs require visible conflict state before merge | AT-INV-013, AT-INV-079 | Block merge readiness only |
| AT-INV-081 | swarm_requirement | `RUN_PACKET_MODEL.md`, `EVENT_MODEL.md`, `HPO_STATE_MODEL.md`, `ROADMAP.md` | Merge readiness requires provenance, validation evidence, review handoff, and HPO-visible state before product truth promotion | Merge/review handoff | merge readiness record | merge readiness fixture | fixture TBD by DAG-02 | review/handoff surfaces | Subagent output cannot become durable product truth without acceptance evidence | AT-INV-031, AT-INV-077, AT-INV-080 | Block final swarm completion |

## Matrix Use Rules

Executable classifications are all rows except `positioning_constraint`, `future_goal`, and `non_executable_context`. `positioning_constraint` rows constrain architecture and review. `future_goal` rows remain in the DAG and become executable when dependencies, phase gates, section-level assertions, and validation oracles unlock them. `non_executable_context` rows must not become implementation tasks.

Every future-goal row must include `phase_scope`, `current_contract_testability`, `required_for_pg_f`, and `deferred_until` in the expanded join table. A future node may remain in the DAG, but agents must not invent missing semantics when the product specs do not define executable behavior.
