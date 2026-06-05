---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-validation-gate-registry
title: Atelier Validation Gate Registry
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Validation Gate Registry

## Command Discovery

Exact project names are implementation details and must be discovered before replacing placeholders. Use the package-manager detection algorithm in `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md` before choosing a command. In this repository, discovery resolved to Bun/Nx and project `atelier`; other repositories must try package-manager-specific Nx commands and non-Nx fallbacks before declaring tools unavailable. The repository instruction requires `bun nx run <project>:check` or an equivalent discovered project check before claiming completion.

Do not fabricate a command as existing. If a gate command is not yet implemented, create the fixture `command.txt` with intended command and mark the gate `pending_command_implementation` in the ledger. `pending_command_implementation` is allowed only for scaffold/oracle packets. It never satisfies a phase gate, implementation acceptance gate, public proof claim, or final completion criterion.

Every gate record must state fixture ID, required files, command source, command resolution algorithm, accepted statuses, negative cases, proof artifact, and ledger update. If any field is unknown, the gate is not executable and cannot accept implementation behavior.

The executable structured gate records are persisted in `harness/knowledge/implementation-control/atelier/state/gates/structured-gates-2026-06-04.yaml`. The table below is an index only; packet acceptance must use the structured record and a validation history entry.

## Gates

| Gate ID | Purpose | Command | Required before | Failure owner | Retry policy | Blocking severity |
|---|---|---|---|---|---|---|
| VG-000 | Discover Nx project/targets | `bun nx show projects`; then `bun nx show project <atelier-project>` | Any project-level check | Mother agent | Retry once; if unavailable record `tool_unavailable` | medium |
| VG-001 | No product-spec edits against `HEAD` launch baseline | Run all in this order: `git diff --name-status -- harness/knowledge/product-specs/atelier`; `git diff --cached --name-status -- harness/knowledge/product-specs/atelier`; `git status --porcelain=v1 -- harness/knowledge/product-specs/atelier`; `git diff --name-status HEAD -- harness/knowledge/product-specs/atelier`; `git status --porcelain=v1 -- harness/knowledge/product-specs/atelier \| awk '{print $1}' \| grep -E '^[RADMCU?]'`; record any renamed, mode-changed, deleted, or untracked product-spec path; compare current paths and hashes against the ledger's `HEAD` baseline; `sha256sum harness/knowledge/product-specs/atelier/*.md` and diff against `state/validations/VG-036-product-spec-hash-2026-06-04.md` | Every packet acceptance and final completion | Mother agent | No retry; reject patch and record P0 blocker if product spec edits exist | fatal |
| VG-002 | Static project check | `bun nx run <atelier-project>:check` (resolved via `state/command-discovery/command-discovery-2026-06-04.md` → `canonical_project_check`) | Before phase gates and completion claims | Packet owner for changed project | Retry after scoped fix; no test weakening | high |
| VG-003 | Type/static validation | Run typecheck target for the assigned project: `bun nx run <atelier-project>:typecheck`; if the project has no typecheck target, use the static portion of `bun nx run <atelier-project>:check` and document the absence in the proof artifact | Schema and code packets | Packet owner | Retry twice then assign regression fixer | high |
| VG-004 | Fixture layout validation | Validate each `fixtures/<id>/` has input or input dir, expected, README, command | Before fixture-based implementation | Fixture author | Fix fixture; do not edit specs | high |
| VG-005 | Artifact graph golden fixture | Command from `fixtures/artifact_graph_golden_v1/command.*` or implementation test target | End of graph kernel phase | Graph kernel implementer | Retry twice; split graph hash vs extraction if needed | high |
| VG-006 | Graph endpoint compatibility | Command from `fixtures/graph_endpoint_matrix_v1/command.*` | Before graph consumers | Graph kernel implementer | Retry invalid matrix handling first | high |
| VG-007 | `.atelier` deletion/regeneration | Command from deletion regeneration fixture | Before claiming repository ownership/durable state | Graph kernel implementer | Retry once; block if product truth only exists in `.atelier` | fatal |
| VG-008 | Verification record schema | Command from `fixtures/verification_record_v1/command.*` | Before run verify/complete | Verification engine implementer | Retry schema and negative cases | high |
| VG-009 | Required verification map derivation | Command from `fixtures/verification_map_derivation_v1/command.*` | Before context plan co-emission/run creation | Verification engine implementer | Retry derivation filters; split task/check bindings if needed | high |
| VG-010 | Completion truth table | Command from `fixtures/completion_truth_table_v1/command.*` | Before run completion | Verification engine implementer | Retry; no truth table reinterpretation without blocker | fatal |
| VG-011 | Run lifecycle state machine | Command from `fixtures/run_lifecycle_state_machine_v1/command.*` | Before run force-close and HPO lifecycle states | Event lifecycle implementer | Retry state transition code only | fatal |
| VG-012 | Forced close lifecycle | Command from `fixtures/forced_close_lifecycle_v1/command.*` | Before force-close surface release | Run lifecycle implementer | Retry invalid-state guards | high |
| VG-013 | Durable acceptance | Command from `fixtures/durable_acceptance_v1/command.*` | Before accepted evidence claims | Event/evidence implementer | Retry correlation/durable path handling | fatal |
| VG-014 | Accepted evidence lifecycle | Command from `fixtures/accepted_evidence_lifecycle_v1/command.*` | Before MVP wedge and transformation pilots | Event/evidence implementer | Retry once; block if acceptance cannot be represented | fatal |
| VG-015 | Context plan read-only | Command from `fixtures/context_plan_readonly_v1/command.*` | Before Attention v1 | Attention planner implementer | Retry side-effect removal; no hidden writes | fatal |
| VG-016 | Context budget traversal guard | Command from `fixtures/context_budget_v1/command.*` | Before Attention v1 | Attention planner implementer | Retry budget fields/enforcement | high |
| VG-017 | Resolution decision record | Command from `fixtures/resolution_decision_v1/command.*` | Before semantic/hybrid context selection | Attention planner implementer | Retry record completeness | high |
| VG-018 | Active surface inventory | Command from `fixtures/surface_inventory_v1/command.*` | Before surface release and phase gates | Surface/CLI implementer | Retry stale surface cleanup; no aliases | high |
| VG-019 | Run verify surface record | Command from `fixtures/run_verify_surface_record_v1/command.*` | Before run verify release | Surface/CLI plus verification owner | Retry full-record validation only | high |
| VG-020 | Run packet reading order | Command from `fixtures/run_packet_v1/command.*` | Before run resume/export | Run packet implementer | Retry prompt/order generation | high |
| VG-021 | Adapter semantic equivalence | Command from `fixtures/adapter_semantic_equivalence_v1/command.*` | Before packet/runtime parity claims | Adapter implementer | Retry normalization; do not require byte equality | high |
| VG-022 | Adapter packet portability | Command from `fixtures/adapter_packet_portability_v1/command.*` | Before MVP 1B completion | Adapter implementer | Retry adapter descriptors and normalized fields | high |
| VG-023 | Adapter runtime parity | Command from `fixtures/adapter_runtime_parity_v1/command.*` | Before runtime_agnosticism_claim | Adapter implementer | Retry adapter-specific issue; block only runtime agnosticism claim | fatal for claim, medium for other work |
| VG-024 | Decision_ref primary target | Command from `fixtures/decision_ref_primary_target_v1/command.*` | Before transformation/verification skip acceptance | Verification/Transformation owners | Retry decision record validation | high |
| VG-025 | Transform maturity transition | Command from `fixtures/transform_maturity_v1/command.*` | Before transformation pilots completion | Transformation implementer | Retry transition guards; no auto-promotion | high |
| VG-026A | Minimum write authority hard-block | `bun nx run atelier:test -- --testPathPattern=write-authority-minimum`; the test reads `WRITE_AUTHORITY_MATRIX.md`, `contract.md`, and `VERIFICATION_SCHEMA.md`, asserts the actor × artifact-class × surface permission truth table is present, and exercises the existing policy module fail-closed paths; full fixture absence cannot waive this minimum | Before any mutating packet that creates, accepts, rejects, promotes, exports, imports, or mutates durable evidence | Governance boundary implementer | Retry guard rules; no pending fixture may satisfy this gate | fatal for mutating packets |
| VG-026B | Full write authority matrix fixture | Command from `fixtures/write_authority_v1/command.*`; if absent, record product-spec deferred fixture waiver with owner and expiry | Before full write-authority claims and final completion if still in scope | Governance boundary implementer | Retry fixture/guard rules; if fixture absent mark blocked/pending with waiver | high after fixture exists; cannot waive VG-026A |
| VG-027 | Drift detection | Command from `fixtures/drift_v1/command.*` | Before reconciliation and HPO drift display | Integration tester | Retry pair-specific detector | medium for Phase 1E, high for full completion |
| VG-028 | HPO state evidence table | Command from `fixtures/hpo_state_evidence_v1/command.*` | Before HPO UI release | HPO state/UI implementer | Retry projection/copy/actions | high |
| VG-029 | Contract coverage | Command from `fixtures/coverage_v1/command.*` or implemented `contract_coverage_test` | Every phase gate and final release | Contract auditor | Retry mapping/waiver entries outside product specs | fatal for phase completion |
| VG-030 | End-to-end MVP wedge | Discover implemented E2E target; intended flow from `ROADMAP.md` Phase 1D and `EXAMPLES.md` | Before Phase 2 | Integration tester | Retry failing segment; split if root cause unclear | fatal for Phase 2 |
| VG-031 | End-to-end full product flows | Discover implemented E2E target covering all six examples and HPO/runtime/swarm flows | Final convergence | Integration tester | Assign regression fixers by failed flow | fatal |
| VG-032 | Adapter parity no-lock-in audit | Run adapter parity plus surface inventory plus no hidden adapter state checks | Before final release | Contract auditor | Retry adapter state/surface issues | fatal |
| VG-033 | Generated-state regeneration | Delete/regenerate permitted derived state in controlled fixture only | Before repository ownership acceptance | Graph kernel implementer | Retry regeneration; never delete user `.atelier` outside fixture without packet authority | fatal |
| VG-034 | Negative tests | Run negative cases for invalid enums, missing evidence, removed commands, invalid transitions, forbidden writes | Before each domain phase gate | Domain packet owner | Retry until invalid cases fail closed | high |
| VG-035 | Release readiness | `bun nx run <atelier-project>:check` plus all applicable VG gates and final ledger checklist | Final completion | Mother agent | No retry loop; assign targeted regression packets | fatal |
| VG-036 | Product spec hash baseline check | Record SHA-256 for each `HEAD:harness/knowledge/product-specs/atelier/*` entry; compare current hash to recorded baseline only after staged/status checks pass | `DAG-01`, every phase gate, final completion | Mother agent | Product-spec drift is P0; continue control repair only | fatal |
| VG-037 | Immutable control-doc diff check | Compare immutable implementation-control baseline docs against recorded baseline; ordinary packets must have no diff outside mutable state files | Before ordinary packet acceptance and every phase gate | Mother agent | Reject ordinary packet; allow only dedicated `control-doc-repair` packet with audit | fatal for ordinary packets |
| VG-038 | Test integrity / no weakening | Mechanical diff audit on the packet's changed file list. Forbid any of: deleted assertions in `*.test.*` files; broadened expected outputs in fixture `expected` files or inline `expect()` calls; skipped tests (`it.skip`, `test.skip`, `describe.skip`, `xit`, `xtest`); renamed failing tests out of scope (path or identifier change without semantic preservation); weakened fixture oracle files (changes to `command.*`, `expected.*`, `input.*` that do not preserve the prior assertion semantics); broadened success criteria in `*coverage*` or `*contract*` files. Require contract-backed rationale for any legitimate test repair: a packet that legitimately weakens a test must (a) declare the change in `test_integrity_check.repairs` with `reason` and `backed_by_evidence`, (b) reference a `product_spec_hash_ref` and `source_sections` for the rationale, and (c) fail the audit until the rationale is recorded | Every packet that touches tests, fixtures, serializers, validators, or public surfaces | Mother agent plus integration tester | Reject and split into test-repair packet if legitimate; never accept broadened behavior as a test repair | high |
| VG-039 | Stale command grep | Search active surfaces, help text, docs, prompts, MCP names, and GUI labels for removed commands/aliases from `SURFACES.md` | Before surface release and final completion | Surface/CLI implementer | Remove stale aliases; do not add compatibility shims | high |
| VG-040 | Task/run boundary event test | Command from `fixtures/task_run_boundary_event_v1/command.*` or implemented `task_run_boundary_event_test` | Before task lifecycle or run lifecycle acceptance | Event lifecycle implementer | Retry event separation only | high |
| VG-041 | Run lifecycle event test | Command from `fixtures/run_lifecycle_event_v1/command.*` or implemented `run_lifecycle_event_test` | Before run lifecycle surfaces | Run lifecycle implementer | Retry state/event transitions | fatal |
| VG-042 | Verification status schema test | Command from `fixtures/verification_status_schema_v1/command.*` or implemented `verification_status_schema_test` | Before verification record acceptance | Verification engine implementer | Retry enum/reason-code validators | high |
| VG-043 | Policy decision hard-block schema | Command from `fixtures/policy_decision_hard_block_v1/command.*`; must assert `policy_decision` shape and active blocking contribution to `hard_block` | Before completion truth table, write authority, governance, or mutating packets | Governance/verification owners | Retry schema/truth-table integration; do not invent full policy engine | fatal for mutating and completion packets |
| VG-044 | Privacy/redaction boundary | Command from `fixtures/privacy_redaction_boundary_v1/command.*`; must prove redacted fields are placeholdered and uncertainty is visible where full privacy semantics are deferred | Before trace/adapters/HPO public display of redacted evidence | Event/HPO owners | Retry boundary handling; record full privacy gap if needed | high |
| VG-045 | Fixture alias consistency | `bun nx run atelier:test -- --testPathPattern=fixture-alias-consistency` runs the alias-consistency test which reads `state/traceability/fixture-alias-registry-2026-06-04.yaml` and asserts: every `fixture_id` is unique, every `command_file` exists on disk or the row is `pending_command_implementation`/`oracle_gap`, every `gate_id` references a real VG-NNN in the gate table or structured gate record, every non-null `negative_case_id` references a real negative case in the matrix | Before fixture scaffold acceptance and phase gates | Fixture author plus contract auditor | Retry alias map; do not edit product specs | high |
| VG-046 | Parallel-packet conflict detection | `bun nx run atelier:test -- --testPathPattern=parallel-conflict-checker` runs the parallel-conflict-checker test which reads `state/packets/in-flight.yaml` and asserts: a candidate packet whose `allowed_files` or `forbidden_roots` intersect any in-flight packet's `allowed_files` or `forbidden_roots` is reported as `failed` with a per-conflict `ConflictReport`; fixture-family, command-surface, generated-state, and durable-evidence overlaps are reported as their own `conflict_kind`; an empty in-flight list always returns `passed`; conflicting packet ids are sorted deterministically | Every parallel packet dispatch | Mother agent | Do not dispatch conflicting packet; record `BLK-CONFLICT-<id>` blocker or wait for the in-flight packet to complete; do not edit product specs | high |

