---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-contract-test-matrix
title: Atelier Contract Test Matrix
status: active
pattern: simple
tags:
  - product:atelier
  - subject:test-matrix
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - check-candidate
    - test-source
---

# Atelier Contract Test Matrix

## 1. Coverage Rule

Every normative claim in `contract.md`, `GRAPH_SEMANTICS.md`, `SURFACES.md`, `ADAPTER_CONTRACT.md`, `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, `HPO_STATE_MODEL.md`, and `EXAMPLES.md` must map to one of:

- a test (abstract name and fixture are specified in this document);
- a fixture-only check (the claim is verified by a fixture, not a runtime test);
- an explicit waiver with a reason, an expiry, and an owner.

A normative claim without a mapping is a coverage gap. Coverage gaps are listed in the Waiver Log (§6) and must be reviewed every contract revision.

This document is abstract. Tests are described by name, purpose, and fixture. Concrete test file paths and harness locations are decided by the implementation owner and are not part of this contract.

### 1a. Fixture Layout

v5.1 adds a concrete fixture layout. The implementation owner creates the actual fixture contents; the test matrix owns the layout and the path conventions.

```txt
fixtures/
  artifact_graph_golden_v1/
  graph_endpoint_matrix_v1/
  completion_truth_table_v1/            (new in v5.1)
  run_lifecycle_state_machine_v1/       (new in v5.1)
  verification_record_v1/
  verification_map_derivation_v1/
  verification_gate_v1/
  adapter_packet_portability_v1/        (new in v5.1; replaces generic_stage0_v1)
  adapter_runtime_parity_v1/            (new in v5.1)
  adapter_semantic_equivalence_v1/
  decision_ref_primary_target_v1/       (new in v5.1)
  run_verify_surface_record_v1/         (new in v5.1)
  durable_acceptance_v1/                (new in v5.1)
  resolution_decision_v1/
  context_budget_v1/
  run_packet_v1/
  write_authority_v1/                    (new in v5.1)
  transform_maturity_v1/
  forced_close_lifecycle_v1/
  accepted_evidence_lifecycle_v1/
  hpo_state_evidence_v1/
  drift_v1/
  surface_inventory_v1/
  coverage_v1/
```

Each fixture directory contains:

- `input.json` or input directory
- `expected.json` or expected output
- `README.md` describing the assertion steps
- `command.sh` or `command.txt` with the validation command

## 2. Tests to Add First

These tests are the priority backlog. They cover the v5 substrate (Phase 0.5) and the v5 MVP (Phase 1).

### 2.1 Artifact Graph Golden Fixture

```yaml
test_name:   artifact_graph_golden_fixture
covers:      GRAPH_SEMANTICS.md §4, §5, §6, §8, §9
fixture:     graph_golden_v1
purpose: |
  Verify that a fixed repository snapshot produces a fixed graph hash.
  The fixture includes:
    - source artifacts of distinct kinds
    - accepted durable evidence
    - derived state under .atelier/
    - a stale node with populated stale_reason
    - an orphan control (control with no source artifact)
    - a moved/supersedes edge
    - a conflict resolved by authority precedence
    - at least one experimental kind node, disconnected from canonical
      required resolution (per GRAPH_SEMANTICS.md §4.5)
assertions:
  - graph_hash equals committed golden hash
  - stale nodes are present with stale_reason populated
  - moved edge links new id to old id
  - authority precedence resolves the conflict in the documented direction
  - strict_graph_validation accepts the fixture
```

### 2.2 Context Plan Read-Only Fixture

```yaml
test_name:   context_plan_readonly_fixture
covers:      contract.md §10
fixture:     context_plan_readonly_v1
purpose: |
  Verify that `atelier context plan` has no side effects on the
  source, task, run, or index state.
assertions:
  - source tree hash is unchanged before and after
  - task directory snapshot is unchanged
  - run directory snapshot is unchanged
  - .atelier/indexes/ may change only if the contract permits
    a documented cache update; otherwise unchanged
  - mutated flag in result is false
  - created_run is false
  - created_task is false
  - emitted JSON field names are snake_case (per SURFACES.md §2.5)
```

### 2.3 `.atelier` Deletion and Regeneration Fixture

```yaml
test_name:   atelier_deletion_regeneration_fixture
covers:      GRAPH_SEMANTICS.md §2, §11
fixture:     atelier_deletion_v1
purpose: |
  Verify that deleting .atelier/ and regenerating the graph from
  source artifacts plus accepted durable evidence produces a graph
  equivalent (semantic, not byte) to the pre-deletion graph.
assertions:
  - pre-deletion graph hash equals post-regeneration graph hash
  - no source artifact is lost
  - no accepted durable evidence is lost (including durable verification
    records, acceptance receipts, and contract revisions)
  - lost items are limited to cache, debug, trace, and index state
```

### 2.4 Verification Gate Completion Fixture

```yaml
test_name:   verification_gate_completion_fixture
covers:      contract.md §16, VERIFICATION_SCHEMA.md §8
fixture:     verification_gate_v1
purpose: |
  Verify that the completion gate evaluates the truth table correctly
  and that lifecycle consequences are emitted faithfully.
