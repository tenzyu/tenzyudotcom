# VG-037 Immutable Control-Doc Baseline Proof (post-Round-2-patch refresh)

```yaml
record_id: vg-037-control-doc-baseline-2026-06-04-post-kernel-patch
gate_id: VG-037
ran_at: 2026-06-04T00:00:00Z
baseline_id: immutable-control-doc-baseline-2026-06-04-post-kernel-patch
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
recorded_by: control-doc-repair
status: passed
supersedes: vg-037-control-doc-baseline-2026-06-04
superseded_at: 2026-06-04T00:00:00Z
superseded_reason: kernel was patched by at-ctrl-000..004 during Round 2 control repair
mutable_exclusions:
  - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md
  - harness/knowledge/implementation-control/atelier/state/**
immutable_control_docs:
  - {path: harness/knowledge/implementation-control/atelier/AGENT_PACKET_PROTOCOL.md, sha256: c0de993c862583fbcd28b5ee500aa150e4be953a98f09fe37ee763dbedc9c83d}
  - {path: harness/knowledge/implementation-control/atelier/CONTRACT_TO_BUILD_MATRIX.md, sha256: 67adb8db9a99039ce7863cb9e1dd26b6e91f796ee3fbdff71a35fb77a450e116}
  - {path: harness/knowledge/implementation-control/atelier/FULL_COMPLETION_DEFINITION.md, sha256: 51e1b60960213f2245417e9fa01bfa91675e760e4e59ef382fca3c2e60a808a6}
  - {path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_DAG.md, sha256: 519b396f5972cb49b4ba08f6a6463cf12b22c0745c45f3337a12f42b33de2bf9}
  - {path: harness/knowledge/implementation-control/atelier/IMPLEMENTATION_ORCHESTRATOR.md, sha256: 8f647be183db12ac38f3f5b9d0afa330dae439dd1a0f9a3f0b0e5293fc545fdb}
  - {path: harness/knowledge/implementation-control/atelier/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md, sha256: 0665ccd6dbf220725b354d2571ed0216441092cbe7c83e45f709f6d2e9ffc530}
  - {path: harness/knowledge/implementation-control/atelier/SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md, sha256: bad4c1b577baaed0a48ed001abf75973a10b934f1388d58a15e08828666ee311}
  - {path: harness/knowledge/implementation-control/atelier/SPEC_READ_PLAN.md, sha256: 124bfbaf63635c878fd186deb4d43b7917957bf6ff45155302b28c25cba7b7cc}
  - {path: harness/knowledge/implementation-control/atelier/SUBAGENT_ROLE_CATALOG.md, sha256: 4b5847ce9b09c3b85eda4ca67670d3f7ee9f3d3871d457dd74c3d687e4952494}
  - {path: harness/knowledge/implementation-control/atelier/VALIDATION_GATE_REGISTRY.md, sha256: ffaff7f656a8de64c96ae66e3004c9726f756dc068ecd81493495d610bd886cc}
ordinary_packet_rule: Any ordinary packet changing these hashes fails VG-037 and must be rejected.
notes: |
  After Round 2 kernel patches (at-ctrl-000..004), the immutable control-doc
  baseline is refreshed. The pre-patch baseline is preserved at
  vg-037-control-doc-baseline-2026-06-04 for traceability. The new
  baseline is the reference for any subsequent control-doc-repair packet.
```
