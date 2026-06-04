---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-spec-immutability-gap-protocol
title: Atelier Spec Immutability And Gap Protocol
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Spec Immutability And Gap Protocol

## Product-Spec Immutability Rule

Files under `harness/knowledge/product-specs/atelier/**` are immutable during implementation. Agents may read, cite, and derive work from these specs. Agents must not edit, rewrite, patch, normalize, reformat, rename, move, or “improve” them.

Every packet review must run the no-product-spec-edit gate from `VALIDATION_GATE_REGISTRY.md`.

The launch baseline is `HEAD`, not the current filesystem, unless a separate product-spec governance process has committed an authorized new baseline. Current filesystem product-spec drift is a P0 launch blocker and cannot be blessed by implementation-control repair.

## Authority Precedence

Use the conflict classes from `contract.md` §2:

| Conflict Class | Resolution |
|---|---|
| product_direction_conflict | Unresolved until Ideal and/or contract are explicitly revised by product authority; implementation records blocker |
| implementation_behavior_conflict | `contract.md` wins unless a narrower schema subcontract owns the domain |
| graph_kernel_schema_conflict | `GRAPH_SEMANTICS.md` wins |
| schema_subcontract_conflict | Narrow schema file wins for its owned domain |

`ROADMAP.md` wins for execution order. `POSITIONING.md` is strategic and does not override behavior. `CONTRACT_TEST_MATRIX.md` owns coverage and fixture obligations. `EXAMPLES.md` owns golden flow shape.

## Ambiguity Classification

| Ambiguity Type | Definition | Action |
|---|---|---|
| naming_ambiguity | Name differs but behavior is clear | Use `SURFACES.md` or domain schema; record assumption if visible |
| scope_ambiguity | Claim does not define exact path/module/surface | Choose narrowest implementation that satisfies assigned invariant |
| oracle_ambiguity | Expected test result cannot be derived | Record oracle gap; create fixture placeholder only if expected behavior is stated elsewhere |
| phase_ambiguity | Behavior exists but phase is unclear | Use `ROADMAP.md`; continue later-phase work only when dependencies unlock |
| authority_ambiguity | Two specs appear to own same decision | Classify conflict using `contract.md` §2 before implementing |

## Contradiction Classification

| Contradiction Type | Definition | Action |
|---|---|---|
| direct_normative_conflict | Two normative specs require incompatible behavior | Apply authority precedence; if no winner, block affected invariants |
| example_contract_conflict | Golden example differs from schema/contract | Schema/contract owns behavior; record example gap unless example owns flow shape and schema is silent |
| roadmap_contract_conflict | Roadmap sequence implies behavior contract forbids | Contract wins for behavior; roadmap wins only for order; record gap |
| surface_behavior_conflict | Surface name spec conflicts with behavior spec | `SURFACES.md` wins names; behavior spec wins semantics |
| test_oracle_conflict | Test matrix expected result conflicts with domain schema | Domain schema wins behavior; matrix gap recorded |

## Safe Assumption Protocol

When the spec allows multiple interpretations, choose the narrowest behavior that:

- preserves repository ownership;
- preserves `.atelier` as derived state;
- avoids runtime lock-in;
- avoids writing product specs;
- avoids expanding Atelier into an agent runtime;
- satisfies the highest-authority applicable spec;
- can be tested or fixture-backed.

Record the assumption outside product specs with:

```yaml
assumption_id: asm-<date>-<slug>
date: <RFC3339 date>
agent: <mother or subagent id>
affected_invariants:
  - <AT-INV-*>
affected_dag_nodes:
  - <DAG-*>
source_specs:
  - <path#section>
ambiguity_type: <type>
chosen_interpretation: <narrow behavior>
why_safe: <short rationale>
validation: <test/fixture/gate>
expiry: <phase, gate, or condition>
```

Safe assumptions must expire no later than the phase gate they affect. An assumption cannot authorize public surface claims, runtime-agnosticism claims, proof-status claims, product-spec baseline changes, or final completion.

## Severity Normalization

Use P-severity as the canonical blocker vocabulary. Gate severity and dispatch impact map to P-severity as follows:

| P Severity | Gate Severity | Blocker Scope | Dispatch Effect |
|---|---|---|---|
| P0 | fatal | launch_blocking or final_completion_blocking | Blocks all ordinary implementation packets; control repair/discovery may continue only when it does not touch product specs/product code |
| P1 | high | phase_blocking or frontier_blocking | Blocks affected DAG nodes and phase gates; independent discovery/control work may continue |
| P2 | medium | track_blocking or local | Blocks affected packet/track; does not block unrelated DAG nodes |
| P3 | low | advisory | Records risk; cannot satisfy acceptance alone |

Product-spec drift is always P0. Immutable control-doc unauthorized drift is P0 for ordinary packet acceptance. Missing structured gate records or missing section-level traceability are P1 until repaired.

## Product-Spec Drift Record Format

Record product-spec drift checks outside product specs:

```yaml
record_id: <stable id>
gate_ids: [VG-001, VG-036]
baseline_source: HEAD
baseline_revision: <git rev-parse HEAD>
commands:
  - command: git diff --name-status -- harness/knowledge/product-specs/atelier
    output: <empty or exact output>
  - command: git diff --cached --name-status -- harness/knowledge/product-specs/atelier
    output: <empty or exact output>
  - command: git status --porcelain=v1 -- harness/knowledge/product-specs/atelier
    output: <empty or exact output>
  - command: git diff --name-status HEAD -- harness/knowledge/product-specs/atelier
    output: <empty or exact output>
hash_comparison:
  - path: <product spec path>
    head_sha256: <sha>
    current_sha256: <sha>
    status: match | drift
result: passed | failed
blocker_opened: <blocker id or null>
```

## No-Assumption Conditions

