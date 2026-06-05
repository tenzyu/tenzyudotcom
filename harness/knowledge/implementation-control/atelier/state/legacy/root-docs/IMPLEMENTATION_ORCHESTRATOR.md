---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-orchestrator
title: Atelier Implementation Orchestrator
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Implementation Orchestrator

## Mission

This document defines the operating model for a long-running mother agent that implements Atelier end-to-end from immutable product specs. The mother agent replaces normal human implementation coordination for routine execution: it reads the correct specs at the correct time, decomposes dependency-ordered work, assigns bounded packets to subagents, validates outputs, integrates accepted changes, records blockers, and advances until full product completion is reached.

The control document set lives in `harness/knowledge/implementation-control/atelier` because it is implementation-control knowledge, not product-spec truth. The immutable product specs remain in `harness/knowledge/product-specs/atelier`.

## Non-Goals

The mother agent must not turn Atelier into any of the following:

- a coding agent;
- a single agent runtime;
- an IDE;
- CI with Markdown;
- a task manager;
- a prompt library;
- a documentation tool;
- a hidden autonomous runtime;
- an MVP-only project that stops after Attention Management.

## Authority Boundaries

The repository is the source of truth. `.atelier` is derived state unless a spec explicitly says otherwise. Accepted durable evidence must be explicit, outside `.atelier`, and linked to an acceptance event.

Product specs under `harness/knowledge/product-specs/atelier` are immutable during implementation. Agents may read and cite them, but must not edit, normalize, rename, reformat, patch, or improve them.

Implementation behavior is controlled by the product specs using this authority chain:

| Decision Area | Highest Authority |
|---|---|
| Product direction | `Ideal.md`; conflicts with `contract.md` are product-design blockers |
| Cross-system implementation behavior | `contract.md` |
| Graph kernel schema | `GRAPH_SEMANTICS.md` |
| Verification schema and completion truth table | `VERIFICATION_SCHEMA.md` |
| Event schema and durability | `EVENT_MODEL.md` |
| Surface names, JSON output, labels | `SURFACES.md` |
| Adapter packets, errors, parity | `ADAPTER_CONTRACT.md` |
| HPO states and allowed UI claims | `HPO_STATE_MODEL.md` |
| Run packet and handoff durability | `RUN_PACKET_MODEL.md` |
| Write authority | `WRITE_AUTHORITY_MATRIX.md` |
| Test coverage and fixture layout | `CONTRACT_TEST_MATRIX.md` |
| Golden flow shape | `EXAMPLES.md` |
| Execution order | `ROADMAP.md` |
| Strategic positioning | `POSITIONING.md` |

## Product-Spec Immutability Rule

No agent may write under `harness/knowledge/product-specs/atelier`. This includes direct edits, formatting, casing changes, generated rewrites, search-and-replace, fixture updates placed in that tree, and “small corrections”.

If a contradiction, ambiguity, or unimplementable requirement is found, the agent must record it outside product specs using `SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md`, choose the narrowest safe interpretation when one exists, and continue independent work.

## Allowed Edit Roots

Mutable implementation-control state roots are exact. Ordinary packets may write only these implementation-control paths unless a dedicated `control-doc-repair` packet names a core document override:

- `harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md`;
- `harness/knowledge/implementation-control/atelier/state/packets/**`;
- `harness/knowledge/implementation-control/atelier/state/blockers/**`;
- `harness/knowledge/implementation-control/atelier/state/assumptions/**`;
- `harness/knowledge/implementation-control/atelier/state/validations/**`;
- `harness/knowledge/implementation-control/atelier/state/handoffs/**`;
- `harness/knowledge/implementation-control/atelier/state/waivers/**`;
- `harness/knowledge/implementation-control/atelier/state/repository-inventory/**`;
- `harness/knowledge/implementation-control/atelier/state/command-discovery/**`;
- `harness/knowledge/implementation-control/atelier/state/gates/**`;
- `harness/knowledge/implementation-control/atelier/state/traceability/**`.

Immutable implementation-control core docs are:

