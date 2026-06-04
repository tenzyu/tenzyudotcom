---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-readme
title: Atelier Product Specs README
status: active
pattern: simple
tags:
  - product:atelier
  - subject:readme
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
---

# Atelier Product Specs

## Start Here

This directory is the v5 product spec pack for Atelier. This README is the human entry point. Read this first, then move to the documents below in the order listed.

Atelier is a repository-native artifact alignment layer for agentic software development.

It treats Markdown, tests, checks, skills, linters, roles, permissions, hooks, tasks, product specs, traces, verification records, reviews, prompts, handoffs, source files, and configuration as graph-managed artifacts.

The central mechanism is the artifact graph kernel defined in `GRAPH_SEMANTICS.md`. Cross-runtime support is operationalized by `ADAPTER_CONTRACT.md`. The behavioral contract is in `contract.md`. The verification substrate is in `VERIFICATION_SCHEMA.md`. The event backbone is in `EVENT_MODEL.md`. The HPO state projection is in `HPO_STATE_MODEL.md`. Run packet durability is defined in `RUN_PACKET_MODEL.md`; write authority is defined in `WRITE_AUTHORITY_MATRIX.md`.

## Current MVP

The MVP is a narrow end-to-end loop:

```txt
task
  -> context plan (snake_case, budget, resolution decisions)
  -> generic packet
  -> external runner result (human/shell or no-op reference adapter)
  -> verification record (committed durably)
  -> completed_clean | completed_dirty | run_blocked_terminal | forced_closed
  -> accepted evidence lifecycle (artifact_accepted event -> durable receipt)
```

It is not a context packer. It is not a prompt generator. The MVP must produce a context plan paired with a required verification map, route the plan through a generic adapter, record verification durably, and surface the lifecycle consequence honestly through the completion gate.

The MVP wedge is "Attention + Verification + Generic Runtime Packet Export". The wedge is not "Attention Management v1" alone; the v4 framing did not include the cross-runtime boundary.

## Document Map

Read in this order for a canonical review:

```txt
README.md       (this file; entry point)
Ideal.md        (product thesis and philosophy root)
contract.md     (normative behavior contract; normative hub for the spec pack)
POSITIONING.md  (strategic position; market evidence; absorption threats)
ROADMAP.md      (phase order; canonical source for execution order)
```

The full v5.1 spec pack is fifteen documents. Their responsibilities are:

```txt
Philosophy Root:
  Ideal.md
    Why Atelier exists. Cross-links only to GRAPH_SEMANTICS.md
    and ADAPTER_CONTRACT.md.

Normative Hub:
  contract.md
    Behavioral obligations. Defers to schema subcontracts for
    domain-internal authority. Holds the four-class conflict
    resolution in §2 and the contract test coverage rule.

Strategy:
  POSITIONING.md
    Market evidence, absorption threats, why this still exists,
    absorption test. Mirrors the phase order from ROADMAP.md.

Execution:
  ROADMAP.md
    Canonical phase order. Phase 0 stabilization, Phase 0.5
    v5 contract repair, Phase 1 MVP (1A-1D + optional 1E),
    Phase 2 runtime-specific adapters, Phase 3 transformation
    pilots, Phase 4 HPO UI, Phase 5 swarm coordination.

Schema Subcontracts (normative in their domain):
  GRAPH_SEMANTICS.md
    Artifact identity, class model, kind catalog (two-tier),
    edge catalog, exhaustive endpoint matrix, graph authority,
    hash rules, regeneration, stale detection, strict
    graph validation.

  VERIFICATION_SCHEMA.md
    Check registry, verification record schema, required
    verification map derivation, status lattice, reason codes,
    hard-block definition, completion truth table,
    decision_ref validation rule, completed_dirty guardrail.

  EVENT_MODEL.md
    Event identity, payload invariants, durability, replay,
    redaction, accept/reject event shape.

  HPO_STATE_MODEL.md
    HPO state labels, required evidence per state, forbidden
    UI claims, allowed human actions, state transitions,
    uncertainty display.

  RUN_PACKET_MODEL.md
    Working packet, exported packet, handoff, accepted handoff,
    terminal verification summary, debug trace, and promotion rules.

  WRITE_AUTHORITY_MATRIX.md
    Actors and surfaces authorized to write, export, accept, reject,
    or promote each artifact class.

Surface Contract:
  SURFACES.md
    Active CLI command inventory (including force-close and
    export), removed command do-not-advertise list, MCP tool
    surface, GUI label rule, generated prompt surfaces,
    adapter output surfaces, JSON output schemas, parity
    test scope.

Adapter Contract:
  ADAPTER_CONTRACT.md
    Canonical packet input/output, runtime capability
    descriptors, output class split, forbidden adapter
    behavior, round-trip rule, semantic equivalence oracle,
    adapter error schema, adapter inventory stages.

Test Matrix:
  CONTRACT_TEST_MATRIX.md
    Coverage rule, priority tests (including nine new v5
    fixtures), currently testable claims, claims not yet
    testable, waiver log.

Examples:
  EXAMPLES.md
    Six golden flows: Context plan, Verification and
    completion states, Markdown-to-Check transformation,
    Adapter packet portability, Forced close, Accepted evidence
    lifecycle.

Onboarding:
  README.md
    This file. The human entry point.
```