assertions:
  - run with all required checks passed and no required skipped|unavail
    completes clean and emits run_completed_clean
  - run with one required check skipped-with-reason (valid decision_ref)
    completes dirty and emits run_completed_dirty
  - run with one required check skipped-with-reason and INVALID decision_ref
    is blocked (the skip is treated as not-run)
  - run with one required check unavailable-with-reason completes dirty
  - run with one required check unavailable-with-reason and
    unavailable_effect=blocked emits run_blocked_terminal
  - run with one required check not-run is blocked
  - run with one missing required verification record is blocked
  - run with one required check in unknown status is blocked
  - run with one required check failed is blocked
  - run with one optional unavailable check emits only an optional warning
  - run with a hard-block from a policy_decision (severity=block, active=true)
    is blocked even if all required checks pass
  - completed_clean emitted while any required check is skipped|unavailable
    is a contract violation
  - completed_dirty emitted while no required check is skipped|unavailable
    and no hard-block is a contract violation
  - blocked run emitting any run_completed_* is a contract violation
  - dirty state is honest: the result message does not claim success
```

### 2.5 Run Packet Reading Order Fixture

```yaml
test_name:   run_packet_reading_order_fixture
covers:      contract.md §12
fixture:     run_packet_v1
purpose: |
  Verify that the LLM-readable run packet order begins with
  handoff.md and does not put manifest.json in the normal order.
assertions:
  - reading order begins with handoff.md
  - manifest.json is not in the first position of the normal order
  - manifest.json is present in the debug/provenance surface only
```

### 2.6 Transform Maturity Transition Fixture

```yaml
test_name:   transform_maturity_transition_fixture
covers:      contract.md §8, §8a
fixture:     transform_maturity_v1
purpose: |
  Verify that maturity transitions follow the allowed transition
  table and that illegal level jumps are rejected.
assertions:
  - Level 0 to Level 1 transition is allowed
  - Level 1 to Level 2 transition is allowed
  - Level 2 to Level 3 transition is allowed with proposal evidence
  - Level 3 to Level 4 transition is allowed with acceptance actor and evidence
  - Level 4 to Level 5 transition is allowed with deterministic output schema
  - Level 5 to Level 6 transition is allowed with enforcement registration
  - Level 0 to Level 6 transition is rejected (level jump)
  - Level 1 to Level 6 transition is rejected
  - rejected transition emits rejected event with reason
  - every Level 3 to Level 4 transition has a valid artifact_accepted event
    with scope, accepted_by, accepted_at
```

### 2.7 Adapter Runtime Parity Fixture

```yaml
test_name:   adapter_runtime_parity_fixture
covers:      ADAPTER_CONTRACT.md §6, §7
fixture:     adapter_runtime_parity_v1
purpose: |
  Verify that two real runtime adapters produce semantically equivalent
  canonical results from the same canonical packet under the
  normalization rules in ADAPTER_CONTRACT.md §7.1. This fixture gates
  the runtime_agnosticism_claim and is distinct from Stage 0 packet
  portability.
assertions:
  - both adapters emit a result with the same task reference
  - both adapters emit the same acceptance_criteria ids (set equal)
  - both adapters emit the same artifact ids (set equal)
  - both adapters emit the same required_check ids (set equal)
  - both adapters emit the same forbidden_behavior ids (set equal)
  - per-check status is in the closed status lattice
    (passed | failed | skipped | unavailable | not-run | unknown)
  - both adapters emit equivalent handoff content (heading_id set equal)
  - both adapters emit equivalent diff_summary (file_path, change_class set equal)
  - both adapters populate the diff field, even if empty
  - the byte difference is permitted; semantic equivalence is asserted
  - the runtime-agnosticism contract claim is gated on this fixture passing
  - a human-shell + noop-reference pair is rejected for this fixture
```

### 2.8 Drift Detection Fixture

```yaml
test_name:   drift_detection_fixture
covers:      contract.md §17
fixture:     drift_v1
purpose: |
  Verify that drift between paired surfaces is detected and
  reported with a risk action.
pairs:
  - README usage          vs  CLI help
  - Markdown knowledge    vs  registered check
  - run handoff           vs  actual diff
  - context plan          vs  stale graph hash
assertions:
  - drift is detected for each pair
  - risk action is emitted (block | warn | info)
  - stale command grep returns no hits in active surfaces
```

### 2.9 Active Surface Inventory Test

```yaml
test_name:   active_surface_inventory_test
covers:      SURFACES.md §9
fixture:     surface_inventory_v1
purpose: |
  Verify that the active surface inventory in SURFACES.md
  matches what CLI help, MCP tool list, GUI label map, README
  usage, and adapter outputs actually expose.
assertions:
  - CLI help exposes exactly the commands in SURFACES.md §2
  - CLI help exposes no command in SURFACES.md §3
  - atelier_run_force_close is in §2.2 and not in §3
  - atelier_run_export is in §2.2 and not in §3
  - MCP tool list exposes exactly the tools in SURFACES.md §4
  - GUI label map points only to canonical surfaces
  - README usage uses only active commands
  - adapter outputs declare their runtime id
  - emitted JSON field names are snake_case (per §2.5)
