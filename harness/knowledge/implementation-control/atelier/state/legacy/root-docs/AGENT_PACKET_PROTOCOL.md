---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-agent-packet-protocol
title: Atelier Agent Packet Protocol
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Agent Packet Protocol

## Purpose

This protocol defines the packet format the mother agent uses to assign bounded implementation work to subagents. A packet is the unit of autonomous implementation. It must be small enough to complete independently and large enough to produce a schema, fixture, test, implementation increment, or verified fix.

## Packet Schema

```yaml
packet_id: <stable id, e.g. at-pkt-001>
packet_type: ordinary-implementation | control-doc-repair | fixture-author | schema-implementer | discovery | regression-fixer
dag_node_ids:
  - <DAG-* from IMPLEMENTATION_DAG.md>
title: <one-line task>
role: <role from SUBAGENT_ROLE_CATALOG.md>
status: proposed | dispatched | accepted | retry_requested | blocked | superseded
base_revision: <git rev or launch baseline id>
repo_inventory_ref: <IMPLEMENTATION_LEDGER.md repo_inventory id>
product_spec_hash_ref: <IMPLEMENTATION_LEDGER.md spec_hashes id>
immutable_control_hash_ref: <IMPLEMENTATION_LEDGER.md immutable_control_doc_baseline id>
intent: <specific implementation outcome>
phase_gate: <PG-* gate this packet advances>
invariant_ids:
  - <AT-INV-*>
schema_ids:
  - <schema id or N/A>
fixture_ids:
  - <fixture id or N/A>
test_ids:
  - <test id or N/A>
implementation_modules:
  - <module path or N/A>
acceptance_criteria:
  - <concrete criterion tied to invariant/gate>
source_sections:
  - path: <path>
    section: <section or heading>
classification:
  - <classification values from CONTRACT_TO_BUILD_MATRIX.md>
required_context:
  global_controls:
    - IMPLEMENTATION_ORCHESTRATOR.md
    - SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md
    - this packet
  product_specs_to_read:
    - <exact spec paths and sections>
  implementation_docs_to_read:
    - CONTRACT_TO_BUILD_MATRIX.md
    - IMPLEMENTATION_DAG.md
files_to_inspect_before_edit:
  - path: <path>
    reason: <why>
existing_interfaces_to_preserve:
  - <path or symbol>
allowed_files:
  - path: <path>
    category: <source|test|fixture|generated|state|control-doc|nx-config>
forbidden_files:
  - path: <path>
    reason: <why forbidden>
generated_state_policy: <none|read_only|fixture_only|regenerate_only|authorized_write>
allowed_files_intersect_inflight:
  type: list
  description: |
    Set by the mother agent after running VG-046. Empty list = passed.
    Non-empty list = VG-046 failed, list contains the in-flight packet
    IDs that conflict with this packet's allowed_files.
  default: []
expected_tests:
  - <test or fixture ids>
expected_outputs:
  - <schemas, fixtures, code modules, docs, records>
validation_gate_ids:
  - <VG-*>
expected_diff_shape:
  max_files_changed: <n>
  allowed_file_categories: <list>
  forbidden_diff_patterns: []
test_integrity_check:
  required: true
  forbidden:
    - deleting assertions
    - loosening expected outputs
    - skipping tests
    - renaming failing tests out of scope
    - weakening fixture oracle files
    - broadening success criteria
patch_boundaries:
  max_scope: <what may change>
  must_not_change: <what must remain untouched>
validation:
  required_before_handoff:
    - VG-001
    - VG-037
    - VG-038
validation_commands:
  - command: <exact command if known>
    purpose: <what it verifies>
    if_unknown: <discovery instruction>
rollback_rules:
  - rule: <how to remove or supersede this packet's changes without touching unrelated work>
    targets: <file paths or artifacts>
rollback_validation:
  - command: <command that proves rollback>
    purpose: <what it verifies>
handoff_artifact_path: <path under mutable implementation-control state or ledger section>
handoff_required: true
failure_report_required: true
```

## Packet Type Definitions

| packet_type | Dispatch mode | Mutates product code | Mutates immutable control docs | Notes |
|---|---|---|---|---|
| `ordinary-implementation` | Subagent (after kernel is fully ready) | yes | no | The default; blocked until all kernel readiness conditions met |
| `control-doc-repair` | Mother agent direct only | no | yes (named target docs) | Forbidden-actions list applies; full list in `IMPLEMENTATION_ORCHESTRATOR.md` |
| `fixture-author` | Subagent | no (fixtures only) | no | Cannot satisfy an invariant by itself; produces fixtures |
| `schema-implementer` | Subagent | yes (schema only) | no | Cannot satisfy runtime behavior invariants |
| `discovery` | Mother agent direct preferred | no | no | Produces inventory/command-discovery records |
| `regression-fixer` | Subagent | yes (scoped) | no | Targets a specific failing gate; diff must be narrow |

