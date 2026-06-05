---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-implementation-ledger
title: Atelier Implementation Ledger
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Implementation Ledger

This ledger is append-oriented. Later mother agent sessions must resume from this file without relying on conversation memory.

## Current Program State

```yaml
program: atelier-full-build
control_docs_created_at: 2026-06-04
product_spec_root: harness/knowledge/product-specs/atelier
implementation_control_root: harness/knowledge/implementation-control/atelier
product_specs_immutable: true
product_spec_baseline:
  baseline_source: HEAD
  baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
  status: clean_with_recorded_proof
  rule: current filesystem contents are not accepted as immutable baseline when they differ from HEAD
  drift_action: staged, unstaged, status, or hash drift becomes BLK-SPEC-DRIFT-001 and blocks implementation subagent dispatch
  current_phase_gate: PG-0B-control-and-discovery-ready
  current_frontier:
    - DAG-02
    - DAG-02A
  implementation_packet_frontier: []
  ordinary_product_code_packets_allowed: false
  control_and_discovery_packets_allowed: true
  launch_status: unsafe
  allowed_next_run_type: control-doc-repair only
  repository_discovery_required_before_dispatch: true
  product_spec_mutation_allowed: false
  immutable_control_doc_mutation_allowed: false except via control-doc-repair packet
  overall_status: unsafe_control_repair_in_progress
```

## Product Spec Inventory

```yaml
found_specs:
  - ADAPTER_CONTRACT.md
  - CONTRACT_TEST_MATRIX.md
  - EVENT_MODEL.md
  - EXAMPLES.md
  - GRAPH_SEMANTICS.md
  - HPO_STATE_MODEL.md
  - Ideal.md
  - POSITIONING.md
  - README.md
  - ROADMAP.md
  - RUN_PACKET_MODEL.md
  - SURFACES.md
  - VERIFICATION_SCHEMA.md
  - WRITE_AUTHORITY_MATRIX.md
  - contract.md
missing_expected_specs: []
spec_edit_policy: forbidden
```

## Product Spec HEAD Hash Baseline

These hashes are calculated from `HEAD:<path>`, not from the current filesystem. If any current product-spec staged, unstaged, status, or hash check differs from this baseline, implementation subagent dispatch is blocked until the drift is resolved or an authorized product-spec governance revision is committed.

```yaml
spec_hashes:
  baseline_id: product-spec-head-baseline
  baseline_source: HEAD
  baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
  recorded_at: 2026-06-04
  recorded_by: control-doc-repair
  entries:
    - path: harness/knowledge/product-specs/atelier/ADAPTER_CONTRACT.md
      sha256: 38fda784699e17dc59e6cdbd7dc02defcabe3cf04c375eaf4ff04861d3ca3a6f
    - path: harness/knowledge/product-specs/atelier/CONTRACT_TEST_MATRIX.md
      sha256: b0d72965f30320c0b3efb0a1386f990333852818e6475a998b196a18da0c10aa
    - path: harness/knowledge/product-specs/atelier/EVENT_MODEL.md
      sha256: f98739c816e3555d4af32b96c56de83d34fcd500d2a22e7d250f05f4d93be568
    - path: harness/knowledge/product-specs/atelier/EXAMPLES.md
      sha256: 6cfaa48d7c673f43dd63c637692e62d75b1c15b722934f5325513cb69567e187
    - path: harness/knowledge/product-specs/atelier/GRAPH_SEMANTICS.md
      sha256: d52daee9650ffa666a4075cd70b84c32d0ac5d5826bb169dee34d8c1c2b1abd7
    - path: harness/knowledge/product-specs/atelier/HPO_STATE_MODEL.md
      sha256: db0203619abca5ec0f4c6d3d4a6248c573d10d8e78f706d0c9e998c544b4987a
    - path: harness/knowledge/product-specs/atelier/Ideal.md
      sha256: 02ef4df3d2e37ab498d002526c7014048b785c791f06ea61b525891c09598c2a
    - path: harness/knowledge/product-specs/atelier/POSITIONING.md
      sha256: 8e915c82d92a694068f83de2932839e0f6ea6aa48e8d6987a913eb8868ac8e03
    - path: harness/knowledge/product-specs/atelier/README.md
      sha256: b4b9e255aca19579e5a42cf49c979e802c5c5269fea671d0a7392e355410c372
    - path: harness/knowledge/product-specs/atelier/ROADMAP.md
      sha256: e1afdbbf2b7f1ef7eb4933949817f8d683e6a8bc1ab6e2733a102a14eec2830f
    - path: harness/knowledge/product-specs/atelier/RUN_PACKET_MODEL.md
      sha256: 91f9e4d38e9c7743df9238391044d26e4f6baa27841c08892cd84447140b3087
    - path: harness/knowledge/product-specs/atelier/SURFACES.md
      sha256: fed0f2722ba5d1770e8f13ec4cd69f42d9526b8bb3685e009bba4341d1607b50
    - path: harness/knowledge/product-specs/atelier/VERIFICATION_SCHEMA.md
      sha256: a76941b847736113ec72d93b52d9aafb58a537694920a1b15bf7c6455887dc6d
    - path: harness/knowledge/product-specs/atelier/WRITE_AUTHORITY_MATRIX.md
      sha256: 782ccec52f32fd2bf1ae018745610ef683f36eaab7407d83fc9aea3a372b2fa7
    - path: harness/knowledge/product-specs/atelier/contract.md
      sha256: 3de22827caa36c052c26ed7ad459c09f264077b9230ab1a40051e12231b78c53
```

## Mutable State Roots And Immutable Control Docs