Do not assume when:

- behavior would require editing product specs;
- no validation oracle can be defined from any spec;
- two highest-authority specs in the same domain conflict;
- the choice would create a new product surface;
- the choice would make a future runtime adapter impossible;
- the choice would make `.atelier` product truth;
- the choice would turn dirty/blocked/forced states into success;
- the choice would silently promote generated artifacts.

Record a blocker instead.

Blocked executable invariants prevent full completion. A blocker can pause or split work, but it cannot satisfy `PG-F` unless a product-authorized spec revision or explicit deferred waiver removes that invariant from the current full-build scope.

## Deferral, Blocker, Waiver Distinction

These are distinct state names; they are not interchangeable.

| State | Definition | Effect on completion |
|---|---|---|
| `deferred_until_phase` | Spec or matrix explicitly defers the claim to a later phase | Not blocking that phase; blocking for full completion until the phase passes |
| `blocked_by_missing_fixture` | Implementation blocked because fixture/oracle is not yet defined | Blocks acceptance; cannot satisfy completion |
| `blocked_by_product_gap` | Implementation blocked because product spec is silent or contradictory | Blocks acceptance; cannot satisfy completion without a product-authorized revision |
| `waived_by_product_governance` | A product owner granted a time-bounded waiver | Does not satisfy completion unless the waiver is recorded with owner, expiry, scope, and allowed public claim, and the claim is removed from full-build scope |

Waivers are owner-bounded and time-bounded. A waiver without an owner, expiry, scope, and allowed public claim is invalid and treated as `blocked_by_product_gap`.

## Waiver Record Format

```yaml
waiver_id: wvr-<date>-<slug>
date: <RFC3339>
granted_by: <product owner id or human>
scope: <which claim or invariant is waived>
allowed_public_claim: <what may still be claimed in public material>
expiry: <phase gate, calendar date, or condition>
affected_invariants:
  - <AT-INV-*>
affected_dag_nodes:
  - <DAG-*>
source_specs:
  - <path#section>
rationale: <why the waiver is safe>
status: active | retired | expired
```

A waiver is the only mechanism that can authorize a `pending_command_implementation` to satisfy a phase gate, and even then only for the explicit claim recorded in `allowed_public_claim`. A waiver never satisfies a P0 launch blocker or product-spec immutability.

## Blocker Reporting Format

Blockers live outside product specs in `IMPLEMENTATION_LEDGER.md` and/or `harness/knowledge/implementation-control/atelier/state/blockers/**`.

```yaml
blocker_id: blk-<date>-<slug>
date: <RFC3339 date>
reported_by: <agent id>
classification: spec_contradiction | spec_ambiguity | missing_oracle | impossible_requirement | forbidden_spec_edit_required | product_spec_drift | control_doc_drift
severity: P0 | P1 | P2 | P3
blocking_scope: launch_blocking | final_completion_blocking | phase_blocking | frontier_blocking | track_blocking | local | advisory
affected_invariants:
  - <AT-INV-*>
affected_dag_nodes:
  - <DAG-*>
source_specs:
  - <path#section>
description: <what is blocked>
evidence: <quoted spec sections or validation output>
safe_interpretation_available: false
independent_work_to_continue:
  - <DAG-*>
human_escalation_required: true | false
```

## Continuing Independent Tracks

After recording a blocker, the mother agent must recompute the DAG frontier and dispatch any node whose dependencies are not blocked. A blocked adapter parity claim does not block graph, transformation, or HPO state work unless those nodes depend on runtime agnosticism. A blocked HPO UI label does not block verification engine work. A blocked write-authority fixture does not block read-only context planning.

Spec contradiction blockers freeze only affected invariants and dependent DAG nodes. Independent DAG nodes continue. Human escalation is required only when the entire dependency frontier is blocked.

## Preventing Silent Spec Changes

Every packet must include product-specs in forbidden files. Every handoff must report `product_specs_touched: false`. Every packet acceptance must run VG-001 and VG-036. Any product-spec diff, staged change, status entry, or hash drift relative to the `HEAD` baseline is a hard rejection unless the user explicitly authorized product-spec editing outside this implementation program and committed the authorized revision before implementation launch.

## Control-Doc-Repair Packet Type

The `control-doc-repair` packet type is the only authorized way to mutate immutable implementation-control core docs. It is defined in detail in `SUBAGENT_ROLE_CATALOG.md` and `IMPLEMENTATION_ORCHESTRATOR.md`. The protocol summary is:

- Dispatch mode: mother agent direct. Subagent dispatch is forbidden.
- `allowed_files`: exact immutable control-doc paths the packet will edit.
- `forbidden_actions`: the closed list of ten items in `IMPLEMENTATION_ORCHESTRATOR.md` (weakening gates, deleting dependencies, broadening completion criteria, relaxing product-spec immutability, adding compatibility aliases for removed commands, broadening fixture scope without matrix-backed reason, narrowing expected diff shape, downgrading blocker severity without evidence, converting executable requirements into assumptions, allowing pending commands to satisfy phase gates).
- `required_review`: mother-agent authority audit recorded in the ledger under `state/validations/at-ctrl-XXX-acceptance-2026-06-04.md`.
- `audit_proof_ref`: path to the before/after authority audit record.

A `control-doc-repair` packet must run `VG-037` (immutable control-doc diff check) before and after its edits, must record the before/after authority audit, and must run `VG-038` (test-integrity / no-weakening) on its own diff.

## Traceability Preservation

Implementation artifacts must reference invariant IDs, and invariant IDs must reference product specs. Tests and fixtures must use the abstract fixture names from `CONTRACT_TEST_MATRIX.md`. Product behavior without an invariant ID is untraced and must be removed, reclassified as infrastructure support, or blocked pending matrix update outside product specs.