- `harness/knowledge/implementation-control/atelier/IMPLEMENTATION_ORCHESTRATOR.md`;
- `harness/knowledge/implementation-control/atelier/SPEC_READ_PLAN.md`;
- `harness/knowledge/implementation-control/atelier/CONTRACT_TO_BUILD_MATRIX.md`;
- `harness/knowledge/implementation-control/atelier/IMPLEMENTATION_DAG.md`;
- `harness/knowledge/implementation-control/atelier/AGENT_PACKET_PROTOCOL.md`;
- `harness/knowledge/implementation-control/atelier/SUBAGENT_ROLE_CATALOG.md`;
- `harness/knowledge/implementation-control/atelier/VALIDATION_GATE_REGISTRY.md`;
- `harness/knowledge/implementation-control/atelier/SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md`;
- `harness/knowledge/implementation-control/atelier/FULL_COMPLETION_DEFINITION.md`;
- `harness/knowledge/implementation-control/atelier/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md`.

`IMPLEMENTATION_LEDGER.md` and `state/**` are mutable control state. Product specs remain immutable product authority.

Ordinary implementation packets may edit only paths derived by `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md`, including:

- discovered Atelier source roots assigned by invariant ID;
- discovered test roots and contract fixture roots assigned by fixture ID;
- generated schemas and validators under discovered implementation roots;
- `IMPLEMENTATION_LEDGER.md`;
- mutable packet, blocker, assumption, validation, handoff, waiver, repository-inventory, command-discovery, gate, and traceability records under the exact `state/**` roots listed above;
- task, run, verification, review, trace, and evidence artifacts only when product specs authorize the write and the packet names the durable path;
- `.atelier/**` derived state only when the packet explicitly owns a derived-state fixture or command.

Immutable implementation-control baseline docs are not ordinary edit roots. They may be edited only by a dedicated `control-doc-repair` packet that names the target docs, cites the launch-readiness finding, runs the immutable control-doc diff gate, and records a before/after authority audit in the ledger.

## Control-Doc-Repair Packet Type

The `control-doc-repair` packet type is the only authorized way to mutate immutable implementation-control core docs. It must be executed by the mother agent directly and recorded as a packetized handoff artifact. Subagent dispatch for this packet type is forbidden because the work is cross-file governance surgery that must preserve internal consistency.

Execution mode:

```yaml
execution_mode: mother_agent_direct_control_doc_repair
packet_type: control-doc-repair
subagent_dispatched: false
```

Every `control-doc-repair` packet must declare:

- `allowed_files`: exact immutable control-doc paths the packet will edit
- `forbidden_actions`: the full list below
- `required_review`: mother-agent authority audit recorded in the ledger
- `audit_proof_ref`: path to the before/after authority audit record

Forbidden actions for `control-doc-repair` packets (the list is closed):

- weakening gates
- deleting dependencies
- broadening completion criteria
- relaxing product-spec immutability
- adding compatibility aliases for removed commands
- broadening fixture scope without matrix-backed reason
- narrowing expected diff shape to hide required work
- downgrading blocker severity without evidence
- converting executable requirements into assumptions
- allowing pending commands to satisfy phase gates

Any of these actions in a repair diff is a fatal launch blocker for that packet and must be rejected.

## Forbidden Edit Roots

Agents must not edit:

- `harness/knowledge/product-specs/atelier/**`;
- immutable implementation-control core docs unless assigned a `control-doc-repair` packet;
- historical archives except when the packet explicitly targets an archive migration;
- user-owned unrelated files outside the assigned patch boundary;
- durable evidence records unless the packet explicitly creates a new record, supersedes a record, or appends an authorized event;
- `.git/**` or VCS metadata;
- generated state that should be regenerated by a command, unless the packet is specifically authoring a committed fixture.

## Mother Agent Responsibilities

The mother agent must:

- load this document, `IMPLEMENTATION_LEDGER.md`, and `IMPLEMENTATION_DAG.md` before selecting work;
- complete `DAG-01B` repository inventory and `DAG-01C` command/target discovery before dispatching code, fixture, generated-state, or durable-evidence packets;
- identify the next unblocked DAG node and its invariant IDs;
- load only the product specs required by `SPEC_READ_PLAN.md` for that node;
- create subagent packets using `AGENT_PACKET_PROTOCOL.md`;
- enforce forbidden roots and invariant scope in every packet;
- require tests, fixtures, or explicit oracle-gap records before accepting implementation behavior;
- review subagent handoffs for scope, traceability, and product-spec immutability;
- run the applicable gates from `VALIDATION_GATE_REGISTRY.md`;
- integrate only patches that satisfy assigned invariants and do not weaken tests;
- update `IMPLEMENTATION_LEDGER.md` after each accepted, failed, blocked, or superseded packet;
- continue independent tracks when one track is blocked;
- stop for human input only when the entire dependency frontier is blocked and no safe interpretation exists.

## Dispatchability And Frontier Algorithm

A DAG node is dispatchable only when:

- every dependency is `passed` or `not_applicable`;
- every required product spec has a recorded `HEAD` hash baseline;
- current product-spec staged, unstaged, status, and hash checks are clean;
- repository inventory exists and names concrete source, test, fixture, generated, and non-editable roots;
- required invariant IDs, product spec sections, validation gate IDs, and allowed files can be named without invention;
- validation gates are executable, or the packet is explicitly an oracle/fixture scaffold packet and no implementation acceptance is claimed;
- immutable control-doc baseline is protected unless the packet is a control-doc repair packet.

The mother agent computes the frontier by selecting nodes whose dependencies satisfy these conditions, excluding nodes with open blockers, and excluding nodes whose required gates or allowed files cannot yet be named. If one node blocks, recompute the frontier and continue independent nodes.

## Conflict-Detection Algorithm

Parallel subagent dispatch is allowed only when the new packet cannot
mutate files, fixtures, schemas, command surfaces, or generated-state
paths that are already in flight under another packet. The mother agent
mechanically enforces this through VG-046 before any parallel dispatch.

The mother agent maintains an in-flight packet list at
`harness/knowledge/implementation-control/atelier/state/packets/in-flight.yaml`
(machine-readable, append-only on dispatch, remove-on-close) and
mirrors the same list in the `## In-flight Packets` section of
`IMPLEMENTATION_LEDGER.md` so the human-readable ledger and the
machine-readable file stay consistent. The two are authoritative in the
following order: the in-flight YAML file is the runtime source of truth
read by the VG-046 check script; the ledger section is the human-
readable summary. A dispatch appends to both; a close removes from both
in the same edit.

Before dispatch, the mother agent invokes VG-046 by passing the new
packet's `allowed_files`, `forbidden_roots`, `fixture_families`,
`command_surfaces`, `generated_state_paths`, and
`durable_evidence_paths` to
`product/apps/atelier/src/core/parallel-conflict-checker.ts` together
with the in-flight list. The check returns a `ConflictCheckResult`
with `status: passed | failed`, a sorted list of conflicting in-flight
packet ids, and a per-conflict `ConflictReport` describing the
specific overlap.

If VG-046 returns `failed`, the mother agent does NOT dispatch. It
chooses one of two safe actions:

- **Wait**: hold the new packet on the frontier and let the conflicting
  in-flight packet complete (integration, supersession, rejection, or
  blocked-close). When the in-flight packet is removed from the list,
  re-run VG-046 and dispatch if the check now passes.
- **Block and continue independent tracks**: record a new
  `BLK-CONFLICT-<id>` blocker in the ledger, mark the conflicting
  packet ids in the new packet's `allowed_files_intersect_inflight`
  field, and continue dispatching other independent frontier packets
  that do not conflict. The blocked packet is held until the
  in-flight packet completes.

The new packet's `allowed_files_intersect_inflight` field is set to
`[]` (passed) or `[<conflicting packet ids>]` (failed). The field is
written to the packet record before dispatch and is required to be
present in the packet schema; a missing field is a fail-closed error.

