---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-examples
title: Atelier Examples
status: active
pattern: simple
tags:
  - product:atelier
  - subject:examples
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - check-candidate
    - test-source
---

# Atelier Examples

## Purpose

This document provides six concrete, end-to-end flows that ground the abstract spec in observable behavior. Each example is a golden flow. The flows are referenced by the test fixtures in `CONTRACT_TEST_MATRIX.md` and by the implementation work in `ROADMAP.md`.

The flows are not exhaustive. They are the minimum set required to make the spec testable without further negotiation.

```txt
Example 1: Context plan and resolution decisions
Example 2: Verification and completion states
Example 3: Markdown-to-Check transformation proposal
Example 4: Adapter packet portability
Example 5: Forced close of blocked run
Example 6: Accepted evidence lifecycle
```

## Example 1: Context Plan and Resolution Decisions

### Setup

A repository has the following relevant artifacts.

```txt
harness/knowledge/product-specs/atelier/Ideal.md
harness/knowledge/product-specs/atelier/contract.md
harness/knowledge/product-specs/atelier/GRAPH_SEMANTICS.md
harness/knowledge/product-specs/atelier/VERIFICATION_SCHEMA.md
harness/knowledge/product-specs/atelier/EVENT_MODEL.md
harness/tasks/0007-graph-kernel.md
harness/controls/contract-test-matrix.md
harness/controls/atelier-spec-coverage.md
```

A new task arrives:

```yaml
id:          task.0008
title:       "Implement artifact identity scheme in atelier graph kernel"
role:        role.core.implementer
phase:       implementation
path_scope:  harness/knowledge/product-specs/atelier/
intent:      "Add the Primary/Secondary/Location/Ephemeral identity model to GRAPH_SEMANTICS.md"
```

### Step 1: Selector Resolution

The Attention Plane resolves deterministic selectors first.

```txt
Required by phase "implementation":
  - contract.md
  - spec documents for the product being implemented

Required by path_scope "harness/knowledge/product-specs/atelier/":
  - Ideal.md
  - contract.md
  - GRAPH_SEMANTICS.md
  - SURFACES.md
  - ADAPTER_CONTRACT.md
  - VERIFICATION_SCHEMA.md
  - EVENT_MODEL.md
  - HPO_STATE_MODEL.md
  - CONTRACT_TEST_MATRIX.md
  - ROADMAP.md

Required by role "role.core.implementer":
  - harness/controls/*
  - harness/tasks/active/*
```

### Step 2: Resolution Decisions

A resolution decision is recorded for each non-deterministic or model-assisted selection. Two are needed here.

```yaml
- decision:
    id:                  rdr.0008.001
    input_signals:
      - task.intent mentions "identity model"
      - task.path_scope includes the GRAPH_SEMANTICS document
    candidates:
      - id:    GRAPH_SEMANTICS.md
        score: high
      - id:    contract.md
        score: medium
      - id:    README.md
        score: low
    decision_reason: |
      The task intent directly targets the identity model. The GRAPH_SEMANTICS
      document is the canonical home for identity; the contract document
      refers to it. The README is a navigation document and is excluded
      from the full-read set.
    resolution_type:   deterministic
    resolver_identity: atelier.selector.path-match@1.4.2
    rejected:          [README.md]
    budget_delta:
      artifact_slot_count: 1
      estimated_tokens_full: 2400
      estimated_tokens_summary: 0
```

```yaml
- decision:
    id:                  rdr.0008.002
    input_signals:
      - task.path_scope is the atelier product spec pack
      - the implementer role requires control coverage to avoid drift
    candidates:
      - id:    harness/controls/contract-test-matrix.md
        score: high
      - id:    harness/controls/atelier-spec-coverage.md
        score: medium
    decision_reason: |
      The contract test matrix is the most relevant control because the
      task modifies the document the matrix maps from. The spec coverage
      control is included as a summary reference.
    resolution_type:   hybrid
    resolver_identity: atelier.selector.role-and-path@1.4.2
    rejected:          []
    budget_delta:
      artifact_slot_count: 1
      estimated_tokens_full: 0
      estimated_tokens_summary: 800
```