```yaml
mutable_state_roots:
  - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md
  - harness/knowledge/implementation-control/atelier/state/packets/**
  - harness/knowledge/implementation-control/atelier/state/blockers/**
  - harness/knowledge/implementation-control/atelier/state/assumptions/**
  - harness/knowledge/implementation-control/atelier/state/validations/**
  - harness/knowledge/implementation-control/atelier/state/handoffs/**
  - harness/knowledge/implementation-control/atelier/state/waivers/**
  - harness/knowledge/implementation-control/atelier/state/repository-inventory/**
  - harness/knowledge/implementation-control/atelier/state/command-discovery/**
  - harness/knowledge/implementation-control/atelier/state/gates/**
  - harness/knowledge/implementation-control/atelier/state/traceability/**
immutable_control_doc_roots:
  - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_ORCHESTRATOR.md
  - harness/knowledge/implementation-control/atelier/SPEC_READ_PLAN.md
  - harness/knowledge/implementation-control/atelier/CONTRACT_TO_BUILD_MATRIX.md
  - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_DAG.md
  - harness/knowledge/implementation-control/atelier/AGENT_PACKET_PROTOCOL.md
  - harness/knowledge/implementation-control/atelier/SUBAGENT_ROLE_CATALOG.md
  - harness/knowledge/implementation-control/atelier/VALIDATION_GATE_REGISTRY.md
  - harness/knowledge/implementation-control/atelier/SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md
  - harness/knowledge/implementation-control/atelier/FULL_COMPLETION_DEFINITION.md
  - harness/knowledge/implementation-control/atelier/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md
state_index: harness/knowledge/implementation-control/atelier/state/README.md
```

## Immutable Control Doc Baseline

```yaml
immutable_control_doc_baseline:
  baseline_id: immutable-control-doc-baseline-2026-06-04-round-3
  baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
  recorded_at: 2026-06-04T01:30:00Z
  recorded_by: control-doc-repair
  proof_ref: harness/knowledge/implementation-control/atelier/state/validations/VG-037-control-doc-baseline-2026-06-04-post-round-3-patches.md
  previous_baseline_ref: harness/knowledge/implementation-control/atelier/state/validations/VG-037-control-doc-baseline-2026-06-04-post-kernel-patch.md
  mutable_exclusions:
    - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md
    - harness/knowledge/implementation-control/atelier/state/**
  entries:
    - {path: harness/knowledge/implementation-control/atelier/AGENT_PACKET_PROTOCOL.md, sha256: 3ff4811bbedf535b7d077d6f9612e445695a8a4f76d9531d9b41c38e9212f7d7}
    - {path: harness/knowledge/implementation-control/atelier/CONTRACT_TO_BUILD_MATRIX.md, sha256: 67adb8db9a99039ce7863cb9e1dd26b6e91f796ee3fbdff71a35fb77a450e116}
    - {path: harness/knowledge/implementation-control/atelier/FULL_COMPLETION_DEFINITION.md, sha256: 51e1b60960213f2245417e9fa01bfa91675e760e4e59ef382fca3c2e60a808a6}
    - {path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_DAG.md, sha256: 860470ac0101a6fffb05d1bc69c935b44b6d7f88a45161712b94d48c37ad7139}
    - {path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_ORCHESTRATOR.md, sha256: 74449aa02e01562c236595b4f53d9e942cbd0b5008e67d1aa97d0c5fe4a5dc36}
    - {path: harness/knowledge/implementation-control/atelier/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md, sha256: 29e890bf6fb82d04a18964391f6c80097f1370c59498cac6720114d6efb356bb}
    - {path: harness/knowledge/implementation-control/atelier/SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md, sha256: bad4c1b577baaed0a48ed001abf75973a10b934f1388d58a15e08828666ee311}
    - {path: harness/knowledge/implementation-control/atelier/SPEC_READ_PLAN.md, sha256: 124bfbaf63635c878fd186deb4d43b7917957bf6ff45155302b28c25cba7b7cc}
    - {path: harness/knowledge/implementation-control/atelier/SUBAGENT_ROLE_CATALOG.md, sha256: 37741329b6f68396052ad180f4975ec98fbdffb8af8ad45d824742ba071e7e51}
    - {path: harness/knowledge/implementation-control/atelier/VALIDATION_GATE_REGISTRY.md, sha256: f429b016702ca2165a2c064edaa29cde09eb3ab7487ba2cfdfd41b4a44ecef6f}
```

## Repository Inventory

```yaml
repo_inventory:
  status: passed_for_discovery_control_packets
  required_before_implementation_packets: true
  inventory_doc: REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md
  inventory_ref: harness/knowledge/implementation-control/atelier/state/repository-inventory/repo-inventory-2026-06-04.md
  command_discovery_ref: harness/knowledge/implementation-control/atelier/state/command-discovery/command-discovery-2026-06-04.md
  product_spec_drift_status: clean
  product_spec_drift_proof_refs:
    - harness/knowledge/implementation-control/atelier/state/validations/VG-001-product-spec-clean-2026-06-04.md
    - harness/knowledge/implementation-control/atelier/state/validations/VG-036-product-spec-hash-2026-06-04.md
  control_doc_baseline_ref: harness/knowledge/implementation-control/atelier/state/validations/VG-037-control-doc-baseline-2026-06-04.md
  package_manager: bun
  atelier_project: atelier
  canonical_check_command: bun nx run atelier:check
  product_code_packets_allowed: false
  product_code_blockers:
    - BLK-TRACEABILITY-001
```

## Track Status