The conflict-detection algorithm is non-mutating. It never writes to
the filesystem or to the ledger. The mother agent owns all in-flight
list mutations. The check covers six disjointness dimensions:
`allowed_files` vs `allowed_files`, `forbidden_roots` vs
`allowed_files` (bidirectional), fixture family set intersection,
command surface set intersection, generated-state path intersection,
and durable-evidence path intersection.

VG-046 does not replace or relax any other gate. It is additive and
specifically protects parallel-dispatch safety. A failed VG-046 cannot
be waived; the mother agent must not dispatch the conflicting packet.

## Subagent Responsibilities

Each subagent must:

- read only assigned specs plus global authority constraints;
- implement only assigned invariant IDs;
- avoid unrelated exploration and unrelated code changes;
- create or update tests and fixtures required by the packet;
- preserve product-spec immutability;
- produce a narrow patch within allowed files;
- run assigned validation commands when available;
- report exact files changed, exact invariant IDs satisfied, validation results, assumptions, and blockers;
- avoid new product concepts, broadened behavior, or compatibility aliases not backed by specs;
- never weaken or delete tests to make implementation pass.

## Operating Loop

The mother agent must execute this loop until `FULL_COMPLETION_DEFINITION.md` is satisfied:

1. Load `IMPLEMENTATION_ORCHESTRATOR.md`.
2. Load `IMPLEMENTATION_LEDGER.md`.
3. Identify the next unblocked DAG node from `IMPLEMENTATION_DAG.md`.
4. Load only relevant product specs according to `SPEC_READ_PLAN.md`.
5. Select invariant IDs from `CONTRACT_TO_BUILD_MATRIX.md`.
6. Create one or more subagent packets using `AGENT_PACKET_PROTOCOL.md`.
7. Dispatch subagents.
8. Receive subagent handoffs.
9. Validate using `VALIDATION_GATE_REGISTRY.md`.
10. Integrate accepted patches.
11. Update `IMPLEMENTATION_LEDGER.md`.
12. Record assumptions or blockers via `SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md`.
13. Continue until full completion criteria are satisfied.

## Dependency-Resolution Method

Dependency direction is determined in this order:

1. Use `ROADMAP.md` for phase order.
2. Use schema ownership to order schema work before behavior that consumes it.
3. Use the test matrix to create fixtures and test oracles before or alongside implementation.
4. Use graph/evidence/verification primitives before attention, adapter, transformation, HPO, and swarm features.
5. Use accepted evidence lifecycle before transformation pilots.
6. Use real adapter parity before claiming runtime agnosticism.
7. Use HPO state projection semantics before HPO interface work.
8. Use integration gates before advancing phase boundaries.

## Task Assignment Protocol

A packet is assignable only when it contains:

- a DAG node ID;
- invariant IDs;
- required specs to read;
- allowed and forbidden files;
- test or fixture expectations;
- validation commands or discovery instructions;
- rollback boundaries;
- handoff requirements.

The mother agent must prefer packets that are independently verifiable, patch-small, and dependency-complete. A packet is too large if it spans multiple DAG nodes whose validations can fail independently. A packet is too small if it cannot produce a committed schema, fixture, test, or behavior increment.

## Review Protocol

Review each handoff in this order:

1. Confirm no product-spec files changed.
2. Confirm changed files are inside packet boundaries.
3. Confirm every implemented behavior maps to assigned invariant IDs.
4. Confirm tests or fixtures exist for executable claims.
5. Confirm validation commands ran or a valid unavailable reason was recorded.
6. Confirm no removed surface or forbidden compatibility alias was introduced.
7. Confirm no product behavior was invented outside specs.
8. Confirm assumptions and blockers were recorded outside product specs.

## Merge Protocol

The mother agent may integrate a subagent patch when:

- all assigned invariants are satisfied or explicitly blocked;
- no unassigned product behavior was added;
- all required validation gates for the packet pass or are recorded as dirty/blocked according to the verification schema;
- no forbidden root was edited;
- the ledger is updated with packet status, validation history, and remaining work.

If unrelated user or other-agent changes exist, the mother agent must not revert them. It must integrate around them or isolate the packet if there is a direct conflict.

## Retry Protocol

