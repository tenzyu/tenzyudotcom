# at-ctrl-007 Acceptance Proof

```yaml
record_id: at-ctrl-007-acceptance-2026-06-04
packet_id: at-ctrl-007
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T04:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Mission Audit

VG-026A is now executable. The pending placeholder command
`state/gates/write-authority-minimum-command.txt until implemented`
is replaced by a real, runnable test that reads the three required
input files and asserts the minimum write-authority rules enumerated
in the structured gate record and the packet mission. The minimum
test is a static text-presence check plus a small fail-closed probe
against the existing `core/policy.ts` module. It is NOT a runtime
actor × artifact-class × surface policy engine; building that engine
is the explicit VG-026B scope and is intentionally out of scope for
this packet.

### Before

- VG-026A had `executable_now: false`.
- VG-026A's command was `state/gates/write-authority-minimum-command.txt until implemented`.
- VG-026A's proof_artifact was the templated `state/validations/<run-id>-VG-026A.md`.
- DAG-10's per-DAG dependency on VG-026A could not be satisfied except
  by a placeholder; this blocked the gate's ability to be the
  minimum guard for mutating packets.

### After

- `product/apps/atelier/src/__tests__/write-authority-minimum.test.ts`
  exists, runs end-to-end via
  `bun nx run atelier:test -- --testPathPattern=write-authority-minimum`,
  and passes.
- VG-026A's structured gate record has `executable_now: true`, the
  real test command, and a concrete proof_artifact path.
- The VALIDATION_GATE_REGISTRY.md VG-026A row references the real
  test command.
- The IMPLEMENTATION_LEDGER.md has at-ctrl-007 in the Packet Status
  table and in the Validation History table.
- VG-026A's proof artifact is recorded at
  `state/validations/VG-026A-2026-06-04.md`.

## Test Run Audit

```text
$ bun nx run atelier:test -- --testPathPattern=write-authority-minimum

> bun run test --testPathPattern=write-authority-minimum

bun test v1.3.13 (bf2e2cec)
$ bun test "--testPathPattern=write-authority-minimum"

src/__tests__/write-authority-minimum.test.ts:
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md declares every required actor
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md declares a Forbidden Writes section
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md declares an Acceptance Requirements section
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md Forbidden Writes — context_planner is forbidden from mutating
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md Forbidden Writes — runtime_adapter is forbidden from rewriting source artifacts
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md Forbidden Writes — runtime_adapter is forbidden from implicit acceptance
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md Forbidden Writes — validator is forbidden from accepting its own evidence
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md Forbidden Writes — .atelier must not be the only copy of product truth
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md Acceptance Requirements — destination must be outside .atelier/
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md Acceptance Requirements — actor identity is required
  ✓ VG-026A write authority minimum — spec text assertions > WRITE_AUTHORITY_MATRIX.md Acceptance Requirements — correlation id is required
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md forbids runtime adapters from inventing verification records
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md forbids runtime adapters from persisting state outside canonical surfaces
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md states runtime adapters do not own product truth
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md §10 declares the context plan read-only effect schema
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md §10 forbids context plan from creating tasks, runs, or writing sources
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md §8a.5 states a validator must produce a verification record to be an accepted actor
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md §16.2 emits ATELIER-INVARIANT-VIOLATION on forbidden lifecycle transitions
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md §4.5 defines product truth as recoverable without .atelier/
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md §4.7 forbids .atelier from being the only product truth location
  ✓ VG-026A write authority minimum — contract.md assertions > contract.md §7 says .atelier may lose cache and debug but never product truth
  ✓ VG-026A write authority minimum — VERIFICATION_SCHEMA.md assertions > VERIFICATION_SCHEMA.md §7 defines hard_block as a union of conditions
  ✓ VG-026A write authority minimum — VERIFICATION_SCHEMA.md assertions > VERIFICATION_SCHEMA.md §7 includes adapter contract violation as a hard_block condition
  ✓ VG-026A write authority minimum — VERIFICATION_SCHEMA.md assertions > VERIFICATION_SCHEMA.md states verification record is durable only outside .atelier/
  ✓ VG-026A write authority minimum — VERIFICATION_SCHEMA.md assertions > VERIFICATION_SCHEMA.md defines a policy_decision minimum shape that can block
  ✓ VG-026A write authority minimum — VERIFICATION_SCHEMA.md assertions > VERIFICATION_SCHEMA.md states an active policy_decision with severity=block contributes to hard_block
  ✓ VG-026A write authority minimum — VERIFICATION_SCHEMA.md assertions > VERIFICATION_SCHEMA.md §9 says a file write alone is not acceptance
  ✓ VG-026A write authority minimum — rejection code wiring > contract.md or SURFACES.md or ADAPTER_CONTRACT.md names the invariant violation rejection code
  ✓ VG-026A write authority minimum — rejection code wiring > invariant violation code is the only fail-closed outcome for forbidden transitions referenced by contract.md §16.2
  ✓ VG-026A write authority minimum — fail-closed policy module behavior > evaluatePath blocks writes to a system path
  ✓ VG-026A write authority minimum — fail-closed policy module behavior > evaluateCommand blocks a dangerous curl pipe
  ✓ VG-026A write authority minimum — fail-closed policy module behavior > evaluateTool requires ask for edit/write tools
  ✓ VG-026A write authority minimum — fail-closed policy module behavior > default-deny on unknown rules means a minimum guard that knows no rule defaults to deny
  ✓ VG-026A write authority minimum — closed vocabulary and integrity > WRITE_AUTHORITY_MATRIX.md section 3 names artifact classes that include source_artifact and accepted_durable_evidence
  ✓ VG-026A write authority minimum — closed vocabulary and integrity > WRITE_AUTHORITY_MATRIX.md section 3 names derived_state, working_run_packet, working_handoff
  ✓ VG-026A write authority minimum — closed vocabulary and integrity > WRITE_AUTHORITY_MATRIX.md names the five expected actors exactly once each in section 2
  ✓ VG-026A write authority minimum — closed vocabulary and integrity > READ_ONLY_EFFECT_KEYS is a complete enumeration of the context plan read-only effect schema
 178 pass
  0 fail
 600 expect() calls