```

### 2.10 Contract Coverage Test

```yaml
test_name:   contract_coverage_test
covers:      CONTRACT_TEST_MATRIX.md §1
fixture:     coverage_v1
purpose: |
  Verify that every normative `must` in contract.md,
  GRAPH_SEMANTICS.md, SURFACES.md, ADAPTER_CONTRACT.md,
  VERIFICATION_SCHEMA.md, EVENT_MODEL.md, HPO_STATE_MODEL.md,
  and EXAMPLES.md has a mapping to a test, a fixture, or an
  explicit waiver.
assertions:
  - extracted `must` clauses are non-empty
  - each `must` clause has a corresponding entry in §3, §4, or §6
  - waivers in §6 have non-empty reason, expiry, and owner
  - expired waivers are reported as a coverage gap
```

## 2a. Tests Added in v5

The following tests are added by the v5 cut. They cover the new schemas and rules introduced in v5.

### 2a.1 Graph Kind Endpoint Compatibility Fixture

```yaml
test_name:   graph_kind_endpoint_compatibility_fixture
covers:      GRAPH_SEMANTICS.md §4.4, §4.5, §6.3
fixture:     graph_endpoint_matrix_v1
purpose: |
  Verify that every edge in the canonical graph is emitted with a
  source_kind and target_kind allowed by §6.3, and that strict
  graph validation rejects experimental kinds in canonical required
  resolution edges.
assertions:
  - for every canonical edge kind, every allowed source_kind and
    target_kind from §6.3 produces a valid edge
  - for every disallowed (source_kind, target_kind) pair, the edge
    is rejected with a graph_endpoint_compatibility_violation event
  - strict graph validation rejects an experimental kind node when
    it is a source or target of any canonical required resolution edge
  - strict graph validation ignores an experimental subgraph when
    it is disconnected from canonical required resolution
  - the canonical required resolution set is closed:
    {derives_from, implements, references, moved, supersedes,
     enforces, blocks, conflicts_with, verifies, accepts, rejects, owned_by}
  - per GRAPH_SEMANTICS.md §6.3, derives_from.source_kind is closed over
    the concrete canonical kinds
    {transform_receipt, verification_record, review_record, trace,
     product_insight, prompt, run_handoff}; the synthetic `derived` kind
    is rejected
  - `supersedes` (not `superseded`) is the canonical edge label for
    moved/renamed artifacts (per GRAPH_SEMANTICS.md §4.5)
  - the `accepts` edge label and the `artifact_accepted` event share
    a `correlation_id` and are emitted as a pair (per EVENT_MODEL.md §6)
```

### 2a.2 Verification Record Schema Fixture

```yaml
test_name:   verification_record_schema_fixture
covers:      VERIFICATION_SCHEMA.md §2, §3, §4, §5, §6
fixture:     verification_record_v1
purpose: |
  Verify that a verification record conforms to the schema and that
  the controlled reason code lists and decision_ref validation rule
  are enforced.
assertions:
  - a record with status=passed has at least one evidence_artifact_refs entry
  - a record with status=skipped has skip_reason_code from the §6.1 list
  - a record with status=unavailable has unavailable_reason_code from the §6.2 list
  - a record with skip_reason_code=deferred_by_accepted_decision has a
    valid decision_ref per §6.3
  - a record with skip_reason_code=deferred_by_accepted_decision and an
    invalid decision_ref is treated as not-run for the gate
  - a record with status outside the closed lattice is rejected
  - required_verification_map derivation per §3 includes task
    acceptance criteria and check registry bindings
  - the policy registry term contributes zero entries in v5.1
  - the verification record durable_path is outside .atelier/
```

### 2a.3 Required Verification Map Derivation Fixture

```yaml
test_name:   required_verification_map_derivation_fixture
covers:      VERIFICATION_SCHEMA.md §3
fixture:     verification_map_derivation_v1
purpose: |
  Verify that the required verification map of a task is derived from
  task acceptance criteria and check registry bindings, and is not
  invented by the context planner. The policy registry term contributes
  zero entries in v5.1 until a policy schema exists.
assertions:
  - map = task_acceptance_criteria union check_registry.bindings
  - policy registry contribution is the empty set in v5.1
  - map is filtered by applicable_paths intersects task.path_scope
  - map is filtered by applicable_roles intersects task.role
  - map is filtered by check.status == active
  - map is closed at task creation time
  - extending the map after task creation emits
    verification_map_extended event
```

### 2a.4 Accepted Evidence Lifecycle Fixture

```yaml
test_name:   accepted_evidence_lifecycle_fixture
covers:      EVENT_MODEL.md §5, §6, §9; VERIFICATION_SCHEMA.md §9
fixture:     accepted_evidence_lifecycle_v1
purpose: |
  Verify that an artifact_accepted event promotes a candidate to
  durable evidence, that the receipt is placed outside .atelier/,
  and that the receipt survives .atelier/ deletion.
