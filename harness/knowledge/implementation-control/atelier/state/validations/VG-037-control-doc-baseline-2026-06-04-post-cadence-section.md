# VG-037 Immutable Control-Doc Baseline Proof (post-at-ctrl-010 cadence section)

```yaml
record_id: vg-037-control-doc-baseline-2026-06-04-post-cadence-section
gate_id: VG-037
ran_at: 2026-06-04T03:00:00Z
baseline_id: immutable-control-doc-baseline-2026-06-04-post-cadence-section
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
parent_baseline_id: immutable-control-doc-baseline-2026-06-04-post-kernel-patch
parent_proof_ref: harness/knowledge/implementation-control/atelier/state/validations/VG-037-control-doc-baseline-2026-06-04-post-kernel-patch.md
recorded_by: control-doc-repair
status: passed
packet_id: at-ctrl-010
mutable_exclusions:
  - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md
  - harness/knowledge/implementation-control/atelier/state/**
immutable_control_docs:
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
ordinary_packet_rule: |
  Any ordinary packet changing these hashes fails VG-037 and must be
  rejected. The post-cadence-section baseline supersedes the
  post-kernel-patch baseline for ordinary-packet comparison;
  the post-kernel-patch baseline remains in force for any
  control-doc-repair packet that names a parent baseline.
```

## What changed relative to the parent baseline

| File | Pre-at-ctrl-010 SHA-256 | Post-at-ctrl-010 SHA-256 | Changed? |
|---|---|---|---|
| `IMPLEMENTATION_ORCHESTRATOR.md` | `6fe44a9779b0dc6a9e5cf5a7ee5129fe15499a450e22d2cd3611432aedd88103` (post-kernel-patch baseline, which is also the post-Round-2 baseline recorded in the ledger's `Immutable Control Doc Baseline` section) | `74449aa02e01562c236595b4f53d9e942cbd0b5008e67d1aa97d0c5fe4a5dc36` | yes (new "Validation Re-run Cadence" section appended) |
| All other immutable control docs | (parent baseline) | (unchanged) | no |

The single-file change is documented in
`state/validations/at-ctrl-010-acceptance-2026-06-04.md`. The
diff appends one section; it does not modify any existing
section, gate value, or forbidden-action list.
