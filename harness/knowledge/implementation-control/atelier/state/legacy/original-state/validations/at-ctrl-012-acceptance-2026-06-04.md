# at-ctrl-012 Acceptance Proof

```yaml
record_id: at-ctrl-012-acceptance-2026-06-04
packet_id: at-ctrl-012
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T01:30:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Mission Audit

The round-3 control-doc-repair packets (at-ctrl-007, at-ctrl-008, at-ctrl-009, at-ctrl-010) modified several immutable control docs. The VG-037 baseline recorded in the ledger was the post-Round-2 kernel-patch baseline. This packet refreshes the baseline to capture the round-3 patches.

### Modified docs

| Doc | Pre-round-3 SHA-256 | Post-round-3 SHA-256 |
|---|---|---|
| `AGENT_PACKET_PROTOCOL.md` | `c0de993c...` (post-Round-2) | `3ff4811b...` |
| `IMPLEMENTATION_DAG.md` | `519b396f...` (unchanged Round 2) | `860470ac...` |
| `IMPLEMENTATION_ORCHESTRATOR.md` | `8f647be1...` (post-Round-2) | `74449aa0...` |
| `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md` | `0665ccd6...` (post-Round-2) | `29e890bf...` |
| `SUBAGENT_ROLE_CATALOG.md` | `4b5847ce...` (post-Round-2) | `37741329...` |
| `VALIDATION_GATE_REGISTRY.md` | `ffaff7f6...` (post-Round-2) | `f429b016...` |

The other four (`CONTRACT_TO_BUILD_MATRIX.md`, `FULL_COMPLETION_DEFINITION.md`, `SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md`, `SPEC_READ_PLAN.md`) were not modified in round 3, so their hashes carry forward unchanged.

### Pre-patch baseline preservation

The pre-patch baseline at `state/validations/VG-037-control-doc-baseline-2026-06-04-post-kernel-patch.md` is preserved. Both baselines are now in the `state/validations/` tree for history.

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-012 diff? |
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

## Why this packet exists

Round-3 control-doc-repair packets at-ctrl-007/008/009/010 each modified at least one immutable control doc. The orchestrator's `required_before` machinery for VG-037 requires that the baseline match the current state. Without this refresh, the next ordinary packet acceptance would fail VG-037 even though the modifications are legitimate (they are `control-doc-repair` packets with full forbidden-action audits).

## Re-verification command

```bash
for f in AGENT_PACKET_PROTOCOL.md CONTRACT_TO_BUILD_MATRIX.md FULL_COMPLETION_DEFINITION.md IMPLEMENTATION_DAG.md IMPLEMENTATION_ORCHESTRATOR.md REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md SPEC_READ_PLAN.md SUBAGENT_ROLE_CATALOG.md VALIDATION_GATE_REGISTRY.md; do
  sha256sum harness/knowledge/implementation-control/atelier/$f
done
```

All ten outputs should match the entries in `state/validations/VG-037-control-doc-baseline-2026-06-04-post-round-3-patches.md`.
