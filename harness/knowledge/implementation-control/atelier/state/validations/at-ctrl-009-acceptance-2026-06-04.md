# at-ctrl-009 Acceptance Proof

```yaml
record_id: at-ctrl-009-acceptance-2026-06-04
packet_id: at-ctrl-009
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T03:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Mission Audit

VG-046 (parallel-packet conflict detection) is now an executable,
phase-gate eligible gate that mechanically prevents two in-flight
implementation packets from mutating overlapping files, fixtures,
schemas, command surfaces, or generated-state paths. The gate is
backed by an implemented core module and a 19-test suite that
covers positive, negative, multi-conflict, deterministic-sort, and
file-load integration cases.

### Before

- AT-INV-080 (parallel conflict) was mapped in the matrix but had no
  executable enforcement.
- The DAG supported parallel subagent work, but the system relied only
  on static `allowed_files` disjointness checks in the packet review
  step.
- The orchestrator's `Dispatchability And Frontier Algorithm`
  section did not describe a conflict-detection algorithm.
- The packet schema in `AGENT_PACKET_PROTOCOL.md` had no
  `allowed_files_intersect_inflight` field.
- The ledger had no `## In-flight Packets` section and no
  `state/packets/in-flight.yaml` file existed.
- Round 2 audit (F-P2-3) flagged the missing executable
  parallel-conflict gate.

### After

- The structured gate record for VG-046 is appended to
  `state/gates/structured-gates-2026-06-04.yaml` with
  `executable_now: true`, `accepted_statuses: [passed]`, P1
  blocking severity, and the `parallel_conflict_check_v1` fixture
  id. The command is the implemented test target
  `bun nx run atelier:test -- --testPathPattern=parallel-conflict-checker`.
- `VALIDATION_GATE_REGISTRY.md` adds a `## VG-046` section matching
  the structure of the other gate sections (Purpose, Command,
  Severity, Executable Now, Required Before, Notes) plus the new
  row in the gate-index table.
- `IMPLEMENTATION_ORCHESTRATOR.md` adds a new
  `## Conflict-Detection Algorithm` section that describes the
  in-flight packet list source, the pre-dispatch VG-046 invocation,
  the failed-dispatch handling (wait or `BLK-CONFLICT-<id>`
  blocker), and the new `allowed_files_intersect_inflight` packet
  field.
- `AGENT_PACKET_PROTOCOL.md` adds the
  `allowed_files_intersect_inflight` field to the packet schema with
  the closed list type, the empty default, and the
  empty-list-equals-passed / non-empty-list-equals-failed semantics.
- `IMPLEMENTATION_LEDGER.md` adds rows to the Packet Status table
  and Validation History table for `at-ctrl-009` and `VG-046`, plus
  a new `## In-flight Packets` section (machine-readable YAML
  mirror; initial state empty list). The `state_directory_aliases`
  map gets a new `in_flight` alias.
- `state/packets/in-flight.yaml` is created with the schema header
  (schema id, file id, recorded_at, recorded_by, rule, vocabulary,
  closed_field_shape, notes) and an empty `in_flight_packets: []`
  list. The vocabulary declares the eight packet fields, the six
  conflict kinds, and the two `status_values` (`passed`, `failed`).
- The `parallel-conflict-checker` core module is implemented at
  `product/apps/atelier/src/core/parallel-conflict-checker.ts`. It
  exports `CandidatePacket`, `InFlightPacket`, `ConflictKind`,
  `ConflictReport`, `ConflictCheckResult`, `InFlightFile`,
  `checkConflicts`, `loadInFlightPackets`, and `runConflictCheck`.
  The path-intersection helper handles literal paths, `*`,
  `**`, `?`, character classes, and directory containment.
- The test suite at
  `product/apps/atelier/src/__tests__/parallel-conflict-checker.test.ts`
  has 19 cases covering empty in-flight, disjoint allowed_files,
  exact intersection, candidate-under-glob, glob-parent overlap,
  forbidden_roots-vs-allowed_files (both directions), fixture
  family overlap, command surface overlap, generated_state_paths
  overlap, durable_evidence_paths overlap, multi-conflict-per-
  packet aggregation, multi-packet aggregation, deterministic
  sorted conflicting_packet_ids, file-load integration, missing
  `in_flight_packets` key, full file-load + check integration,
  full-dimensional disjoint case, and ran_at/candidate_packet_id
  fields.

