# VG-037 Immutable Control-Doc Baseline — Post Round-3 Patches

```yaml
record_id: VG-037-control-doc-baseline-2026-06-04-post-round-3-patches
recorded_at: 2026-06-04T01:30:00Z
recorded_by: control-doc-repair
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
previous_baseline: harness/knowledge/implementation-control/atelier/state/validations/VG-037-control-doc-baseline-2026-06-04-post-kernel-patch.md
refresh_reason: |
  Round-3 control-doc-repair packets (at-ctrl-007, at-ctrl-008, at-ctrl-009,
  at-ctrl-010) modified the following immutable control docs:
    - AGENT_PACKET_PROTOCOL.md  (allowed_files_intersect_inflight field)
    - IMPLEMENTATION_DAG.md  (DAG Node Range Rule)
    - IMPLEMENTATION_ORCHESTRATOR.md  (Conflict-Detection Algorithm, Validation Re-run Cadence)
    - REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md  (fixture_alias_registry_ref schema)
    - SUBAGENT_ROLE_CATALOG.md  (cross-reference to DAG range rule)
    - VALIDATION_GATE_REGISTRY.md  (VG-045 + VG-046 entries)
status: passed
```

## SHA-256 of all 10 immutable control docs (post-round-3-patches)

```yaml
immutable_control_doc_baseline:
  baseline_id: immutable-control-doc-baseline-2026-06-04-round-3
  baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
  recorded_at: 2026-06-04T01:30:00Z
  recorded_by: control-doc-repair
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

## Verification

To re-verify VG-037 against this baseline:

```bash
for f in AGENT_PACKET_PROTOCOL.md CONTRACT_TO_BUILD_MATRIX.md FULL_COMPLETION_DEFINITION.md IMPLEMENTATION_DAG.md IMPLEMENTATION_ORCHESTRATOR.md REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md SPEC_READ_PLAN.md SUBAGENT_ROLE_CATALOG.md VALIDATION_GATE_REGISTRY.md; do
  sha256sum harness/knowledge/implementation-control/atelier/$f
done
```

Compare each output against the entries above. Any non-matching hash triggers VG-037 failure (and a control-doc-repair packet is required to authorize any mutation).

## Notes

- The post-kernel-patch baseline (round 2) is preserved at its original path.
- This is the round-3 patch baseline.
- Future rounds (round 4, round 5, etc.) should follow the same naming convention: `VG-037-control-doc-baseline-2026-06-04-post-round-N-patches.md`.
- The ledger's `immutable_control_doc_baseline.proof_ref` and `immutable_control_doc_baseline.entries` sections have been updated to match this baseline.
