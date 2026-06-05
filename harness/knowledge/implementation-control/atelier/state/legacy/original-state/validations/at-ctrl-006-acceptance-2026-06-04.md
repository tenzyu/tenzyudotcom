# at-ctrl-006 Acceptance Proof

```yaml
record_id: at-ctrl-006-acceptance-2026-06-04
packet_id: at-ctrl-006
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T01:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Mission Audit

The fixture alias registry is now machine-readable at
`harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-2026-06-04.yaml`.
VG-045 is now executable: its command is
`bun nx run atelier:test -- --testPathPattern=fixture-alias-consistency`.
`BLK-FIXTURE-ALIAS-001` is closed.

### Before

- The fixture alias registry did not exist. Fixture/code packets
  could not use TBD fixture aliases as acceptance proof.
- VG-045 had `executable_now: false` and
  `command: pending alias consistency command`.
- The v5.1 fixture layout (input/expected/README/command per fixture
  directory) was not scaffolded for any contract fixture.
- `BLK-FIXTURE-ALIAS-001` had `status: open` and `severity: P1` with
  `blocking_scope: phase_blocking`.

### After

- 45-row alias registry exists, parseable as YAML, covering every
  fixture_id from `CONTRACT_TEST_MATRIX.md` §1a, §2, §2a, §2b, §4,
  every fixture_id in the DAG-02 join table rows for DAG-01, DAG-01B,
  DAG-01C, and the meta-fixtures used by the gate records.
- 40 placeholder fixture directories exist at
  `product/apps/atelier/src/__tests__/fixtures/<id>/` with the v5.1
  four-file layout (`input.ts`, `expected.ts`, `README.md`,
  `command.ts`). The `command.ts` files are real, fail-closed
  implementations that throw `fixture_not_yet_implemented: <id>`;
  they are not compatibility aliases.
- VG-045's structured record has `executable_now: true` and a real
  command. Its registry index row in `VALIDATION_GATE_REGISTRY.md`
  matches.
- `fixture-alias-consistency.test.ts` reads the alias registry YAML,
  asserts unique fixture_ids, asserts every `command_file` path
  either exists on disk or the row is `pending_command_implementation`
  or `oracle_gap`, asserts every `gate_id` references a real VG-NNN
  in either the gate table or the structured gate record, asserts
  every gate_id matches the closed `VG-<digits>[<letter>]` pattern,
  and asserts every non-null `negative_case_id` references a real
  matrix case. The test runs via `bun nx run atelier:test --
  --testPathPattern=fixture-alias-consistency`.
- VG-045 is now phase-gate eligible: a fixture/code packet may now
  cite a `fixture_id` in its `allowed_files_ref` and rely on
  `status: executable` for the assigned row.
- `BLK-FIXTURE-ALIAS-001` status changed from `open` to `closed`;
  the ledger's `computed_frontier` and `remaining work` paragraphs
  no longer list it.
- `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md` adds
  `fixture_alias_registry_ref` to the inventory schema and to the
  inventory validity criteria.
- `repo-inventory-2026-06-04.md` records the
  `fixture_alias_registry_ref`, adds the new
  `fixture-alias-consistency.test.ts` to `atelier_modules`, and
  updates the inventory validity audit to list the new criterion.

## Test Run Audit

```text
$ bun nx run atelier:test -- --testPathPattern=fixture-alias-consistency
 122 pass
   0 fail
 491 expect() calls
Ran 122 tests across 11 files. [1027.00ms]

$ bun nx run atelier:check
 122 pass
   0 fail
 491 expect() calls