Note the use of `resolution_type=hybrid` in the second decision: a deterministic role-and-path rule narrowed the candidate set, then a model-assisted judgment ranked them.

### Step 3: Exclusions

```yaml
- exclusion:
    artifact:  POSITIONING.md
    reason:    "Strategic positioning is not relevant to an implementation task"
- exclusion:
    artifact:  harness/tasks/0001-product-spec-canonicalization.md
    reason:    "Closed task; superseded by 0007-graph-kernel"
```

### Step 4: Reading Order and Injection Mode

```yaml
plan:
  id:        plan.0008
  task:      task.0008
  reading_order:
    - artifact:  contract.md
      mode:      full
    - artifact:  GRAPH_SEMANTICS.md
      mode:      full
    - artifact:  VERIFICATION_SCHEMA.md
      mode:      full
    - artifact:  EVENT_MODEL.md
      mode:      full
    - artifact:  CONTRACT_TEST_MATRIX.md
      mode:      full
    - artifact:  SURFACES.md
      mode:      reference
    - artifact:  ADAPTER_CONTRACT.md
      mode:      reference
    - artifact:  HPO_STATE_MODEL.md
      mode:      reference
    - artifact:  ROADMAP.md
      mode:      summary
    - artifact:  harness/controls/contract-test-matrix.md
      mode:      full
    - artifact:  harness/controls/atelier-spec-coverage.md
      mode:      summary
  injections:
    full:       6
    summary:    2
    reference:  3
  context_budget:
    artifact_slot_count:        11
    estimated_tokens_full:      14800
    estimated_tokens_summary:   1200
    budget_limit:               24000
    budget_policy:              soft
  resolution_decisions:        [rdr.0008.001, rdr.0008.002]
  exclusions:                   [POSITIONING.md, harness/tasks/0001-product-spec-canonicalization.md]
  freshness:
    graph_hash:                 "sha256:abc123..."
    contract.md hash:           "abc123..."
    grph_semantics_md hash:     "def456..."
    stale:                      false
  next_actions:
    - "read contract.md, then GRAPH_SEMANTICS.md, then VERIFICATION_SCHEMA.md"
    - "draft the identity model section"
    - "update the kernel golden fixture reference"
```

### Step 5: Required Verification Map (Co-Emitted)

The context plan co-emits a required verification map per `VERIFICATION_SCHEMA.md` §3. In v5.1 the map is the closure of acceptance criteria and registry bindings for the task's path scope and role. The policy registry term is a Phase C placeholder and contributes zero entries until a policy schema exists.

```yaml
required_verification_map:
  - check_id:   chk.identity.primary-present
    required:   true
    blocking:   true
    source:     task_acceptance_criteria
  - check_id:   chk.identity.secondary-present
    required:   true
    blocking:   true
    source:     task_acceptance_criteria
  - check_id:   chk.identity.location-decoupled
    required:   true
    blocking:   true
    source:     check_registry.binding(task=implementation, path=GRAPH_SEMANTICS.md)
  - check_id:   chk.identity.ephemeral-documented
    required:   false
    blocking:   false
    source:     check_registry.binding(task=implementation, path=GRAPH_SEMANTICS.md)
```

### Step 6: Effect Check

```yaml
effects:
  mutated:         false
  created_run:     false
  created_task:    false
  source_writes:   none
  index_writes:    none
```

Field names are `snake_case` per `contract.md` §10. The effects are the read-only contract that `context_plan_readonly_fixture` verifies.

This example passes:
- `context_plan_readonly_fixture` (CONTRACT_TEST_MATRIX.md §2.2)
- `context_budget_traversal_guard_fixture` (CONTRACT_TEST_MATRIX.md §2)
- `resolution_decision_record_fixture` (CONTRACT_TEST_MATRIX.md §2)

## Example 2: Verification and Completion States

This example is a golden fixture for the completion truth table in `VERIFICATION_SCHEMA.md` §8. Each scenario lists the minimum records and the expected lifecycle consequence.

### Setup

A run has been created.

