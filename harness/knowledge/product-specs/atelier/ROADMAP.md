---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-roadmap
title: Atelier Roadmap
status: active
pattern: simple
tags:
  - product:atelier
  - subject:roadmap
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - task-candidate
---

# Atelier Roadmap

## Status

This roadmap is derived from `Ideal.md` and constrained by `contract.md`.

It is not the product truth. It is the current implementation sequence.

If this roadmap conflicts with `contract.md`, `contract.md` wins. If this roadmap no longer supports `Ideal.md`, revise the roadmap.

This document is the canonical source for **phase order**. `POSITIONING.md` mirrors the phase order for strategic purposes. If the two diverge, this document wins for execution; `POSITIONING.md` is updated to mirror.

## Strategic Shape

Atelier should not start by building a full autonomous agent runtime.

The correct wedge is:

```txt
Attention + Verification + Generic Runtime Packet Export
```

The durable product becomes:

```txt
Artifact Graph + Transformation + Human Product Owner UI
```

The long-term coordination layer becomes:

```txt
Runtime Adapter Plane + Swarm Coordination
```

Do not jump directly to swarm coordination, GUI polish, or runtime ownership before artifact alignment exists.

The runtime-agnosticism claim is a contract claim only after the Stage 1 real-runtime parity fixture (`adapter_runtime_parity_fixture`) passes. Until then, runtime agnosticism is a product goal, not a contract claim. Stage 0 packet portability is gated separately by `adapter_packet_portability_fixture`.

## Current MVP Definition

The MVP is a narrow end-to-end loop that proves the wedge. The loop is:

```txt
task
  -> context plan (snake_case, budget, resolution decisions)
  -> generic packet
  -> external runner result (human/shell or no-op reference adapter)
  -> verification record (committed durably)
  -> completed_clean | completed_dirty | run_blocked_terminal | forced_closed
  -> accepted evidence lifecycle (artifact_accepted event -> durable receipt)
```

Every step in this loop must be implemented, fixture-backed, and testable before the MVP is called complete. The MVP proves the wedge; nothing else.

The MVP is not a context packer. It is not a prompt generator. The MVP must produce a context plan paired with a required verification map, route the plan through a generic adapter, record verification durably, and surface the lifecycle consequence honestly through the completion gate.

## Phase 0: Spec and Contract Stabilization

Phase 0 makes the v4 spec pack self-consistent, testable, and load-bearing for implementation work. It is not a product feature phase; it is a substrate phase. No product behavior is shipped from Phase 0.

### 0.1 Spec Pack v4 Cut

```txt
Goal: Produce a coherent v4 spec pack.

Scope:
  - Ideal.md, contract.md, POSITIONING.md, ROADMAP.md, README.md updated to v4.
  - GRAPH_SEMANTICS.md, SURFACES.md, ADAPTER_CONTRACT.md,
    CONTRACT_TEST_MATRIX.md, EXAMPLES.md created.
  - Strategic sequence in POSITIONING.md mirrors this roadmap.
  - Three-class rule is consistent across all documents.
  - Runtime Adapter Plane is the canonical plane name.

Done when:
  - All ten documents exist and are linked from README.md.
  - Self-check pass confirms no cross-document contradictions.
  - "Runtime Adapter Plane" appears in every document that names a plane.
  - "source / accepted durable evidence / derived" appears in every document that names artifact classes.
```

### 0.2 Active Surface Cleanup

```txt
Goal: Make active CLI, MCP, GUI, adapters, README, and generated output match SURFACES.md.

Scope:
  - Stale-command grep returns no hits in active surfaces.
  - CLI help, MCP tool list, GUI copy, README usage, and adapter prompts agree.
  - No active surface recommends a removed command.

Done when:
  - `active_surface_inventory_test` (CONTRACT_TEST_MATRIX.md §2.9) passes.
  - Removed command grep is clean against active surfaces, with archive exceptions explicit.
```

### 0.3 Run / Task Boundary Hardening

```txt
Goal: Make task lifecycle and run lifecycle trustworthy.

Scope:
  - Task lifecycle state machine and events (contract.md §11).
  - Run lifecycle state machine and events (contract.md §12).
  - LLM-readable reading order enforced by run resume prompt.
  - Completion gate moved from soft language to hard gate (contract.md §16).

Done when:
  - `run_packet_reading_order_fixture` (§2.5) passes.
  - `verification_gate_completion_fixture` (§2.4) passes.
  - Task closure never emits run completion in any test path.
```

### 0.4 Contract Test Matrix v1

