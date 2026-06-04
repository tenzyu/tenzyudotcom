---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-contract
title: Atelier Contract
status: active
pattern: simple
tags:
  - product:atelier
  - subject:contract
  - domain:harness
  - layer:product
  - criticality:fatal
  - status:active
affordances:
  declared:
    - context
    - check-candidate
    - review-candidate
    - test-source
---

# Atelier Contract

## 1. Status and Authority

This document is the normative product and behavior contract for Atelier.

`Ideal.md` defines why Atelier exists. This document defines the durable behavior that implementation, tests, CLI output, MCP tools, GUI text, adapters, run packets, and generated next actions must satisfy.

Companion documents, all normative in their own domain:

- `GRAPH_SEMANTICS.md` — artifact graph kernel schema, identity, kinds, edge compatibility, class model, two-tier catalog, graph authority, graph validation.
- `SURFACES.md` — single source of truth for active command names, removed command names, MCP tool names, GUI labels, generated prompt surfaces, adapter output surfaces, README usage examples, and parity scope.
- `ADAPTER_CONTRACT.md` — canonical packet schema, runtime capability descriptors, round-trip rule, parity fixture, semantic equivalence oracle, forbidden adapter behavior.
- `CONTRACT_TEST_MATRIX.md` — coverage rule, tests to add first, currently testable claims, claims not yet testable, waiver log.
- `EXAMPLES.md` — six golden flows: Context plan, Verification and completion states, Markdown-to-Check transformation, Adapter parity, Forced close, Accepted evidence lifecycle.
- `VERIFICATION_SCHEMA.md` — check registry, verification record schema, required verification map derivation, status lattice, reason codes, hard-block definition, completion truth table.
- `EVENT_MODEL.md` — event identity, event payload invariants, durability, replay, redaction, accept/reject event schema.
- `HPO_STATE_MODEL.md` — HPO state labels, required evidence per state, forbidden UI claims, allowed human actions.

If implementation conflicts with this document, implementation is wrong.

If tests conflict with this document, either the tests are wrong or this document must be explicitly revised.

If README, ROADMAP, or POSITIONING conflicts with this document on behavior, this document wins, except where document precedence assigns a higher authority (see §2).

If this document conflicts with `Ideal.md`, do not silently let this document win. Treat the conflict as a product-design decision and revise one or both documents explicitly.

If this document conflicts with `GRAPH_SEMANTICS.md`, `SURFACES.md`, `ADAPTER_CONTRACT.md`, `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, or `HPO_STATE_MODEL.md` on a domain those documents own, those documents win in their domain. The normative authority of each companion document is in its `Scope and Authority` section and is enforced by the four-class conflict resolution in §2.

## 2. Document Precedence and Conflict Resolution

Authority is resolved by four conflict classes. A cross-document conflict must be classified before precedence is applied.

### 2.1 The Four Conflict Classes

```txt
1. product_direction_conflict
   A conflict between Ideal.md and any other document on product direction.
   Resolved by: unresolved until Ideal.md and/or contract.md is explicitly revised.

2. implementation_behavior_conflict
   A conflict between this contract and any referenced normative subcontract on
   runtime behavior, lifecycle consequence, or testable claim.
   Resolved by: contract.md wins unless a referenced normative subcontract has
   narrower authority over the disputed domain.

3. graph_kernel_schema_conflict
   A conflict over kind catalogs, edge compatibility, graph authority,
   graph-derived resolution, hash rules, regeneration rules, or staleness rules.
   Resolved by: GRAPH_SEMANTICS.md wins.

4. schema_subcontract_conflict
   A conflict between contract.md and a schema subcontract on a domain the
   subcontract owns.
   Resolved by: the narrower schema file wins for its owned domain:
     VERIFICATION_SCHEMA.md  -> check registry, verification records,
                                status lattice, reason codes, hard-block,
                                completion truth table
     EVENT_MODEL.md          -> event identity, payload invariants,
                                durability, replay, redaction,
                                accept/reject event shape
     ADAPTER_CONTRACT.md     -> canonical packet, canonical result,
                                semantic equivalence, parity fixture,
                                forbidden adapter behavior
     SURFACES.md             -> CLI/MCP/GUI surface names, parity test scope,
                                removed-command list
     HPO_STATE_MODEL.md      -> HPO state labels, required evidence,
                                forbidden UI claims, allowed human actions
     GRAPH_SEMANTICS.md      -> graph kernel schema (handled by class 3)