```yaml
run:
  id:            run.0008.r1
  task:          task.0008
  packet_id:     pkt.0008.r1
  runtime:       codex
  required_verification_map:
    - check_id:  chk.identity.primary
      required:  true
      blocking:  true
      unavailable_effect: dirty
    - check_id:  chk.identity.secondary
      required:  true
      blocking:  true
      unavailable_effect: blocked
    - check_id:  chk.identity.location
      required:  true
      blocking:  true
      unavailable_effect: dirty
  optional:
    - check_id:  chk.identity.ephemeral
      required:  false
      blocking:  false
      unavailable_effect: dirty
```

### Scenario A: Clean Completion (All Required Passed)

Fixture id: `example_2_clean_completion`.

All required checks pass. The optional check is unavailable, which is reported as a warning and does not dirty the required verification state.

```yaml
records:
  required:
    chk.identity.primary:   { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location:  { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
  optional:
    chk.identity.ephemeral:
      status: unavailable
      unavailable_reason_code: tool_not_installed
```

Completion evaluation:

```yaml
gate:
  all_required_passed:                     true
  all_required_resolved:                   true
  any_required_skipped_or_unavailable:     false
  required_unavailable_blocking:           false
  hard_block:                              false
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             completed_clean
  event:                                   run_completed_clean
  emitted_at:                              "2026-06-04T12:05:00Z"
  hard_block_source:                       null
```

### Scenario B: Required Unavailable Defaults to Dirty

Fixture id: `example_2_required_unavailable_default_dirty`.

`chk.identity.location` is required and unavailable, but its declaration uses the default `unavailable_effect=dirty`.

```yaml
records:
  required:
    chk.identity.primary:   { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location:
      status: unavailable
      unavailable_reason_code: runner_unavailable
gate:
  all_required_passed:                     false
  all_required_resolved:                   true
  any_required_skipped_or_unavailable:     true
  required_unavailable_blocking:           false
  hard_block:                              false
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             completed_dirty
  event:                                   run_completed_dirty
```

### Scenario C: Required Unavailable Blocking

Fixture id: `example_2_required_unavailable_blocking`.

`chk.identity.secondary` is required and unavailable. Its declaration explicitly sets `unavailable_effect=blocked`, so the run becomes terminal blocked.

```yaml
records:
  required:
    chk.identity.primary:  { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary:
      status: unavailable
      unavailable_reason_code: environment_unavailable
gate:
  all_required_passed:                     false
  all_required_resolved:                   true
  any_required_skipped_or_unavailable:     true
  required_unavailable_blocking:           true
  hard_block:                              true
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             run_blocked_terminal
  event:                                   run_blocked_terminal
  hard_block_source:                       required_unavailable_blocking:chk.identity.secondary
```

No `run_completed_*` event is emitted. The run is terminal at `run_blocked_terminal`. The HPO state projection is `blocked_terminal`, not `run_blocked_terminal`.

### Scenario D: Required Missing

Fixture id: `example_2_required_missing`.

`chk.identity.location` has no verification record. Missing required evidence is a hard block.

```yaml
records:
  required:
    chk.identity.primary:   { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location:  { status: not-run }
gate:
  all_required_passed:                     false
  all_required_resolved:                   false
  any_required_skipped_or_unavailable:     false
  required_unavailable_blocking:           false
  hard_block:                              true
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             run_blocked_terminal
  event:                                   run_blocked_terminal
  hard_block_source:                       required_check_not_run:chk.identity.location
```

### Scenario E: Required Failed

Fixture id: `example_2_required_failed`.

A required check fails. Failure of a required check is a hard block.

```yaml
records:
  required:
    chk.identity.primary:   { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location:  { status: failed, reason_code: identity_location_invalid }
gate:
  all_required_passed:                     false
  all_required_resolved:                   false
  any_required_skipped_or_unavailable:     false
  required_unavailable_blocking:           false
  hard_block:                              true
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             run_blocked_terminal
  event:                                   run_blocked_terminal
  hard_block_source:                       required_check_failed:chk.identity.location
```

### Scenario F: Optional Unavailable

Fixture id: `example_2_optional_unavailable`.

An optional check is unavailable. Optional unavailable checks are warnings only; they neither dirty nor block the required verification state.