```txt
Goal: Make the claim-to-test coverage explicit and machine-checkable.

Scope:
  - Every normative `must` in contract.md, GRAPH_SEMANTICS.md,
    SURFACES.md, ADAPTER_CONTRACT.md is mapped to a test, a
    fixture, or an explicit waiver.
  - The ten priority tests in CONTRACT_TEST_MATRIX.md §2 are
    described (abstract name, fixture, assertions).

Done when:
  - `contract_coverage_test` (§2.10) is implementable.
  - Waiver log has initial entries for out-of-scope claims.
```

## Phase 0.5: Contract Blocking Repairs (v5 Cut)

Phase 0.5 is the v5 contract stabilization cut. It is the bridge between the v4 substrate and the v5 implementation wedge. No product behavior is shipped from Phase 0.5. The phase exists only to make the rest of the v5 phases implementable.

```txt
Goal: Resolve the P0 contradictions in the v4 spec pack and ship the
substrate schemas required to implement Phase 1.

Scope:
  - Completion truth table moved to VERIFICATION_SCHEMA.md §8.
  - `run_forced_closed` lifecycle event added in contract.md §12.
  - Canonical kind catalog expanded (run, actor, runtime, runtime_step,
    ci_workflow, event, external_input, adapter, artifact_class) and
    made two-tier in GRAPH_SEMANTICS.md §4.4.
  - Endpoint compatibility matrix made exhaustive in GRAPH_SEMANTICS.md
    §6.3.
  - Strict graph validation rule in GRAPH_SEMANTICS.md §4.5.
  - Four-class document precedence in contract.md §2.
  - VERIFICATION_SCHEMA.md, EVENT_MODEL.md, HPO_STATE_MODEL.md created
    as normative subcontracts.
  - Adapter output class split in ADAPTER_CONTRACT.md §10.
  - Semantic equivalence normalization oracle in ADAPTER_CONTRACT.md
    §7.1.
  - Resolution Decision Record renamed from "semantic decision record"
    in contract.md §4.8 and §10a; `resolution_type` replaces `resolver`.
  - Context plan effect schema switched to snake_case in contract.md
    §10.
  - Context budget units added in contract.md §10.
  - Adapter error schema added in ADAPTER_CONTRACT.md §8a.
  - `decision_ref` validation rule added in VERIFICATION_SCHEMA.md §6.3.
  - `completed_dirty` guardrail added: "completed_dirty is not success".

Done when:
  - All v5 schema subcontracts exist and are referenced from contract.md.
  - contract.md §16 defers status semantics to VERIFICATION_SCHEMA.md.
  - GRAPH_SEMANTICS.md §6.3 is exhaustive and fixture-backed.
  - adapter_packet_portability_fixture (in ADAPTER_CONTRACT.md §7) is implementable
    against the new semantic equivalence normalization.
  - `graph_kind_endpoint_compatibility_fixture` is in
    CONTRACT_TEST_MATRIX.md §2.
  - `verification_record_schema_fixture` is in CONTRACT_TEST_MATRIX.md §2.
  - `adapter_semantic_equivalence_fixture` is in CONTRACT_TEST_MATRIX.md
    §2.
  - `context_budget_traversal_guard_fixture` is in CONTRACT_TEST_MATRIX.md
    §2.
  - `resolution_decision_record_fixture` is in CONTRACT_TEST_MATRIX.md §2.
  - `forced_close_lifecycle_fixture` is in CONTRACT_TEST_MATRIX.md §2.
```

## Phase 1: MVP

The MVP is the narrow end-to-end loop defined in "Current MVP Definition" above. The order within Phase 1 is non-negotiable.

### 1A Artifact Graph v0-min + Verification Schema v0

```txt
Goal: Make artifact resolution explicit, regenerable, and paired with
a complete verification substrate.

Scope:
  - Source artifact identity (primary, secondary, location, ephemeral).
  - Two-tier kind catalog (canonical + experimental).
  - Move/rename tracking through `moved/supersedes` edges.
  - Exhaustive edge catalog and endpoint compatibility matrix.
  - Authority model with five-level scale and the decision_record rule.
  - Content hash and graph hash rules.
  - Regeneration contract.
  - Stale detection (excluding age-based, which is deferred).
  - Three-class boundary (source / accepted durable evidence / derived).
  - Strict graph validation rule.
  - Check registry, verification record schema, status lattice, reason
    codes, hard_block definition, completion truth table.

Done when:
  - `artifact_graph_golden_fixture` (§2.1) passes.
  - `graph_kind_endpoint_compatibility_fixture` (§2) passes.
  - `verification_record_schema_fixture` (§2) passes.
  - `atelier_deletion_regeneration_fixture` (§2.3) passes.
  - The graph hash is byte-identical on regeneration from the committed
    fixture.
```

