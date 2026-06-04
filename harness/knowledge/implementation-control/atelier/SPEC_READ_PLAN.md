---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-spec-read-plan
title: Atelier Spec Read Plan
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Spec Read Plan

## Purpose

This read plan prevents every subagent from loading every product spec by default. The mother agent reads global control documents and only the product specs needed for the current DAG node. Subagents read the global authority constraints plus the domain specs required by their packet.

Global authority constraints for every packet:

- product specs under `harness/knowledge/product-specs/atelier/**` are immutable;
- `contract.md` §1-§2 controls authority and conflicts;
- `contract.md` §18 controls positioning boundaries;
- `ROADMAP.md` controls execution order;
- the packet’s assigned invariant IDs are the implementation scope.

## Read Plan Table

| Document | Authority level | Read by mother agent when | Read by subagent when | Implementation decisions controlled | Forbidden interpretations |
|---|---|---|---|---|---|
| `README.md` | Onboarding and spec map; active claims summary | At program start; when product-spec inventory changes | Only when packet needs spec-pack map or proof-status summary | Spec inventory, document responsibilities, proof status, artifact class summary, run packet read order | Do not treat MVP summary as full completion; do not infer authority from filename casing |
| `Ideal.md` | Product direction root; philosophy root | At program start; before full-DAG changes; when product-direction conflict appears | Only for boundary-sensitive packets or final completion audit | Product thesis, non-negotiable principles, failure definition, machine-readable success set | Do not derive command/schema details from Ideal; do not silently resolve Ideal vs contract conflict |
| `contract.md` | Normative behavior hub | At every DAG-node selection; before any implementation packet | For every executable packet, at least assigned sections | Plane boundaries, artifact classes, attention contract, task/run lifecycle, transformation maturity, verification lifecycle consequence, non-goals | Do not let implementation or tests override contract; do not collapse planes semantically |
| `POSITIONING.md` | Strategic positioning; boundary context | At phase planning, absorption-boundary review, final completion review | Only when packet risks adjacent-category collapse or HPO/adapter strategy | Non-goals, absorption threats, strategic sequence mirror, defensible boundary | Do not turn strategic market claims into code tasks unless backed by contract/subcontract |
| `ROADMAP.md` | Canonical execution order | At every phase gate and DAG frontier selection | When packet belongs to phase sequencing or unlock criteria | Phase order, MVP loop, adapter proof staging, transformation/HPO/swarm ordering | Do not reorder phases because parallelism seems convenient; do not claim runtime agnosticism before Stage 1 parity |
| `GRAPH_SEMANTICS.md` | Graph kernel schema subcontract | Before graph, identity, class, edge, authority, hash, stale, regeneration, privacy-boundary packets | Graph kernel implementer, schema implementer, fixture author, verification/HPO/adapter roles when graph edges are touched | Artifact classes, node schema, canonical kinds, edge schema, endpoint matrix, strict validation, authority, hash, stale detection, regeneration | Do not invent canonical kinds or edge kinds; do not put derived state outside `.atelier`; do not use path as identity except path-owned artifacts |
| `VERIFICATION_SCHEMA.md` | Verification schema subcontract | Before verification, completion, run verify, required map, HPO evidence, contract gates | Verification engine implementer, fixture author, CLI implementer, HPO state implementer | Check registry, required verification map, record schema, status lattice, reason codes, hard_block, truth table, durable promotion | Do not add statuses or reason codes; do not treat skipped/unavailable as clean; do not make file write alone durable evidence |
| `EVENT_MODEL.md` | Event schema subcontract | Before lifecycle, evidence promotion, graph/event correlation, redaction, replay, HPO packets | Event lifecycle implementer, verification engine, transformation, HPO state, adapter roles | Closed event enum, event identity, payload invariants, durability, redaction, replay, `artifact_accepted`/`artifact_rejected`, correlation IDs | Do not emit legacy `run_started` in new code; do not replay durable events; do not accept without scope and evidence |
| `HPO_STATE_MODEL.md` | HPO state subcontract | Before HPO projection/interface work and final completion | HPO state/UI implementer, verification engine when UI consequences are exposed | State labels, required evidence, forbidden claims, allowed actions, state transitions, uncertainty display | Do not add state labels; do not display a state without evidence; do not present dirty/forced/blocked as success |
| `RUN_PACKET_MODEL.md` | Run packet/handoff durability subcontract | Before run packet storage, export, handoff promotion, deletion-regeneration packets | Run lifecycle, adapter, surface/CLI, fixture author roles | Working packet, exported packet, accepted handoff, terminal summary, debug trace classes, promotion rules | Do not treat `.atelier/runs/**` handoff as durable proof; do not make export imply acceptance |
| `WRITE_AUTHORITY_MATRIX.md` | Write authority subcontract | Before any packet that writes, exports, accepts, rejects, promotes, or enforces artifacts | All implementers with write behavior; adapter and validator roles | Actor authority, allowed creates, promotion authority, forbidden writes, acceptance requirements | Do not let adapters/validators promote their own output; do not let context planner write source/product truth |
| `SURFACES.md` | Surface contract subcontract | Before CLI/MCP/GUI/prompt/adapter-output packets and active-surface tests | Surface/CLI, adapter, HPO UI, integration tester roles | Active command inventory, removed commands, MCP names, GUI labels, generated prompts, JSON schemas, parity scope | Do not advertise removed commands; do not add compatibility aliases; do not emit camelCase JSON fields |
| `ADAPTER_CONTRACT.md` | Runtime adapter subcontract | Before packet export, adapter registry, generic/noop, real adapter, parity packets | Adapter implementer, fixture author, integration tester | Canonical packet/result, capability descriptors, forbidden adapter behavior, round-trip, semantic equivalence, proof levels, error schema, output class split | Do not claim runtime agnosticism from Stage 0; do not let adapters own execution, hide state, or invent verification records |
| `CONTRACT_TEST_MATRIX.md` | Test coverage subcontract | Before every phase gate, fixture packet, contract audit, and final acceptance | Fixture author, integration tester, contract auditor, regression fixer | Coverage rule, fixture layout, priority tests, currently testable claims, waivers, test authoring rules | Do not call a normative claim covered unless it maps to test, fixture-only check, or waiver; do not fabricate concrete paths as product spec truth |
| `EXAMPLES.md` | Normative golden flow shape | Before end-to-end flow, fixture, adapter portability, transformation, force-close, accepted evidence packets | Fixture author, integration tester, domain implementer for matching flow | Six golden flows and their expected observable behavior | Do not treat examples as exhaustive; do not contradict their golden flow shape without blocker record |