## VG-046

### Purpose

VG-046 is the gate that mechanically prevents two in-flight implementation
packets from mutating overlapping files, fixtures, schemas, command surfaces,
or generated-state paths. The DAG supports parallel subagent work, but the
system must enforce disjointness of the per-packet `allowed_files`,
`forbidden_roots`, fixture families, command surfaces, generated-state
paths, and durable-evidence paths before any packet is dispatched. This
gate is the executable enforcement of AT-INV-080.

### Command

`bun nx run atelier:test -- --testPathPattern=parallel-conflict-checker`

The test target runs `product/apps/atelier/src/__tests__/parallel-conflict-checker.test.ts`,
which exercises the core module at
`product/apps/atelier/src/core/parallel-conflict-checker.ts`. The core
module reads the machine-readable in-flight packet list at
`harness/knowledge/implementation-control/atelier/state/packets/in-flight.yaml`
(or the equivalent ledger section) and returns a
`ConflictCheckResult` with `status: passed | failed`, a sorted list of
conflicting in-flight packet ids, and a per-conflict report
(`ConflictReport[]`).

### Severity

`high` (P1). A failed VG-046 means two in-flight packets would mutate
overlapping files, fixtures, schemas, command surfaces, generated-state
paths, or durable-evidence paths. The mother agent must not dispatch the
new packet; it must either wait for the in-flight packet to complete or
record a new `BLK-CONFLICT-<id>` blocker. This is a parallel-dispatch
safety invariant and is not waiverable.