Ran 122 tests across 11 files. [1051.00ms]
NX   Successfully ran target check for project atelier and 2 tasks it depends on
```

The 12 new alias-consistency tests join the existing 110 atelier
tests, for 122 total. Zero failures.

## Row Count Audit

| Status | Count |
|---|---|
| `executable` | 5 |
| `pending_command_implementation` | 40 |
| `oracle_gap` | 0 |
| **Total** | **45** |

The 5 executable rows are:

- `product_spec_hash_baseline` (DAG-01 join-table row; VG-001)
- `repo_inventory_2026_06_04` (DAG-01B join-table row; VG-000)
- `command_discovery_2026_06_04` (DAG-01C join-table row; VG-000)
- `all-assigned-fixtures` (VG-004 meta-fixture)
- `fixture_alias_registry_v1` (VG-045 self-reference)

## Fixture Layout Audit

| Layout requirement | Status |
|---|---|
| 40 placeholder fixture directories exist | yes |
| Each directory has `input.ts`, `expected.ts`, `README.md`, `command.ts` | yes |
| `command.ts` is a real, fail-closed throw (not a compatibility alias) | yes |
| `README.md` links to the alias registry row for the assigned fixture | yes |

## Gate Record Audit

| Gate record field | Before | After |
|---|---|---|
| `executable_now` | `false` | `true` |
| `command` | `pending alias consistency command` | `bun nx run atelier:test -- --testPathPattern=fixture-alias-consistency` |
| `required_input_files` | `[fixture alias registry]` | `[..., VALIDATION_GATE_REGISTRY.md, CONTRACT_TEST_MATRIX.md]` |
| `proof_artifact` | `state/validations/<run-id>-VG-045.md` | `state/validations/VG-045-2026-06-04.md` |

The `VALIDATION_GATE_REGISTRY.md` VG-045 row was updated to match.

## Repository Inventory Audit

`fixture_alias_registry_ref` is now present in
`repo-inventory-2026-06-04.md`. `atelier_modules` includes the new
test file. The validity audit enumerates the new criterion.

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-006 diff? |
|---|---|
| weakening gates | No (VG-045 is now stronger, not weaker) |
| deleting dependencies | No |
| broadening completion criteria | No (the registry only adds rows; it does not remove or weaken any) |
| relaxing product-spec immutability | No |
| adding compatibility aliases for removed commands | No (placeholder `command.ts` throws are real fail-closed implementations, not compatibility aliases) |
| broadening fixture scope without matrix-backed reason | No (each row's `provenance` field cites a specific matrix section, gate record, or join-table row) |
| narrowing expected diff shape to hide required work | No |
| downgrading blocker severity without evidence | No (BLK-FIXTURE-ALIAS-001 severity remains P1; only the status changes from `open` to `closed` with proof) |
| converting executable requirements into assumptions | No |
| allowing pending commands to satisfy phase gates | No (the orchestrator rule is unchanged; pending rows explicitly fail closed and are recorded with `pending_command_implementation` status) |

All ten forbidden actions: clear.

## Why this is a control-doc-repair packet (not an implementation packet)

- The registry is a state artifact under
  `harness/knowledge/implementation-control/atelier/state/traceability/`,
  which is in the mutable state root list.
- The placeholder `command.ts` files are scaffold files; they throw
  until a future fixture-author packet replaces them with real
  commands. The orchestrator rule prevents
  `pending_command_implementation` from satisfying any phase gate.
- The new test file is itself an executable artifact: it runs
  end-to-end and proves the alias registry is consistent.
- No product code, product fixture (in the contract-test sense), or
  product surface was changed.
- `product_code_packet_status: blocked_until_traceability_and_gate_records_are_concrete_for_assigned_rows`
  remains true for DAG-04..DAG-10, and
  `product_code_packets_allowed: false` is unchanged.
- The launch state (`launch_status: unsafe`) is unchanged.
- `BLK-TRACEABILITY-001` is the only remaining phase blocker.

## Why VG-045 is now phase-gate eligible

VG-045 is the gate that protects fixture/code packets from
referencing TBD or duplicate fixture aliases. Before this packet,
VG-045 had `executable_now: false`, which meant no fixture/code
packet could rely on the alias registry as proof. After this packet:

- The alias registry is concrete.
- The alias consistency test runs end-to-end and passes.
- The structured gate record reflects `executable_now: true`.
- The gate is now a first-class `accepted_statuses: [passed]` gate
  for fixture scaffold acceptance and any phase gate that names a
  fixture.

A future fixture/code packet that wants to use a fixture in
`allowed_files_ref` may now cite the alias registry row and rely on
its `command_file` and `status: executable` evidence.
