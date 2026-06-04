# Long-Run Implementation-Control Readiness Audit Prompt

This is the rubric used to audit `harness/knowledge/implementation-control/atelier/**` against `harness/knowledge/product-specs/atelier/**`. It is persisted here so audits are reproducible.

## Mission

Determine whether the `implementation-control` document set is sufficient to let a mother/orchestrator agent complete the full product implementation from immutable `product-specs`, without stalling, drifting into MVP-only delivery, inventing behavior, weakening validation, or requiring hidden conversation context.

This is a launch-readiness audit for autonomous, multi-session, multi-agent implementation.

## Operating Model Under Test

A new session can be started, the relevant Markdown files under `harness/knowledge/implementation-control/atelier/**` can be mentioned as the starting context, and a mother agent can use those files to coordinate the implementation to completion.

Completion means full product implementation per `harness/knowledge/product-specs/atelier/**`, not MVP.

The mother agent must be able to:

1. Understand the implementation goal and authority hierarchy.
2. Treat product specs as immutable.
3. Discover the repository and derive safe edit boundaries before implementation.
4. Compute a deterministic directed acyclic implementation graph.
5. Select the next safe frontier without conversation memory.
6. Dispatch bounded subagent packets.
7. Parallelize independent DAG branches safely.
8. Prevent subagents from mutating authority documents or product specs.
9. Validate every packet through concrete gates.
10. Record progress, blockers, assumptions, validation evidence, and frontier state.
11. Continue independent work when one branch is blocked.
12. Avoid false completion when executable blockers, pending gates, or waived-but-required invariants remain.
13. Finish the full product, not merely scaffold or demonstrate an MVP path.

## Materials to Inspect

Review all generated implementation-control files:

* `IMPLEMENTATION_ORCHESTRATOR.md`
* `SPEC_READ_PLAN.md`
* `CONTRACT_TO_BUILD_MATRIX.md`
* `IMPLEMENTATION_DAG.md`
* `AGENT_PACKET_PROTOCOL.md`
* `SUBAGENT_ROLE_CATALOG.md`
* `VALIDATION_GATE_REGISTRY.md`
* `SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md`
* `IMPLEMENTATION_LEDGER.md`
* `FULL_COMPLETION_DEFINITION.md`
* `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md`
* all files under `harness/knowledge/implementation-control/atelier/state/**`

Compare against the immutable product specs under `harness/knowledge/product-specs/atelier/**`.

Verify claims trace back to product specs, repository discovery records, validation gates, or explicit blocker/assumption records.

## Review Stance

Adversarial. Assume future agents will:

* over-broaden file scope;
* treat vague prose as permission;
* mark placeholders as done;
* change tests to pass;
* mutate control docs to escape constraints;
* skip repository discovery;
* confuse fixture scaffolding with behavioral proof;
* call blocked work complete;
* conflate MVP readiness with full completion;
* lose prior conversation context.

Identify whether the document set mechanically prevents these failures. Reward enforceability, not intent.

## Core Questions

### 1. Authority and Mutability
* Are product specs explicitly forbidden from edits, renames, reformatting, normalization, "fixes," or cleanup?
* Is product-spec immutability enforced mechanically, not only verbally?
* Are implementation-control documents split into immutable baseline and mutable execution state?
* Can ordinary agents edit the DAG, gate registry, completion definition, packet protocol, or matrix?
* Is there a dedicated `control-doc-repair` packet type?
* Does control-doc repair forbid weakening gates, deleting dependencies, broadening completion, relaxing product-spec immutability, converting requirements into assumptions, allowing pending commands to satisfy phase gates?
* Are mutable state paths explicit and narrow?
* Are control-doc hash baselines recorded and checked?

Launch blocker if ordinary implementation agents can mutate the authority layer.

### 2. Repository Discovery and Edit Boundary
* Mandatory repository discovery phase before implementation packets?
* Required outputs: baseline revision, package manager, workspace system, project list, source roots, test roots, fixture roots, generated-state roots, existing Atelier modules, existing commands and targets, current git status, staged files, unstaged files, untracked files, editable roots, forbidden roots, generated-output policy.
* Allowed files in packets must be derived from repository discovery.

Launch blocker if implementation packets can be dispatched before repository inventory and command discovery are complete.