| Track | DAG Nodes | Status | Last Evidence | Next Action |
|---|---|---|---|---|
| Control substrate | DAG-00 to DAG-03 | discovery_ready_product_code_blocked | Product-spec proof, control-doc baseline, repository inventory, command discovery, gate records, and traceability blockers recorded | Continue DAG-02/DAG-02A repair; at-ctrl-005B for DAG-11..DAG-53 expansion |
| Graph kernel | DAG-04, DAG-11, DAG-12, DAG-13 | DAG-04 concrete_blocked_until_implementation; DAG-11..DAG-13 not_started | at-ctrl-005 join-table expansion | DAG-04 dispatch pending per-DAG dependency gates; DAG-11..DAG-13 in at-ctrl-005B |
| Source/derived/durable evidence model | DAG-04, DAG-10, DAG-17 | DAG-04 and DAG-10 concrete_blocked_until_implementation; DAG-17 not_started | at-ctrl-005 join-table expansion | DAG-04 and DAG-10 dispatch pending per-DAG dependency gates |
| Event model | DAG-05, DAG-17 | DAG-05 concrete_blocked_until_implementation; DAG-17 not_started | at-ctrl-005 join-table expansion | DAG-05 dispatch pending per-DAG dependency gates |
| Run lifecycle | DAG-18, DAG-19, DAG-20 | not_started | Specs read | Wait for event and verification gates |
| Verification engine | DAG-06, DAG-14, DAG-15, DAG-16 | DAG-06 concrete_blocked_until_implementation; DAG-14..DAG-16 not_started | at-ctrl-005 join-table expansion | DAG-06 dispatch pending per-DAG dependency gates |
| Attention planner | DAG-26, DAG-27, DAG-28 | not_started | Specs read | Wait for graph and required-map dependencies |
| Run packet model | DAG-09, DAG-21 | DAG-09 concrete_blocked_until_implementation; DAG-21 not_started | at-ctrl-005 join-table expansion | DAG-09 dispatch pending per-DAG dependency gates |
| Surfaces/CLI/JSON contracts | DAG-07, DAG-20 | DAG-07 concrete_blocked_until_implementation; DAG-20 not_started | at-ctrl-005 join-table expansion | DAG-07 dispatch pending per-DAG dependency gates |
| Contract fixtures | DAG-03 plus fixture gates | not_started | Test matrix read | Dispatch fixture layout packet |
| Adapter capability registry | DAG-08, DAG-21 to DAG-25 | DAG-08 concrete_blocked_until_implementation; DAG-21..DAG-25 not_started | at-ctrl-005 join-table expansion | DAG-08 dispatch pending per-DAG dependency gates |
| Generic packet portability | DAG-21 to DAG-25 | not_started | Specs read | Wait for adapter schemas |
| Real runtime adapter parity | DAG-31 to DAG-34 | not_started | Specs read | Wait for PG-2 |
| Transformation lifecycle | DAG-35 to DAG-38 | not_started | Specs read | Wait for accepted evidence lifecycle |
| Write authority enforcement | DAG-10, DAG-39 | DAG-10 concrete_blocked_until_implementation; DAG-39 not_started | at-ctrl-005 join-table expansion; at-ctrl-007 minimum guard proven | DAG-10 dispatch requires VG-026A minimum guard proof (now satisfied by at-ctrl-007) and VG-043 |
| Governance/policy boundary | DAG-39 | not_started | Specs read | Wait for verification hard-block engine |
| HPO state projection | DAG-41 | not_started | Specs read | Wait for lifecycle, evidence, drift |
| HPO interface | DAG-42, DAG-43 | not_started | Specs read | Wait for HPO projection |
| Trace and review records | DAG-44 | not_started | Specs read | Wait for event/evidence lifecycle |
| Runtime resolution | DAG-45, DAG-46 | not_started | Specs read | Wait for runtime parity |
| End-to-end flows | DAG-29, DAG-51 | not_started | Specs read | Wait for dependencies |
```

## Invariant Status

Use this table append-only. Do not remove rows; supersede them with later entries.

| Date | Invariant ID | Status | Evidence | Notes |
|---|---|---|---|---|
| 2026-06-04 | AT-INV-001 to AT-INV-075 | mapped | `CONTRACT_TO_BUILD_MATRIX.md` | Initial implementation-control mapping |
| 2026-06-04 | AT-INV-076 to AT-INV-081 | added_to_control_repair | `CONTRACT_TO_BUILD_MATRIX.md` repair addendum | Policy, trace/review, runtime resolution, swarm routing, parallel conflict, merge readiness |

## Packet Status

| Packet ID | DAG Node | Role | Invariants | Status | Assigned To | Evidence | Notes |
|---|---|---|---|---|---|---|---|
| at-pkt-000 | DAG-01B | contract auditor | infrastructure_support | superseded | control-doc-repair | superseded by at-pkt-000-r2 | Repository implementation inventory and editable-root discovery (Round 1 schema; superseded by Round 2 schema refactor) |
| at-pkt-000-r2 | DAG-01B | contract auditor | infrastructure_support | accepted | control-doc-repair | `state/repository-inventory/repo-inventory-2026-06-04.md` (Round 2 schema) | Repository implementation inventory and editable-root discovery (Round 2 schema; supersedes at-pkt-000) |
| at-pkt-001 | DAG-01 | contract auditor | AT-INV-068 | accepted | control-doc-repair | `state/validations/VG-001-product-spec-clean-2026-06-04.md`, `state/validations/VG-036-product-spec-hash-2026-06-04.md` | HEAD product spec hashes and no-spec-edit baseline proof |
| at-pkt-ctl-001 | DAG-00 | control-doc repairer | infrastructure_support | accepted | control-doc-repair | `state/validations/VG-037-control-doc-baseline-2026-06-04.md` | Immutable control-doc baseline recorded |
| at-pkt-002 | DAG-01C | contract auditor | infrastructure_support | accepted | control-doc-repair | `state/command-discovery/command-discovery-2026-06-04.md` | Command and target discovery |
| at-pkt-003 | DAG-02 | contract auditor | AT-INV-068 | partial_blocked | control-doc-repair | `state/traceability/dag-02-join-table-2026-06-04.yaml`, `BLK-TRACEABILITY-001` | Control/discovery traceability concrete; product code traceability blocked until field split |
| at-pkt-004 | DAG-02A | fixture author | AT-INV-069 | blocked | unassigned | `BLK-FIXTURE-ALIAS-001` | Fixture alias registry still required before fixture/code packets |
| at-ctrl-000 | DAG-00 | control-doc repairer | infrastructure_support | accepted | mother agent direct | `state/validations/at-ctrl-000-acceptance-2026-06-04.md` | Round 2: split immutable/mutable, define control-doc-repair packet type |
| at-ctrl-001 | DAG-01B, DAG-01C | control-doc repairer | infrastructure_support | accepted | mother agent direct | `state/validations/at-ctrl-001-acceptance-2026-06-04.md` | Round 2: refactor repository discovery schema and add hard prerequisites |
| at-ctrl-002 | DAG-00 | control-doc repairer | infrastructure_support | accepted | mother agent direct | `state/validations/at-ctrl-002-acceptance-2026-06-04.md` | Round 2: upgrade VG-001, VG-002, VG-003, VG-038 |
| at-ctrl-003 | DAG-00 | control-doc repairer | infrastructure_support | accepted | mother agent direct | `state/validations/at-ctrl-003-acceptance-2026-06-04.md` | Round 2: tighten completion semantics and waiver rules |
| at-ctrl-004 | DAG-02 | control-doc repairer | AT-INV-068 | accepted | mother agent direct | `state/validations/at-ctrl-004-acceptance-2026-06-04.md` | Round 2: upgrade matrix to full row shape with deferral_state |
| at-ctrl-011 | DAG-00 | control-doc repairer | infrastructure_support | accepted | mother agent direct | `state/validations/at-ctrl-011-acceptance-2026-06-04.md` | Round 3: persist implementation-control audit prompt to state/ for reproducibility |
| at-ctrl-012 | DAG-00 | control-doc repairer | infrastructure_support | accepted | mother agent direct | `state/validations/at-ctrl-012-acceptance-2026-06-04.md` | Round 3: refresh VG-037 immutable control-doc baseline after round-3 patches |
| at-ctrl-006 | DAG-02A | fixture author | AT-INV-069 | accepted | mother agent direct | `state/validations/at-ctrl-006-acceptance-2026-06-04.md` | Round 3: build fixture alias registry and close BLK-FIXTURE-ALIAS-001; make VG-045 executable |
| at-ctrl-005 | DAG-04, DAG-05, DAG-06, DAG-07, DAG-08, DAG-09, DAG-10 | control-doc repairer | AT-INV-004..009, AT-INV-014..022, AT-INV-029..033, AT-INV-034..039, AT-INV-040..049, AT-INV-050..052, AT-INV-053..055 | accepted | mother agent direct | `state/validations/at-ctrl-005-acceptance-2026-06-04.md` | Round 3: expand join table to 48 concrete rows; product_code_packet_authorization flipped; BLK-TRACEABILITY-001 partial_resolution |
| at-ctrl-009 | DAG-00 | control-doc repairer | AT-INV-080 | accepted | mother agent direct | `state/validations/at-ctrl-009-acceptance-2026-06-04.md` | Round 4: add VG-046 parallel-packet conflict detection gate; implement parallel-conflict-checker; add In-flight Packets ledger section; add `allowed_files_intersect_inflight` packet schema field |
| at-ctrl-008 | DAG-00 | control-doc repairer | infrastructure_support | accepted | mother agent direct | `state/validations/at-ctrl-008-acceptance-2026-06-04.md` | Round 3: add explicit DAG Node Range Rule to IMPLEMENTATION_DAG.md and cross-reference in SUBAGENT_ROLE_CATALOG.md so a single packet never spans a `DAG-NN_to_DAG-MM` range |
| at-ctrl-007 | DAG-10 | governance boundary implementer | AT-INV-050, AT-INV-051, AT-INV-052 | accepted | mother agent direct | `state/validations/at-ctrl-007-acceptance-2026-06-04.md` | Round 3: make VG-026A executable by replacing the pending placeholder command with a real minimum write-authority test that reads WRITE_AUTHORITY_MATRIX.md, contract.md, and VERIFICATION_SCHEMA.md and asserts the minimum rules; structured gate `executable_now` flipped to `true`; DAG-10's per-DAG dependency on VG-026A is now satisfiable by a passing test instead of a placeholder |
| at-ctrl-010 | DAG-00 | control-doc repairer | infrastructure_support | accepted | mother agent direct | `state/validations/at-ctrl-010-acceptance-2026-06-04.md` | Round 3: add explicit "Validation Re-run Cadence" section to IMPLEMENTATION_ORCHESTRATOR.md making VG-001, VG-036, VG-037, VG-038 re-run cadence explicit; document stale Validation History P1 finding |

## DAG Status

```yaml
dag_status:
  - node_id: DAG-00
    dependencies: []
    dependency_status: passed
    status: passed
    invariant_ids: []
    gate_ids: [VG-001, VG-037]
    blocker_ids: []
    next_packet_ids: []
  - node_id: DAG-01
    dependencies: [DAG-00]
    dependency_status: passed
    status: passed
    invariant_ids: [AT-INV-068]
    gate_ids: [VG-001, VG-036]
    blocker_ids: []
    next_packet_ids: [at-pkt-001]
  - node_id: DAG-01B
    dependencies: [DAG-01]
    dependency_status: passed
    status: passed
    invariant_ids: [infrastructure_support]
    gate_ids: [VG-000, VG-001, VG-002, VG-003, VG-036, VG-037, VG-038]
    blocker_ids: []
    next_packet_ids: [at-pkt-000-r2]
  - node_id: DAG-01C
    dependencies: [DAG-01B]
    dependency_status: passed
    status: passed
    invariant_ids: [infrastructure_support]
    gate_ids: [VG-000, VG-002]
    blocker_ids: []
    next_packet_ids: [at-pkt-002]
  - node_id: DAG-02
    dependencies: [DAG-01B]
    dependency_status: passed
    status: partial_blocked
    invariant_ids: [AT-INV-068]
    gate_ids: [VG-029, VG-038]
    blocker_ids: [BLK-TRACEABILITY-001]
    next_packet_ids: [at-pkt-003]
  - node_id: DAG-02A
    dependencies: [DAG-01C]
    dependency_status: passed
    status: passed
    invariant_ids: [AT-INV-069]
    gate_ids: [VG-004, VG-045]
    blocker_ids: []
    next_packet_ids: [at-ctrl-006]
  - node_id: DAG-04
    dependencies: [DAG-01B, DAG-02]
    dependency_status: passed
    status: concrete_blocked_until_implementation
    invariant_ids: [AT-INV-004, AT-INV-005, AT-INV-006, AT-INV-007, AT-INV-008, AT-INV-009]
    gate_ids: [VG-005, VG-006, VG-034, VG-038]
    blocker_ids: []
    next_packet_ids: []
  - node_id: DAG-05
    dependencies: [DAG-01B, DAG-02]
    dependency_status: passed
    status: concrete_blocked_until_implementation
    invariant_ids: [AT-INV-029, AT-INV-030, AT-INV-031, AT-INV-032, AT-INV-033]
    gate_ids: [VG-011, VG-013, VG-040, VG-041, VG-044]
    blocker_ids: []
    next_packet_ids: []
  - node_id: DAG-06
    dependencies: [DAG-01B, DAG-02]
    dependency_status: passed
    status: concrete_blocked_until_implementation
    invariant_ids: [AT-INV-014, AT-INV-015, AT-INV-016, AT-INV-017, AT-INV-018, AT-INV-019, AT-INV-020, AT-INV-021, AT-INV-022]
    gate_ids: [VG-008, VG-009, VG-010, VG-024, VG-042, VG-043]
    blocker_ids: []
    next_packet_ids: []
  - node_id: DAG-07
    dependencies: [DAG-01B, DAG-02]
    dependency_status: passed
    status: concrete_blocked_until_implementation
    invariant_ids: [AT-INV-034, AT-INV-035, AT-INV-036, AT-INV-037, AT-INV-038, AT-INV-039]
    gate_ids: [VG-018, VG-019, VG-039]
    blocker_ids: []
    next_packet_ids: []
  - node_id: DAG-08
    dependencies: [DAG-01B, DAG-02]
    dependency_status: passed
    status: concrete_blocked_until_implementation
    invariant_ids: [AT-INV-040, AT-INV-041, AT-INV-042, AT-INV-043, AT-INV-044, AT-INV-045, AT-INV-046, AT-INV-047, AT-INV-048, AT-INV-049]
    gate_ids: [VG-021, VG-022, VG-023, VG-032]
    blocker_ids: []
    next_packet_ids: []
  - node_id: DAG-09
    dependencies: [DAG-01B, DAG-02]
    dependency_status: passed
    status: concrete_blocked_until_implementation
    invariant_ids: [AT-INV-053, AT-INV-054, AT-INV-055]
    gate_ids: [VG-020, VG-033]
    blocker_ids: []
    next_packet_ids: []
  - node_id: DAG-10
    dependencies: [DAG-04, DAG-05, DAG-06]
    dependency_status: passed
    status: concrete_blocked_until_implementation
    invariant_ids: [AT-INV-050, AT-INV-051, AT-INV-052]
    gate_ids: [VG-026A, VG-026B, VG-043, VG-034]
    blocker_ids: []
    next_packet_ids: []
    notes: per-DAG dispatch requires VG-026A minimum write-authority guard to be passing; VG-026A minimum guard is now proven by at-ctrl-007 (see state/validations/VG-026A-2026-06-04.md); VG-043 is the only remaining DAG-10 dependency.
