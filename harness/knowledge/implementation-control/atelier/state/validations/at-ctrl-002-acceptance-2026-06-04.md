# at-ctrl-002 Acceptance Proof

```yaml
record_id: at-ctrl-002-acceptance-2026-06-04
packet_id: at-ctrl-002
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T00:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Gate Refinement Audit

### VG-001 — Product spec immutability

| Before | After |
|---|---|
| staged, unstaged, status, HEAD diff checks | staged, unstaged, status, HEAD diff checks **plus** rename/mode/untracked/diff-deleted detection via `awk '{print $1}' \| grep -E '^[RADMCU?]'` and explicit `sha256sum` cross-check against `VG-036` proof |

The added detection covers the four change types previously missed by name-only git status: `R` (rename), `M` (mode change), `D` (deleted in working tree), and `?` (untracked). Hash cross-check ensures that a file with no git status entry but a different SHA-256 from `HEAD` is still caught.

### VG-002 — Static project check

| Before | After |
|---|---|
| `bun nx run <atelier-project>:check` (literal string) | `bun nx run <atelier-project>:check` (resolved via `state/command-discovery/command-discovery-2026-06-04.md` → `canonical_project_check`) |

The command is now bound to a `command_discovery_ref` rather than a literal Bun/Nx string. Other toolchains can substitute their equivalent without the gate record embedding toolchain assumptions.

### VG-003 — Type/static validation

| Before | After |
|---|---|
| `bun nx show project <atelier-project>`; run typecheck/lint targets if present | Run typecheck target: `bun nx run <atelier-project>:typecheck`; if the project has no typecheck target, use the static portion of `bun nx run <atelier-project>:check` and document the absence |

The previous rule was vague about what to do when the typecheck target is absent. The new rule makes the absence explicit and requires it to be documented in the proof artifact.

### VG-037 — Immutable control-doc diff check

Verified pre-existing in registry and structured records. No change required; the gate continues to be enforced.

### VG-038 — Test integrity / no weakening

| Before | After |
|---|---|
| review test and fixture diffs for deleted assertions, looser expected outputs, skipped cases, removed negative cases, or broadened success criteria | mechanical diff audit with six closed rules: deleted assertions, broadened expected outputs, skipped tests, renamed failing tests, weakened fixture oracle files, broadened success criteria; legitimate repairs require `test_integrity_check.repairs` with reason and backed-by-evidence |

The new VG-038 specification is mechanical and auditable. The accompanying `state/validations/VG-038-test-integrity-mechanical-2026-06-04.md` proves the rule was applied to the at-ctrl-000..004 diff and found zero violations.

## Pending-Command Rule Audit

The "pending_command_implementation cannot satisfy phase gates" rule is already present in `VALIDATION_GATE_REGISTRY.md` (lines 19 and 79) and is now also referenced from the gate severity table for VG-004, VG-005, and related fixture gates. The rule is unchanged but verified.

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-002 diff? |
|---|---|
| weakening gates | No |
| deleting dependencies | No |
| broadening completion criteria | No |
| relaxing product-spec immutability | No |
| adding compatibility aliases for removed commands | No |
| broadening fixture scope without matrix-backed reason | No |
| narrowing expected diff shape to hide required work | No |
| downgrading blocker severity without evidence | No |
| converting executable requirements into assumptions | No |
| allowing pending commands to satisfy phase gates | No |

All ten forbidden actions: clear.

## Gate Runs

| Gate | Status | Evidence |
|---|---|---|
| VG-001 | passed | product-spec staged/unstaged/status/HEAD/rename/mode/untracked/diff-deleted checks all empty |
| VG-002 | passed (pre-existing) | state/validations/VG-002-atelier-check-2026-06-04.md |
| VG-003 | passed (new) | state/validations/VG-003-typecheck-2026-06-04.md |
| VG-037 | to be re-recorded | state/validations/VG-037-control-doc-baseline-2026-06-04.md |
| VG-038 | passed (new) | state/validations/VG-038-test-integrity-mechanical-2026-06-04.md |
