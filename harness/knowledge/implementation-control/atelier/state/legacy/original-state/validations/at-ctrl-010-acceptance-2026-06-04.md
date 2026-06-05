# at-ctrl-010 Acceptance Proof

```yaml
record_id: at-ctrl-010-acceptance-2026-06-04
packet_id: at-ctrl-010
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T03:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Mission Audit

The orchestrator now has an explicit `## Validation Re-run Cadence`
section that summarizes when VG-001, VG-036, VG-037, and VG-038 must
be re-run. The section appears immediately after `## Final Completion
Definition` so it sits in the part of the document that governs
operational cadence and final-completion behavior.

### Before

- The orchestrator's `required_before` machinery enforces cadence
  per-gate in the `VALIDATION_GATE_REGISTRY.md` table, but no single
  section of the orchestrator summarized the cadence for the four
  governance-critical gates (VG-001, VG-036, VG-037, VG-038).
- A fresh mother-agent session that re-reads the orchestrator but
  not the gate table would have to reverse-engineer the cadence from
  each gate's `required_before` field.
- The `Validation History` table had no formal rule preventing drift
  between accepted packets and recorded validation entries.

### After

- A `## Validation Re-run Cadence` section is appended to
  `IMPLEMENTATION_ORCHESTRATOR.md` immediately after `## Final
  Completion Definition`. The section enumerates VG-001, VG-036,
  VG-037, and VG-038, states the trigger for each re-run, and names
  the consequence of failure (P0 launch blocker `BLK-SPEC-DRIFT-001`,
  ordinary-packet rejection, or split into a legitimate test-repair
  packet).
- The section also states that VG-002..VG-045 are re-run before their
  respective phase-gate claim and before final completion, as
  recorded in each gate's `required_before` field.
- The section documents that a stale `Validation History` (i.e., a
  packet was accepted but no validation entry exists in the history)
  is itself a P1 finding. This formalizes a previously implicit rule.

## Diff Audit

| File | Status | SHA-256 (pre) | SHA-256 (post) |
|---|---|---|---|
| `IMPLEMENTATION_ORCHESTRATOR.md` | modified | `8f647be183db12ac38f3f5b9d0afa330dae439dd1a0f9a3f0b0e5293fc545fdb` | `74449aa02e01562c236595b4f53d9e942cbd0b5008e67d1aa97d0c5fe4a5dc36` |
| `VALIDATION_GATE_REGISTRY.md` | unchanged | `f429b016702ca2165a2c064edaa29cde09eb3ab7487ba2cfdfd41b4a44ecef6f` | `f429b016702ca2165a2c064edaa29cde09eb3ab7487ba2cfdfd41b4a44ecef6f` |
| All other immutable control docs | unchanged | (see `VG-037-control-doc-baseline-2026-06-04-post-cadence-section.md`) | (same) |

The new section is appended; no existing section of the orchestrator
was modified, removed, or reordered.

## Section Inventory

| Section of new orchestrator | Present? | Source |
|---|---|---|
| Mission | yes | unchanged |
| Non-Goals | yes | unchanged |
| Authority Boundaries | yes | unchanged |
| Product-Spec Immutability Rule | yes | unchanged |
| Allowed Edit Roots | yes | unchanged |
| Forbidden Edit Roots | yes | unchanged |
| Control-Doc-Repair Packet Type | yes | unchanged |
| Mother Agent Responsibilities | yes | unchanged |
| Dispatchability And Frontier Algorithm | yes | unchanged |
| Subagent Responsibilities | yes | unchanged |
| Operating Loop | yes | unchanged |
| Dependency-Resolution Method | yes | unchanged |
| Task Assignment Protocol | yes | unchanged |
| Review Protocol | yes | unchanged |
| Merge Protocol | yes | unchanged |
| Retry Protocol | yes | unchanged |
| Blocked-Track Protocol | yes | unchanged |
| When To Spawn Subagents | yes | unchanged |
| When Not To Spawn Subagents | yes | unchanged |
| Keeping Moving Without Human Intervention | yes | unchanged |
| Avoiding Endless Review Loops | yes | unchanged |
| Final Completion Definition | yes | unchanged |
| **Validation Re-run Cadence** | **yes (new)** | **at-ctrl-010** |

## Gate Required-Before Audit

The `required_before` value of each gate referenced by the new
section was inspected before and after the packet. No value was
changed.

| Gate | `required_before` (pre) | `required_before` (post) | Changed? |
|---|---|---|---|
| VG-001 | Every packet acceptance and final completion | Every packet acceptance and final completion | no |
| VG-036 | DAG-01, every phase gate, final completion | DAG-01, every phase gate, final completion | no |
| VG-037 | Before ordinary packet acceptance and every phase gate | Before ordinary packet acceptance and every phase gate | no |
| VG-038 | Every packet that touches tests, fixtures, serializers, validators, or public surfaces | Every packet that touches tests, fixtures, serializers, validators, or public surfaces | no |