```

## Subagent Assignments

Append assignment records:

```yaml
- assigned_at: <RFC3339>
  packet_id: <id>
  role: <role>
  agent: <agent id>
  status: dispatched | completed | failed | blocked | superseded
  handoff_ref: <path or ledger section>
```

## Validation History

Append validation records:

```yaml
- ran_at: <RFC3339>
  gate_id: <VG-*>
  command: <exact command>
  status: passed | failed | unavailable | not_run
  owner: <role or agent>
  affected_packets:
    - <packet_id>
  evidence: <log path or summary>
```

Recorded validation records:

| Ran At | Gate ID | Status | Proof Artifact | Notes |
|---|---|---|---|---|
| 2026-06-04T00:00:00Z | VG-001 | passed | `state/validations/VG-001-product-spec-clean-2026-06-04.md` | Product-spec staged/unstaged/status/HEAD diffs are empty |
| 2026-06-04T00:00:00Z | VG-036 | passed | `state/validations/VG-036-product-spec-hash-2026-06-04.md` | All current product-spec hashes match `HEAD:<path>` hashes |
| 2026-06-04T00:00:00Z | VG-037 | passed | `state/validations/VG-037-control-doc-baseline-2026-06-04.md` | Immutable control-doc baseline recorded; ordinary packets must compare against it |
| 2026-06-04T00:00:00Z | VG-037 | passed | `state/validations/VG-037-control-doc-baseline-2026-06-04-post-kernel-patch.md` | Post-Round-2 kernel patch refresh; pre-patch baseline preserved |
| 2026-06-04T00:00:00Z | VG-000 | passed | `state/command-discovery/command-discovery-2026-06-04.md` | Bun/Nx project and Atelier targets discovered; fallback algorithm recorded |
| 2026-06-04T00:00:00Z | VG-002 | passed | `state/validations/VG-002-atelier-check-2026-06-04.md` | `bun nx run atelier:check` passed; 110 tests, 0 failures |
| 2026-06-04T00:00:00Z | VG-003 | passed | `state/validations/VG-003-typecheck-2026-06-04.md` | `bun nx run atelier:typecheck` passed; `tsc --noEmit` exits 0 |
| 2026-06-04T00:00:00Z | VG-038 | passed | `state/validations/VG-038-test-integrity-mechanical-2026-06-04.md` | Mechanical VG-038 audit on at-ctrl-000..004 diff found no test, fixture, coverage, or contract weakening |
| 2026-06-04T00:00:00Z | at-ctrl-000 | passed | `state/validations/at-ctrl-000-acceptance-2026-06-04.md` | Split immutable/mutable, control-doc-repair packet type |
| 2026-06-04T00:00:00Z | at-ctrl-001 | passed | `state/validations/at-ctrl-001-acceptance-2026-06-04.md` | Repository discovery schema refactor, hard prerequisites |
| 2026-06-04T00:00:00Z | at-ctrl-002 | passed | `state/validations/at-ctrl-002-acceptance-2026-06-04.md` | VG-001/002/003/038 upgrade |
| 2026-06-04T00:00:00Z | at-ctrl-003 | passed | `state/validations/at-ctrl-003-acceptance-2026-06-04.md` | Completion semantics and waiver rules |
| 2026-06-04T00:00:00Z | at-ctrl-004 | passed | `state/validations/at-ctrl-004-acceptance-2026-06-04.md` | Matrix row shape, deferral_state column |
| 2026-06-04T01:00:00Z | at-ctrl-011 | passed | `state/validations/at-ctrl-011-acceptance-2026-06-04.md` | Persist implementation-control audit prompt to state/ |
| 2026-06-04T01:30:00Z | VG-037 | passed | `state/validations/VG-037-control-doc-baseline-2026-06-04-post-round-3-patches.md` | Round-3 patch baseline recorded; pre-patch baseline preserved |
| 2026-06-04T01:30:00Z | at-ctrl-012 | passed | `state/validations/at-ctrl-012-acceptance-2026-06-04.md` | Refresh VG-037 baseline after round-3 control-doc patches |
| 2026-06-04T01:00:00Z | VG-045 | passed | `state/validations/VG-045-2026-06-04.md` | `bun nx run atelier:test -- --testPathPattern=fixture-alias-consistency` passed; 12 alias-consistency tests + 110 existing tests, 0 failures |
| 2026-06-04T01:00:00Z | at-ctrl-006 | passed | `state/validations/at-ctrl-006-acceptance-2026-06-04.md` | Fixture alias registry built; BLK-FIXTURE-ALIAS-001 closed |
| 2026-06-04T02:00:00Z | at-ctrl-005 | passed | `state/validations/at-ctrl-005-acceptance-2026-06-04.md` | Expanded join table to 48 concrete rows (DAG-04..DAG-10); product_code_packet_authorization flipped; BLK-TRACEABILITY-001 partial_resolution; join-table SHA-256 c60218ea2f3cd9977b51bc402934774ecff9e26dbb92a90abc4ccae0d6c60e41 |
| 2026-06-04T03:00:00Z | at-ctrl-009 | passed | `state/validations/at-ctrl-009-acceptance-2026-06-04.md` | Added VG-046 parallel-packet conflict detection gate; implemented `parallel-conflict-checker` core module + test; created `state/packets/in-flight.yaml`; added `allowed_files_intersect_inflight` field to packet schema; added `## In-flight Packets` section to ledger; ledger now records the In-flight Packets schema header |
| 2026-06-04T03:00:00Z | VG-046 | passed | `state/validations/VG-046-2026-06-04.md` | `bun nx run atelier:test -- --testPathPattern=parallel-conflict-checker` passed; 19 new parallel-conflict-checker tests, 0 failures, total 178 pass / 0 fail / 600 expect() calls |
| 2026-06-04T03:00:00Z | VG-037 | passed | `state/validations/VG-037-control-doc-baseline-2026-06-04-post-cadence-section.md` | Post-at-ctrl-010 immutable control-doc baseline refresh; pre-patch baseline preserved in `state/validations/VG-037-control-doc-baseline-2026-06-04-post-kernel-patch.md` |
| 2026-06-04T03:00:00Z | VG-038 | passed | `state/validations/VG-038-test-integrity-mechanical-2026-06-04.md` (mechanical rule results updated for at-ctrl-010) | Mechanical VG-038 audit on at-ctrl-010 diff: no `*.test.*`, fixture `expected`, `*coverage*`, or `*contract*` files touched; no test weakening |
| 2026-06-04T03:00:00Z | at-ctrl-010 | passed | `state/validations/at-ctrl-010-acceptance-2026-06-04.md` | Added explicit "Validation Re-run Cadence" section to IMPLEMENTATION_ORCHESTRATOR.md making VG-001, VG-036, VG-037, VG-038 re-run cadence explicit; documented stale Validation History P1 finding; orchestrator SHA-256 74449aa02e01562c236595b4f53d9e942cbd0b5008e67d1aa97d0c5fe4a5dc36 |
| 2026-06-04T03:00:00Z | at-ctrl-008 | passed | `state/validations/at-ctrl-008-acceptance-2026-06-04.md` | Added DAG Node Range Rule to IMPLEMENTATION_DAG.md and cross-reference in SUBAGENT_ROLE_CATALOG.md; ranges are documentation-only and must be split per canonical splits before dispatch |
| 2026-06-04T04:00:00Z | VG-026A | passed | `state/validations/VG-026A-2026-06-04.md` | `bun nx run atelier:test -- --testPathPattern=write-authority-minimum` passed; 37 new write-authority-minimum tests + 141 existing tests = 178 total, 0 failures, 600 expect() calls; minimum write-authority guard now executable; the placeholder command `state/gates/write-authority-minimum-command.txt until implemented` is retired |
| 2026-06-04T04:00:00Z | at-ctrl-007 | passed | `state/validations/at-ctrl-007-acceptance-2026-06-04.md` | VG-026A made executable: real minimum test added; structured-gates yaml `executable_now` flipped to `true`; VALIDATION_GATE_REGISTRY.md updated; no product-spec edited; forbidden-action audit clear |

