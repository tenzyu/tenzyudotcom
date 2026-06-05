---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-implementation-dag
title: Atelier Implementation DAG
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Implementation DAG

## Purpose

This DAG sequences full Atelier implementation to completion. It is dependency-ordered, not MVP-reduced. Phase 1 proves the wedge, but the graph continues through real runtime adapters, transformation, HPO UI, and swarm coordination until the full product ideal is satisfied.

## Phase Gates

| Phase Gate | Unlocks | Required Evidence |
|---|---|---|
| PG-0 Control readiness | Control repair and repository discovery packets only | This control document set exists; product-spec baseline is `HEAD`; product-spec drift checks are clean or recorded as P0 launch blocker |
| PG-0B Repository readiness | Implementation packets | `DAG-01`, `DAG-01B`, and `DAG-01C` pass; immutable control-doc baseline recorded; executable structured gate records exist for packet gates; relevant `DAG-02` join-table rows are concrete; allowed edit roots derived from repository inventory |
| PG-1 Schema substrate | Feature implementation | Graph, verification, event, surface, adapter, run packet, write authority schemas have validators and fixtures |
| PG-2 MVP wedge | Phase 2 real adapters | Phase 1A-1D fixtures pass; Stage 0 packet portability passes; accepted evidence lifecycle passes |
| PG-3 Runtime agnosticism | Adapter expansion and HPO claims about runtime agnosticism | At least one real-runtime adapter pair passes `adapter_runtime_parity_fixture` |
| PG-4 Transformation safety | Broad transformation pilots | Accepted evidence lifecycle, maturity transition fixture, decision_ref fixture pass |
| PG-5 HPO value | Full HPO interface | HPO state projection, forbidden claims, evidence table, drift semantics pass |
| PG-6 Swarm readiness | Multi-agent coordination | Runtime agnosticism, graph conflict detection, verification gates, HPO state evidence pass |
| PG-F Full completion | Release | `FULL_COMPLETION_DEFINITION.md` criteria satisfied |

## DAG Nodes

## DAG Node Range Rule

Each row whose Node ID is a `DAG-NN_to_DAG-MM` range (e.g. `DAG-21_to_DAG-25`) is documentation-only. Per-packet dispatch must split the range into individual `DAG-NN` packets according to `SUBAGENT_ROLE_CATALOG.md` canonical splits before any subagent is dispatched. A single subagent packet must never span a `DAG-NN_to_DAG-MM` range.