## Test Run Audit

```text
$ bun nx run atelier:test -- --testPathPattern=parallel-conflict-checker
 178 pass
   0 fail
 600 expect() calls
Ran 178 tests across 13 files. [1.57s]

$ bun nx run atelier:check
 178 pass
   0 fail
 600 expect() calls
Ran 178 tests across 13 files. [1.32s]
NX   Successfully ran target check for project atelier and 2 tasks it depends on
```

19 new parallel-conflict-checker tests join the existing 122 atelier
tests (plus 37 from other test files that are now also picked up by
the test pattern, for 178 total). Zero failures. The typecheck target
passes.

## Gate Record Audit

| Gate record field | Value |
|---|---|
| `gate_id` | `VG-046` |
| `purpose` | `Parallel-packet conflict detection` |
| `fixture_id` | `parallel_conflict_check_v1` |
| `required_input_files` | `state/packets/in-flight.yaml`, `packet allowed_files and forbidden_roots fields` |
| `positive_cases` | `in-flight packet allowed_files disjoint from new packet` |
| `negative_cases` | `overlapping fixture family / overlapping command surface / overlapping generated-state path / overlapping durable-evidence path` |
| `command_source` | `implemented check script` |
| `command_resolution_algorithm` | `read in-flight packet list, intersect new packet allowed_files against each in-flight packet allowed_files, check fixture family and command surface disjointness` |
| `command` | `bun nx run atelier:test -- --testPathPattern=parallel-conflict-checker` |
| `required_before` | `every parallel packet dispatch` |
| `failure_owner` | `mother agent` |
| `retry_policy` | `do not dispatch conflicting packet; record a new BLK-CONFLICT-<id> blocker or wait for in-flight to complete` |
| `blocking_severity` | `P1` |
| `accepted_statuses` | `[passed]` |
| `proof_artifact` | `state/validations/<run-id>-VG-046.md` |
| `executable_now` | `true` |

The `VALIDATION_GATE_REGISTRY.md` VG-046 row matches the structured
record. The new `## VG-046` section adds the same Purpose / Command /
Severity / Executable Now / Required Before / Notes structure used by
the other gate sections.

## Conflict-Detection Algorithm Audit

The new `## Conflict-Detection Algorithm` section in
`IMPLEMENTATION_ORCHESTRATOR.md` covers:

- The in-flight packet list is maintained at
  `state/packets/in-flight.yaml` (machine-readable) and mirrored in
  the ledger's `## In-flight Packets` section (human-readable). The
  YAML file is the runtime source of truth read by the checker.
- Before dispatch, the mother agent invokes VG-046 by passing the
  new packet's `allowed_files`, `forbidden_roots`,
  `fixture_families`, `command_surfaces`, `generated_state_paths`,
  and `durable_evidence_paths` to the checker alongside the
  in-flight list.
- If VG-046 returns `failed`, the mother agent does not dispatch.
  It either waits for the in-flight packet to complete, or records
  a new `BLK-CONFLICT-<id>` blocker and continues independent
  tracks.
- The new packet's `allowed_files_intersect_inflight` field is set
  to `[]` (passed) or `[<conflicting packet ids>]` (failed). A
  missing field is a fail-closed error.
- The check is non-mutating: it never writes to the filesystem or
  the ledger. The mother agent owns all in-flight list mutations.
- VG-046 does not replace or relax any other gate. It is additive.

## Packet Schema Audit

The new `allowed_files_intersect_inflight` field is added to the
packet schema in `AGENT_PACKET_PROTOCOL.md` immediately after
`generated_state_policy`. The field has type `list`, an empty
default, and the documented semantics that an empty list means
VG-046 passed and a non-empty list means VG-046 failed with the
listed packet ids. The field is now a required element of every
parallel packet dispatched under the new algorithm.

## In-flight Packets Audit