```yaml
records:
  required:
    chk.identity.primary:   { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location:  { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
  optional:
    chk.identity.ephemeral:
      status: unavailable
      unavailable_reason_code: tool_not_installed
gate:
  all_required_passed:                     true
  all_required_resolved:                   true
  any_required_skipped_or_unavailable:     false
  required_unavailable_blocking:           false
  hard_block:                              false
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             completed_clean
  event:                                   run_completed_clean
  optional_warning:                        unavailable:chk.identity.ephemeral
```

This example passes:
- `verification_gate_completion_fixture` (CONTRACT_TEST_MATRIX.md §2.4)
- The new `verification_record_schema_fixture` (CONTRACT_TEST_MATRIX.md §2)

## Example 3: Markdown-to-Check Transformation Proposal

### Setup

A knowledge artifact exists.

```yaml
artifact:
  id:           knowledge.product-spec.atelier-graph-semantics
  path:         harness/knowledge/product-specs/atelier/GRAPH_SEMANTICS.md
  class:        source
  authority:    1
```

A reviewer observes that the identity scheme section in `GRAPH_SEMANTICS.md` is unambiguous enough to be encoded as an automated check on future graph kernel PRs. They initiate a transformation proposal.

### Step 1: Transform Candidate (Level 2)

```yaml
candidate:
  id:           transform.candidate.0001
  source:       knowledge.product-spec.atelier-graph-semantics
  target_kind:  check
  rule:         "GRAPH_SEMANTICS.md §3.1 contains Primary/Secondary/Location/Ephemeral sections"
  maturity:     2
  emitted_at:   "2026-06-04T13:00:00Z"
```

The candidate is registered in `.atelier/graph/transforms/`. It is not promoted to the source tree.

### Step 2: Proposed Artifact (Level 3)

A draft check artifact is generated.

```yaml
proposed:
  id:           check.proposed.0001
  path:         .atelier/drafts/checks/identity-scheme-present.sh
  content_hash: "sha256:..."
  maturity:     3
  evidence:
    - source_section: GRAPH_SEMANTICS.md §3.1
    - source_quote:   "Artifact Identity Scheme ... Primary ... Secondary ..."
```

The proposed draft is in `.atelier/drafts/`. It is not yet accepted.

### Step 3: Acceptance (Level 4)

A human reviewer with role `role.product.reviewer` accepts the proposal.

```yaml
acceptance:
  artifact_id:   check.proposed.0001
  accepted_by:   role.product.reviewer
  accepted_at:   "2026-06-04T14:00:00Z"
  evidence_refs: [GRAPH_SEMANTICS.md#3.1]
  scope:         "path:harness/knowledge/product-specs/atelier/"
  receipt_id:    transform.receipt.0001
```

The `artifact_accepted` event is emitted per `EVENT_MODEL.md` §5. The acceptance receipt is durable evidence placed outside `.atelier/`, in `harness/decisions/`, so its provenance is discoverable without the derived state.

The receipt is a `transform_receipt` node, not a `decision_record` node. Per `VERIFICATION_SCHEMA.md` §6.3, the primary `decision_ref` for a future `deferred_by_accepted_decision` skip must point at a `decision_record` node. A future `decision_record` that cites this receipt in its `evidence_artifact_refs` may be the `decision_ref` target; the receipt itself is `evidence_artifact_refs` material. See Example 6 Step 3 for the validation rule.

### Step 4: Deterministic Artifact (Level 5)

The accepted check artifact is promoted to a deterministic check, with a stable path and a content hash.

```yaml
check:
  id:           check.identity-scheme-present
  path:         harness/controls/checks/identity-scheme-present.sh
  content_hash: "sha256:..."
  maturity:     5
  accepts:      [transform.receipt.0001]
  verifies:     [knowledge.product-spec.atelier-graph-semantics]
```

The path now lives in the durable part of the repository. The check is now registered in the check registry per `VERIFICATION_SCHEMA.md` §2 and may be bound to a task's required verification map.

### Step 5: Enforced Artifact (Level 6)

The check is wired into a hook or CI step.