### 1B Generic Runtime Packet Export + Packet Portability Fixture

```txt
Goal: Prove packet portability with a generic adapter pair before
shipping any runtime-specific adapter.

Scope:
  - Canonical packet schema (ADAPTER_CONTRACT.md §2).
  - Canonical result schema (ADAPTER_CONTRACT.md §3).
  - Generic human/shell adapter (Stage 0).
  - No-op reference adapter (Stage 0).
  - Adapter error schema (ADAPTER_CONTRACT.md §8a).
  - Semantic equivalence normalization oracle (ADAPTER_CONTRACT.md §7.1).
  - `adapter_packet_portability_fixture`.

Done when:
  - `adapter_packet_portability_fixture` passes for the
    human-shell + noop-reference adapter pair.
  - The generic adapter is the first adapter shipped.
  - The no-op reference adapter is itself a registered adapter.
  - `packet_portability_claim` can be made as a contract claim.
  - `runtime_agnosticism_claim` remains a product goal until at
    least one Stage 1 adapter pair passes `adapter_runtime_parity_fixture`.
```

### 1C Attention Management v1

```txt
Goal: Make context planning an explicit Attention Plane surface, paired
with verification, with budget and resolution decision records.

Scope:
  - Selectors: deterministic, semantic, hybrid (resolution_type field).
  - Role routing, phase routing, path and intent matching.
  - Injection modes: full, summary, reference, decision, constant.
  - Exclusion logic.
  - Resolution decision records (contract.md §10a).
  - Context budget reporting (contract.md §10, snake_case).
  - Freshness checks against the graph hash.
  - Co-emitted required verification map.

Done when:
  - `context_plan_readonly_fixture` (§2.2) passes.
  - `context_budget_traversal_guard_fixture` (§2) passes.
  - `resolution_decision_record_fixture` (§2) passes.
  - A context plan includes its resolution decisions, its budget
    impact, and its co-emitted required verification map.
```

### 1D End-to-End Run Completion Wedge

```txt
Goal: Land the narrow end-to-end loop that proves the wedge.

Scope:
  - Run lifecycle state machine and events (contract.md §12) including
    run_forced_closed.
  - Completion gate evaluation against the truth table
    (VERIFICATION_SCHEMA.md §8).
  - Verification record promotion to durable evidence
    (VERIFICATION_SCHEMA.md §9 and EVENT_MODEL.md §5).
  - Accepted evidence lifecycle: artifact_accepted event -> durable
    receipt outside .atelier/.
  - One task, one generic packet, one external/human runner, one
    verification gate, one acceptance event.

Done when:
  - `verification_gate_completion_fixture` (§2.4) passes.
  - `forced_close_lifecycle_fixture` (§2) passes.
  - `accepted_evidence_lifecycle_fixture` (§2) passes.
  - A task can run end-to-end: context plan -> generic packet -> runner
    result -> verification record -> completed_clean|completed_dirty|
    run_blocked_terminal|forced_closed -> accepted evidence.
  - The MVP is declared complete only when this loop is fixture-backed.
```

### 1E (Optional) Narrow Reconciliation

```txt
Goal: Detect drift in the minimum set of pairs needed by Attention v1.

Scope:
  - Drift detection between README and CLI.
  - Drift detection between context plan and stale graph hash.
  - Drift detection between run handoff and diff summary.

Done when:
  - `drift_detection_fixture` (§2.8) passes.
  - A reconciliation report can be produced from the graph.
  - Broad reconciliation (Markdown-vs-hooks, runtime-config-vs-canonical,
    policy-vs-permissions) is explicitly deferred to Phase 3.
```

## Phase 2: Runtime-Specific Adapters

Phase 2 adds Stage 1 and Stage 2 adapters. The MVP shipped a generic adapter pair in Phase 1B; runtime-specific adapters come after. The phase is split into 2A-2D so that a real runtime pair is established before additional adapters expand the parity surface.

### 2A: First real runtime adapter

```txt
Scope: One real runtime adapter (e.g. codex OR opencode).

Done when:
  - The adapter passes `adapter_packet_portability_fixture` against the
    noop-reference adapter.
  - Adapter capability descriptor is published in
    ADAPTER_CONTRACT.md §4.
  - The adapter output surface is listed in SURFACES.md §7.
```

### 2B: Second real runtime adapter