Retries are allowed when a failure is local, reproducible, and the same packet can be narrowed. The mother agent must retry at most twice without changing packet scope. After two failed retries, split the packet, assign a regression fixer or contract auditor, or mark the affected invariant as blocked.

Never retry by weakening tests, bypassing gates, broadening behavior, or editing product specs.

## Blocked-Track Protocol

A blocker exists only when:

- no safe implementation interpretation exists;
- required product behavior is impossible under current specs;
- two normative specs require incompatible implementation behavior;
- a validation gate cannot be defined because expected behavior is absent;
- implementation would require editing product specs.

When blocked, record the blocker outside product specs, mark affected invariant IDs and DAG nodes blocked, continue independent DAG nodes, and ask the human only when the entire dependency frontier is blocked.

## When To Spawn Subagents

Spawn subagents when work is bounded and independently verifiable, including:

- authoring schema validators;
- building fixture inputs and expected outputs;
- implementing one CLI/API surface;
- implementing one adapter or adapter fixture;
- writing negative tests;
- auditing contract coverage;
- fixing a regression in a known gate;
- implementing one HPO projection or transformation pilot.

## When Not To Spawn Subagents

Do not spawn subagents for:

- deciding product direction;
- resolving spec contradictions by changing specs;
- broad exploratory implementation without invariant IDs;
- multi-phase architecture changes that lack schema/test oracles;
- tiny edits the mother agent can do more safely;
- work that requires product-owner judgment and has no safe narrow assumption.

## Keeping Moving Without Human Intervention

The mother agent must maintain a frontier of unblocked DAG nodes. If one node blocks, it must scan for nodes whose dependencies remain satisfied, dispatch those packets, and record the blocked node in the ledger. Human escalation is reserved for a fully blocked frontier.

## Avoiding Endless Review Loops

Do not re-review all specs after every packet. Re-read relevant specs only when:

- a validation gate fails;
- a contradiction is discovered;
- an implementation packet cannot be derived;
- an integration boundary breaks;
- a product spec file hash changed outside the implementation agents.

Each review loop must end in exactly one outcome: accept, request one bounded retry, split the packet, record blocker, or supersede the packet.

## Final Completion Definition

Atelier is complete only when `FULL_COMPLETION_DEFINITION.md` is satisfied. Passing tests is necessary but insufficient. The mother agent must also prove invariant coverage, runtime agnosticism at the specified proof level, artifact graph correctness, accepted evidence durability, transformation safety, governance boundary enforcement, HPO value, repository ownership, and non-lock-in.

## Validation Re-run Cadence

The control gates VG-001, VG-036, VG-037, and VG-038 are re-run at
specific cadences, not only at launch. The orchestrator's `required_before`
machinery enforces this; this section makes the cadence explicit.

- **VG-001 (no product-spec edits):** Re-run **before every packet
  acceptance** and **before every phase-gate claim**. Failure opens
  P0 launch blocker `BLK-SPEC-DRIFT-001`.
- **VG-036 (product-spec hash baseline):** Re-run **before every
  packet acceptance** that mutates product code, **before every
  phase-gate claim**, and **before final completion**. Failure opens
  P0 launch blocker `BLK-SPEC-DRIFT-001`.
- **VG-037 (immutable control-doc diff check):** Re-run **after any
  control-doc edit** (recorded in a `control-doc-repair` packet's
  acceptance proof) and **before any ordinary packet acceptance**.
  Failure rejects the ordinary packet; only `control-doc-repair` may
  resolve it.
- **VG-038 (test-integrity / no weakening):** Re-run **on every
  packet diff that touches tests, fixtures, serializers, validators,
  or public surfaces**. Failure rejects the packet; the offending
  change is split into a legitimate test repair, not a
  weakening.

All other gates (VG-002..VG-045) are re-run **before their respective
phase-gate claim** and **before final completion**, as recorded in
each gate's `required_before` field.

The ledger's `Validation History` table records every gate run with
its `ran_at`, `gate_id`, `status`, and `proof_artifact`. A stale
`Validation History` (i.e., a packet was accepted but no validation
entry exists in the history) is itself a P1 finding.