## Blocker History

Append blocker records from `SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md`:

```yaml
- blocker_id: <id>
  date: <RFC3339>
  classification: <type>
  severity: <P0|P1|P2|P3>
  blocking_scope: <launch_blocking|final_completion_blocking|phase_blocking|frontier_blocking|track_blocking|local|advisory>
  affected_invariants: []
  affected_dag_nodes: []
  source_specs: []
  status: open | resolved | superseded
  resolution: <text or null>
```

Reserved mandatory product-spec drift blocker:

```yaml
- blocker_id: BLK-SPEC-DRIFT-001
  severity: P0
  scope: product-spec immutability
  status: not_open_recorded_clean
  description: Product-spec files under harness/knowledge/product-specs/atelier have staged or modified changes relative to HEAD.
  required_resolution:
    - revert product-spec changes to HEAD
    - complete a separate product-spec governance process and commit the authorized spec revision before implementation launch
  mother_agent_allowed_action: continue control-doc repair only
  subagent_dispatch_allowed: false for implementation packets
  activation_condition: any product-spec staged, unstaged, status, HEAD diff, or hash drift relative to product-spec-head-baseline
  current_proof_refs:
    - state/validations/VG-001-product-spec-clean-2026-06-04.md
    - state/validations/VG-036-product-spec-hash-2026-06-04.md
```