## Document Authority

For document precedence and the four-class conflict resolution (product_direction, implementation_behavior, graph_kernel_schema, schema_subcontract), see `contract.md` §2.

`contract.md` is the normative hub. The schema subcontracts (`GRAPH_SEMANTICS.md`, `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, `HPO_STATE_MODEL.md`, `ADAPTER_CONTRACT.md`, `SURFACES.md`) each own one domain and win in that domain under the four-class rules. `CONTRACT_TEST_MATRIX.md` and `EXAMPLES.md` are normative in their respective domains.

`ROADMAP.md` is the canonical source for phase order. `POSITIONING.md` mirrors it. If they diverge, the roadmap wins for execution; positioning is updated to mirror.

## Filename Casing

Filename casing is intentional. Long-lived entry/category documents use title or uppercase names; normative kernel documents may use lowercase where already established. Do not infer authority from filename casing. Do not rename files for casing consistency.

## Current Proof Status

The v5.1 pack is intended to become implementation-grade for Phase 0.5 and Phase 1 after the named fixtures pass. Until each named fixture passes, the corresponding claim is a **product goal**, not a contract claim. Packet portability and runtime agnosticism are tracked separately:

```txt
- packet_portability_claim: a contract claim only after
  `adapter_packet_portability_fixture` passes for the
  human-shell + noop-reference adapter pair (Stage 0).
  This is the only adapter proof claim that ships in the MVP
  per ROADMAP.md Phase 1B.

- runtime_agnosticism_claim: a contract claim only after
  `adapter_runtime_parity_fixture` passes for at least one Stage 1
  pair of real runtime adapters (e.g. codex + opencode,
  codex + claude-code, or equivalent). Stage 1 delivery per
  ROADMAP.md Phase 2A-2C is required.

- Cross-runtime graph identity: a contract claim only after
  `graph_kind_endpoint_compatibility_fixture` passes.

- Accepted evidence survives .atelier/ deletion: a contract claim only
  after `accepted_evidence_lifecycle_fixture` passes.

- Completion gate honesty: a contract claim only after
  `verification_gate_completion_fixture` passes including the
  v5.1 truth-table columns and the boundary violations
  (clean with skipped; dirty without skipped).

- Force-close lifecycle: a contract claim only after
  `forced_close_lifecycle_fixture` passes.

- Run lifecycle state machine: a contract claim only after
  `run_lifecycle_state_machine_fixture` passes.

- Decision_ref primary target: a contract claim only after
  `decision_ref_primary_target_fixture` passes.

- Durable acceptance event: a contract claim only after
  `durable_acceptance_event_fixture` passes.
```

Until each fixture passes, the corresponding claim is a goal, not a contract claim. The two adapter proof claims are not interchangeable: a passing `adapter_packet_portability_fixture` does not establish `runtime_agnosticism_claim`.

## One-Screen Summary

Atelier is not trying to be the best coding agent.

Atelier is the layer around coding agents that manages project artifacts:

```txt
Human Product Owner
  -> intent / ideal / contract
Atelier
  -> context / checks / prompts / traces / verification / handoff
Agent Runtime
  -> code edits / shell / tool execution
Repository
  -> tests / diffs / traces / artifact graph / verification records
Atelier
  -> reconcile / summarize / transform / expose to human
```

Current wedge:

```txt
Attention Management v1
  + Verification Schema v0
  + Generic Runtime Packet Export (Stage 0)
  = context plan + required verification map + completion honesty
    + cross-runtime packet portability proof
```

Durable product:

```txt
Artifact Graph Kernel
  + Transformation Plane
  + Human Product Owner UI
```

Long-term coordination:

```txt
Runtime Adapter Plane + Swarm Coordination
```

## Three Artifact Classes

Every artifact belongs to exactly one class. The class determines placement, ownership, deletion behavior, and acceptance.

```txt
Source Artifact:
  Authored or externally meaningful repository material.
  Lives anywhere in the repository except .atelier/.

Accepted Durable Evidence:
  Verification records, review records, accepted decisions, accepted
  transformation receipts. Lives in the repository, outside .atelier/.
  Promoted only by an explicit acceptance event.

Derived State:
  Generated resolution, cache, index, trace, or debug output.
  Lives exclusively under .atelier/.
  Regenerable. Must not be the only place product truth exists.
```

The class boundary is an acceptance event, not a file extension or path prefix. The detailed class rules are in `GRAPH_SEMANTICS.md` §2.

## Active Product Claims

- Atelier is a repository-native artifact alignment layer for agentic software development.
- Atelier is runtime-agnostic by design. The runtime-agnosticism claim becomes a contract claim only after `adapter_runtime_parity_fixture` passes for at least one pair of real runtime adapters. Stage 0 (packet portability) is a separate, weaker claim, gated on `adapter_packet_portability_fixture`. The two are not interchangeable.
- The repository remains the source of truth.
- `.atelier` is derived state only.
- Accepted durable evidence lives in the repository, not under `.atelier`.
- Attention Management is the first implementation slice, paired with Verification and Generic Runtime Packet Export.
- Artifacts are not destroyed by transformation.
- Transformations require provenance, maturity transitions, and an acceptance event.
- External runners remain replaceable.
- Adapters must pass the parity fixture in `ADAPTER_CONTRACT.md`.
- Verification beats trust.
- Completion is gate-evaluated, not file-existence-evaluated.
- The completion truth table lives in `VERIFICATION_SCHEMA.md` §8; lifecycle consequence lives in `contract.md` §16.
- `completed_dirty` is `terminal_non_success_reviewable`. It is terminal, honest, and reviewable, but not a success state. Only `completed_clean` is `terminal_success`. The other three closure states (`completed_dirty`, `run_blocked_terminal`, `forced_closed`) are non-success variants.
- A run in `run_blocked_terminal` state may be force-closed by an explicit user action. Force-close emits `run_forced_closed`; it does not emit any `run_completed_*` event. A run in `blocked_waiting` may not be force-closed directly; it must first transition to `run_blocked_terminal` via gate evaluation.
- Human product owner judgment remains explicit.
- The UI must not imply verification that does not exist. The HPO state model is in `HPO_STATE_MODEL.md`.
- Resolution decisions are recorded. The decision record schema is in `contract.md` §10a.
- The artifact graph hash is byte-identical on regeneration from a committed fixture.
- Deleting `.atelier` does not delete product truth.
- Move and rename are tracked as `moved/supersedes` relations, not as new identity mints.
- Adapter output has a per-field class split (runtime_observation, verification_record_candidate, accepted_verification_record, trace, diff_summary). The split is in `ADAPTER_CONTRACT.md` §10.
- Events are the backbone of provenance, maturity, lifecycle, and acceptance. The event model is in `EVENT_MODEL.md`. The `artifact_accepted` event type and the `accepts` graph edge kind are the matched pair that promotes candidates to durable evidence; both must be present, linked by `correlation_id`.

## LLM-Readable Run Packet Order

Normal runners should read run packet files in this order:

```txt
handoff.md
brief.md
plan.md
context.md
verification.md
review.md
worklog.md
artifacts.md
```

`manifest.json` is not part of the normal LLM reading order. Manifest-like state belongs to debug/provenance and should be inspected only as a last resort.

## Plane Model

```txt
Atelier
  = Artifact Plane
  + Attention Plane
  + Transformation Plane
  + Knowledge Plane
  + Governance Plane
  + Verification Plane
  + Task / Product Plane
  + Swarm Coordination Plane
  + Runtime Adapter Plane
  + Human Product Owner UI
```

The Runtime Adapter Plane is the canonical name. The prior "Agent Runtime Plane" wording is retired.

## Current Non-Goals

Atelier is not:

- a standalone coding agent;
- an IDE replacement;
- a CI replacement;
- a generic chatbot;
- a vector database;
- a hidden autonomous runtime;
- a runtime-specific wrapper;
- a Markdown-only documentation system;
- a task manager with extra steps;
- a context packer with ambitions.

Atelier may integrate with all of those categories, but its durable boundary is repository-native artifact alignment for agentic software development.

## v5 Revision Notes

- Bumped spec pack version to v5. Three new normative subcontracts added: `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, `HPO_STATE_MODEL.md`.
- Document authority section collapsed to a pointer at `contract.md` §2 (four-class conflict resolution). Filename casing is declared intentional and does not encode authority.
- "Current MVP" updated to the narrow end-to-end loop: task -> context plan -> generic packet -> external runner result -> verification record -> completed_clean|completed_dirty|run_blocked_terminal|forced_closed -> accepted evidence lifecycle.
- "Current wedge" updated to "Attention + Verification + Generic Runtime Packet Export" with the cross-runtime parity proof as a load-bearing claim.
- "Active Product Claims" updated: runtime-agnosticism now gated on adapter parity fixture; `completed_dirty` guardrail added; `run_forced_closed` rule added; resolution decision record rename noted; adapter output class split referenced; event model referenced.
- "Current Proof Status" block added: lists which claims are product goals vs contract claims, with the gating fixture for each.
- Stable `## Document Map` reformatted into four sections: philosophy root, normative hub, schema subcontracts, surface contract. The full v5 pack is thirteen documents.

## v5.1 Revision Notes

- §"Current Proof Status" rewrites the runtime-agnosticism claim into two distinct proof levels: `packet_portability_claim` (Stage 0) and `runtime_agnosticism_claim` (Stage 1). The two are not interchangeable. The section also lists the new v5.1 fixtures required for the load-bearing claims.
- §"Current MVP" loop signature updated to the v5.1 closure states: `completed_clean | completed_dirty | run_blocked_terminal | forced_closed`. The "accepts event" wording in the loop is replaced with "artifact_accepted event" to match the v5.1 event vocabulary.
- §"Current wedge" description softens the "cross-runtime adapter parity proof" wording to "cross-runtime packet portability proof" to reflect the Stage 0 → Stage 1 split.
- Lead of §"Current Proof Status" softens "implementation-grade" to "intended to become implementation-grade" until the named fixtures pass.
- §"Active Product Claims" runtime-agnosticism bullet is rewritten to distinguish the two proof levels. The `completed_dirty` bullet is updated to use the v5.1 `terminal_non_success_reviewable` terminology. The force-close bullet now distinguishes `run_blocked_terminal` (force-close permitted) from `blocked_waiting` (force-close forbidden). The events bullet now mentions the matched `artifact_accepted` + `accepts` pair.