```txt
Scope: A second real runtime adapter (e.g. the other of codex/opencode,
or an equivalent such as claude-code).

Done when:
  - The second adapter passes `adapter_packet_portability_fixture` against the
    noop-reference adapter.
  - Adapter capability descriptor is published.
  - The adapter output surface is listed in SURFACES.md §7.
```

### 2C: Pairwise parity between two real adapters

```txt
Scope: Pairwise parity between the two Stage 1 adapters from 2A and 2B.

Done when:
  - `adapter_runtime_parity_fixture` passes for the real-runtime pair.
  - `runtime_agnosticism_claim` can be made as a contract claim.
```

### 2D: Additional adapters

```txt
Scope: Additional Stage 1 adapters (claude-code, chatgpt) and
Stage 2 adapters (gemini, local runtimes, custom organization adapters).

Done when:
  - Each new adapter passes `adapter_runtime_parity_fixture` in at least one pair.
  - Each new adapter is listed in SURFACES.md.
  - The full parity coverage (Stage 0 + Stage 1 + Stage 2) is asserted
    by `adapter_semantic_equivalence_fixture`.
```

## Phase 3: Transformation Pilots

Phase 3 introduces the transformation plane. It comes after the accepted evidence lifecycle from Phase 1D is shipped, because transformation requires a stable acceptance path.

```txt
Goal: Introduce transformation maturity without over-automating.

Scope:
  - Markdown-to-check pilot.
  - Test-to-markdown pilot.
  - Review-to-task pilot.
  - Maturity transition model in pilots (contract.md §8a).
  - Acceptance event recording per EVENT_MODEL.md §5.

Done when:
  - `transform_maturity_transition_fixture` (§2.6) passes.
  - No transformation is auto-promoted past Level 4.
  - Acceptance evidence is required for every Level 3 -> 4 transition.
  - `decision_ref` validation rule is exercised in the transformation
    pilots.
```

## Phase 4: Human Product Owner UI

Phase 4 builds the HPO surface. It comes after graph, verification, drift semantics, and transformation are stable, because the HPO surface must show real evidence, not decorative dashboards.

```txt
Goal: Expose artifact alignment, risk, verification, and drift to a human.

Scope:
  - HPO state model from HPO_STATE_MODEL.md.
  - Product truth overview.
  - Contract coverage.
  - Verification state.
  - Drift dashboard.
  - Transform candidates.
  - Unresolved decisions.
  - Run handoff state.
  - Roadmap state.
  - State evidence table (HPO_STATE_MODEL.md §3).
  - Forbidden UI claims (HPO_STATE_MODEL.md §4).
  - Allowed human actions (HPO_STATE_MODEL.md §5).

Done when:
  - An HPO can identify the repository state without inspecting every
    diff.
  - The UI does not assert verification that does not exist.
  - Every UI state maps to a documented evidence set.
  - The forced_closed state is presented honestly as not-success.
```

## Phase 5: Swarm Coordination

Phase 5 coordinates multiple agents. It comes last because multi-agent work multiplies artifacts faster than a stable graph can absorb.

```txt
Goal: Coordinate multiple agents, roles, subagents, and handoffs.

Scope:
  - Role-based task routing.
  - Subagent packet generation.
  - Parallel run boundaries.
  - Conflict detection.
  - Review handoff.
  - Merge readiness.
  - Cheap-model scout/research roles.
  - Human decision gates.

Done when:
  - Multiple agents can work without their outputs becoming canonical
    by default.
  - Conflicts are surfaced through artifact graph and verification
    state.
  - Swarm work remains runtime-agnostic.
  - Subagent outputs follow the maturity transition model in
    contract.md §8a.
```

## Canonical Phase Order (for POSITIONING.md)

The order above is the canonical phase order. `POSITIONING.md` mirrors it for strategic purposes. The order is:

```txt
Phase 0: Spec and Contract Stabilization
  0.1 Spec Pack v4 Cut
  0.2 Active Surface Cleanup
  0.3 Run / Task Boundary Hardening
  0.4 Contract Test Matrix v1

Phase 0.5: Contract Blocking Repairs (v5 Cut)
  (no sub-phases; deliverables enumerated above)

Phase 1: MVP
  1A  Artifact Graph v0-min + Verification Schema v0
  1B  Generic Runtime Packet Export + Adapter Parity Fixture
  1C  Attention Management v1
  1D  End-to-End Run Completion Wedge
  1E  (Optional) Narrow Reconciliation

Phase 2: Runtime-Specific Adapters
  2A  First real runtime adapter
  2B  Second real runtime adapter
  2C  Pairwise parity between two real adapters (runtime_agnosticism_claim gate)
  2D  Additional adapters (Stage 1 + Stage 2 expansion)

Phase 3: Transformation Pilots
  3.1 Markdown-to-check
  3.2 Test-to-markdown
  3.3 Review-to-task

Phase 4: Human Product Owner UI
  4.1 State evidence table rollout
  4.2 Forbidden claims enforcement
  4.3 Allowed actions surface

Phase 5: Swarm Coordination
  5.1 Role routing
  5.2 Subagent packets
  5.3 Merge readiness
```

