schema: atelier.packet/v1
packet_id: PKT-DAG-01-9E9AB0FEFD
status: draft
dispatchability_reasons: []
dag_node_ids:
  - DAG-01
title: "DAG-01: Product specs are immutable, baseline hashes are from HEAD, and
  drift opens P0 blocker."
goal: "Implement DAG-01: Product specs are immutable, baseline hashes are from
  HEAD, and drift opens P0 blocker. using only the bounded context in this
  packet."
subagent_contract:
  - Read only this packet and exact source line ranges named here.
  - Do not read legacy root docs or broad product-spec files.
  - Do not edit product specs.
  - Write or update tests before implementation.
  - Edit only allowed files.
  - Run only this packet validation profile unless the mother agent requests a
    global guard.
  - Record evidence for tests, implementation, and validation.
  - If context is insufficient, stop and return a blocker instead of exploring
    unrelated Markdown.
  - Return a structured handoff with files changed, tests written, commands run,
    evidence paths, and blockers.
non_goals:
  - Do not edit product specs.
  - Do not read the full product-spec pack during ordinary implementation.
  - Do not modify the main Atelier CLI for implementation-control scripts.
required_source_sections:
  - section_id: SPEC-CONTRACT_TEST_MATRIX-D6ECD5993D
    source_path: harness/knowledge/product-specs/atelier/CONTRACT_TEST_MATRIX.md
    heading_path:
      - Atelier Contract Test Matrix
    start_line: 21
    end_line: 871
source_read_commands:
  - sed -n '21,871p'
    harness/knowledge/product-specs/atelier/CONTRACT_TEST_MATRIX.md
assertions:
  - assertion_id: AST-PRODUCT-C3DF60791E
    text: Product specs are immutable, baseline hashes are from HEAD, and drift
      opens P0 blocker.
    modality: must
    severity: P0
    testability: executable
allowed_files:
  - state/validations/VG-001-product-spec-clean-2026-06-04.md and
    VG-036-product-spec-hash-2026-06-04.md
forbidden_files:
  - harness/knowledge/product-specs/atelier/**
  - product/apps/atelier/**/implementation-control*
required_gates:
  - VG-001
  - VG-036
required_fixtures:
  - product_spec_hash_baseline
required_tests:
  - name: DAG-01-VG-001
    test_command: see state/validations/VG-001-product-spec-clean-2026-06-04.md
    expected_failure_before_implementation: Failing or missing test must be recorded
      before implementation when practical.
    expected_pass_after_implementation: Packet-specific validation command passes and writes evidence.
    negative_cases:
      - any product-spec status or diff
  - name: DAG-01-VG-036
    test_command: see state/validations/VG-036-product-spec-hash-2026-06-04.md
    expected_failure_before_implementation: Failing or missing test must be recorded
      before implementation when practical.
    expected_pass_after_implementation: Packet-specific validation command passes and writes evidence.
    negative_cases:
      - any hash drift
validation_profile:
  profile_id: VP-DAG-01
  global_guards:
    - bun run validate:graph
    - bun run validate:coverage
  packet_gates:
    - VG-001
    - VG-036
  test_commands:
    - see state/validations/VG-001-product-spec-clean-2026-06-04.md
    - see state/validations/VG-036-product-spec-hash-2026-06-04.md
  evidence_required:
    - state/evidence/DAG-01-VG-001.json
    - state/evidence/DAG-01-VG-036.json
  skip_global_checks_reason: Packet work uses this bounded profile; global checks
    remain mother-agent guards.
acceptance_criteria:
  - Product specs are immutable, baseline hashes are from HEAD, and drift opens
    P0 blocker.
evidence_expectations:
  - gate_id: VG-001
    expected_artifact: state/validations/VG-001-product-spec-clean-2026-06-04.md
  - gate_id: VG-036
    expected_artifact: state/validations/VG-036-product-spec-hash-2026-06-04.md
blockers: []
resume_behavior:
  - If interrupted, append an in-flight entry to state/packets/in-flight.yaml
    before returning.
  - On resume, run `bun run resume` to confirm packet and frontier state, then
    continue from the last recorded evidence and handoff.
  - Do not re-run completed packet work; resume only at the next sub-step inside
    this packet.
  - If packet context is missing on resume, return a blocker instead of
    exploring unrelated Markdown.
failure_policy:
  - Do not dispatch implementation work while packet status is blocked.
  - Fail closed on missing gates, missing fixtures, product-spec drift, or
    forbidden file requirements.
  - Record blockers rather than guessing when packet context is insufficient.
  - Run required validation before claiming packet completion.