| Node ID | Track | Depends On | Invariants | Gates | Unlock Criteria | Parallelizable With | Blocked-Work Isolation | Phase Gate |
|---|---|---|---|---|---|---|---|---|
| DAG-00 | Control substrate | None | N/A | VG-001, VG-037 | Implementation-control docs exist; product-spec drift is not accepted as baseline | None | Blocks all implementation if absent | PG-0 |
| DAG-01 | Product spec inventory and HEAD hash ledger | DAG-00 | AT-INV-068 | VG-001, VG-036 | All product spec paths and `HEAD` hashes recorded outside product specs; current drift is either clean or P0-blocked | Repository inventory | Product-spec drift blocks implementation dispatch, not control repair | PG-0 |
| DAG-01B | Repository implementation inventory | DAG-01 | infrastructure_support for all executable invariants | VG-000, VG-001, VG-036, VG-037 | Project list, package manager, targets, source roots, test roots, fixture roots, generated roots, dirty status, baseline revision, editable/non-editable roots recorded | Command discovery | Inventory gaps block implementation packets only | PG-0B |
| DAG-01C | Command and target discovery | DAG-01B | infrastructure_support for all executable invariants | VG-000, VG-002 | Atelier project and target commands discovered; check command recorded | Fixture alias registry | Missing command blocks command-dependent packets only | PG-0B |
| DAG-02 | Contract coverage extractor | DAG-01B | AT-INV-068 | VG-029, VG-038 | Normative `must` extraction maps to section-level invariant IDs, gates, fixtures, waivers, or blockers | Fixture scaffolding | Coverage gaps block phase close, not schema work | PG-1 |
| DAG-02A | Fixture/test oracle alias registry | DAG-01C | AT-INV-069 | VG-004, VG-045 | Product test names, fixture aliases, command files, and pending oracle gaps are normalized outside product specs | Contract coverage | Alias gaps block fixture acceptance, not schema design | PG-1 |
| DAG-03 | Fixture layout scaffold | DAG-01C, DAG-02A | AT-INV-069 | VG-004, VG-045 | v5.1 fixture directories and required files convention exists | Contract coverage | Missing exact commands may use placeholders plus discovery; placeholders cannot satisfy phase gates | PG-1 |
| DAG-04 | Graph kernel schema | DAG-01B, DAG-02 | AT-INV-004 to AT-INV-009 | VG-005, VG-006, VG-034, VG-038 | Node/edge/class/kind/identity/authority schemas implemented | Verification schema, event schema | Graph schema blocker does not block verification schema validators | PG-1 |
| DAG-05 | Event schema | DAG-01B, DAG-02 | AT-INV-029 to AT-INV-033 | VG-011, VG-013, VG-040, VG-041, VG-044 | Closed event enum, identity, payload, durability, redaction validators implemented | Graph schema, verification schema | Event blocker blocks lifecycle, not graph schema | PG-1 |
| DAG-06 | Verification schema | DAG-01B, DAG-02 | AT-INV-014 to AT-INV-022 | VG-008, VG-009, VG-010, VG-024, VG-042, VG-043 | Check registry, record schema, status/reason enums, hard-block/truth-table validators implemented | Graph schema, event schema | Verification blocker blocks completion, not graph hash | PG-1 |
| DAG-07 | Surface inventory schema | DAG-01B, DAG-02 | AT-INV-034 to AT-INV-039 | VG-018, VG-019, VG-039 | Active/removed CLI, MCP names, JSON schema validators exist | Adapter schema | Surface blocker blocks CLI release, not core schemas | PG-1 |
| DAG-08 | Adapter canonical schemas | DAG-01B, DAG-02 | AT-INV-040 to AT-INV-049 | VG-021, VG-022, VG-023, VG-032 | Packet/result/error/capability/output-class schemas implemented | Surface schema, run packet schema | Adapter schema blocker blocks adapter tracks only | PG-1 |
| DAG-09 | Run packet model schema | DAG-01B, DAG-02 | AT-INV-053 to AT-INV-055 | VG-020, VG-033 | Working/exported/accepted packet classes and reading order validators exist | Adapter schema | Blocks run export/resume only | PG-1 |
| DAG-10 | Write authority enforcement boundary | DAG-04, DAG-05, DAG-06 | AT-INV-050 to AT-INV-052 | VG-026A, VG-026B, VG-043, VG-034 | Minimum actor/class authority checks enforce forbidden writes; full fixture gate is separate and cannot waive mutating-write protection | CLI implementation, fixtures | Write-authority blocker freezes mutating packets; read-only features may continue | PG-1 |
| DAG-11 | Graph discovery and node extraction | DAG-04 | AT-INV-002, AT-INV-005 to AT-INV-007 | VG-005, VG-007 | Source and accepted evidence artifacts discover into graph nodes | Verification registry implementation | Blocks graph hash, attention freshness | PG-1 |
| DAG-12 | Graph edge extraction and strict validation | DAG-04, DAG-05, DAG-11 | AT-INV-008, AT-INV-009, AT-INV-013 | VG-006, VG-034 | Endpoint matrix validation and violation events work | Verification engine | Blocks graph consumers | PG-1 |
| DAG-13 | Graph hash, regeneration, stale detection | DAG-11, DAG-12 | AT-INV-010 to AT-INV-012 | VG-005, VG-007, VG-027, VG-033 | Golden graph hash deterministic; deletion-regeneration fixture passes | Verification record validator | Blocks attention freshness and full artifact graph correctness | PG-1 |
| DAG-14 | Verification registry and record validator | DAG-06, DAG-10 | AT-INV-014, AT-INV-016 to AT-INV-020 | VG-008, VG-024, VG-042 | Check registry and record validation pass negative cases | Graph hash | Blocks required map and run verify | PG-1 |
| DAG-15 | Required verification map derivation | DAG-14 | AT-INV-015 | VG-009 | Task acceptance criteria and check bindings derive closed map | Context planner | Blocks context plan co-emission and run creation | PG-1 |
| DAG-16 | Completion truth table engine | DAG-06, DAG-14, DAG-15 | AT-INV-021 to AT-INV-023 | VG-010, VG-043 | Completion truth table fixture passes | Event lifecycle implementation | Blocks run completion | PG-1 |
| DAG-17 | Event durability and accepted evidence lifecycle | DAG-05, DAG-10, DAG-14 | AT-INV-031, AT-INV-032, AT-INV-049 | VG-013, VG-014 | Durable acceptance fixture passes | Run lifecycle state machine | Blocks transformation and durable verification | PG-1 |
| DAG-18 | Task lifecycle | DAG-05, DAG-10 | AT-INV-024 | VG-040 | Task create/assign/split/block/unblock/close events validate | Run lifecycle | Blocks run materialization from tasks | PG-1 |
| DAG-19 | Run lifecycle state machine | DAG-05, DAG-09, DAG-16 | AT-INV-025 to AT-INV-028 | VG-011, VG-012, VG-041 | Run lifecycle fixture passes; blocked_waiting/terminal split enforced | Task lifecycle | Blocks complete/force-close | PG-1 |
| DAG-20 | Run verify/complete/force-close surfaces | DAG-07, DAG-14, DAG-16, DAG-17, DAG-19 | AT-INV-028, AT-INV-036, AT-INV-037 | VG-019, VG-034, VG-038 | CLI JSON schema and negative lifecycle tests pass | Context planner | Blocks E2E wedge | PG-2 |
| DAG-21 | Generic packet export core | DAG-08, DAG-09, DAG-15 | AT-INV-040 to AT-INV-046, AT-INV-053 to AT-INV-055 | VG-020, VG-021, VG-022 | Canonical packet can export to adapter boundary | Context planner | Blocks Stage 0 adapters | PG-2 |
| DAG-22 | Human-shell adapter | DAG-21 | AT-INV-040 to AT-INV-046 | VG-021, VG-022 | Registered Stage 0 adapter descriptor and result normalization | Noop adapter | Blocks packet portability only | PG-2 |
| DAG-23 | Noop-reference adapter | DAG-21 | AT-INV-040 to AT-INV-046 | VG-021, VG-022 | Registered schema-fixture adapter descriptor and result normalization | Human-shell adapter | Blocks packet portability only | PG-2 |
| DAG-24 | Adapter semantic equivalence oracle | DAG-08, DAG-22, DAG-23 | AT-INV-045 | VG-021 | Shared normalization oracle passes fixture | Context planner | Blocks packet/runtime parity | PG-2 |
| DAG-25 | Stage 0 packet portability | DAG-22, DAG-23, DAG-24 | AT-INV-046 | VG-022, VG-032 | `adapter_packet_portability_fixture` passes; only packet portability claim enabled | Context planner | Runtime agnosticism remains product goal | PG-2 |
| DAG-26 | Attention planner selection engine | DAG-13, DAG-15 | AT-INV-056 to AT-INV-059 | VG-015, VG-016, VG-017 | Deterministic/semantic/hybrid selection produces traceable plan | Generic adapters after schemas | Blocks context plan surface | PG-2 |
| DAG-27 | Resolution decision and budget engine | DAG-26 | AT-INV-057, AT-INV-058 | VG-016, VG-017 | Resolution decision and budget fixtures pass | Run lifecycle | Blocks Attention v1 | PG-2 |
| DAG-28 | Context plan surface | DAG-07, DAG-26, DAG-27 | AT-INV-051, AT-INV-056, AT-INV-059 | VG-015, VG-018 | Read-only fixture passes; snake_case JSON; verification map co-emitted | Run complete surface | Blocks E2E wedge | PG-2 |
| DAG-29 | MVP E2E wedge | DAG-20, DAG-25, DAG-28 | AT-INV-070 | VG-030, VG-034, VG-038 | Task -> context plan -> generic packet -> runner result -> verification record -> closure -> accepted evidence passes | Narrow reconciliation | Blocks Phase 2 | PG-2 |
| DAG-30 | Narrow reconciliation | DAG-13, DAG-28, DAG-29 | AT-INV-012, AT-INV-071 | VG-027, VG-033 | README/CLI, context/stale graph, handoff/diff drift reports work | Early Phase 2 design | Optional for MVP but required for full product | PG-2 |
| DAG-31 | First real runtime adapter | DAG-25, DAG-30 | AT-INV-047 | VG-023 | First real adapter passes packet portability against noop | Second adapter after adapter framework stable | Does not enable runtime agnosticism alone | PG-3 |
| DAG-32 | Second real runtime adapter | DAG-25, DAG-30 | AT-INV-047 | VG-023 | Second real adapter passes packet portability against noop | First adapter | Does not enable runtime agnosticism alone | PG-3 |
| DAG-33 | Real runtime parity | DAG-31, DAG-32, DAG-24 | AT-INV-047 | VG-023, VG-032 | `adapter_runtime_parity_fixture` passes for real pair | Additional adapters after pass | If blocked, runtime_agnosticism_claim remains product goal | PG-3 |
| DAG-34 | Additional adapters | DAG-33 | AT-INV-047, AT-INV-048 | VG-023 | Each additional adapter passes runtime parity in at least one pair | Transformation pilots | Block individual adapter only | PG-3 |
| DAG-35 | Transformation candidate lifecycle core | DAG-17, DAG-30 | AT-INV-065 to AT-INV-067 | VG-024, VG-025 | Maturity transitions and no-level-jump rules pass | Broad reconciliation | Blocks pilots | PG-4 |
| DAG-36 | Markdown-to-check pilot | DAG-35 | AT-INV-065 to AT-INV-067, AT-INV-072 | VG-025 | Candidate/proposal/accept/deterministic/enforced path fixture passes | Test-to-markdown, review-to-task | Block this pilot only | PG-4 |
| DAG-37 | Test-to-markdown pilot | DAG-35 | AT-INV-065 to AT-INV-067, AT-INV-072 | VG-025 | Test-derived product insight preserves provenance and acceptance | Markdown-to-check | Block this pilot only | PG-4 |
| DAG-38 | Review-to-task pilot | DAG-18, DAG-35 | AT-INV-065 to AT-INV-067, AT-INV-072, AT-INV-076 | VG-025 | Review record derives task candidate through accepted transition | Other pilots | Block this pilot only | PG-4 |
| DAG-39 | Governance/policy integration boundary | DAG-10, DAG-16, DAG-35 | AT-INV-050 to AT-INV-052, AT-INV-076 | VG-026A, VG-026B, VG-043 | Minimum policy decision shape contributes to hard_block; full policy schema gap recorded | HPO projection | POLICY_SCHEMA absence does not block v5.1 map | PG-4 |
| DAG-40 | Broad reconciliation | DAG-30, DAG-35, DAG-39 | AT-INV-071, AT-INV-077 | VG-027 | Markdown-vs-hooks, runtime-config-vs-canonical, policy-vs-permissions drift surfaced | HPO projection | Pair-specific blockers do not stop other drift pairs | PG-4 |
| DAG-41 | HPO state projection | DAG-16, DAG-17, DAG-19, DAG-40 | AT-INV-060 to AT-INV-064 | VG-028, VG-044 | Closed state set, evidence table, forbidden claims fixtures pass | HPO UI shell | Blocks HPO interface | PG-5 |
| DAG-42 | HPO interface | DAG-41 | AT-INV-060 to AT-INV-064, AT-INV-073 | VG-028, VG-018 | Product truth, verification, drift, transform candidates, decisions, roadmap state visible with evidence | Runtime adapter expansion | UI blockers do not block adapter parity | PG-5 |
| DAG-43 | HPO allowed actions | DAG-20, DAG-41, DAG-42 | AT-INV-063 | VG-028 | UI/API exposes actions only when state permits; force-close boundary enforced | Trace/review records | Blocks HPO completion | PG-5 |
| DAG-44 | Trace and review records | DAG-17, DAG-35, DAG-41 | AT-INV-077 | VG-034 | Trace/review records classify correctly and can become durable evidence through acceptance | HPO actions | Blocks review-to-task convergence | PG-5 |
| DAG-45 | Runtime resolution | DAG-33, DAG-41 | AT-INV-078 | VG-023, VG-032 | Runtime capability descriptors and adapter selection are graph-managed and replaceable | Swarm packet protocol | Blocks multi-runtime routing | PG-6 |
| DAG-46 | Generic packet portability expansion | DAG-33, DAG-45 | AT-INV-046, AT-INV-047, AT-INV-078 | VG-022, VG-023, VG-032 | Packets remain canonical across supported runtimes and humans | Swarm role routing | Blocks swarm dispatch | PG-6 |
| DAG-47 | Swarm role routing | DAG-41, DAG-45 | AT-INV-074, AT-INV-079 | VG-034, VG-038 | Role-based task routing produces bounded packets without making subagent outputs product truth | Subagent packet generation | Blocks swarm merge readiness | PG-6 |
| DAG-48 | Subagent packet generation | DAG-46, DAG-47 | AT-INV-074, AT-INV-079 | VG-037, VG-038 | Generated subagent packets include specs, invariants, files, validations, handoff | Parallel run boundaries | Blocks swarm coordination | PG-6 |
| DAG-49 | Parallel run boundaries and conflict detection | DAG-13, DAG-19, DAG-48 | AT-INV-080 | VG-034, VG-038 | Concurrent outputs conflict through graph/verification state, not hidden runtime state | Merge readiness | Blocks swarm release | PG-6 |
| DAG-50 | Merge readiness and review handoff | DAG-44, DAG-49 | AT-INV-081 | VG-034, VG-038 | Multi-agent outputs require provenance, validation, HPO-visible state before merge | Final E2E flows | Blocks full completion | PG-6 |
| DAG-51 | End-to-end product flows | DAG-29, DAG-33, DAG-40, DAG-43, DAG-50 | AT-INV-070 and all executable full-flow invariants | VG-031, VG-034, VG-038 | Six examples and full product flows pass across CLI/API/HPO/adapters | Final audit | Flow blocker blocks final only | PG-F |
| DAG-52 | Final invariant coverage audit | DAG-02, DAG-51 | AT-INV-001 to AT-INV-081 | VG-029, VG-036, VG-037, VG-038 | All executable invariants implemented/proven or product-authorized waived; no expired waivers; no unresolved executable blockers | Release docs | Blocks release | PG-F |
| DAG-53 | Final release proof | DAG-52 | AT-INV-001 to AT-INV-081 | VG-001, VG-002, VG-035, VG-036, VG-037, VG-038 | Full completion checklist satisfied; no product-spec edits; release evidence durable | None | Blocks final declaration | PG-F |