## Required Context

Every packet must include:

- immutable spec rule;
- launch `base_revision`;
- repository inventory reference;
- product spec `HEAD` hash baseline reference;
- immutable control-doc hash baseline reference;
- assigned invariant IDs;
- schema IDs, fixture IDs, test IDs, implementation modules, and acceptance criteria;
- the exact product specs and sections to read;
- the relevant DAG node and dependencies;
- validation gate IDs;
- files to inspect before editing;
- expected tests or explicit oracle-gap record;
- allowed and forbidden file globs;
- expected diff shape;
- generated-state policy;
- test-integrity check;
- validation commands or discovery instructions.

Do not include every Atelier product spec by default. Use `SPEC_READ_PLAN.md`.

## Allowed Files

Allowed files must be explicit. Use path globs only when the packet genuinely owns a directory. Examples:

```yaml
allowed_files:
  - packages/atelier-core/src/graph/**
  - packages/atelier-core/test/fixtures/graph_endpoint_matrix_v1/**
  - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md
```

## Forbidden Files

Every packet must include:

```yaml
forbidden_files:
  - path: harness/knowledge/product-specs/atelier/**
    reason: product specs are immutable
  - path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_ORCHESTRATOR.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/SPEC_READ_PLAN.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/CONTRACT_TO_BUILD_MATRIX.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_DAG.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/AGENT_PACKET_PROTOCOL.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/SUBAGENT_ROLE_CATALOG.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/VALIDATION_GATE_REGISTRY.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/FULL_COMPLETION_DEFINITION.md
    reason: immutable control doc
  - path: harness/knowledge/implementation-control/atelier/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md
    reason: immutable control doc
```

Add narrower forbidden files for unrelated modules, generated outputs, durable evidence, or user-owned work. A dedicated `control-doc-repair` packet may override immutable control-doc forbidden files only for named target docs and must run `VG-037`.

## Fail-Closed Rules

A packet is rejected (and must not be dispatched) if any of the following is true:

- any field contains a `<…>` placeholder that has not been resolved;
- any `*_ref` does not resolve to an existing record under the mutable state roots;
- `forbidden_files` is missing, empty, or incomplete relative to the assignment;
- `rollback_rules` is empty;
- `packet_type` is `ordinary-implementation` and `dag_node_ids` references a node with status `blocked` or `partial_blocked` or `waiting_on_dependencies`;
- `packet_type` is `ordinary-implementation` and `dag_node_ids` references a node whose `traceability_status` is not `concrete` in the join table;
- `packet_type` is `ordinary-implementation` and `repo_inventory_ref` does not exist or fails `inventory_validity_criteria` (per `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md`);
- `packet_type` is `ordinary-implementation` and `immutable_control_hash_ref` does not match the current control-doc baseline;
- `packet_type` is `control-doc-repair` and the diff touches a file outside `allowed_files`;
- `packet_type` is `control-doc-repair` and the diff exhibits any forbidden action listed in `IMPLEMENTATION_ORCHESTRATOR.md`;
- `validation.required_before_handoff` is missing or does not include `VG-001`, `VG-037`, and `VG-038`;
- `test_integrity_check.forbidden` is empty.

## Required Specs To Read

The packet must list exact specs. Examples:

- Graph packet: `contract.md` §2, §4, §6, `GRAPH_SEMANTICS.md`, `EVENT_MODEL.md` §3, `CONTRACT_TEST_MATRIX.md` §2.1 and §2a.1.
- Verification packet: `VERIFICATION_SCHEMA.md`, `contract.md` §16, `EVENT_MODEL.md` §5-§6, `SURFACES.md` §2.2 and §2.5.
- Adapter packet: `ADAPTER_CONTRACT.md`, `SURFACES.md` §7, `CONTRACT_TEST_MATRIX.md` §2b.3 or §2.7.

## Invariants To Satisfy

Packets must not implement behavior without invariant IDs. If useful infrastructure is required, classify it as `infrastructure_support` in the packet and state which invariant it enables. Infrastructure must not add product behavior.

## Expected Tests

For executable invariants, the packet must include at least one of:

- a schema validation test;
- a fixture input/expected pair;
- a unit test;
- an integration test;
- a contract conformance test;
- a negative test;
- an explicit blocker explaining why no oracle can be defined.

Tests must be created before or alongside implementation. A packet that only implements behavior and defers all tests requires mother-agent rejection unless the packet is explicitly a spike and records no product completion.