```yaml
enforcement:
  check:         check.identity-scheme-present
  mechanism:     ci
  severity:      block
  registered_at: "2026-06-04T15:00:00Z"
  registered_by: role.core.implementer
  enforces:      [knowledge.product-spec.atelier-graph-semantics]
```

A future PR that removes the Primary/Secondary/Location/Ephemeral sections from `GRAPH_SEMANTICS.md` will fail CI with a message identifying the enforcing check and the source section it guards.

### Maturity Level Trajectory

```txt
Level 0: source artifact (GRAPH_SEMANTICS.md)
Level 1: resolved (graph node exists for the source)
Level 2: candidate (transform.candidate.0001)
Level 3: proposed (check.proposed.0001 in .atelier/drafts/)
Level 4: accepted (transform.receipt.0001 in harness/decisions/)
         -- artifact_accepted event emitted --
         -- a future decision_record citing this receipt may serve
            as a decision_ref in a deferred_by_accepted_decision skip --
Level 5: deterministic (check.identity-scheme-present in harness/controls/checks/)
Level 6: enforced (ci step registered with severity=block)
```

Each level change is recorded in the graph as a maturity transition. No level was jumped. No level was applied without provenance. The check is enforced only because a human accepted the proposal and an implementer registered the enforcement.

This example passes:
- `transform_maturity_transition_fixture` (CONTRACT_TEST_MATRIX.md §2.6)
- `accepted_evidence_lifecycle_fixture` (CONTRACT_TEST_MATRIX.md §2)

## Example 4: Adapter Packet Portability

### Setup

A canonical packet is fixed in the test source. Two adapters, `human-shell` (Stage 0) and `noop-reference` (Stage 0), consume the same packet. The fixture asserts packet portability under the normalization rules in `ADAPTER_CONTRACT.md` §7.1. It does not prove runtime agnosticism because `noop-reference` is not a real runtime.

```yaml
canonical_packet:
  id:                pkt.parity.0001
  schema_version:    5.0.0
  task:
    id:              task.parity
    acceptance_criteria:
      - id:          ac.identity
      - id:          ac.authority
  role:
    id:              role.core.implementer
    allowed_paths:   [harness/knowledge/product-specs/atelier/]
  context_plan:
    id:              plan.parity
    reading_order:   [contract.md, GRAPH_SEMANTICS.md, VERIFICATION_SCHEMA.md]
  verification_map:
    required:
      - check_id:    chk.identity.primary
      - check_id:    chk.identity.location
  artifacts:
    - GRAPH_SEMANTICS.md
    - VERIFICATION_SCHEMA.md
  constraints:
    forbidden_behavior: [no-source-rewrite, no-implicit-acceptance]
  external_inputs: {}
```

### Step 1: Adapter A (`human-shell`) Round-Trip

Adapter A produces a human/shell-shaped packet and a canonical result.

```yaml
adapter_a_canonical_result:
  id:                pkt.parity.0001
  runtime:           human-shell
  runtime_packet:
    format:          markdown-handoff
    sections:        [handoff, brief, plan, context, verification, review, worklog, artifacts]
  runtime_result:
    format:          shell-output
    body:            "(simulated)"
  verification:
    chk.identity.primary:   { status: passed,  recorded_at: "2026-06-04T13:00:00Z" }
    chk.identity.location:  { status: passed,  recorded_at: "2026-06-04T13:00:01Z" }
  trace:             []
  diff:
    files_changed:   0
    change_classes:  []
  errors:            []
  adapter_version:   human-shell@1.0.0
```

### Step 2: Adapter B (`noop-reference`) Round-Trip

Adapter B is the no-op reference adapter. It produces the same canonical structure but a different runtime-shaped packet.

```yaml
adapter_b_canonical_result:
  id:                pkt.parity.0001
  runtime:           noop-reference
  runtime_packet:
    format:          reference-shape
    body:            "(no-op reference, no runtime packet produced)"
  runtime_result:
    format:          reference-output
    body:            "(simulated)"
  verification:
    chk.identity.primary:   { status: passed,  recorded_at: "2026-06-04T13:00:00Z" }
    chk.identity.location:  { status: passed,  recorded_at: "2026-06-04T13:00:01Z" }
  trace:             []
  diff:
    files_changed:   0
    change_classes:  []
  errors:            []
  adapter_version:   noop-reference@1.0.0
```