## Blockers Preventing Autonomous Implementation

```yaml
blockers_preventing_autonomous_implementation:
  - id: P0-1-control-docs-self-mutable
    severity: P0
    description: Control docs are self-mutable
    recorded_at: 2026-06-04T00:00:00Z
    resolution_path: at-ctrl-000
  - id: P0-2-repository-discovery-missing
    severity: P0
    description: Repository discovery/edit-boundary missing
    recorded_at: 2026-06-04T00:00:00Z
    resolution_path: at-ctrl-001
  - id: P0-3-blocked-invariants-satisfy-completion
    severity: P0
    description: Blocked executable invariants can satisfy completion
    recorded_at: 2026-06-04T00:00:00Z
    resolution_path: at-ctrl-003
  - id: P0-4-product-spec-immutability-incomplete
    severity: P0
    description: Product-spec immutability gate is mechanically incomplete
    recorded_at: 2026-06-04T00:00:00Z
    resolution_path: at-ctrl-002
```

## Computed Frontier

```yaml
computed_frontier:
  dispatchable:
    - control-doc-repair
  blocked:
    - DAG-11..DAG-53
  waiting_on_dependencies:
    - DAG-02
    schema_substrate_concrete_blocked_until_implementation:
    - DAG-04
    - DAG-05
    - DAG-06
    - DAG-07
    - DAG-08
    - DAG-09
    - DAG-10
  rationale: |
    DAG-00, DAG-01, DAG-01B, DAG-01C, and DAG-02A are passed with recorded
    proof. The only dispatchable category is control-doc-repair, which is
    required when the kernel itself must be hardened. DAG-02 is
    partial_blocked pending BLK-TRACEABILITY-001 partial-resolution:
    at-ctrl-005 added 42 field/fixture/gate-level concrete rows for
    DAG-04..DAG-10; at-ctrl-005B is the carryover for DAG-11..DAG-53.
    DAG-02A is now passed: at-ctrl-006 built the fixture alias registry
    at state/traceability/fixture-alias-registry-2026-06-04.yaml and
    closed BLK-FIXTURE-ALIAS-001. VG-045 is now executable and its
    proof is recorded at state/validations/VG-045-2026-06-04.md.
    VG-026A is now executable: at-ctrl-007 replaced the pending
    placeholder with a real minimum test that asserts the
    actor × artifact-class × surface permission truth table is
    present in the specs and the existing policy module fail-closes
    for block/deny/ask rules. Its proof is recorded at
    state/validations/VG-026A-2026-06-04.md. DAG-04..DAG-10 are
    concrete in the join table (deferral_state=concrete,
    traceability_status=concrete, blocker_id=null) and the
    product_code_packet_authorization is now
    allowed_when_rows_for_target_node_are_concrete, but each DAG node
    still requires its own per-DAG dependency gate to be passing
    before a schema-implementer or ordinary-implementation packet can
    be dispatched (e.g. DAG-10 requires DAG-04, DAG-05, DAG-06,
    VG-026A, and VG-043 to pass; VG-026A is now satisfied, VG-043 is
    still the only remaining DAG-10 dependency). DAG-11..DAG-53 are
    blocked because at-ctrl-005B has not yet expanded their
    join-table rows.
```