assertions:
  - artifact_accepted event has accepted_by, accepted_at, scope
  - artifact_accepted event has evidence_refs
  - receipt is written to durable_location outside .atelier/
  - the accepts edge and the artifact_accepted event share a
    correlation_id
  - the receipt survives .atelier/ deletion
  - a verification_recorded event paired with a durable verification
    record shares a correlation_id with the artifact_accepted event
  - run_completed_clean and run_completed_dirty and run_forced_closed
    events are durable
```

### 2a.5 Adapter Semantic Equivalence Fixture

```yaml
test_name:   adapter_semantic_equivalence_fixture
covers:      ADAPTER_CONTRACT.md §7.1
fixture:     adapter_semantic_equivalence_v1
purpose: |
  Verify that the semantic equivalence normalization oracle is
  applied identically across adapter pairs.
assertions:
  - identity equivalence: task id, acceptance_criteria ids,
    artifact ids, required_check ids, forbidden_behavior ids
    all match as sets
  - status lattice equivalence: per-check status maps to a value
    in the closed status lattice
  - handoff equivalence: handoff content normalized by heading_id
    is equivalent (set equal)
  - diff summary equivalence: (file_path, change_class) pairs
    are equivalent (set equal)
  - byte differences in runtime_packet and runtime_result are
    permitted when normalized result is equivalent
  - the fixture supplies the shared semantic equivalence oracle used by
    both adapter proof fixtures
```

### 2a.6 Resolution Decision Record Fixture

```yaml
test_name:   resolution_decision_record_fixture
covers:      contract.md §10a
fixture:     resolution_decision_v1
purpose: |
  Verify that a resolution decision record conforms to the schema
  and that the resolution_type field is used correctly.
assertions:
  - every resolution decision has resolver_identity
  - resolution_type is one of: deterministic | semantic | hybrid
  - resolution_type=deterministic records document a closed rule
  - resolution_type=semantic records document a non-deterministic
    or model-assisted judgment
  - resolution_type=hybrid records document a deterministic narrowing
    followed by a model-assisted selection
  - a context plan includes every resolution decision it used
  - budget_delta is reported in the units defined in contract.md §10
```

### 2a.7 Context Budget Traversal Guard Fixture

```yaml
test_name:   context_budget_traversal_guard_fixture
covers:      contract.md §10
fixture:     context_budget_v1
purpose: |
  Verify that the context budget is reported in the units defined
  in contract.md §10 and that the policy is enforced.
assertions:
  - artifact_slot_count is reported as an integer
  - estimated_tokens_full and estimated_tokens_summary are reported
    as integers
  - budget_limit is reported
  - budget_policy is one of: hard | soft | advisory
  - budget_policy=hard with exceeded limit produces a plan-time error
  - budget_policy=soft or advisory with exceeded limit reports the
    delta explicitly
  - budget fields are present in context plan JSON output
    (per SURFACES.md §2.5)
```

### 2a.8 Forced Close Lifecycle Fixture

```yaml
test_name:   forced_close_lifecycle_fixture
covers:      contract.md §12.1, §12.2, §16.2
fixture:     forced_close_lifecycle_v1
purpose: |
  Verify that a run_forced_closed event is emitted only for a run
  in run_blocked_terminal state, that the run is not eligible for any
  run_completed_* event after force-close, and that the prior
  terminal blocked state is recorded in the event payload.
assertions:
  - run_forced_closed is emitted only when prior_state is run_blocked_terminal
  - run_forced_closed payload contains run_id, reason, forced_by,
    forced_at, prior_state=run_blocked_terminal
  - calling force-close on a non-blocked run returns
    ATELIER-INVARIANT-VIOLATION
  - calling complete on a blocked run returns ATELIER-INVARIANT-VIOLATION
  - after force-close, no run_completed_* event is emitted
  - the HPO state forced_closed is presented honestly (not as success)
```

### 2a.9 HPO State Evidence Table Fixture

```yaml
test_name:   hpo_state_evidence_table_fixture
covers:      HPO_STATE_MODEL.md §2, §3, §4, §5
fixture:     hpo_state_evidence_v1
purpose: |
  Verify that each HPO state carries its required evidence, that
  the forbidden claims are not asserted, and that the allowed
  human actions are present.
assertions:
  - for every HPO state, the required evidence set is present
  - the verified state does not coexist with unverified, dirty,
    blocked, or forced_closed unless evidence justifies it
  - the dirty state UI does not assert "the work is done" or
    "verification passed"
  - the blocked state UI does not assert any success claim
  - the forced_closed state UI does not assert any success claim
  - human actions not in the allowed set for the current state
    are not exposed
```

## 2b. Tests Added in v5.1

The following tests are added by the v5.1 repair. They close the v5.1 review findings P0 #1-#4 and P1 #5-#13.

### 2b.1 Completion Truth Table Fixture

```yaml
test_name:   completion_truth_table_fixture
covers:      VERIFICATION_SCHEMA.md §8, contract.md §16, §16.1
fixture:     completion_truth_table_v1
purpose: |
  Verify that the completion gate evaluates the truth table with
  the explicit boolean columns defined in VERIFICATION_SCHEMA.md §8
  and that the lifecycle consequences match exactly.