### 3. Deterministic DAG and Frontier Computation
* DAG acyclic? Dependencies explicit? Deterministic frontier-computation rule?
* Each dispatchable node has required dependencies, invariant IDs, validation gate IDs, allowed-file derivation?
* Non-dispatchable or future/deferred nodes clearly marked?
* Mother agent can distinguish `ready`, `blocked`, `waiting_on_dependencies`, `deferred`, `waived`, `passed`, `failed`?
* All product planes represented: graph, verification, events, run lifecycle, surfaces, adapters, write authority, HPO, runtime resolution, trace/review records, swarm coordination, final E2E flow?
* Nodes with missing product semantics blocked rather than implemented by invention?
* Rule for continuing independent DAG branches when one node is blocked?
* Parallel execution safe, or could two packets touch overlapping files, generated state, fixtures, schemas, or validation surfaces?

Launch blocker if the mother agent cannot compute the next safe packet frontier without conversation memory.

### 4. Product-Spec Traceability
* Is the matrix a true implementation join table, not just a coverage outline?
* Every dispatchable invariant has: stable invariant ID, product spec path, exact section anchor, exact assertion, owned fields or enums, closed enum values, negative cases, fixture ID, validation gate IDs, DAG node IDs, owner role, proof level, waiver ID if applicable, allowed implementation surface, completion condition.

Launch blocker if subagents must rediscover or invent implementation semantics because matrix rows are too coarse.

### 5. Spec Read Plan
* Map DAG nodes to exact product spec sections (not document-level only)?
* Required/optional/forbidden sections per packet?
* Prevents strategic documents from being treated as executable schema authority?
* Requires proof-status reads before any public claim or phase-gate claim?
* Prevents "read everything and improvise"?

Strong readiness requires a `DAG node -> product spec sections -> expected reading output` table.

### 6. Subagent Packet Protocol
* Each packet: packet ID, type, DAG node IDs, invariant IDs, validation gate IDs, base revision, repository inventory reference, product spec hash reference, immutable control hash reference, exact source sections, files to inspect, allowed files, forbidden files, existing interfaces to preserve, expected diff shape, generated-state policy, test-integrity requirements, required validations, rollback plan, rollback validation, handoff artifact path, failure-report format.
* Packet-size constraints by role. A single subagent must not span graph schema, graph regeneration, stale detection, authority conflicts, CLI behavior, and tests.

Launch blocker if packets can be created without base revision, exact gates, allowed files, test-integrity checks, or source-section anchors.

### 7. Validation Gates and Test Oracles
* Each gate: ID, purpose, blocking severity, exact command or command-resolution algorithm, fixture ID, required input files, required expected files, accepted statuses, negative cases, pass/fail interpretation, proof artifact, retry policy, owner, ledger update requirement.
* Pay attention to: no-product-spec-edit checks, product spec hash checks, immutable control-doc diff/hash checks, test-integrity/no-weakening checks, stale command grep, task/run boundary event tests, run lifecycle event tests, verification status schema tests, policy decision hard-block tests, write-authority tests, privacy/redaction boundaries, fixture alias consistency.
* `pending_command_implementation` must not satisfy any phase gate or implementation acceptance gate.

Launch blocker if validation gates are mostly named intentions, fixture placeholders, or "discover command later" statements.

### 8. Ledger Resumability
* Ledger contains machine-readable sections for: launch status, blockers preventing autonomous implementation, product spec hashes, immutable control-doc hashes, repository inventory, DAG status, invariant status, packet status, validation history, blocker records, assumption records, waiver records, phase-gate decisions, computed frontier, final acceptance checklist.
* Current frontier consistent with DAG dependencies.

Launch blocker if the ledger cannot reconstruct current state, dispatchable frontier, remaining work, or proof status.

### 9. Blocker, Assumption, and Waiver Semantics
* Blockers classified by severity?
* Blocked executable invariants prevent full completion?
* Independent DAG branches can continue while one branch is blocked?
* Assumptions narrow, expiring, linked to affected invariants?
* Assumptions forbidden from authorizing public product claims?
* Waivers owner-scoped, expiry-bound, claim-scoped, product-authorized?
* Unresolved P0/P1 blockers disallowed at final completion?

Launch blocker if blocked work or pending gates can be counted as completion.

### 10. Full-Product Completion, Not MVP
* Completion requires all relevant product planes.
* Docs distinguish: scaffolded, implemented, executable gate exists, gate passing, fixture-gated product goal, future/deferred, waived, blocked, completed.