### Step 3: Semantic Equivalence Normalization

The packet portability fixture normalizes both results and asserts equivalence under the rules in `ADAPTER_CONTRACT.md` §7.1.

```yaml
normalized_comparison:
  identity_equivalence:
    task_id:                          equal (pkt.parity.0001)
    acceptance_criteria_ids:          equal ({ac.identity, ac.authority})
    artifact_ids:                     equal ({GRAPH_SEMANTICS.md, VERIFICATION_SCHEMA.md})
    required_check_ids:               equal ({chk.identity.primary, chk.identity.location})
    forbidden_behavior_ids:           equal ({no-source-rewrite, no-implicit-acceptance})

  status_lattice_equivalence:
    chk.identity.primary:
      adapter_a:  passed
      adapter_b:  passed
      equivalent: true
    chk.identity.location:
      adapter_a:  passed
      adapter_b:  passed
      equivalent: true

  handoff_equivalence:
    adapter_a_sections:   [handoff, brief, plan, context, verification, review, worklog, artifacts]
    adapter_b_sections:   []
    note: |
      Adapter B is a no-op reference and emits no handoff content.
      For Stage 0 adapter pairs, the no-op reference MAY have empty
      handoff content because the no-op is not a real runtime. The
      runtime parity fixture for Stage 1 pairs (e.g. codex+opencode) does
      NOT permit empty handoff content.

  diff_equivalence:
    adapter_a:  { files_changed: 0, change_classes: [] }
    adapter_b:  { files_changed: 0, change_classes: [] }
    equivalent: true

  result:
    semantically_equivalent: true
    byte_equivalent:         false
    packet_portability_proven: true
    runtime_agnosticism_proven: false
```

The fixture asserts the normalized result is semantically equivalent. Byte differences in `runtime_packet` and `runtime_result` are permitted.

This example passes:
- `adapter_packet_portability_fixture` (CONTRACT_TEST_MATRIX.md §2b.3)
- `adapter_semantic_equivalence_fixture` (CONTRACT_TEST_MATRIX.md §2)

## Example 5: Forced Close of Blocked Run

### Setup

A run is in `run_blocked_terminal` state because a required check did not run and the gate evaluated to terminal. Per `contract.md` §12.1, a `blocked_waiting` run may not be force-closed directly; the run must first transition to `run_blocked_terminal` via gate evaluation, and force-close is then permitted from that state.

```yaml
run:
  id:            run.0008.r1
  task:          task.0008
  state:         run_blocked_terminal
  terminal:      true
  blocked_reason: required_check_not_run:chk.identity.location
  block_emitted_at: "2026-06-04T12:05:00Z"
```

### Step 1: HPO Decides to Force-Close

The HPO determines the run cannot make further progress and explicitly force-closes it. The action is not automatic; it requires an explicit command.

```yaml
- command:
    surface:   atelier run force-close run.0008.r1 --reason "blocked check requires schema redesign; closing for sprint boundary"
    effect:    forced_close
```

### Step 2: Forced-Close Event

The command emits `run_forced_closed` per `contract.md` §12.2. It does not emit any `run_completed_*` event.

```yaml
- event:
    event_id:        evt.0008.r1.force-close
    event_type:      run_forced_closed
    subject_id:      run.0008.r1
    actor_id:        role.product.owner
    occurred_at:     "2026-06-04T12:10:00Z"
    recorded_at:     "2026-06-04T12:10:00Z"
    source_artifacts: [run.0008.r1, role.product.owner]
    evidence_refs:   [evt.0008.r1.run-blocked-terminal, force-close command transcript]
    durable_location: harness/runs/0008/r1/events/run-forced-closed.json
    correlation_id:   corr.0008.r1.force-close
    payload:
      run_id:        run.0008.r1
      reason:        "blocked check requires schema redesign; closing for sprint boundary"
      forced_by:     role.product.owner
      forced_at:     "2026-06-04T12:10:00Z"
      prior_state:   run_blocked_terminal
```