columns_under_test:
  - all_required_passed
  - all_required_resolved
  - any_required_skipped_or_unavailable
  - required_unavailable_blocking
  - hard_block
  - prior_state
  - user_force_close
assertions:
  - the impossible row
    (all_required_passed=true AND any_required_skipped_or_unavailable=true)
    is rejected by the gate and does not produce a run_completed_*
  - the valid rows produce exactly the documented consequence:
    row 1 -> run_completed_clean
    row 2 -> run_completed_dirty (terminal_non_success_reviewable)
    row 3 -> run_blocked_terminal (required unavailable blocking)
    row 4 -> run_blocked_terminal (other hard block)
    row 5 -> run_forced_closed (prior_state=run_blocked_terminal only)
  - required unavailable with default unavailable_effect=dirty routes to
    run_completed_dirty when all other required checks pass
  - required unavailable with unavailable_effect=blocked routes to
    run_blocked_terminal
  - missing required verification records route to run_blocked_terminal
  - failed required verification records route to run_blocked_terminal
  - optional unavailable records do not dirty or block the required gate
  - run_completed_clean emitted while any_required_skipped_or_unavailable
    is true is a contract violation
  - run_completed_dirty emitted while no required check is
    skipped|unavailable and no hard-block is a contract violation
  - run_completed_dirty is presented honestly as not-success:
    no UI claim asserts "verification passed" or "the work is done"
  - user_force_close=true requires prior_state=run_blocked_terminal
```

### 2b.2 Run Lifecycle State Machine Fixture

```yaml
test_name:   run_lifecycle_state_machine_fixture
covers:      contract.md §12.1, §12.2, §16.2; HPO_STATE_MODEL.md §2, §5, §6
fixture:     run_lifecycle_state_machine_v1
purpose: |
  Verify the run lifecycle state machine and the split between
  blocked_waiting and run_blocked_terminal.
states_under_test:
  - unverified
  - resumed
  - blocked_waiting
  - run_blocked_terminal
  - forced_closed
  - completed_clean
  - completed_dirty
assertions:
  - the state machine has the transitions listed in contract.md §12.1
  - blocked_waiting is a non-terminal blocked state; force-close from
    blocked_waiting is forbidden and returns ATELIER-INVARIANT-VIOLATION
  - run_blocked_terminal is the only state from which force-close is
    permitted; force-close from any other state is rejected
  - the events in EVENT_MODEL.md §3 include run_blocked_waiting and
    run_blocked_terminal; the legacy `run_blocked` name is reserved
    for migration only
  - the prior_state field of run_forced_closed is run_blocked_terminal
    (not `blocked`)
  - the HPO allowed-actions split per HPO_STATE_MODEL.md §5:
    blocked_waiting allows inspect, retry, mark-as-blocked_terminal;
    blocked_terminal allows inspect, force-close
  - the "blocks" edge variant `blocks_terminal` is NOT defined in v5.1
    and is rejected if asserted
```

### 2b.3 Adapter Packet Portability Fixture

```yaml
test_name:   adapter_packet_portability_fixture
covers:      ADAPTER_CONTRACT.md §7.2 (Stage 0)
fixture:     adapter_packet_portability_v1
purpose: |
  Verify that the human-shell adapter and the noop-reference adapter
  produce semantically equivalent canonical packets from the same
  canonical run state. This fixture gates the
  packet_portability_claim contract claim and is the only Stage 0
  proof.
adapter_pair:
  - human-shell
  - noop-reference
assertions:
  - both adapters emit a packet with the same task reference
  - both adapters emit the same acceptance_criteria ids (set equal)
  - both adapters emit the same artifact ids (set equal)
  - both adapters emit the same required_check ids (set equal)
  - both adapters emit the same forbidden_behavior ids (set equal)
  - per-check status is in the closed status lattice
  - byte differences in the wire format are permitted when
    normalized result is equivalent
  - the noop-reference is a schema fixture, not a second runtime;
    passing this fixture does not establish runtime_agnosticism_claim
  - the packet_portability_claim is asserted by this fixture and
    only by this fixture
```

### 2b.4 Adapter Runtime Parity Fixture

The canonical `adapter_runtime_parity_fixture` definition is §2.7. v5.1 renames the legacy adapter parity slot to the Stage 1 real-runtime fixture so there is only one runtime agnosticism gate.

### 2b.5 Decision Ref Primary Target Fixture

```yaml
test_name:   decision_ref_primary_target_fixture
covers:      VERIFICATION_SCHEMA.md §6.3, EXAMPLES.md Example 6
fixture:     decision_ref_primary_target_v1
purpose: |
  Verify that the decision_ref primary target is a decision_record
  artifact (per VERIFICATION_SCHEMA.md §6.3), and that transform
  receipts that inform a decision appear in evidence_artifact_refs
  but not as decision_ref.
