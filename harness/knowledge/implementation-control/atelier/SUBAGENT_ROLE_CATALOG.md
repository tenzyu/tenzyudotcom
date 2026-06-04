---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-subagent-role-catalog
title: Atelier Subagent Role Catalog
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Subagent Role Catalog

## Global Role Limits

All roles are routing hints, not packet-size authorization. A packet should normally change no more than one domain schema, one fixture family, one command surface, or one integration seam. A role may receive a broad invariant range only as a planning context; the packet must still name a narrow subset of invariant IDs, exact spec sections, allowed files, and validation gates.

No role may edit immutable implementation-control docs unless the packet role is `control-doc repairer`, the packet explicitly targets those files, and `VG-037` records a before/after authority audit.

When the DAG row is a range (`DAG-NN_to_DAG-MM`), the canonical split in this catalog is authoritative; never dispatch a single packet that covers a range. See `IMPLEMENTATION_DAG.md` § "DAG Node Range Rule".

## Canonical Packet Splits

| Domain | Split packets |
|---|---|
| Graph | schema validator; endpoint fixture; identity resolver; hash/regeneration; stale detector; authority-conflict resolver |
| Verification | registry schema; record schema; status/reason lattice; required-map derivation; hard-block truth table; run verify surface |
| Events | event enum/schema; durable event writer; task/run boundary; accepted evidence; redaction boundary |
| Surfaces | active CLI inventory; removed-command grep; priority JSON schema per command; MCP parity; GUI label map |
| Adapters | canonical packet schema; canonical result schema; capability descriptors; Stage 0 adapters; semantic equivalence; real-runtime parity |
| Governance | write-authority guard; policy_decision hard-block; forbidden promotion negative cases |
| Swarm | role routing; generated packet protocol; conflict detection; merge readiness/handoff |