### Executable Now

Yes. The check script is implemented at
`product/apps/atelier/src/core/parallel-conflict-checker.ts` and the
test suite at
`product/apps/atelier/src/__tests__/parallel-conflict-checker.test.ts`
covers positive, negative, multi-conflict, deterministic-sort, and
file-load integration cases. The structured gate record has
`executable_now: true` and the command above is runnable. No
`pending_command_implementation` placeholder is used.

### Required Before

Every parallel packet dispatch. Before the mother agent dispatches a
new subagent packet, it must invoke VG-046 by passing the new packet's
`allowed_files`, `forbidden_roots`, `fixture_families`,
`command_surfaces`, `generated_state_paths`, and
`durable_evidence_paths` to the checker alongside the in-flight list.
If VG-046 returns `failed`, the mother agent does not dispatch and
follows the `Conflict-Detection Algorithm` described in
`IMPLEMENTATION_ORCHESTRATOR.md`.

### Notes

- The check covers six disjointness dimensions: `allowed_files` vs
  `allowed_files`, `forbidden_roots` vs `allowed_files` (bidirectional),
  fixture family set intersection, command surface set intersection,
  generated-state path intersection, and durable-evidence path
  intersection.
- The check operates on the in-flight list, not on closed or
  superseded packets. The mother agent removes the in-flight entry
  when a packet is integrated, superseded, rejected, or blocked-closed.
- VG-046 does not relax or replace any existing gate. It is additive
  and specifically protects parallel-dispatch safety.
- The check is non-mutating: it never writes to the filesystem or to
  the ledger. The mother agent owns the in-flight list mutations.

## Phase-Gate Rule

Phase gates require executable gates and proof artifacts. A gate marked `pending_command_implementation`, `not_run`, `unavailable`, or `oracle_gap` cannot satisfy a phase gate unless the product specs explicitly classify the entire claim as deferred and the ledger records a product-authorized waiver with owner and expiry.

## Proof Artifact Format

Each validation history entry must include:

```yaml
gate_id: <VG-*>
fixture_id: <fixture id or N/A>
command: <exact command>
resolved_from: <fixture command|nx target|manual audit|hash comparison>
status: passed | failed | pending_command_implementation | unavailable | not_run
negative_cases: []
proof_artifact: <log path or ledger evidence>
affected_packets: []
affected_invariants: []
```