assertions:
  - a verification record with skip_reason_code=
    deferred_by_accepted_decision has decision_ref pointing to a
    decision_record artifact, not a transform_receipt
  - a decision_record artifact with the referenced decision_id exists
  - the transform receipts that informed the decision are listed in
    evidence_artifact_refs of the same record
  - a verification record with decision_ref pointing to a
    transform_receipt is rejected
  - the EXAMPLES.md Example 6 Step 3 scenario: the run packet
    references decision.0002.policy-acceptance as decision_ref;
    transform.receipt.0002 is in evidence_artifact_refs only
```

### 2b.6 Run Verify Surface Record Fixture

```yaml
test_name:   run_verify_surface_record_fixture
covers:      SURFACES.md §2.2, §2.5; VERIFICATION_SCHEMA.md §4
fixture:     run_verify_surface_record_v1
purpose: |
  Verify that the v5.1 atelier run verify <run-id>
  --record --from <verification-record.json> --json surface accepts
  a complete record, validates it against the closed schema, and
  emits the paired verification_recorded + artifact_accepted events.
assertions:
  - the CLI reads <verification-record.json> as a single record
    input (no per-field flag bundle)
  - the CLI rejects records with status outside the closed lattice
  - the CLI rejects records with status=passed and empty
    evidence_artifact_refs
  - the CLI rejects records with status=skipped and missing or
    invalid skip_reason_code
  - the CLI rejects records with status=unavailable and missing
    or invalid unavailable_reason_code
  - the CLI rejects records with skip_reason_code=
    deferred_by_accepted_decision and missing or invalid decision_ref
  - the CLI rejects records with durable_path under .atelier/
  - the CLI emits verification_recorded followed by artifact_accepted
    with the same correlation_id on success
  - the JSON output schema in SURFACES.md §2.5 includes
    command_invocation, tool_version, recorded_by, source_hashes,
    notes
```

### 2b.7 Durable Acceptance Fixture

```yaml
test_name:   durable_acceptance_fixture
covers:      VERIFICATION_SCHEMA.md §9, EVENT_MODEL.md §5, §6
fixture:     durable_acceptance_v1
purpose: |
  Verify that promotion to durable evidence requires BOTH a
  durable_path commit AND a matching artifact_accepted event with
  the same correlation_id. Either alone is insufficient.
assertions:
  - a candidate with a durable_path commit but no artifact_accepted
    event is NOT durable evidence
  - a candidate with an artifact_accepted event but no durable_path
    commit is NOT durable evidence
  - a candidate with BOTH a durable_path commit and a matching
    artifact_accepted event (same correlation_id) IS durable evidence
  - the receipt is written to a durable_location outside .atelier/
  - the receipt survives .atelier/ deletion
  - a verification_recorded event paired with a durable verification
    record shares a correlation_id with the artifact_accepted event
  - the `accepts` graph edge and the `artifact_accepted` event share
    a correlation_id (per EVENT_MODEL.md §6)