```

### 2.2 Document Precedence Chains

For product direction:

```txt
Ideal.md > contract.md > POSITIONING.md > ROADMAP.md > README.md
```

For implementation correctness:

```txt
contract.md > tests > implementation > README.md > ROADMAP.md > POSITIONING.md
```

For execution planning:

```txt
ROADMAP.md > task artifacts > run packets > work orders
```

For market and strategic positioning:

```txt
POSITIONING.md
```

For human onboarding:

```txt
README.md
```

For domain-internal authority inside the contract pack:

```txt
GRAPH_SEMANTICS.md        > this contract, on graph kernel schemas
VERIFICATION_SCHEMA.md    > this contract, on check registry, status, completion truth table
EVENT_MODEL.md            > this contract, on event identity and payload invariants
SURFACES.md               > this contract, on surface names and labels
ADAPTER_CONTRACT.md       > this contract, on adapter behavior
HPO_STATE_MODEL.md        > this contract, on HPO state and allowed actions
CONTRACT_TEST_MATRIX.md   > this contract, on test coverage
EXAMPLES.md               > this contract, on golden flow shape
```

`contract.md` is the normative hub for cross-system behavior. Each schema subcontract owns one domain and wins in that domain under the four-class rules.

## 3. Product Definition

Atelier is a repository-native artifact alignment layer for agentic software development.

It is runtime-agnostic. It treats implicit knowledge, Markdown, tests, checks, skills, linters, roles, permissions, hooks, tasks, product specs, traces, verification records, reviews, prompts, handoffs, source files, and configuration as graph-managed project artifacts.

Atelier resolves attention, manages artifact transformations, preserves provenance, verifies outcomes, and presents decisions.

Atelier does not directly own coding agent execution.

Atelier is not merely a context planner. Attention Management is one plane of the product, not the whole product. Attention Management v1 means a context plan plus a required verification map, not a prompt generator.

## 4. Core Vocabulary

### 4.1 Artifact

An artifact is any repository-relevant object that Atelier can observe, classify, relate, resolve, transform, verify, or present.

Artifacts must retain source identity. A transformation may derive a new artifact from an old one, but must not erase the old artifact or make its origin unknowable.

### 4.2 Artifact Identity

Artifact identity is decoupled from location. The identity scheme is defined in `GRAPH_SEMANTICS.md` §3.

A primary identity is the explicit authored id from the artifact's frontmatter. A secondary identity is `kind + scope + slug` for artifacts without an explicit id. Location is a mutable observation, not identity, except for path-owned source artifacts. Content hash may identify ephemeral artifacts but must not become durable identity unless the artifact is accepted.

Move and rename are tracked as `moved/supersedes` relations, not as new identity mints.

### 4.3 Artifact Authority

Authority is the level at which an artifact is allowed to influence the product. The five-level scale, conflict resolution, and precedence by kind are defined in `GRAPH_SEMANTICS.md` §7. The numeric authority scale applies only to `graph_kernel_schema_conflict` (§2.1 class 3). Cross-document governance is not resolved by that scale.

### 4.4 Three Artifact Classes

Every artifact belongs to exactly one of:

```txt
source                  authored or externally meaningful repository material
accepted_durable_evidence
                        result of an acceptance event that the repository
                        has chosen to keep outside .atelier/
derived                 generated resolution, cache, index, trace, or debug
                        output; lives under .atelier/
```

The class boundary is defined by an explicit acceptance event, not by file extension or path prefix. The class rules, placement rules, ownership rules, and deletion rules are defined in `GRAPH_SEMANTICS.md` §2.

### 4.5 Product Truth

Product truth is the set of source artifacts plus accepted durable evidence that, taken together, allow the repository to be rebuilt to a contract-compliant state without consulting `.atelier/`.

Product truth is recoverable. Derived state is not. Deleting `.atelier/` does not delete product truth.

### 4.6 Durable Evidence

Durable evidence is the subset of accepted durable evidence that the repository has chosen to keep after an acceptance event: verification records, review records, accepted decisions, accepted transformation receipts, contract revisions, and roadmap revisions.

Durable evidence must be discoverable without `.atelier/`.

### 4.7 Derived State

Derived state is generated resolution, cache, index, trace, or debug output that lives exclusively under `.atelier/`.

Derived state may be regenerated. Derived state must not be the only place product truth exists.

Adapter output has its own class split. The classes below extend §4.4 with adapter-derived material. An adapter observation, a candidate verification record, a captured trace, and a captured diff summary are derived by default. They become durable evidence only through an explicit acceptance event. The full adapter output class split is in `ADAPTER_CONTRACT.md` §10.

### 4.8 Resolution Decision

A resolution decision is a recorded judgment made by the Attention Plane whenever a selection requires explanation. The selection may be deterministic, model-assisted, or hybrid. The decision must record how the selection was made. The schema is in §10a.

The term "resolution decision" replaces the older "semantic decision" wording. "Semantic" is reserved for non-deterministic or model-assisted selection; deterministic and hybrid are also resolution decisions.

### 4.9 Accepted Artifact

An accepted artifact is an artifact that has crossed an acceptance event and has been promoted out of the proposal or candidate state into durable evidence.

The acceptance event, the accepting actor, the acceptance evidence, and the receipt are recorded per the transform maturity transition rules in §8a and the event shape in `EVENT_MODEL.md`.

### 4.10 Enforced Artifact

An enforced artifact is an accepted, deterministic artifact that has been registered to a check, hook, linter, policy, CI step, or completion gate with an explicit enforcement mechanism and severity.

### 4.11 Task

A task is a durable work item or product-intent artifact. A task is not a run. A task represents what should be done or decided.

### 4.12 Run

A run is a portable, resumable work packet for an external runner. A run is not the external runtime. A run does not prove completion by existing.

### 4.13 Context Plan

A context plan is a read-only attention-resolution output. It does not create tasks, create runs, mutate repository files, launch agents, or complete work.

### 4.14 External Runner

An external runner is any system that performs work outside Atelier's direct runtime ownership. Examples: Codex, opencode, ChatGPT, Gemini, Claude Code, local scripts, human operator, CI job.

### 4.15 Adapter

An adapter is the translator between a canonical packet and a runtime-shaped packet. Adapters are owned by the Runtime Adapter Plane. Adapter behavior, capability descriptors, round-trip rules, semantic equivalence oracle, and forbidden behavior are defined in `ADAPTER_CONTRACT.md`.

## 5. Plane Model

Atelier behavior is divided into planes. The planes are conceptual boundaries and may share implementation modules, but they must not be collapsed semantically.

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

The Runtime Adapter Plane replaces the prior "Agent Runtime Plane" wording. The plane does not own execution; it translates between the canonical packet and a runtime-shaped packet. Detailed adapter obligations are in `ADAPTER_CONTRACT.md`.

### 5.1 Artifact Plane Contract

The Artifact Plane must observe source artifacts without destroying them.

It may produce derived graph state.

It must preserve artifact identity, kind, path, hash, ownership, authority, and relation information when available. The detailed node and edge schemas are defined in `GRAPH_SEMANTICS.md`.

### 5.2 Attention Plane Contract

The Attention Plane must compute what to read for a task-specific context.

It must support deterministic selection where possible.

It may use semantic judgment, but every resolution decision must be traceable through the resolution decision record schema in §10a.

It must not use uncontrolled relation expansion that causes context bloat. A context plan must report the budget impact of every decision in the budget units defined in §10.

### 5.3 Transformation Plane Contract

The Transformation Plane must not silently promote generated artifacts into accepted project truth.

It must distinguish candidates, proposals, accepted artifacts, deterministic artifacts, and enforced artifacts.

It must preserve provenance from source artifact to derived artifact across every maturity transition.

The maturity transition rules are defined in §8a.

### 5.4 Knowledge Plane Contract

Knowledge artifacts may afford transformations, but they do not directly emit final checks, skills, hooks, tasks, or policies without maturity steps.

Knowledge body remains natural language unless explicitly transformed into a deterministic artifact.

Frontmatter should index, route, constrain, and relate knowledge. It should not duplicate the full meaning of the body.

### 5.5 Governance Plane Contract

Governance artifacts define permissions, policies, roles, hooks, forbidden behavior, boundaries, and risk actions.

Governance should make unsafe or contract-breaking changes mechanically visible.

Governance must not hide mutations from the repository.

The minimum policy decision shape is normative. A `policy_decision` contributes to the completion gate per `VERIFICATION_SCHEMA.md` §Hard-Block.

```txt
policy_decision:
  decision_id:   string
  policy_id:     string
  subject_id:    artifact_id | run_id | task_id | event_id
  severity:      enum[block | warn | info]
  reason:        string
  emitted_by:    actor_id | adapter_id | check_id
  emitted_at:    timestamp
  evidence_refs: array[artifact_ref]
  active:        boolean