| Role | Responsibilities | Required specs | Forbidden actions | Inputs | Outputs | Validation duties | Handoff duties |
|---|---|---|---|---|---|---|---|
| Graph kernel implementer | Implement graph identity, node/edge schemas, kind catalog, endpoint validation, graph hash, regeneration, stale detection | `contract.md`, `GRAPH_SEMANTICS.md`, `EVENT_MODEL.md`, `CONTRACT_TEST_MATRIX.md` graph fixtures | Editing product specs; inventing canonical kinds/edges; using path as identity except path-owned artifacts | AT-INV-004 through AT-INV-013, graph fixture packet | Graph modules, validators, graph JSON output, fixture support | Run graph golden, endpoint compatibility, deletion-regeneration gates when available | Changed files, graph hash evidence, invalid endpoint cases, assumptions |
| Schema implementer | Implement reusable schema definitions and validators for graph, verification, events, adapters, surfaces, HPO, run packets | Domain schema spec for packet plus `contract.md` §2 | Adding schema fields not in specs; loosening closed enums; allowing extra JSON fields where forbidden | Assigned schema invariants and fixture layout | Schema files, validators, negative tests | Run schema validation and negative tests | Report schema coverage and rejected invalid cases |
| Fixture author | Create committed fixtures and expected outputs per test matrix layout | `CONTRACT_TEST_MATRIX.md`, `EXAMPLES.md`, relevant domain spec | Changing product specs to match fixture; making fixture depend on network/LLM/external state | Fixture ID, invariants, expected behavior | Fixture directory with input/expected/README/command | Validate fixture is reproducible from committed files | List fixture IDs, assertions, unresolved oracle gaps |
| Verification engine implementer | Implement check registry, required map derivation, verification record validation, hard-block, truth table | `VERIFICATION_SCHEMA.md`, `contract.md` §16, `EVENT_MODEL.md` §5-§6, `SURFACES.md` run verify sections | Adding statuses/reason codes; treating dirty as success; accepting passed without evidence | AT-INV-014 through AT-INV-023 | Verification modules, run verify integration, completion gate | Run verification record, map derivation, completion truth table, run verify surface fixtures | Report gate truth table coverage and blocked cases |
| Event lifecycle implementer | Implement event identity, closed enum, payload validation, durability, replay/redaction, graph edge correlation | `EVENT_MODEL.md`, `contract.md` task/run sections, `GRAPH_SEMANTICS.md` edge correlation | Emitting legacy events in new code; replaying durable events; accepting without correlation_id | AT-INV-025 through AT-INV-032 | Event service, event validators, durable event writers | Run event schema, durable acceptance, run lifecycle fixtures | Report emitted event types and durability paths |
| Attention planner implementer | Implement context plan selection, resolution decisions, budget reporting, read-only effect profile, required verification map co-emission | `contract.md` §10/§10a, `VERIFICATION_SCHEMA.md` §3, `SURFACES.md` context JSON, `EXAMPLES.md` Example 1 | Mutating tasks/runs/source; uncontrolled context expansion; omitting resolver_identity | AT-INV-056 through AT-INV-059 | Context planner, CLI/API JSON, budget guards | Run context readonly, budget, resolution decision fixtures | Report selected artifacts, exclusions, budget deltas, read-only evidence |
| Surface/CLI implementer | Implement active CLI/MCP/JSON surfaces and removed-command enforcement | `SURFACES.md`, domain specs for each command, `CONTRACT_TEST_MATRIX.md` surface tests | Adding short flags as contract; advertising removed commands; extra JSON fields on priority commands | AT-INV-034 through AT-INV-039 plus command-specific invariants | CLI/MCP code, JSON serializers, help output | Run active surface inventory and command-specific fixtures | Report exact command help and JSON examples |
| Adapter implementer | Implement adapter registry, canonical packet/result, generic adapters, real adapters, parity oracle | `ADAPTER_CONTRACT.md`, `SURFACES.md` §7, `VERIFICATION_SCHEMA.md` statuses, `RUN_PACKET_MODEL.md` | Owning execution; hidden state; inventing verification; implicit promotion; claiming runtime agnosticism from Stage 0 | AT-INV-040 through AT-INV-049 | Adapter code, descriptors, parity fixtures | Run packet portability, semantic equivalence, runtime parity as applicable | Report adapter pair, normalized comparison, proof claim enabled or not |
| Transformation implementer | Implement candidate/proposal/accept/deterministic/enforced lifecycle and pilots | `contract.md` §8/§8a, `EVENT_MODEL.md` §5, `GRAPH_SEMANTICS.md`, `EXAMPLES.md` Examples 3 and 6 | Auto-promoting proposals; level jumps; using transform_receipt as primary decision_ref | AT-INV-065 through AT-INV-067, pilot invariants | Transformation modules, receipts, pilot fixtures | Run transform maturity, accepted evidence, decision_ref fixtures | Report maturity transitions and acceptance evidence |
| Governance/policy boundary implementer | Implement minimum policy decision hard-block boundary and write authority guards | `contract.md` §5.5, `WRITE_AUTHORITY_MATRIX.md`, `VERIFICATION_SCHEMA.md` §7 | Inventing full policy schema before spec exists; hiding mutations; allowing unauthorized promotion | AT-INV-050 through AT-INV-052, AT-INV-039 | Policy decision stub, write guards, negative tests | Run write authority fixture when available, completion gate policy hard-block case | Report deferred POLICY_SCHEMA gap if encountered |
| HPO state/UI implementer | Implement HPO projection and UI/API that displays evidence, forbidden-claim-safe states, allowed actions, uncertainty | `HPO_STATE_MODEL.md`, `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, `SURFACES.md` GUI labels | Adding state labels; displaying states without evidence; success language for dirty/blocked/forced | AT-INV-060 through AT-INV-064 | Projection service, UI/API components, label map | Run HPO state evidence fixture and surface inventory | Report state/evidence/action mappings and forbidden copy checks |
| Integration tester | Run cross-track flows and phase gates, including examples and end-to-end wedge | `CONTRACT_TEST_MATRIX.md`, `EXAMPLES.md`, `ROADMAP.md`, relevant domain specs | Editing implementation to make tests pass; weakening expected outputs; touching product specs | DAG node set, gate list, fixture commands | Test reports, failure triage, integration evidence | Run all assigned validation gates | Report pass/fail/unavailable with exact commands and affected invariants |
| Contract auditor | Check traceability from specs to invariants, tests, fixtures, waivers, and implementation | All product specs as needed, `CONTRACT_TO_BUILD_MATRIX.md`, `CONTRACT_TEST_MATRIX.md` | Changing product specs; inventing product behavior; approving untraced code | Matrix, changed files, ledger | Coverage report, gap ledger entries, blocker recommendations | Run coverage test when available; no-product-spec-edit check | Report unmapped behavior, expired waivers, missing tests |
| Regression fixer | Fix failing validation gates with minimal scoped patches | Specs and files for failing invariant only | Broad refactors; deleting tests; changing expected fixtures without proof | Failure report, logs, affected invariant IDs | Narrow fix, new regression test if missing | Re-run failing gate and packet-specific checks | Report root cause, fix scope, validation result |
| Control-doc repairer | Repair implementation-control authority documents in response to launch-readiness findings. The role executes directly as the mother agent; it is not dispatched as a subagent. | Review finding, affected control docs, product-spec immutability rule | Editing product specs; weakening gates; changing completion to allow unresolved blockers; dispatching implementation packets; adding compatibility aliases for removed commands; broadening fixture scope without matrix-backed reason; narrowing expected diff shape; downgrading blocker severity without evidence; converting executable requirements into assumptions; allowing pending commands to satisfy phase gates | Dedicated `control-doc-repair` packet | Updated control docs and authority audit | Run VG-001, VG-036, VG-037, VG-038, and project check | Before/after authority summary, changed docs, remaining blockers |

## Control-Doc-Repair Packet Type (closed specification)

The `control-doc-repair` packet type is the only authorized way to mutate immutable implementation-control core docs.

- Dispatch mode: mother agent direct. Subagent dispatch is forbidden.
- `allowed_files`: exact immutable control-doc paths the packet will edit.
- `forbidden_actions` (closed list; any violation is a fatal packet-level blocker):
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
- `required_review`: mother-agent authority audit recorded in the ledger.
- `audit_proof_ref`: path to the before/after authority audit record.

Execution mode constant:

```yaml
execution_mode: mother_agent_direct_control_doc_repair
packet_type: control-doc-repair
subagent_dispatched: false
```