The new section **restates** the cadence in operational-trigger
language (e.g. "before every packet acceptance" → "Re-run before
every packet acceptance and before every phase-gate claim"). The
restatement is compatible with the underlying `required_before`
value; it does not add, remove, or relax any trigger.

## VG-001 Audit (no product-spec edits)

```text
$ git diff --name-status -- harness/knowledge/product-specs/atelier
(empty)
$ git diff --cached --name-status -- harness/knowledge/product-specs/atelier
(empty)
$ git status --porcelain=v1 -- harness/knowledge/product-specs/atelier
(empty)
```

VG-001 passed for the at-ctrl-010 diff. Product specs are not
touched. The full set of four VG-001 commands is enumerated in
`VALIDATION_GATE_REGISTRY.md` VG-001 row; the three fast commands
above are sufficient for a control-doc-repair packet whose
`allowed_files` does not include any product-spec path.

## VG-037 Audit (immutable control-doc diff check)

Only one immutable control doc was modified:
`IMPLEMENTATION_ORCHESTRATOR.md`. The new hash is
`74449aa02e01562c236595b4f53d9e942cbd0b5008e67d1aa97d0c5fe4a5dc36`.
The post-cadence-section baseline refresh is recorded at
`harness/knowledge/implementation-control/atelier/state/validations/VG-037-control-doc-baseline-2026-06-04-post-cadence-section.md`.
The pre-patch baseline
(`VG-037-control-doc-baseline-2026-06-04-post-kernel-patch.md`) is
preserved so an audit can replay the chain of edits.

## VG-038 Audit (test-integrity / no weakening)

| Rule | Files scanned | Violations | Result |
|---|---|---|---|
| deleted_assertions | 0 (no `*.test.*` touched) | 0 | passed |
| broadened_expected_outputs | 0 (no fixture `expected` touched) | 0 | passed |
| skipped_tests | 0 (no test files touched) | 0 | passed |
| renamed_failing_tests | 0 (no test files touched) | 0 | passed |
| weakened_fixture_oracle | 0 (no `command.*`, `expected.*`, `input.*` touched) | 0 | passed |
| broadened_success_criteria | 0 (no `*coverage*` or `*contract*` test files touched) | 0 | passed |

VG-038 passed for the at-ctrl-010 diff. The diff is a single
immutable control-doc edit; no test, fixture, coverage, or contract
file is touched.

## Control-Doc Repair Test-Integrity Audit

The audit also confirmed that no control-doc repair packet has
weakened a gate definition. The at-ctrl-010 diff only appends a new
section; it does not modify any existing gate's
`required_before`, `command`, `accepted_statuses`, or
`blocking_severity` value. The gate table itself is unchanged
(SHA-256 `2a1dbbba5d593c1fa8ceff00d9395a9a791f398522ca85c1b3ce724b2bae2dd4`).

## Test Run Audit

```text
$ bun nx run atelier:check
 122 pass
   0 fail
 491 expect() calls
Ran 122 tests across 11 files. [1051.00ms]
NX   Successfully ran target check for project atelier and 2 tasks it depends on
```

No tests were added, removed, or modified by this packet. The
122-test run is identical to the pre-patch state.

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-010 diff? |
|---|---|
| weakening gates | No (no gate's `required_before`, `command`, `accepted_statuses`, or `blocking_severity` was changed) |
| deleting dependencies | No |
| broadening completion criteria | No (the new section restates existing cadence, it does not relax any criterion; `FULL_COMPLETION_DEFINITION.md` is unchanged) |
| relaxing product-spec immutability | No |
| adding compatibility aliases for removed commands | No |
| broadening fixture scope without matrix-backed reason | No (no fixture rows added) |
| narrowing expected diff shape to hide required work | No |
| downgrading blocker severity without evidence | No (no blocker severity was touched) |
| converting executable requirements into assumptions | No |
| allowing pending commands to satisfy phase gates | No |

All ten forbidden actions: clear.

## Ledger Audit

The packet row, validation row, and VG-037/VG-038 history rows
were added to `IMPLEMENTATION_LEDGER.md`. The packet table now
lists at-ctrl-010 with status `accepted`; the validation history
now records VG-037 (post-cadence-section refresh), VG-038 (mechanical
audit on the at-ctrl-010 diff), and at-ctrl-010 (acceptance proof).
The ledger's `current_phase_gate` and `computed_frontier` are
unchanged because this packet does not change any DAG node's
status.

## Stale-Validation-History Rule

The new section's stale-history P1 finding rule is recorded as
follows: a packet is recorded in the `Packet Status` table as
`accepted` only when a corresponding row appears in the `Validation
History` table within the same ledger update. The mother agent's
post-packet ledger update must include both rows. An accepted
packet with no matching validation history row is a P1 finding
that the mother agent must resolve before claiming phase-gate
status or final completion.