```
## 3. Currently Testable Claims

These claims are testable today. Each must have a corresponding entry in the test source tree. The test names below are abstract; the implementation owner assigns concrete paths.

| Claim                                                                                          | Test shape                                            |
|------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| `atelier context plan` is read-only                                                            | `context_plan_readonly_fixture`                       |
| `atelier context plan` does not create tasks or runs                                           | `context_plan_readonly_fixture`                       |
| The context plan JSON uses snake_case field names                                             | `context_plan_readonly_fixture`                       |
| The context plan reports budget in the units defined in contract.md §10                       | `context_budget_traversal_guard_fixture`              |
| Removed commands are not advertised in active surfaces                                         | `active_surface_inventory_test`, `stale_command_grep` |
| Task closure does not emit run completion                                                     | `task_run_boundary_event_test`                        |
| Run creation emits `run_created`, not `run_started`                                            | `run_lifecycle_event_test`                            |
| Resume reading order begins with `handoff.md` and excludes `manifest.json` from the first slot | `run_packet_reading_order_fixture`                    |
| `.atelier` is derived state and can be deleted without losing product truth                     | `atelier_deletion_regeneration_fixture`               |
| Verification statuses distinguish passed/failed/skipped/unavailable/not-run/unknown            | `verification_status_schema_test`                     |
| Verification records conform to the schema in VERIFICATION_SCHEMA.md §4                       | `verification_record_schema_fixture`                  |
| Skip and unavailable reason codes are from the controlled lists                                | `verification_record_schema_fixture`                  |
| `deferred_by_accepted_decision` requires a valid `decision_ref`                               | `verification_record_schema_fixture`                  |
| The completion truth table produces the correct lifecycle consequence                           | `verification_gate_completion_fixture`                |
| `run_forced_closed` is emitted only for `run_blocked_terminal` runs                            | `forced_close_lifecycle_fixture`                      |
| A blocked run cannot emit any `run_completed_*` event                                         | `forced_close_lifecycle_fixture`, `verification_gate_completion_fixture` |
| Transform candidates are not silently accepted as deterministic artifacts                      | `transform_maturity_transition_fixture`               |
| Transform proposals produce an `artifact_accepted` event at Level 3 -> 4                       | `accepted_evidence_lifecycle_fixture`                 |
| Accepted evidence survives `.atelier/` deletion                                                | `accepted_evidence_lifecycle_fixture`                 |
| Interface parity across CLI, MCP, GUI, README, adapter outputs                                 | `active_surface_inventory_test`                       |
| Every canonical edge has a source_kind and target_kind allowed by §6.3                        | `graph_kind_endpoint_compatibility_fixture`           |
| Strict graph validation rejects experimental kinds in canonical required resolution            | `graph_kind_endpoint_compatibility_fixture`           |
| Runtime parity proves semantic equivalence across at least two real runtime adapters           | `adapter_runtime_parity_fixture`                      |
| Adapter semantic equivalence normalization is applied identically across adapter pairs         | `adapter_semantic_equivalence_fixture`                |
| Resolution decision records carry resolver_identity and resolution_type                       | `resolution_decision_record_fixture`                  |
| HPO states carry their required evidence and respect forbidden claims                         | `hpo_state_evidence_table_fixture`                    |
| `completed_dirty` is presented honestly as not-success (not terminal success)                  | `completion_truth_table_fixture`, `hpo_state_evidence_table_fixture` |
| The completion gate rejects the impossible row (all-passed AND any-required-skipped\|unavail)  | `completion_truth_table_fixture`                      |
| `run_blocked_waiting` cannot be force-closed; only `run_blocked_terminal` permits force-close  | `run_lifecycle_state_machine_fixture`                 |
| `derives_from.source_kind` is closed over concrete canonical kinds (rejects `derived`)         | `graph_kind_endpoint_compatibility_fixture`           |
| `packet_portability_claim` is gated on `adapter_packet_portability_fixture`                    | `adapter_packet_portability_fixture`                  |
| `runtime_agnosticism_claim` is gated on `adapter_runtime_parity_fixture`                       | `adapter_runtime_parity_fixture`                     |
| `decision_ref` primary target is a `decision_record`, not a `transform_receipt`                 | `decision_ref_primary_target_fixture`                 |
| `atelier run verify --record --from <verification-record.json>` is the canonical surface        | `run_verify_surface_record_fixture`                   |
| Promotion to durable evidence requires both `durable_path` commit AND `artifact_accepted` event | `durable_acceptance_fixture`                          |

## 4. Claims Not Yet Testable Enough

These claims are in the spec pack but lack a complete test shape. Each is tagged with its blocker and a test that addresses it.

| Claim                                          | Blocker                                            | Test shape                                  |
|------------------------------------------------|----------------------------------------------------|---------------------------------------------|
| Privacy boundary for traces and prompts        | Full classification and redaction policy deferred  | `privacy_redaction_boundary_fixture` (deferred to a later revision) |
| Per-kind stale thresholds                      | Thresholds not yet defined                         | `stale_threshold_fixture` (deferred)        |
| Write authority matrix                         | Fixture implementation deferred                     | `write_authority_matrix_fixture`            |
| Full policy decision schema                    | `POLICY_SCHEMA.md` deferred; minimum stub in `contract.md` §5.5 | partial coverage via `verification_gate_completion_fixture` (policy hard-block) |
| HPO full GUI end-to-end                        | GUI not yet specified                              | `hpo_state_evidence_table_fixture` (state semantics only; UI deferred to Phase 4) |
| Swarm coordination preserves runtime agnosticism | Out of scope for v5 contract tests                | waived; see §6                              |

## 5. Test Authoring Rules

When implementing a test listed in this document:

- Use the abstract test name as the test's canonical identifier.
- Treat the fixture description as a minimum; concrete fixtures may add cases.
- A passing test must be reproducible from the committed fixture alone.
- A test that requires network access, real LLM calls, or external state is out of scope for the contract test matrix. Such tests belong in a separate integration layer.

## 6. Waiver Log

A waiver excuses a normative claim from mapping to a test, with a reason, an expiry, and an owner. Waivers are reviewed at every contract revision. Expired waivers are reported as a coverage gap by `contract_coverage_test`.

Template:

```yaml
waiver:
  claim:     <the normative claim, quoted>
  reason:    <why it is not yet testable>
  expiry:    <RFC 3339 date or contract version>
  owner:     <role or actor id>
```

Initial waiver list:

```yaml
- waiver:
    claim:     "Swarm Coordination Plane preserves runtime agnosticism"
    reason:    "Swarm plane is out of scope for v5 contract tests; deferred to Phase 5"
    expiry:    "next contract revision after Phase 5 swarm delivery"
    owner:     role.core.implementer

- waiver:
    claim:     "HPO UI does not imply unverified verification"
    reason:    "HPO UI is out of scope for v5 contract tests; state semantics are tested via hpo_state_evidence_table_fixture; UI deferred to Phase 4"
    expiry:    "next contract revision after Phase 4 UI delivery"
    owner:     role.product.designer