Ran 178 tests across 13 files. [1132.00ms]

 NX   Successfully ran target test for project atelier
```

```text
$ bun nx run atelier:check

> bun run typecheck && bun run test

$ tsc --noEmit
$ bun test

 178 pass
  0 fail
 600 expect() calls
Ran 178 tests across 13 files. [1315.00ms]

 NX   Successfully ran target check for project atelier and 2 tasks it depends on
```

## Suite Count Audit

| Metric | Before at-ctrl-007 | After at-ctrl-007 |
|---|---|---|
| Test files | 12 | 13 |
| Tests | 141 | 178 |
| `expect()` calls | 541 | 600 |
| New file | — | `product/apps/atelier/src/__tests__/write-authority-minimum.test.ts` (37 tests) |
| Failing tests | 0 | 0 |

## Gate Record Audit

| Gate record field | Before | After |
|---|---|---|
| `executable_now` | `false` | `true` |
| `command` | `state/gates/write-authority-minimum-command.txt until implemented` | `bun nx run atelier:test -- --testPathPattern=write-authority-minimum` |
| `proof_artifact` | `state/validations/<run-id>-VG-026A.md` | `state/validations/VG-026A-2026-06-04.md` |

The `VALIDATION_GATE_REGISTRY.md` VG-026A row was updated to reference
the real test command.

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-007 diff? |
|---|---|
| weakening gates | No (VG-026A becomes executable; its blocking_severity remains P0; required-before list unchanged) |
| deleting dependencies | No (the new test reads the three required input files plus the existing policy module; no dependency was removed) |
| broadening completion criteria | No (the new test asserts the spec defines the rule; it does not relax the spec) |
| relaxing product-spec immutability | No (no product-spec files were modified) |
| adding compatibility aliases for removed commands | No (no command alias was added; the test command is a new test target name) |
| broadening fixture scope without matrix-backed reason | No (the test asserts only the spec-defined minimum; it does not invent a runtime engine) |
| narrowing expected diff shape to hide required work | No (the test asserts every clause enumerated in the packet mission) |
| downgrading blocker severity without evidence | No (VG-026A blocking_severity remains P0 for mutating packets) |
| converting executable requirements into assumptions | No (each minimum rule is asserted as a hard text-presence check) |
| allowing pending commands to satisfy phase gates | No (VG-026A is now executable with a real passing test, not pending) |
| inventing a full policy engine (VG-026B scope) | No (the new test is a static text-presence check plus a small fail-closed probe against the existing `core/policy.ts` module; no new actor × artifact-class × surface engine is created) |

All eleven forbidden actions: clear.

## Why this is a control-doc-repair packet (not an implementation packet)

- The new test file is a state-of-the-art static check; it does not
  introduce a new policy engine, GUI workflow, runtime adapter, or
  transformation feature.
- The structured gate record, the registry index, the ledger, and
  the proof artifact are all state artifacts under
  `harness/knowledge/implementation-control/atelier/state/`, which
  is in the mutable state root list.
- No product code, product fixture (in the contract-test sense), or
  product surface was changed beyond the new test target.
- The launch state (`launch_status: unsafe`) is unchanged.
- `BLK-TRACEABILITY-001` is still the only remaining phase blocker
  (partial_resolution; carryover `at-ctrl-005B` for DAG-11..DAG-53).
- The new test target is a runnable test, not a placeholder
  command.txt; VG-026A now satisfies the "executable gate" rule in
  `VALIDATION_GATE_REGISTRY.md` §Phase-Gate Rule.

## Why VG-026A is now phase-gate eligible

VG-026A is the gate that protects mutating packets from running
without a minimum write-authority proof. Before this packet:

- The gate's command was a placeholder, not a real test.
- No proof artifact existed.
- `executable_now: false` meant no mutating packet could rely on
  VG-026A as proof.

After this packet:

- The minimum test runs end-to-end via
  `bun nx run atelier:test -- --testPathPattern=write-authority-minimum`
  and passes (37 new tests).
- The structured gate record reflects `executable_now: true` and a
  real proof_artifact path.
- The registry index row matches.
- The gate is now a first-class `accepted_statuses: [passed]` gate
  for any mutating packet; it remains a P0 blocker but is no longer
  a placeholder.

A future mutating packet that wants to claim write authority over
`source_artifact`, `accepted_durable_evidence`, or any other
artifact class may now cite VG-026A's proof artifact as the minimum
guard. The full fixture (VG-026B) remains the waivable, owner-bounded
extension of this minimum.