## In-flight Packets

This section is the human-readable mirror of the machine-readable file
at `harness/knowledge/implementation-control/atelier/state/packets/in-flight.yaml`.
The YAML file is the runtime source of truth read by the VG-046
parallel-conflict-checker; this section is the audit trail. The
mother agent appends an entry when a packet is dispatched and removes
the entry when the packet is integrated, superseded, rejected, or
blocked-closed. The two stay in lock-step.

```yaml
in_flight_packets:
  - packet_id: <id>
    dispatch_time: <RFC3339>
    allowed_files: <list>
    forbidden_roots: <list>
    fixture_families: <list>
    command_surfaces: <list>
    generated_state_paths: <list>
    durable_evidence_paths: <list>
  # ...
```

Initial state: empty list. The list stays empty until the mother agent
dispatches a parallel packet under the conflict-detection algorithm
described in `IMPLEMENTATION_ORCHESTRATOR.md`. The current empty
state proves the VG-046 check has a clean baseline to compare against.

The schema for an in-flight entry matches the YAML file vocabulary:

- `packet_id`: stable id of the in-flight packet (e.g. `at-pkt-XXX`)
- `dispatch_time`: RFC 3339 timestamp recorded by the mother agent
  when the packet was dispatched
- `allowed_files`: list of path globs the packet is allowed to mutate
  (mirrors the packet's `allowed_files` field)
- `forbidden_roots`: list of path globs the packet has explicitly
  forbidden (mirrors the packet's `forbidden_roots` field)
- `fixture_families`: list of closed tokens (e.g. `graph_kernel`,
  `verification_record`) grouping fixtures the packet owns
- `command_surfaces`: list of exact CLI/MCP command tokens the packet
  claims (e.g. `atelier run force-close`)
- `generated_state_paths`: list of paths under `.atelier/` the packet
  will write
- `durable_evidence_paths`: list of paths outside `.atelier/` the
  packet will write as durable evidence

The mother agent must not dispatch a new packet when the
`parallel-conflict-checker` returns `failed`. See the
`Conflict-Detection Algorithm` section in
`IMPLEMENTATION_ORCHESTRATOR.md` for the full algorithm and the
`BLK-CONFLICT-<id>` blocker procedure.

## State Directory Aliases

```yaml
state_directory_aliases:
  validation: state/validations
  repo_inventory: state/repository-inventory
  in_flight: state/packets/in-flight.yaml
decision: preserve_existing_paths
reason: avoid breaking existing packet, validation, and ledger references
```

Open repair blockers:

```yaml
- blocker_id: BLK-TRACEABILITY-001
  severity: P1
  blocking_scope: phase_blocking
  status: partial_resolution
  proof_ref: state/blockers/BLK-TRACEABILITY-001.md
  affected_dag_nodes: [DAG-04 to DAG-53]
  resolved_dag_nodes: [DAG-04, DAG-05, DAG-06, DAG-07, DAG-08, DAG-09, DAG-10]
  carryover_dag_nodes: [DAG-11 to DAG-53]
  resolution_packet_ids: [at-ctrl-005]
  carryover_packet_ids: [at-ctrl-005B]
  dispatch_effect: blocks product code packets only for DAG-11..DAG-53 until at-ctrl-005B expands their join-table rows; DAG-04..DAG-10 are now concrete and product_code_packet_authorization is allowed_when_rows_for_target_node_are_concrete, but per-DAG dependency gates still apply
- blocker_id: BLK-FIXTURE-ALIAS-001
  severity: P1
  blocking_scope: phase_blocking
  status: closed
  proof_ref: state/blockers/BLK-FIXTURE-ALIAS-001.md
  affected_dag_nodes: [DAG-02A, DAG-03]
  resolved_dag_nodes: [DAG-02A]
  resolution_packet_ids: [at-ctrl-006]
  resolution_artifacts:
    - harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-2026-06-04.yaml
    - product/apps/atelier/src/__tests__/fixture-alias-consistency.test.ts
    - product/apps/atelier/src/__tests__/fixtures/<fixture_id>/{input,expected,README,command} placeholder scaffolding for every pending fixture
  dispatch_effect: no longer blocks fixture/code packets; VG-045 is now executable and its proof artifact is at state/validations/VG-045-2026-06-04.md
```

## Assumption History

Append safe assumptions:

```yaml
- assumption_id: <id>
  date: <RFC3339>
  affected_invariants: []
  chosen_interpretation: <text>
  why_safe: <text>
  validation: <gate/test>
  expiry: <condition>
  status: active | retired | superseded
```

## Integration Status

| Integration Gate | Status | Evidence | Remaining Work |
|---|---|---|---|
| IG-1 Schema validators and fixture scaffolds | not_started | N/A | DAG-03 through DAG-10 |
| IG-2 Graph plus verification plus event | not_started | N/A | DAG-11 through DAG-17 |
| IG-3 MVP wedge | not_started | N/A | DAG-20 through DAG-29 |
| IG-4 Runtime parity | not_started | N/A | DAG-31 through DAG-33 |
| IG-5 Transformation pilots | not_started | N/A | DAG-35 through DAG-38 |
| IG-6 HPO evidence display | not_started | N/A | DAG-41 through DAG-43 |
| IG-7 Swarm coordination | not_started | N/A | DAG-47 through DAG-50 |
| IG-F Full completion | not_started | N/A | DAG-51 through DAG-53 |

## Remaining Work

After `at-ctrl-005`, the DAG-02 join table is concrete for DAG-04..DAG-10 (42 new field/fixture/gate-level rows). The remaining traceability expansion is `DAG-11..DAG-53` (covered in `at-ctrl-005B`). After `at-ctrl-006`, the fixture alias registry for `DAG-02A` is complete and `BLK-FIXTURE-ALIAS-001` is closed. After `at-ctrl-007`, the minimum write-authority guard (VG-026A) is executable; its pending placeholder command is retired in favor of a real test. `DAG-01`, `DAG-01B`, `DAG-01C`, and `DAG-02A` have recorded proof/state artifacts; VG-045 and VG-026A are now executable with proof. Ordinary product code, product fixture, generated-state, durable-evidence, adapter, HPO, transformation, and swarm packets remain blocked by the per-DAG dependency gates listed in `IMPLEMENTATION_DAG.md` until assigned rows and gate records are concrete and executable. `DAG-10` is not dispatchable until `DAG-04`, `DAG-05`, `DAG-06`, VG-026A, and VG-043 pass; VG-026A is now satisfied by `at-ctrl-007`, leaving VG-043 as the only remaining DAG-10 dependency.

## Final Acceptance Checklist

The full completion requires all of the following (per `FULL_COMPLETION_DEFINITION.md`):

- zero unresolved P0/P1 blockers;
- zero fatal/high pending validation gates;
- all required gates executable and passing;
- all executable invariants implemented and proven;
- all public claims backed by their required proof gates;
- waivers only when the product specs explicitly defer the claim or a human product owner grants a time-bounded waiver.

Round 2 ledger-level checklist:

- No product specs edited.
- Every executable invariant is implemented, fixture-proven, integration-proven, or product-authorized deferred with valid owner and expiry.
- No unresolved executable P0/P1 blocker remains open.
- All validation gates required by `VALIDATION_GATE_REGISTRY.md` are executable and pass.
- No high/fatal gate is pending, unavailable, not-run, or represented only by `command.txt`.
- `bun nx run <atelier-project>:check` passes for the discovered Atelier project.
- Stage 0 packet portability is proven before MVP claim.
- Stage 1 real-runtime parity is proven before runtime-agnosticism contract claim.
- `.atelier` deletion/regeneration preserves product truth.
- Accepted durable evidence is outside `.atelier` and linked by acceptance events.
- HPO states display required evidence and avoid forbidden claims.
- Transformations preserve provenance and do not auto-promote.
- Full product flows pass; completion is not declared from tests alone.
