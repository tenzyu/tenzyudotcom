# VG-037 Immutable Control-Doc Baseline Proof

```yaml
record_id: vg-037-control-doc-baseline-2026-06-04
gate_id: VG-037
ran_at: 2026-06-04T00:00:00Z
baseline_id: immutable-control-doc-baseline-2026-06-04
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
recorded_by: control-doc-repair
status: passed
mutable_exclusions:
  - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md
  - harness/knowledge/implementation-control/atelier/state/**
immutable_control_docs:
  - {path: harness/knowledge/implementation-control/atelier/AGENT_PACKET_PROTOCOL.md, sha256: e22781fc383d6e3d9a89fabed4da2508b351f0683d8698346632af6d5209c07e}
  - {path: harness/knowledge/implementation-control/atelier/CONTRACT_TO_BUILD_MATRIX.md, sha256: 9f99ecb72546d97b2450c37994ee0e4266883f40b94b18da888ffe33dca1580f}
  - {path: harness/knowledge/implementation-control/atelier/FULL_COMPLETION_DEFINITION.md, sha256: 0a5454c645ba3d14743c39b7063a23b3dd8cea1b96f1b75bd8bdec6478c3f936}
  - {path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_DAG.md, sha256: 519b396f5972cb49b4ba08f6a6463cf12b22c0745c45f3337a12f42b33de2bf9}
  - {path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_ORCHESTRATOR.md, sha256: 6fe44a9779b0dc6a9e5cf5a7ee5129fe15499a450e22d2cd3611432aedd88103}
  - {path: harness/knowledge/implementation-control/atelier/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md, sha256: 270ef097a3c4f3d7d58ba952bbc0f60c37369455f12a15585a5e8ac0424f4db9}
  - {path: harness/knowledge/implementation-control/atelier/SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md, sha256: ed84a7dcf35867900c53a2c9f2dba028c4e8cde679d09b31a754ee28ca231647}
  - {path: harness/knowledge/implementation-control/atelier/SPEC_READ_PLAN.md, sha256: a27373394806cc05add5ec7457aab256dab1eec4f88e6571f4e72de7d08dc489}
  - {path: harness/knowledge/implementation-control/atelier/SUBAGENT_ROLE_CATALOG.md, sha256: bdefb648e6c39783f0fe6673128ccce5cf686cda1d112637a94d10fbbb336255}
  - {path: harness/knowledge/implementation-control/atelier/VALIDATION_GATE_REGISTRY.md, sha256: 2a1dbbba5d593c1fa8ceff00d9395a9a791f398522ca85c1b3ce724b2bae2dd4}
ordinary_packet_rule: Any ordinary packet changing these hashes fails VG-037 and must be rejected.
```