## Expected Outputs

Expected outputs may include:

- schema files or validators;
- fixture directories matching `CONTRACT_TEST_MATRIX.md` §1a;
- implementation modules;
- CLI/API surface changes;
- adapter descriptors;
- verification records;
- graph/event records;
- HPO projection records;
- updated ledger entries;
- blocker or assumption records outside product specs.

## Patch Boundaries

The subagent must keep patches narrow. It must not:

- modify product specs;
- edit unrelated files;
- change public surfaces not assigned by invariant IDs;
- add compatibility aliases for removed commands;
- change test expectations to match incorrect implementation;
- delete or weaken existing tests without explicit packet authorization.

## Validation Commands

If exact commands are unknown, use placeholders and discovery instructions. Do not fabricate commands as if they already exist.

Packet validation command format:

```yaml
validation_commands:
  - command: bun nx show projects
    purpose: discover concrete Atelier project name
    if_unknown: run before replacing <atelier-project> placeholders
  - command: bun nx run <atelier-project>:check
    purpose: project-level check required before claiming completion
    if_unknown: replace <atelier-project> after project discovery
  - command: <fixture command from fixtures/<id>/command.sh>
    purpose: run the packet's contract fixture
    if_unknown: create command.txt with the intended command and mark gate pending; pending gates cannot accept implementation behavior
```

Every packet must include `validation_gate_ids` that map to the commands. A command without a gate ID is advisory only and cannot prove completion.

## Rollback Rules

Rollback means removing or superseding the packet's changes only. Never use destructive repository resets. If a packet created durable evidence, rollback requires a superseding/revocation event when product specs require it. If a packet created derived state under `.atelier`, derived state may be regenerated or deleted by authorized commands.

## Handoff Format

```yaml
packet_id: <id>
status: completed | partial | blocked | failed
invariant_ids_satisfied:
  - <AT-INV-*>
invariant_ids_not_satisfied:
  - id: <AT-INV-*>
    reason: <why>
files_changed:
  - <path>
tests_added_or_updated:
  - <path or fixture id>
validation_results:
  - command: <command>
    status: passed | failed | unavailable | not_run
    notes: <short evidence>
assumptions:
  - <assumption id or text>
blockers:
  - <blocker id or text>
product_specs_touched: false
notes: <handoff summary>
```

## Failure Report Format

```yaml
packet_id: <id>
failure_type: validation_failed | spec_ambiguity | spec_contradiction | missing_oracle | forbidden_edit_risk | dependency_missing | tool_unavailable
affected_invariants:
  - <AT-INV-*>
affected_dag_nodes:
  - <DAG-*>
evidence:
  - <log, test output, spec section, or file path>
safe_interpretation_available: true | false
recommended_next_action: retry | split_packet | assign_regression_fixer | record_blocker | continue_independent_work
product_specs_touched: false
```

## Example Packets

### Repository Inventory Packet

```yaml
packet_id: at-pkt-000
packet_type: discovery
dag_node_ids: [DAG-01B]
title: Repository implementation inventory
role: contract auditor
status: proposed
dispatchable: false
template: true
base_revision: <git rev-parse HEAD>
repo_inventory_ref: pending
product_spec_hash_ref: product-spec-head-baseline
immutable_control_hash_ref: immutable-control-doc-baseline-2026-06-04
intent: Discover concrete implementation roots and edit boundaries before implementation dispatch.
phase_gate: PG-0B
invariant_ids:
  - infrastructure_support
source_sections:
  - path: harness/knowledge/implementation-control/atelier/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md
    section: required-inventory-schema
classification:
  - infrastructure_support
required_context:
  global_controls:
    - IMPLEMENTATION_ORCHESTRATOR.md
    - REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md
    - SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md
  product_specs_to_read: []
  implementation_docs_to_read:
    - IMPLEMENTATION_DAG.md
files_to_inspect_before_edit:
  - path: package.json
    reason: package manager and scripts
  - path: nx.json
    reason: Nx workspace config
allowed_files:
  - path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md
    category: state
  - path: harness/knowledge/implementation-control/atelier/state/repository-inventory/**
    category: state
forbidden_files:
  - path: harness/knowledge/product-specs/atelier/**
    reason: product specs are immutable
generated_state_policy: none
expected_tests: []
expected_outputs:
  - repo_inventory ledger section
validation_gate_ids:
  - VG-000
  - VG-001
  - VG-036
  - VG-037
expected_diff_shape:
  max_files_changed: 2
  allowed_file_categories: [state]
  forbidden_diff_patterns:
    - product-spec changes
test_integrity_check:
  required: true
  forbidden:
    - deleting assertions
    - loosening expected outputs
    - skipping tests
    - renaming failing tests out of scope
    - weakening fixture oracle files
    - broadening success criteria
validation:
  required_before_handoff:
    - VG-001
    - VG-037
    - VG-038
handoff_artifact_path: IMPLEMENTATION_LEDGER.md#Repository-Inventory
```