```

A `policy_decision` with `severity=block` and `active=true` contributes to `hard_block` (defined in `VERIFICATION_SCHEMA.md`).

Full policy schema is deferred. This contract only defines the minimum shape required for completion gating.

The policy registry term referenced in the `VERIFICATION_SCHEMA.md` §3 derivation formula is a **Phase C** placeholder. The required verification map derivation in v5.1 ships with `task_acceptance_criteria` and `check_registry.bindings` only. The policy registry term is a placeholder until `POLICY_SCHEMA.md` exists; it contributes zero entries to the v5.1 map.

### 5.6 Verification Plane Contract

Verification artifacts include tests, checks, linters, review records, verification records, and completion gates.

The check registry, verification record schema, required verification map derivation, status lattice, reason codes, hard-block definition, and completion truth table are normative and live in `VERIFICATION_SCHEMA.md`. This contract defers to that document on status semantics.

A runner must not claim verification was performed when it was not. The lifecycle consequence of the gate is in §16.

### 5.7 Task / Product Plane Contract

Product specs, contracts, roadmaps, and tasks must remain distinct.

Tasks may be derived from product specs.

Runs may be materialized from tasks.

Task closure must not imply run completion. The task lifecycle is defined in §11.

### 5.8 Swarm Coordination Plane Contract

Swarm coordination may route subtasks to multiple agents or roles.

Subagents may be cheap, specialized, bounded, or read-only.

No subagent output becomes product truth without artifact provenance and appropriate maturity.

### 5.9 Runtime Adapter Plane Contract

The Runtime Adapter Plane resolves, connects, and observes external runtimes.

It must not make Atelier the only valid runtime.

It must not collapse external execution into hidden Atelier-owned state.

Adapter inputs, outputs, capability descriptors, round-trip rules, parity rules, semantic equivalence oracle, and forbidden behavior are defined in `ADAPTER_CONTRACT.md`.

### 5.10 Human Product Owner UI Contract

The UI must present product truth, drift, risk, evidence, verification, roadmap state, and unresolved decisions.

It must not imply that unverified work is verified.

It must prefer actionable summaries over decorative dashboards.

The HPO state labels, the required evidence per state, the forbidden UI claims, and the allowed human actions are normative and live in `HPO_STATE_MODEL.md`. The lifecycle states referenced in `POSITIONING.md` §6 and in `ROADMAP.md` Phase 4 are projections of that document.

## 6. Artifact Graph Contract (Invariant)

The Artifact Graph is the central mechanism of the product. Its kernel is defined in `GRAPH_SEMANTICS.md`.

Atelier must treat project-relevant artifacts as graph nodes and relations as graph edges.

Invariants:

- Node identity, edge identity, edge direction, allowed endpoint kinds, hash rules, determinism rules, regeneration rules, and stale detection rules are defined in `GRAPH_SEMANTICS.md`. This contract defers to that document.
- The graph must support source artifacts and derived artifacts.
- The graph must support provenance.
- The graph must be deterministic for unchanged input.
- The graph must be regenerable from repository artifacts plus documented external inputs.
- A reproduction of the graph from a committed fixture must produce a byte-identical graph hash. The golden fixture is described in `CONTRACT_TEST_MATRIX.md` §2.1.

## 7. `.atelier` Derived State Contract

`.atelier/` is the home for derived state only.

Allowed contents include:

```txt
.atelier/graph/**
.atelier/indexes/**
.atelier/context/**
.atelier/runs/**
.atelier/traces/**
.atelier/cache/**
.atelier/debug/**
```

`.atelier/` may contain artifact graph snapshots, context resolution traces, run provenance, working run packets, working handoffs, context hashes, debug manifests, runtime capability caches, generated indexes, and transform proposal indexes. Packet and handoff durability are defined in `RUN_PACKET_MODEL.md`.

`.atelier/` must not be the only place product truth exists.

The three-class boundary is normative. Verification records, accepted decisions, accepted handoffs, terminal verification summaries, and accepted transformation receipts belong in the repository outside `.atelier/`, not under it. Write authority for promotion is defined in `WRITE_AUTHORITY_MATRIX.md`.

Deleting `.atelier/` may lose cache and debug detail, but it must not delete the canonical product ideal, contract, tasks, source artifacts, accepted specs, or verification records that are intended as durable repository truth. The deletion and regeneration fixture is described in `CONTRACT_TEST_MATRIX.md` §2.3.

## 8. Transform Maturity Contract

Atelier must not treat all transformations as final.

Transformations use this maturity model:

```txt
Level 0: Source Artifact
  The artifact exists as authored or externally meaningful project material.

Level 1: Resolved Artifact
  Atelier has identified, classified, related, or indexed the artifact.

Level 2: Transform Candidate
  The artifact appears able to produce another artifact representation.

Level 3: Proposed Artifact
  A draft transformation exists.

Level 4: Accepted Artifact
  A human, contract, validator, or accepted policy has approved the transformation.
  An acceptance event has been recorded with an accepting actor and acceptance evidence.

Level 5: Deterministic Artifact
  The artifact can run, verify, or be referenced without LLM interpretation.
  The artifact's output schema and content hash are stable.

Level 6: Enforced Artifact
  The artifact has active force through a check, linter, hook, CI, policy, permission,
  or completion gate, with explicit mechanism and severity.
```

No implementation may skip from Level 0 or Level 1 to Level 6 without preserving provenance and acceptance evidence.

LLM-inferred transformations are proposals unless explicitly accepted.

## 8a. Transform Transition Rules

Maturity transitions are governed by the following rules. The transition model is normative; the level labels are descriptive.

### 8a.1 Allowed Transitions

```txt
0 -> 1
1 -> 2
2 -> 3 (with proposal evidence)
3 -> 4 (with acceptance actor and acceptance evidence)
4 -> 5 (with deterministic output schema and stable content hash)
5 -> 6 (with enforcement mechanism and severity)
```

### 8a.2 Forbidden Transitions

```txt
0 -> 6, 1 -> 6: level jumps are rejected.
0 -> 5, 1 -> 5: level jumps are rejected.
2 -> 4, 2 -> 5, 2 -> 6: missing proposal stage is rejected.
3 -> 5, 3 -> 6: missing acceptance is rejected.
4 -> 6: missing deterministic stabilization is rejected.
```

### 8a.3 Required Evidence per Transition

```txt
0 -> 1: source artifact presence and identity.
1 -> 2: candidate rule and target kind.
2 -> 3: draft artifact, content hash, source section reference.
3 -> 4: accepting actor, acceptance evidence, receipt id.
4 -> 5: deterministic output schema, content hash, path in durable location.
5 -> 6: enforcement mechanism, severity, registration actor.
```

### 8a.4 Accepted Actors

Acceptance at Level 3 -> 4 may be performed by:

```txt
- a human with a designated reviewer role;
- a contract clause that names the artifact and the rule;
- a registered validator that produces a verification record;
- an accepted policy that names the artifact and the rule.
```

A generic LLM prompt is not an accepted actor. A "validator" without a verification record is not an accepted actor.

### 8a.5 Validator Identity

A validator must be a registered check, hook, or policy with a stable id and a verification record path. A validator without a record is invalid for acceptance.

### 8a.6 Rollback Semantics

A transition from Level 4 to Level 5 or Level 6 may be rolled back to Level 4 by removing the deterministic output or removing the enforcement registration. The rollback event must be recorded as a new transition with reason and accepting actor.

A transition from Level 3 to Level 4 may be revoked by the accepting actor or by a higher-authority artifact. The revocation must be recorded.

## 9. Knowledge Contract

Knowledge artifacts may use Dendritic Patterns.

Accepted patterns include:

```txt
simple
conditional
inheritance
multi-context
collector
constants
fragment
factory
```

Knowledge selection must be based on explicit selectors, deterministic conditions, resolution decisions, or traceable relations.

Generic `requires` must not become an uncontrolled injection mechanism.

Knowledge does not emit artifacts. Knowledge affords transformations.

## 10. Attention / Context Plan Contract

`atelier context plan` is read-only.

Normal context planning effects must be:

```json
{
  "mutated": false,
  "created_run": false,
  "created_task": false
}
```

Field naming is `snake_case` for all JSON emitted to the CLI, MCP, and adapter surfaces. Mixed-case or camelCase field names in active JSON output are forbidden.

A context plan must not:

- create a task;
- create a run;
- mutate task state;
- mutate run state;
- write source files;
- update indexes as a hidden side effect;
- launch an external runner;
- mark work complete.

A context plan may:

- resolve relevant artifacts;
- report selected artifacts;
- report exclusions;
- report reading order;
- report injection mode;
- report resolution decisions;
- report next recommended actions;
- report stale or missing artifacts.

The context plan must report its budget impact in the following units.

```txt
context_budget:
  artifact_slot_count:        integer   (slots the plan would consume)
  estimated_tokens_full:      integer   (token estimate if every full slot is injected)
  estimated_tokens_summary:   integer   (token estimate for summary slots)
  budget_limit:               integer   (the limit applicable to the task/role)
  budget_policy:              enum[hard | soft | advisory]
```

A `budget_policy=hard` plan that exceeds `budget_limit` must be reported as a plan-time error, not a silent overshoot. A `budget_policy=soft` or `advisory` plan may exceed the limit and must report the delta explicitly.

The context plan's effect profile is verified by `context_plan_readonly_fixture` in `CONTRACT_TEST_MATRIX.md` §2.2. The context budget is verified by `context_budget_traversal_guard_fixture` in `CONTRACT_TEST_MATRIX.md` §2.

## 10a. Resolution Decision Record Schema

A resolution decision record must conform to the following minimum schema.

```txt
id:                 string  (unique within the run)
input_signals:      array   (the inputs the resolver considered)
candidates:         array   (artifact ids and the resolver's score for each)
decision_reason:    string  (human-readable explanation)
resolution_type:    enum    (deterministic | semantic | hybrid)
resolver_identity:  string  (semver or hash of the resolver implementation)
rejected:           array   (artifact ids the resolver considered and rejected)
budget_delta:       object  (slots and tokens this decision added to the plan)
recorded_at:        string  (RFC 3339 timestamp)
```

`resolution_type` semantics:

```txt
deterministic   selection was made by a closed rule with a single canonical result
semantic        selection was made by a non-deterministic or model-assisted judgment
hybrid          a deterministic rule narrowed the candidate set, then a model-assisted judgment selected within it
```

A context plan must include every resolution decision record it used. A decision without a recorded `resolver_identity` is invalid.

This schema replaces the older "semantic decision record" wording. The term "semantic" is reserved for non-deterministic or model-assisted resolution.

## 11. Task Plane Contract

Task artifacts are durable work items or product-intent artifacts.

A task is not a run. A task represents what should be done or decided.

Tasks may reference product specs, acceptance criteria, risk constraints, assigned roles, parent tasks, subtasks, related runs, and verification requirements.

### 11.1 Task Lifecycle State Machine

```txt
created
   |
   v
assigned
   |
   +---> split ---> (children created)
   |
   v
active
   |
   +---> blocked (with reason)
   |
   v
closed (outcome: completed | cancelled)
```

### 11.2 Task Lifecycle Events

```txt
task_created       payload: { task_id, title, description, phase, scope, parent_task_id }
task_assigned      payload: { task_id, role_id, agent_name }
task_split         payload: { task_id, children: [task_id, ...] }
task_blocked       payload: { task_id, reason, expected_resolution }
task_unblocked     payload: { task_id, resolution }
task_closed        payload: { task_id, outcome: completed|cancelled, accepted_by, evidence }
```

### 11.3 Boundaries

Task closure must emit `task_closed`.

Task closure must not emit `run_completed` or any run completion event.

A run materialization is recorded as a `materializes` edge from the run to the task, not as a task event.

## 12. Run Plane Contract

A run is a portable, resumable work packet for an external runner.

A run does not launch or own an external LLM runtime.

A run packet's LLM-readable files are read in this order:

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

`manifest.json` is not part of the normal LLM reading order.

Manifest-like data, context hashes, provenance, and debug traces belong under `.atelier/` or equivalent debug/provenance state. They may be inspected as a last resort, but runners should not be instructed to read manifest first.

### 12.1 Run Lifecycle State Machine

```txt
created
   |
   v
resumed
   |
   +---> handoff_appended ---> resumed
   |
   +---> verification_recorded ---> resumed
   |
   +---> blocked_waiting (with reason)
   |         |
   |         +---> run_unblocked ---> resumed
   |         |
   |         +---> gate evaluates hard_block=true ---> run_blocked_terminal
   |
   v
completed_clean | completed_dirty

run_blocked_terminal
   |
   +---> force_close (explicit user action) ---> forced_closed
```

`blocked_waiting` is a non-terminal state. A run in `blocked_waiting` may emit `run_unblocked` and transition to `resumed`, or it may receive a hard-block condition and transition to `run_blocked_terminal`.

`run_blocked_terminal` is a terminal state. A run in `run_blocked_terminal` may emit only `run_forced_closed` (via explicit user action) and may not emit `run_unblocked` or any `run_completed_*` event.

`completed_clean`, `completed_dirty`, `run_blocked_terminal`, and `forced_closed` are the four **terminal run closure states**, evaluated by the completion truth table in `VERIFICATION_SCHEMA.md` and the force-close rule in §16.1. None of them is a "success state" by itself; only `completed_clean` is a `terminal_success`. The other three are `terminal_non_success_*` variants and are presented honestly to the HPO.

`completed_clean` and `completed_dirty` are terminal closure states emitted when the completion gate evaluates the run. The gate evaluation is the only authority on which closure state is emitted. The truth table in `VERIFICATION_SCHEMA.md` §8 is normative.

A run that is in `run_blocked_terminal` does not transition to `completed_clean` or `completed_dirty`. It is terminal at `run_blocked_terminal` and emits only the `run_blocked_terminal` event. No completion event is emitted. A force-close from `run_blocked_terminal` emits `run_forced_closed` and does not emit any `run_completed_*` event. `run_forced_closed` is not a success state; it is a terminal closure of a blocked run for human review.

A `blocked_waiting` run does not transition to `forced_closed` directly. A `blocked_waiting` run transitions to `run_blocked_terminal` first (via gate evaluation), and force-close is permitted only from `run_blocked_terminal`. A direct `blocked_waiting -> forced_closed` transition is invalid.

```txt
run_blocked_terminal
   |
   +---> force_close (explicit user action) ---> forced_closed
```

The force-close transition above is permitted only from `run_blocked_terminal`, never from `resumed` or `blocked_waiting`. `run_forced_closed` is not interchangeable with `run_completed_dirty`. A run emitting any `run_completed_*` event while in `run_blocked_terminal` or `blocked_waiting` state is invalid.

### 12.2 Run Lifecycle Events

```txt
run_created                 payload: { run_id, task_id, packet_id, runtime, adapter_id }
run_resumed                 payload: { run_id, resumed_at, resume_reason }
handoff_appended            payload: { run_id, append_text, appender }
verification_recorded       payload: { run_id, check_id, status, evidence_refs, recorded_at, recorded_by }
run_blocked_waiting         payload: { run_id, reason, expected_resolution, terminal: false }
run_blocked_terminal        payload: { run_id, reason, hard_block_source, terminal: true }
run_unblocked               payload: { run_id, resolution, prior_state: blocked_waiting }
run_completed_clean         payload: { run_id, completed_at, required_passed, optional_summary }
run_completed_dirty         payload: { run_id, completed_at, dirty_reasons, evidence_refs }
run_forced_closed           payload: { run_id, reason, forced_by, forced_at, prior_state: run_blocked_terminal }
```

The legacy `run_blocked` event is renamed to `run_blocked_terminal`. New code must emit `run_blocked_terminal` for terminal blocks and `run_blocked_waiting` for non-terminal blocks. Readers may tolerate historical `run_blocked` records for migration; new Run Plane code must not emit `run_blocked`.

`run_unblocked` is emitted only from `blocked_waiting` and only to `resumed`. A `run_unblocked` event whose payload does not declare `prior_state: blocked_waiting` is invalid.

`run_started` is legacy. Readers may tolerate historical records, but new Run Plane code must not emit it.

### 12.3 Active Run Commands

The active run command inventory is owned by `SURFACES.md` §2.2. The contract does not enumerate command names; it requires that the active inventory in `SURFACES.md` is the single source of truth and that the parity test in `CONTRACT_TEST_MATRIX.md` §2.9 passes.

## 13. External Runner Boundary

Atelier may prepare work for external runners.

Atelier may observe and record what external runners did.

Atelier may generate prompts, handoffs, checks, verification records, traces, and review packets.

Atelier must not pretend to have executed work that was executed by an external runner.

Atelier must not require all work to pass through one runtime.

Runtime adapters must be replaceable.

Runtime-specific configuration must not become product truth unless it is explicitly represented as an artifact with provenance.

Adapter-specific obligations are defined in `ADAPTER_CONTRACT.md`.

## 13a. Adapter Parity Invariant

The Runtime Adapter Plane must satisfy the following invariants. The detailed adapter behavior is in `ADAPTER_CONTRACT.md`.

- At least two real runtime adapters must pass the canonical packet through the runtime parity fixture defined in `ADAPTER_CONTRACT.md` §7 and verified by `adapter_runtime_parity_fixture` in `CONTRACT_TEST_MATRIX.md` §2.7.
- No adapter may persist state outside the canonical packet, the canonical result, and the run record.
- No adapter may invent verification records.
- No adapter may alias a removed command.
- The adapter runtime parity invariant is the proof of runtime agnosticism. A claim of runtime agnosticism without a passing `adapter_runtime_parity_fixture` is a marketing claim, not a contract claim.

## 14. Interface Parity Contract

CLI, MCP, GUI, adapters, generated prompts, and README usage must not advertise conflicting active surfaces.

The single source of truth for active surface names and labels is `SURFACES.md`.

If a surface is removed, it must not appear in CLI help, MCP tool descriptions, GUI labels, generated next actions, retry commands, recovery output, active adapter instructions, README usage, or product spec active examples.

Historical run records and archived notes may contain old text, but active surfaces must not recommend it.

The parity test is `active_surface_inventory_test` in `CONTRACT_TEST_MATRIX.md` §2.9.

## 15. Removed / Forbidden Surfaces

The do-not-advertise surface list is owned by `SURFACES.md` §3. The contract requires that this list is the single source of truth and that no active surface advertises any name on the list.

A compatibility alias is forbidden. If a removed surface must be referenced for historical reasons, the reference must live inside an archive, a historical note, or a migration guide, never inside an active surface.

A dedicated review-diff surface is not part of the current contract. It may be designed later, but it must not reintroduce a removed surface as an active surface.

## 16. Verification and Completion Contract

Completion is evidence-aware and gate-evaluated.

A run may not be considered cleanly complete only because required files exist.

The completion gate evaluates a run against the categories defined in `VERIFICATION_SCHEMA.md` §Gate-Categories. The status lattice, reason codes, and `hard_block` definition are normative and live in that document.

This section owns lifecycle consequence only. The truth table that maps gate state to lifecycle event is normative and lives in `VERIFICATION_SCHEMA.md` §Completion-Truth-Table.

### 16.1 Lifecycle Consequence

The completion gate, evaluated by the truth table, produces one of four **terminal run closure states**. The classification is normative.

```txt
terminal_success:
  completed_clean
    The run is terminal, all required checks resolved as passed, and no
    hard-block condition is present. The event emitted is run_completed_clean.
    This is the only terminal run closure state that is also a success state.

terminal_non_success_reviewable:
  completed_dirty
    The run is terminal, no hard-block condition is present, and at least
    one required check resolved as skipped-with-reason or unavailable-with-reason
    with a valid reason code. completed_dirty is NOT a success state.
    completed_dirty means the run is terminal, honest, and reviewable,
    but not clean. The event emitted is run_completed_dirty.

terminal_blocked:
  run_blocked_terminal
    A hard-block condition is present. The run is terminal at
    run_blocked_terminal. The event emitted is run_blocked_terminal.
    No run_completed_* event is emitted. This is not a success state.

terminal_non_success_forced:
  forced_closed
    A user has explicitly force-closed a run that was in
    run_blocked_terminal state. The event emitted is run_forced_closed
    with prior_state: run_blocked_terminal. The run is not successful
    and is not clean; it is closed for human review. No run_completed_*
    event is emitted. This is not a success state.
```

The terminology "terminal success states" used in prior revisions is retired. The four states above are all **terminal run closure states**, but only one of them (`completed_clean`) is a `terminal_success`. The other three are non-success variants and must be presented to the HPO as such per `HPO_STATE_MODEL.md` §2 and §4.

### 16.2 Boundary

A run that emits any `run_completed_*` event while in `run_blocked_terminal` state is a contract violation, even if the event was emitted by a misbehaving adapter.

A run that emits any `run_completed_*` event while in `blocked_waiting` state is a contract violation.

A run that emits `run_forced_closed` while not in `run_blocked_terminal` state is a contract violation. A `blocked_waiting` run may not be force-closed; it must first transition to `run_blocked_terminal` via gate evaluation, and force-close is then permitted from that state.

A run that emits `run_completed_clean` while any required check is in `skipped-with-reason` or `unavailable-with-reason` state is a contract violation. Only `passed` resolves a required check to clean.

### 16.3 Verification Status Lattice (Pointer)

The verification status lattice, the reason codes, the `hard_block` definition, and the completion truth table are owned by `VERIFICATION_SCHEMA.md`. This contract does not redefine them.

```txt
passed
failed
skipped        (with reason; see VERIFICATION_SCHEMA.md §Reason-Codes)
unavailable    (with reason; see VERIFICATION_SCHEMA.md §Reason-Codes)
not-run
unknown
```

`passed` requires a verification record. A record that asserts `passed` without a verification artifact is invalid.

The verification gate is verified by `verification_gate_completion_fixture` in `CONTRACT_TEST_MATRIX.md` §2.4.

## 17. Reconciliation and Drift Contract

Atelier must treat stale artifacts as first-class risk.

Drift may occur between:

- Ideal and contract;
- contract and tests;
- README and active commands;
- roadmap and implementation;
- Markdown and checks;
- tests and product knowledge;
- hooks and policies;
- run handoff and actual diff;
- runtime-specific instructions and canonical product specs.

Atelier should detect drift where possible and surface it with risk actions (`block | warn | info`).

The drift detection fixture is `drift_detection_fixture` in `CONTRACT_TEST_MATRIX.md` §2.8.

## 18. Positioning Boundary Contract

Atelier must not collapse into adjacent categories.

It must not become merely:

- a coding agent;
- an IDE extension;
- an agent orchestration runtime;
- a CI wrapper;
- a documentation generator;
- a task manager;
- a prompt library;
- a vector database;
- a hidden autonomous runtime.

Atelier may integrate with all of those categories.

Atelier's durable boundary is repository-native artifact alignment for agentic software development.

## 19. Privacy and Sensitive Material Boundary

Prompts, traces, and run records may contain sensitive material.

Rules:

- Sensitive material must remain under `.atelier/` by default.
- Sensitive material must not be promoted to durable evidence without an explicit acceptance event.
- Sensitive material must be excluded from any output surface that leaves the local environment by default.
- The privacy boundary is a property of the class, not of the file extension. The detailed rules are in `GRAPH_SEMANTICS.md` §12.

Full privacy classification and redaction rules are deferred to a later revision.

## 20. Acceptance Criteria

Contract-critical tests must cover at least:

- active surfaces do not advertise removed commands;
- `atelier context plan` has read-only effects;
- `atelier context plan` does not create tasks or runs;
- the context plan JSON uses snake_case field names;
- the context plan reports budget in the units defined in §10;
- task closure emits `task_closed`;
- task closure does not emit `run_completed`;
- run creation emits `run_created`;
- run creation does not emit `run_started`;
- historical `run_started` can be read if needed;
- run resume uses the LLM-readable order beginning with `handoff.md`;
- run resume does not instruct normal runners to read `manifest.json` first;
- `.atelier` state is treated as derived state;
- transform candidates are not silently accepted;
- verification records distinguish not-run from passed;
- the completion truth table in `VERIFICATION_SCHEMA.md` is the only authority on completion state;
- a run with all required checks passed completes clean;
- a run with a required check in `skipped-with-reason` completes dirty, never clean;
- a run with a required check in `not-run` or `unknown` is blocked;
- a run in `run_blocked_terminal` state cannot emit any `run_completed_*` event;
- a run in `blocked_waiting` state cannot emit any `run_completed_*` event and cannot transition to `forced_closed` directly;
- a `run_blocked_terminal` run force-closed by user emits `run_forced_closed`, not `run_completed_dirty`;
- a `run_unblocked` event is emitted only from `blocked_waiting` and only to `resumed`;
- `completed_dirty` is `terminal_non_success_reviewable`; it is terminal, honest, and reviewable, but not a success state;
- `forced_closed` is `terminal_non_success_forced`; it is terminal closure of a blocked run for human review, but not a success state;
- only `completed_clean` is `terminal_success`; the other three closure states are non-success variants;
- `deferred_by_accepted_decision` requires a valid `decision_ref`;
- active CLI, MCP, GUI, adapters, and README surfaces agree;
- stale command grep excludes historical archives where appropriate;
- runtime adapters are replaceable and do not own product truth;
- the artifact graph golden fixture is regenerable byte-for-byte;
- the `.atelier/` deletion and regeneration fixture preserves product truth;
- the verification gate fixture rejects clean completion with missing required checks;
- the transform maturity transition fixture rejects level jumps;
- the adapter parity fixture proves semantic equivalence across at least two adapters;
- the drift detection fixture flags drift between paired surfaces;
- the active surface inventory test passes against `SURFACES.md`;
- the contract coverage test fails when a normative `must` lacks a test or waiver.

The full test inventory and the claims-to-tests mapping are in `CONTRACT_TEST_MATRIX.md`.

## 21. Contract Revision Policy

Changing this contract requires updating tests or explicitly documenting why tests are not yet available.

If implementation intentionally diverges from this contract, the divergence must be represented as a contract revision, not an undocumented implementation choice.

If the product ideal changes, revise `Ideal.md` first, then revise this contract.

## 21a. Contract Coverage Rule

Every normative `must` in this contract, in `GRAPH_SEMANTICS.md`, in `SURFACES.md`, in `ADAPTER_CONTRACT.md`, in `VERIFICATION_SCHEMA.md`, in `EVENT_MODEL.md`, in `HPO_STATE_MODEL.md`, and in `EXAMPLES.md` must map to:

- a test described in `CONTRACT_TEST_MATRIX.md`;
- a fixture-only check;
- an explicit waiver with reason, expiry, and owner in `CONTRACT_TEST_MATRIX.md` §6.

A normative `must` without a mapping is a coverage gap. The coverage test is `contract_coverage_test` in `CONTRACT_TEST_MATRIX.md` §2.10.

## v5 Revision Notes

- Replaced two-class document precedence with a four-class conflict resolution model in §2. Domain ownership moved to narrower schema subcontracts.
- Added `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, and `HPO_STATE_MODEL.md` as normative subcontracts. §1, §2, §5, §16 defer to them where their domain applies.
- Rewrote §16.2 as a lifecycle consequence section. The completion truth table now lives in `VERIFICATION_SCHEMA.md`. The clean/dirty/blocked contradiction is removed.
- Added `run_forced_closed` as a distinct terminal event in §12.1 and §12.2. Forced close is not success and not interchangeable with `run_completed_dirty`.
- Added `policy_decision` minimum shape and `hard_block` rule reference in §5.5.
- Renamed "semantic decision" to "resolution decision" in §4.8 and §10a. `resolution_type` replaces `resolver`. `resolver_identity` is required. `budget_delta` is reported in budget units.
- Switched the context plan effect schema to snake_case in §10. Added the `context_budget` unit block in §10.
- Added `decision_ref` validation rule for `deferred_by_accepted_decision` in §20.
- Added the "completed_dirty is not success" guardrail in §16.1.
- Added the `policy_decision` minimum stub to defer full `POLICY_SCHEMA.md`.
- Added a v5 hard-block rule referencing `VERIFICATION_SCHEMA.md` and a `policy_decision` minimum shape in §5.5.
- Updated the companion-document list and the `must`-coverage rule to include the new schema subcontracts.
- Updated §20 to add snake_case, budget, completion-truth-table, blocked-event-boundary, force-close, and `completed_dirty` guardrail acceptance criteria.

## v5.1 Revision Notes

- Rewrote §12.1 to split the prior `blocked` state into `blocked_waiting` (non-terminal, may emit `run_unblocked` and transition to `resumed`) and `run_blocked_terminal` (terminal, may emit only `run_forced_closed`). Direct `blocked_waiting -> forced_closed` transitions are now forbidden.
- Renamed the legacy `run_blocked` event to `run_blocked_terminal` and added `run_blocked_waiting` in §12.2. The new events carry an explicit `terminal: bool` payload field. `run_unblocked` now requires `prior_state: blocked_waiting`.
- Rewrote §16.1 with explicit terminology: `terminal_success` (only `completed_clean`), `terminal_non_success_reviewable` (`completed_dirty`), `terminal_blocked` (`run_blocked_terminal`), `terminal_non_success_forced` (`forced_closed`). The prior "terminal success states" wording is retired.
- Updated §16.2 boundary rules: a run in `blocked_waiting` cannot emit `run_completed_*`; a `run_forced_closed` event is permitted only from `run_blocked_terminal`, never from `resumed` or `blocked_waiting`.
- Updated §20 acceptance criteria to enumerate the new state pairs: `blocked_waiting` ↔ `run_unblocked` → `resumed`; `blocked_waiting` → `run_blocked_terminal`; `run_blocked_terminal` → `run_forced_closed`.
- Added a Phase C marker in §5.5 for the policy registry term referenced by `VERIFICATION_SCHEMA.md` §3. The v5.1 required verification map derivation ships with `task_acceptance_criteria` and `check_registry.bindings` only; the policy registry term is a placeholder.
- Cross-references updated: `HPO_STATE_MODEL.md` for the matching HPO state set, `EVENT_MODEL.md` for the matching closed event enum, `VERIFICATION_SCHEMA.md` for the matching truth table columns.