- waiver:
    claim:     "Privacy boundary for sensitive material is fully classified and redacted"
    reason:    "Privacy classification labels and redaction policies are deferred to PRIVACY_MODEL.md in a later revision. v5 ships the boundary pointer and the redaction state machine only"
    expiry:    "next contract revision after PRIVACY_MODEL.md is added"
    owner:     role.core.implementer

- waiver:
    claim:     "Per-kind stale thresholds are defined"
    reason:    "Age-based stale detection is disabled by default in v5; per-kind thresholds deferred to a later revision"
    expiry:    "next contract revision after stale threshold review"
    owner:     role.core.implementer

- waiver:
    claim:     "Write authority matrix is enforced by executable fixture"
    reason:    "WRITE_AUTHORITY_MATRIX.md is defined in v5.1; concrete fixture implementation is deferred"
    expiry:    "next contract revision after write authority fixture implementation"
    owner:     role.core.implementer

- waiver:
    claim:     "Every GUI label is testable end-to-end"
    reason:    "GUI not yet specified; label map not yet committed"
    expiry:    "next contract revision after first GUI label map commit"
    owner:     role.product.designer
```

## 7. Linkage

- Normative claims are extracted from `contract.md`, `GRAPH_SEMANTICS.md`, `SURFACES.md`, `ADAPTER_CONTRACT.md`, `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, `HPO_STATE_MODEL.md`, and `EXAMPLES.md`.
- Test implementations live outside this document. The test source location is decided by the implementation owner.
- Coverage gaps are surfaced in the Waiver Log (§6) and reviewed at every contract revision.

## v5 Revision Notes

- Added §2a "Tests Added in v5" with nine new fixtures: `graph_kind_endpoint_compatibility_fixture`, `verification_record_schema_fixture`, `required_verification_map_derivation_fixture`, `accepted_evidence_lifecycle_fixture`, `adapter_semantic_equivalence_fixture`, `resolution_decision_record_fixture`, `context_budget_traversal_guard_fixture`, `forced_close_lifecycle_fixture`, `hpo_state_evidence_table_fixture`.
- Updated §2.4 verification gate completion fixture to cover: invalid `decision_ref` treated as not-run; policy-driven hard-block; the "completed_clean with skipped" boundary violation; the "completed_dirty without skipped" boundary violation; the dirty-honesty rule.
- Updated §2.7 adapter parity fixture to assert the §7.1 normalization oracle (set-equal ids, status lattice, handoff by heading_id, diff by file_path/change_class).
- Updated §2.9 active surface inventory test to assert `atelier_run_force_close` and `atelier_run_export` are in §2.2 and not in §3, and that emitted JSON field names are snake_case.
- Updated §3 "Currently Testable Claims" with the new v5 claims and their test shapes.
- Updated §4 "Claims Not Yet Testable Enough" to mark v5-deferred items and link them to their test shapes when one exists.
- Updated §6 "Waiver Log" to add v5 waivers for items deferred to a later revision (privacy classification, stale thresholds, write authority, full policy schema, swarm coordination, HPO UI end-to-end).
- Updated §1 "Coverage Rule" to include the new schema subcontracts (`VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, `HPO_STATE_MODEL.md`) and `EXAMPLES.md` in the list of normative documents that must map to tests.

## v5.1 Revision Notes

- §1a "Fixture Layout" added. Defines the concrete `fixtures/` directory layout that the implementation owner creates. Each fixture directory has the same four-file convention (`input`, `expected`, `README`, `command`).
- §2a.1 `graph_kind_endpoint_compatibility_fixture` updated: new assertions reject `derived` as `derives_from.source_kind`; assert `supersedes` (not `superseded`) as the canonical edge label; assert the `accepts` edge and `artifact_accepted` event share a `correlation_id`.
- §2b "Tests Added in v5.1" added with seven new fixtures closing the v5.1 review findings:
  - `completion_truth_table_fixture` (P0 #1)
  - `run_lifecycle_state_machine_fixture` (P0 #2)
  - `adapter_packet_portability_fixture` (P1 #5)
  - `adapter_runtime_parity_fixture` (P1 #5)
  - `decision_ref_primary_target_fixture` (P1 #6)
  - `run_verify_surface_record_fixture` (P1 #10)
  - `durable_acceptance_fixture` (P1 #8)
- §3 "Currently Testable Claims" extended with 10 new v5.1 rows mapping the v5.1 review findings to test shapes.
- Layout: the `adapter_packet_portability_v1` fixture replaces the legacy `generic_stage0_v1` name; the §2.7 v5 fixture `adapter_parity_v1` was renamed `adapter_runtime_parity_v1` in the layout to avoid confusion with the new `adapter_packet_portability_v1` and to disambiguate the two proof levels (`packet_portability_claim` vs `runtime_agnosticism_claim`).
- Validation: V1-V13 checks listed in the run's validation plan verify (a) v5.1 state names appear in the edited docs, (b) the truth table impossible row is rejected, (c) the v5.1 fixture list contains seven new entries, (d) the two-tier proof distinction is present in `ADAPTER_CONTRACT.md` §7.2 and `ROADMAP.md` Phase 1B.