### Graph Endpoint Fixture Packet

```yaml
packet_id: at-pkt-004
packet_type: fixture-author
dag_node_ids: [DAG-04]
title: Graph schema and endpoint fixture
role: fixture author
status: proposed
dispatchable: false
template: true
base_revision: <launch baseline>
repo_inventory_ref: <repo inventory id>
product_spec_hash_ref: product-spec-head-baseline
immutable_control_hash_ref: immutable-control-doc-baseline-2026-06-04
intent: Create graph schema and endpoint compatibility fixture inputs, expected outputs, negative cases, and command placeholder without accepting implementation behavior.
phase_gate: PG-1
invariant_ids:
  - AT-INV-004
  - AT-INV-005
  - AT-INV-008
  - AT-INV-009
source_sections:
  - path: harness/knowledge/product-specs/atelier/GRAPH_SEMANTICS.md
    section: node-schema
  - path: harness/knowledge/product-specs/atelier/GRAPH_SEMANTICS.md
    section: edge-catalog
  - path: harness/knowledge/product-specs/atelier/CONTRACT_TEST_MATRIX.md
    section: graph-fixtures
classification:
  - schema_requirement
  - fixture_requirement
files_to_inspect_before_edit:
  - path: <discovered fixture root>
    reason: confirm fixture root exists
allowed_files:
  - path: <discovered fixture root>/graph_endpoint_matrix_v1/**
    category: fixture
forbidden_files:
  - path: harness/knowledge/product-specs/atelier/**
    reason: product specs are immutable
generated_state_policy: fixture_only
expected_tests:
  - graph_kind_endpoint_compatibility_fixture
validation_gate_ids:
  - VG-004
  - VG-006
  - VG-034
  - VG-038
expected_diff_shape:
  max_files_changed: 8
  allowed_file_categories: [fixture]
  forbidden_diff_patterns:
    - source implementation changes
test_integrity_check:
  required: true
  forbidden:
    - deleting assertions
    - loosening expected outputs
    - skipping tests
    - renaming failing tests out of scope
    - weakening fixture oracle files
    - broadening success criteria
validation:
  required_before_handoff:
    - VG-001
    - VG-037
    - VG-038
handoff_artifact_path: <mutable packet handoff path>
```

### Verification Record Schema Validator Packet

```yaml
packet_id: at-pkt-005
packet_type: schema-implementer
dag_node_ids: [DAG-06]
title: Verification record schema validator
role: schema implementer
status: proposed
dispatchable: false
template: true
base_revision: <launch baseline>
repo_inventory_ref: <repo inventory id>
product_spec_hash_ref: product-spec-head-baseline
immutable_control_hash_ref: immutable-control-doc-baseline-2026-06-04
intent: Implement closed verification record schema validation and negative cases only.
phase_gate: PG-1
invariant_ids:
  - AT-INV-016
  - AT-INV-017
  - AT-INV-018
  - AT-INV-019
source_sections:
  - path: harness/knowledge/product-specs/atelier/VERIFICATION_SCHEMA.md
    section: record-schema
  - path: harness/knowledge/product-specs/atelier/VERIFICATION_SCHEMA.md
    section: status-lattice
classification:
  - verification_requirement
  - schema_requirement
files_to_inspect_before_edit:
  - path: <discovered verification source root>
    reason: confirm source root exists
  - path: <discovered verification test root>
    reason: confirm test root exists
allowed_files:
  - path: <discovered verification source root>/**
    category: source
  - path: <discovered verification test root>/**
    category: test
forbidden_files:
  - path: harness/knowledge/product-specs/atelier/**
    reason: product specs are immutable
generated_state_policy: none
expected_tests:
  - verification_record_schema_fixture
  - verification_status_schema_test
validation_gate_ids:
  - VG-008
  - VG-034
  - VG-038
  - VG-042
expected_diff_shape:
  max_files_changed: 6
  allowed_file_categories: [source, test]
  forbidden_diff_patterns:
    - accepted evidence promotion
    - run completion behavior
test_integrity_check:
  required: true
  forbidden:
    - deleting assertions
    - loosening expected outputs
    - skipping tests
    - renaming failing tests out of scope
    - weakening fixture oracle files
    - broadening success criteria
validation:
  required_before_handoff:
    - VG-001
    - VG-037
    - VG-038
handoff_artifact_path: <mutable packet handoff path>
```