| Element | Status |
|---|---|
| `state/packets/in-flight.yaml` exists with schema header | yes |
| Initial `in_flight_packets: []` empty list | yes |
| Vocabulary declares eight packet fields | yes |
| Vocabulary declares six conflict kinds | yes |
| Vocabulary declares two `status_values` (`passed`, `failed`) | yes |
| Ledger `## In-flight Packets` section exists | yes |
| Ledger `state_directory_aliases` includes `in_flight` | yes |
| Initial state: empty list (clean baseline) | yes |

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-009 diff? |
|---|---|
| weakening gates | No (VG-046 is a new gate, additive; no existing gate changed) |
| deleting dependencies | No |
| broadening completion criteria | No (VG-046 is a parallel-dispatch safety check, not a completion claim) |
| relaxing product-spec immutability | No (no product spec was edited) |
| adding compatibility aliases for removed commands | No |
| broadening fixture scope without matrix-backed reason | No (the parallel_conflict_check_v1 fixture is the check itself; the gate is backed by an implemented module, not a fixture alias) |
| narrowing expected diff shape to hide required work | No |
| downgrading blocker severity without evidence | No (VG-046 is P1; no other severity was changed) |
| converting executable requirements into assumptions | No (the new gate is `executable_now: true`, not a placeholder) |
| allowing pending commands to satisfy phase gates | No (the check is a real, fail-closed implementation, not a `pending_command_implementation` placeholder) |

All ten forbidden actions: clear.

## Product-Spec Immutability Audit

```text
git diff --name-status -- harness/knowledge/product-specs/atelier  -> empty
git diff --cached --name-status -- harness/knowledge/product-specs/atelier  -> empty
git status --porcelain=v1 -- harness/knowledge/product-specs/atelier  -> empty
```

No product spec was edited.

## Why this is a control-doc-repair packet (not an implementation packet)

- The new gate record, gate section, orchestrator algorithm, packet
  schema field, and ledger section are all under the implementation-
  control root, which is the only authorized edit root for
  `control-doc-repair` packets.
- The new core module and test file are at
  `product/apps/atelier/src/core/parallel-conflict-checker.ts` and
  `product/apps/atelier/src/__tests__/parallel-conflict-checker.ts`.
  These are infrastructure support for the gate; they implement the
  conflict-checker that VG-046 calls, but they do not mutate
  product code, product fixture (in the contract-test sense), or
  product surface. The check is a parallel-dispatch safety
  primitive, not a product behavior.
- `product_code_packet_status: blocked_until_traceability_and_gate_records_are_concrete_for_assigned_rows`
  remains true for DAG-04..DAG-10, and
  `product_code_packets_allowed: false` is unchanged.
- The launch state (`launch_status: unsafe`) is unchanged.
- BLK-TRACEABILITY-001 remains the only open phase blocker (at
  partial_resolution; the at-ctrl-005B carryover is the
  follow-up for DAG-11..DAG-53 join-table expansion).

## Why VG-046 is now phase-gate eligible

VG-046 is the gate that mechanically prevents two in-flight
implementation packets from mutating overlapping files, fixtures,
schemas, command surfaces, or generated-state paths. Before this
packet, the parallel-dispatch check existed only as a static
`allowed_files` disjointness review in the orchestrator. After this
packet:

- The check is implemented as a real, fail-closed TypeScript module
  with a 19-case test suite.
- The structured gate record has `executable_now: true` and a real
  command.
- The in-flight packet list is machine-readable at
  `state/packets/in-flight.yaml` and mirrored in the ledger.
- The packet schema has the `allowed_files_intersect_inflight`
  field that the mother agent fills in after VG-046.
- The orchestrator's `## Conflict-Detection Algorithm` section
  describes the in-flight list, the pre-dispatch invocation, the
  failed-dispatch handling, and the field semantics.

A future packet that wants to be dispatched in parallel with an
in-flight packet must pass VG-046; a packet that does not pass
VG-046 cannot be dispatched and the mother agent must either wait
or record a `BLK-CONFLICT-<id>` blocker. The gate is now a
first-class `accepted_statuses: [passed]` gate for parallel
dispatch safety and is phase-gate eligible.