Launch blocker if final completion can be claimed with unresolved executable blockers, pending commands, missing gates, or MVP-only coverage.

### 11. Parallelization Safety
* Independent DAG branches explicitly identifiable?
* File-level and generated-state conflicts prevented?
* Packet allowed files disjoint or conflict-checked?
* Merge-readiness rule? Review/handoff records? Conflict-detection gate?
* Orchestrator can detect when two packets would mutate the same schema, fixture, command surface, generated output, or control state?
* Parallel execution forbidden for authority-layer repair unless explicitly coordinated?

Launch blocker if parallel work can corrupt shared schema, fixtures, generated state, or validation surfaces.

### 12. Session Startability
A new session can answer:
* What is the current launch status?
* What files are immutable? Mutable?
* What product specs are authoritative?
* What repository baseline is in use?
* What is the current DAG frontier?
* What packets are dispatchable? Blocked?
* What validations are required before dispatch?
* What is the first next action?
* What evidence proves previous work?
* What must not be touched?

Launch blocker if the system depends on unstated prior conversation context.

## Required Output Format

### Executive Verdict

State one of:

* `Safe to launch autonomous implementation`
* `Safe only for controlled repair`
* `Unsafe to launch`

Include a one-paragraph reason.

### Launch Readiness Summary

```yaml
launch_status:
allowed_next_run_type:
ordinary_implementation_packets_allowed:
repository_discovery_required_before_dispatch:
product_spec_mutation_allowed:
immutable_control_doc_mutation_allowed:
first_allowed_packet:
```

### Scorecard

0-5 for each dimension:

* Mother-agent operating model
* Product-spec immutability enforcement
* Immutable control-doc enforcement
* Repository discovery and edit-boundary protocol
* Deterministic DAG quality
* Frontier computation
* Parallelization safety
* Contract-to-build traceability
* Invariant granularity
* Spec-read precision
* Packet protocol safety
* Subagent role sizing
* Validation gate strength
* Test-oracle readiness
* Test-integrity protection
* Blocker/assumption/waiver semantics
* Ledger resumability
* Session startability
* Full-product coverage
* Anti-MVP drift protection
* Runtime-agnosticism and adapter path
* Write-authority and policy boundary
* Final completion definition

Include rationale and confidence for each score.

### Critical Findings

List findings by severity:

* P0: launch blockers
* P1: blocks broad implementation but may allow controlled repair
* P2: high-risk weakness
* P3: cleanup or clarity issue

For each finding include:

```text
ID:
Severity:
Documents:
Evidence:
Analysis:
Required Fix:
Blocks Launch:
```

### DAG and Parallelization Review

Specifically analyze whether the DAG is deterministic, acyclic, dispatchable, and safe for parallel subagents. Identify: missing dependencies, impossible nodes, overbroad nodes, nodes lacking invariant/gate linkage, unsafe parallel branches, missing conflict detection, missing merge-readiness rules.

### Traceability Review

Analyze whether product specs are mapped to implementation work at sufficient granularity. Identify broad invariants that must be split. Identify missing product planes or missing invariant families.

### Validation and Oracle Review

Analyze whether validation gates are executable and sufficient. Identify gates that are placeholders. Identify missing gates. Identify whether pending commands can accidentally satisfy acceptance.

### Ledger and Resume Review

Analyze whether a fresh mother agent can resume without conversation memory. Identify missing ledger fields, stale frontier state, missing evidence, or inconsistent statuses.

### Full Completion Review

Analyze whether full completion can be falsely claimed. Explicitly state whether blocked invariants, pending gates, waivers, deferred items, or fixture-only claims can incorrectly satisfy final completion.

### Recommended Repair Packets

If not safe to launch, propose the smallest ordered set of repair packets. Use this format:

```yaml
packet_id:
packet_type:
mission:
allowed_files:
forbidden_files:
acceptance:
validations:
```

### First Real Implementation Packet

State what the first real implementation packet should be after repair.

### Final Judgment

Answer:

1. Does this document set allow a new session to start from Markdown mentions alone?
2. Can a mother agent compute and dispatch the next safe packet?
3. Can subagents parallelize safely?
4. Can implementation proceed from product specs to full product without MVP drift?
5. Can final completion be trusted?
6. What is the single highest-leverage improvement?

Be strict. If the documents are good conceptually but not mechanically enforceable, say so.