`POSITIONING.md` must reflect this order. If a future change to this roadmap changes the order, both documents must be updated in the same revision.

## Non-Roadmap Items

The following should not be prioritized before the earlier foundations are stable:

- full autonomous runtime ownership;
- decorative GUI before verification semantics;
- runtime-specific lock-in;
- uncontrolled transform automation past Level 4;
- implicit acceptance of generated artifacts;
- old command compatibility aliases;
- context packing without artifact graph provenance;
- new adapter categories before the parity fixture exists;
- swarm work before the artifact graph and verification are stable;
- full HPO UI before graph, verification, transformation, and drift semantics exist;
- a runtime-agnosticism contract claim before the adapter parity fixture passes.

## Done Criteria for the Roadmap as a Whole

The roadmap is complete when all of the following hold:

```txt
- Phase 0 done criteria are met.
- Phase 0.5 done criteria are met (v5 contract cut is implementation-grade).
- `artifact_graph_golden_fixture` passes.
- `graph_kind_endpoint_compatibility_fixture` passes.
- `verification_record_schema_fixture` passes.
- `verification_gate_completion_fixture` passes.
- `forced_close_lifecycle_fixture` passes.
- `accepted_evidence_lifecycle_fixture` passes.
- `transform_maturity_transition_fixture` passes.
- `adapter_packet_portability_fixture` passes for the generic adapter pair (Stage 0).
- `adapter_runtime_parity_fixture` passes for at least one Stage 1 adapter pair.
- `adapter_semantic_equivalence_fixture` passes.
- `drift_detection_fixture` passes.
- `context_plan_readonly_fixture` passes.
- `context_budget_traversal_guard_fixture` passes.
- `resolution_decision_record_fixture` passes.
- `active_surface_inventory_test` passes.
- `contract_coverage_test` passes.
- POSITIONING.md mirrors this roadmap's phase order.
```

## v5 Revision Notes

- Added Phase 0.5 "Contract Blocking Repairs" as the v5 cut. The phase is a bridge between the v4 substrate and the v5 implementation wedge.
- Split Phase 1 into 1A (Graph + Verification substrate), 1B (Generic packet + Adapter parity), 1C (Attention), 1D (End-to-end wedge), 1E (Optional narrow reconciliation).
- Moved Generic Runtime Packet Export into Phase 1B. Runtime-agnosticism is now provable in the MVP, not a Phase 2 claim.
- Moved broad reconciliation out of the MVP path into 1E (Optional). Narrow reconciliation is enough for Attention v1.
- Moved Transformation Pilots to Phase 3 (after Phase 1D accepted evidence lifecycle ships). The previous ordering risked transformation pilots running before the acceptance substrate was stable.
- Moved HPO UI to Phase 4 and added state evidence table, forbidden claims, and allowed actions sub-phases.
- Added the "runtime-agnosticism is a contract claim only after parity fixture passes" rule. Until then, it is a product goal.
- Updated the wedge definition to "Attention + Verification + Generic Runtime Packet Export" so the MVP proves the cross-runtime boundary.
- Updated Done Criteria to include the new fixtures from Phase 0.5.

## v5.1 Revision Notes

- Phase 1B "Done when" block split into two proof levels. The `packet_portability_claim` becomes a contract claim after `adapter_packet_portability_fixture` passes. The `runtime_agnosticism_claim` remains a product goal until at least one Stage 1 adapter pair passes `adapter_runtime_parity_fixture`.
- Phase 2 split into 2A-2D sub-phases. The first real runtime adapter is shipped in 2A, the second in 2B, pairwise parity in 2C (which gates `runtime_agnosticism_claim`), and additional adapters in 2D. The previous all-at-once Stage 1 list (codex, opencode, claude-code, chatgpt) is deferred to 2D.
- MVP loop signature uses the v5.1 closure states: `completed_clean | completed_dirty | run_blocked_terminal | forced_closed`. The "accepts event" wording in the MVP loop and §1D end-to-end loop is replaced with "artifact_accepted event" to match the v5.1 event vocabulary.
- Canonical phase order block at the end updated to use the 2A-2D sub-phases instead of 2.1/2.2.