### Step 3: HPO State Projection

Per `HPO_STATE_MODEL.md` §2, the run is in the `forced_closed` state. The HPO surface must present this state honestly.

```yaml
hpo_state:
  states:                    [forced_closed, blocked_terminal]
  evidence_table_required:   true
  forbidden_claims:          [the work is done, verification passed, the run completed cleanly]
  allowed_actions:           [inspect the force-close reason, request a new run from the same task, mark the run as superseded]
```

`forced_closed` is `terminal_non_success_forced` per `contract.md` §16.1. It is not success. The HPO must not present the run as completed.

### Boundary Cases

- Calling `atelier run force-close` on a run that is not in `run_blocked_terminal` state is invalid. The command returns `ATELIER-INVARIANT-VIOLATION`. This includes `blocked_waiting` runs: a `blocked_waiting` run must first transition to `run_blocked_terminal` via gate evaluation before force-close is permitted.
- Calling `atelier run complete` on a run in `run_blocked_terminal` or `blocked_waiting` state is invalid. The command returns `ATELIER-INVARIANT-VIOLATION` and emits no event.

This example passes:
- `forced_close_lifecycle_fixture` (CONTRACT_TEST_MATRIX.md §2)
- The HPO state evidence table rule from `HPO_STATE_MODEL.md` §3.

## Example 6: Accepted Evidence Lifecycle

### Setup

A transform proposal reaches Level 3 (proposed) and is ready for acceptance. The acceptance event promotes the candidate to durable evidence.

```yaml
candidate:
  id:           transform.candidate.0002
  source:       harness/knowledge/product-specs/atelier/contract.md
  target_kind:  policy
  rule:         "extract forbidden_behavior clauses into a registered policy"
  maturity:     3
  evidence:
    - source_section: contract.md §13
    - source_quote:   "Runtime-specific configuration must not become product truth unless..."
```

### Step 1: Acceptance Event

A human reviewer with role `role.product.reviewer` accepts the proposal. The acceptance event commits a durable receipt outside `.atelier/`.

```yaml
- event:
    event_id:        evt.0002.accept
    event_type:      artifact_accepted
    subject_id:      policy.proposed.0002
    actor_id:        role.product.reviewer
    occurred_at:     "2026-06-04T16:00:00Z"
    recorded_at:     "2026-06-04T16:00:00Z"
    source_artifacts: [policy.proposed.0002, contract.md#13]
    evidence_refs:   [transform.candidate.0002]
    durable_location: harness/decisions/policy-proposal-0002.json
    correlation_id:   corr.0002.accept
    payload:
      artifact_id:   policy.proposed.0002
      accepted_by:   role.product.reviewer
      accepted_at:   "2026-06-04T16:00:00Z"
      evidence_refs: [transform.candidate.0002]
      scope:         "path:harness/knowledge/product-specs/atelier/"
      expires_at:    null
      receipt_id:    transform.receipt.0002
```

The receipt is now durable evidence. It survives `.atelier/` deletion per `GRAPH_SEMANTICS.md` §11.

### Step 2: Graph Edge and Event Correlation

The `accepts` edge is emitted together with the `artifact_accepted` event. They share a `correlation_id`.

```yaml
edge:
  source:        role.product.reviewer
  target:        policy.proposed.0002
  kind:          accepts
  payload:
    evidence:    transform.receipt.0002
  created_at:    "2026-06-04T16:00:00Z"
  correlation_id: corr.0002.accept
```

### Step 3: Reuse as a `decision_ref`

A future verification record may use `decision.0002.policy-acceptance` as the `decision_ref` for a `deferred_by_accepted_decision` skip, provided the skip's check falls inside the decision record's `scope` (`path:harness/knowledge/product-specs/atelier/`).

The `decision_ref` validation rule from `VERIFICATION_SCHEMA.md` §6.3 is exercised: the target must be a `decision_record` node kind with `status=accepted`, `accepted_by` present, `accepted_at` present, and `scope` covering the check. `transform.receipt.0002` is a `transform_receipt` node and is NOT the primary `decision_ref` target. The receipt may appear in `evidence_artifact_refs` for additional context, but the primary `decision_ref` must point at the `decision_record`.