## Parallelization Rules

Parallelize schema validators only after `DAG-01B` repository inventory, `DAG-01C` command discovery, and the required section-level invariant/gate mappings for those schemas exist. Parallelize Stage 0 adapters after canonical packet export exists. Parallelize transformation pilots after `DAG-35`. Parallelize HPO interface components after `DAG-41` defines state projection. Do not parallelize work that writes the same schema, same command surface, same fixture family, same mutable ledger section, or same durable evidence path.

## Integration Gates

Integration gates are cumulative:

- IG-1: schema validators plus fixture scaffolds compile and validate.
- IG-2: graph plus verification plus event integration passes accepted evidence lifecycle.
- IG-3: context plan plus required verification map plus generic packet export passes MVP wedge.
- IG-4: Stage 1 adapter pair passes runtime parity.
- IG-5: transformation pilots preserve provenance and acceptance.
- IG-6: HPO displays evidence without forbidden claims.
- IG-7: swarm packets preserve runtime agnosticism and do not canonize subagent output by default.
- IG-F: all end-to-end flows pass and full completion definition is satisfied.

## Final Convergence Path

The final path is `DAG-51 -> DAG-52 -> DAG-53`. The mother agent must not declare completion until end-to-end flows, invariant coverage, proof-level distinctions, no-product-spec-edit checks, adapter parity, transformation safety, HPO value, and durable release evidence are all satisfied.