## Spec Classification Summary

| Classification | Documents |
|---|---|
| Normative behavior hub | `contract.md` |
| Normative schema/surface subcontracts | `GRAPH_SEMANTICS.md`, `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, `HPO_STATE_MODEL.md`, `RUN_PACKET_MODEL.md`, `WRITE_AUTHORITY_MATRIX.md`, `SURFACES.md`, `ADAPTER_CONTRACT.md` |
| Normative test and fixture authority | `CONTRACT_TEST_MATRIX.md`, `EXAMPLES.md` |
| Canonical sequencing | `ROADMAP.md` |
| Strategic constraints | `POSITIONING.md` |
| Product direction | `Ideal.md` |
| Onboarding and active-claim map | `README.md` |

## Missing Expected Documents

None at creation time. The expected set was found: `Ideal.md`, `contract.md`, `POSITIONING.md`, `ROADMAP.md`, `README.md`, `ADAPTER_CONTRACT.md`, `CONTRACT_TEST_MATRIX.md`, `EXAMPLES.md`, `GRAPH_SEMANTICS.md`, `SURFACES.md`, `EVENT_MODEL.md`, `HPO_STATE_MODEL.md`, `VERIFICATION_SCHEMA.md`, `RUN_PACKET_MODEL.md`, and `WRITE_AUTHORITY_MATRIX.md`.

## DAG Node Section Read Table

The mother agent must refine this table after `DAG-02` section-level coverage extraction. Until then, packets must cite exact source sections manually and cannot rely on document-level reads alone.

### Assertion-Row Routing

After `DAG-02` produces concrete join-table rows (per `state/traceability/dag-02-join-table-2026-06-04.yaml`), the read plan is augmented with an assertion-row routing table. The augmentation maps:

- `dag_node_id` → list of `assertion_row_id`s in the join table that the node owns
- `assertion_row_id` → list of `source_section` references the subagent must read

Until the assertion rows are concrete, the DAG Node Section Read Table below remains the authoritative read plan. Once rows are concrete, the assertion-row routing supersedes the document-level routing for product-code packets.

| DAG Node | Required product spec sections | Optional product spec sections | Forbidden sources | Expected output of reading |
|---|---|---|---|---|
| DAG-01 | `README.md` spec map; all product spec file paths from repository `HEAD` | None | Current dirty filesystem as baseline | `HEAD` product spec hash ledger |
| DAG-01B | None; use `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md` | `README.md` only for project naming context | Product-spec content edits | Repository inventory and edit-root map |
| DAG-02 | `contract.md` all normative `must` sections; all schema subcontracts; `CONTRACT_TEST_MATRIX.md` coverage rules | `EXAMPLES.md` for flow-shaped claims | Strategic-only claims as executable behavior | Section-level invariant/gate/fixture join table |
| DAG-02A | `CONTRACT_TEST_MATRIX.md` fixture layout and named tests; `EXAMPLES.md` flow fixtures | Domain specs for ambiguous aliases | Product-spec rename or normalization | Fixture alias registry |
| DAG-03 | `CONTRACT_TEST_MATRIX.md` fixture layout; domain spec sections for each fixture | `EXAMPLES.md` matching flow | Invented commands as existing commands | Fixture scaffold and command placeholders only |
| DAG-04 | `GRAPH_SEMANTICS.md` artifact classes, node schema, identity, kinds, edges, endpoint matrix; `EVENT_MODEL.md` violation events | `contract.md` artifact class overview | New graph kinds/edges without spec | Graph schema and negative cases |
| DAG-05 | `EVENT_MODEL.md` event enum, identity, payload, durability, redaction; `contract.md` lifecycle sections | `GRAPH_SEMANTICS.md` edge correlation | Legacy events as new emissions | Event schema and durability validators |
| DAG-06 | `VERIFICATION_SCHEMA.md` registry, required map, records, status lattice, reason codes, hard_block, truth table; `contract.md` verification lifecycle | `EVENT_MODEL.md` acceptance events | New statuses/reasons | Verification schema and truth-table validators |
| DAG-07 | `SURFACES.md` active CLI, removed commands, JSON schemas, MCP names, GUI labels, prompts; `contract.md` surface consequences | `README.md` public proof status | Compatibility aliases for removed commands | Surface inventory and stale-command negative cases |
| DAG-08 | `ADAPTER_CONTRACT.md` packet/result/capability/error/output class; `SURFACES.md` adapter surfaces | `RUN_PACKET_MODEL.md` packet classes | Runtime-specific hidden state | Adapter canonical schemas |
| DAG-09 | `RUN_PACKET_MODEL.md` working/exported/accepted packet classes and reading order; `contract.md` run packet overview | `ADAPTER_CONTRACT.md` packet boundary | Treating `.atelier/runs/**` as durable proof | Run packet schema validators |
| DAG-10 | `WRITE_AUTHORITY_MATRIX.md`; `contract.md` policy decision and hard_block sections; `VERIFICATION_SCHEMA.md` hard_block | `SURFACES.md` mutating commands | Full policy engine invention | Write authority and policy-decision gates |
| DAG-11 to DAG-13 | `GRAPH_SEMANTICS.md` discovery, strict validation, hash, regeneration, stale detection | `EVENT_MODEL.md` conflict/violation events | Path-only identity for authored artifacts | Graph builder, hash, stale and regeneration proof |
| DAG-14 to DAG-17 | `VERIFICATION_SCHEMA.md`; `EVENT_MODEL.md`; `contract.md` completion/evidence sections | `RUN_PACKET_MODEL.md` durable summary classes | Dirty-as-success wording | Verification, completion, and durable acceptance proof |
| DAG-18 to DAG-20 | `contract.md` task/run lifecycle; `EVENT_MODEL.md`; `SURFACES.md` run commands | `HPO_STATE_MODEL.md` lifecycle display consequences | Collapsing task close into run completion | Task/run lifecycle and surface proof |
| DAG-21 to DAG-25 | `ADAPTER_CONTRACT.md`; `RUN_PACKET_MODEL.md`; `ROADMAP.md` Stage 0 proof language | `SURFACES.md` adapter output surfaces | Runtime agnosticism claim from Stage 0 | Packet portability proof only |
| DAG-26 to DAG-28 | `contract.md` attention/context sections; `VERIFICATION_SCHEMA.md` required map; `SURFACES.md` context JSON | `EXAMPLES.md` Example 1 | Hidden task/run/source mutation | Read-only context plan proof |
| DAG-29 to DAG-30 | `ROADMAP.md` Phase 1D-1E; `EXAMPLES.md` wedge flows; involved domain specs | `README.md` proof status | Full-product claims from MVP wedge | MVP and narrow reconciliation proof |
| DAG-31 to DAG-34 | `ADAPTER_CONTRACT.md` Stage 1 parity; `ROADMAP.md` Phase 2 | `SURFACES.md` adapter surfaces | Runtime agnosticism before real parity | Runtime parity proof |
| DAG-35 to DAG-40 | `contract.md` transformation maturity; `EVENT_MODEL.md`; `WRITE_AUTHORITY_MATRIX.md`; `VERIFICATION_SCHEMA.md` decision_ref | `EXAMPLES.md` transformation flows | Auto-promotion or skipped maturity | Transformation and governance proof |
| DAG-41 to DAG-44 | `HPO_STATE_MODEL.md`; `EVENT_MODEL.md`; `VERIFICATION_SCHEMA.md`; trace/review invariant addendum | `SURFACES.md` GUI labels | State without evidence or success wording for dirty states | HPO and trace/review proof |
| DAG-45 to DAG-50 | `ADAPTER_CONTRACT.md`; `RUN_PACKET_MODEL.md`; `ROADMAP.md` swarm phase; swarm invariant addendum | `POSITIONING.md` boundary checks | Hidden runtime truth or canonized subagent output | Runtime resolution and swarm safety proof |
| DAG-51 to DAG-53 | All executable spec sections touched by incomplete invariants; `FULL_COMPLETION_DEFINITION.md` proof matrix | `Ideal.md` for final direction audit | Blocked invariants as completion | Full completion evidence |