### Step 4: Survival of `.atelier/` Deletion

The `.atelier/` directory is deleted as a test. The acceptance event and the receipt survive.

```yaml
survives_atelier_deletion:
  - harness/decisions/policy-proposal-0002.json       (durable receipt)
  - evt.0002.accept (durable event)                   (durable event)
  - the `accepts` edge (graph edge, can be regenerated from durable event)

regenerated_from_durable:
  - .atelier/graph/                                   (graph snapshot)
  - .atelier/traces/                                  (trace events)
  - .atelier/cache/                                   (capability caches)
```

This example passes:
- `accepted_evidence_lifecycle_fixture` (CONTRACT_TEST_MATRIX.md §2)
- The event durability rules from `EVENT_MODEL.md` §6.
- The `decision_ref` validation rule from `VERIFICATION_SCHEMA.md` §6.3.

## v5 Revision Notes

- Renamed "Example 1: Attention Plan" to "Example 1: Context plan and resolution decisions". The example now uses `resolution_type`, `resolver_identity`, and `budget_delta` from `contract.md` §10a.
- Switched the example's effect check to `snake_case` field names per `contract.md` §10.
- Added a co-emitted `required_verification_map` to Example 1 to match the MVP wedge definition.
- Rewrote Example 2 to exercise the completion truth table from `VERIFICATION_SCHEMA.md` §8 across fixture-oriented scenarios: clean, required unavailable default-dirty, required unavailable blocking, required missing, required failed, and optional unavailable.
- Added Example 3 acceptance receipt with `scope` so the receipt is usable as a `decision_ref` in future skips.
- Added Example 4: Adapter packet portability. Uses Stage 0 `human-shell` and `noop-reference`. Demonstrates the semantic equivalence normalization from `ADAPTER_CONTRACT.md` §7.1 without proving runtime agnosticism.
- Added Example 5: Forced close of blocked run. Demonstrates `atelier run force-close`, the `run_forced_closed` event, the HPO state projection, and the boundary case (force-close on a non-blocked run is invalid).
- Added Example 6: Accepted evidence lifecycle. Demonstrates the `artifact_accepted` event shape, the graph edge correlation, the `decision_ref` reuse rule, and the `.atelier/` deletion survival.
- All verification records in Example 2 use the canonical record schema from `VERIFICATION_SCHEMA.md` §4 (snake_case fields, `durable_path`, `tool_version`, `recorded_by`).
- All `skip_reason_code` and `unavailable_reason_code` values are from the controlled lists in `VERIFICATION_SCHEMA.md` §6.1 and §6.2.

## v5.1 Revision Notes

- Example 2 (Verification and Completion States): scenarios now use the v5.1 truth-table columns, including `required_unavailable_blocking`, from `VERIFICATION_SCHEMA.md` §8. Blocking scenarios emit `run_blocked_terminal`; HPO projections use `blocked_terminal`.
- Example 5 (Forced Close of Blocked Run): the run's prior state is now `run_blocked_terminal`. The boundary case is updated: force-close is invalid from `resumed` or `blocked_waiting`; it is permitted only from `run_blocked_terminal`.
- Example 6 (Accepted Evidence Lifecycle) Step 3: the `decision_ref` example no longer says `transform.receipt.0002` may be used as the `decision_ref`. The primary `decision_ref` must point at the `decision_record` (`decision.0002.policy-acceptance`); the `transform_receipt` may appear in `evidence_artifact_refs` only. This matches the `decision_ref` validation rule in `VERIFICATION_SCHEMA.md` §6.3.
- Example 3 (Maturity Transitions) Step 3 and Maturity Level Trajectory: the prose "receipt is now usable as a `decision_ref`" replaced with the v5.1 framing. The receipt is a `transform_receipt`; the primary `decision_ref` target must be a `decision_record`. A future `decision_record` citing this receipt in `evidence_artifact_refs` may be the `decision_ref` target. This aligns Example 3 with Example 6 and `VERIFICATION_SCHEMA.md` §6.3.
- All example verification record JSON uses the v5.1 schema, including the new `unavailable_effect` field on checks.
