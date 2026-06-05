schema: atelier.packet/v1
packet_id: PKT-DAG-01C-0DE190B23D
status: draft
dispatchability_reasons: []
dag_node_ids:
  - DAG-01C
title: "DAG-01C: Command discovery uses package-manager-specific Nx commands and
  non-Nx fallback before declaring"
goal: "Implement DAG-01C: Command discovery uses package-manager-specific Nx
  commands and non-Nx fallback before declaring using only the bounded context
  in this packet."
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
  - section_id: SPEC-ADAPTER_CONTRACT-CE33219F1E
    source_path: harness/knowledge/product-specs/atelier/ADAPTER_CONTRACT.md
    heading_path:
      - Atelier Adapter Contract
    start_line: 21
    end_line: 374
source_read_commands:
  - sed -n '21,374p' harness/knowledge/product-specs/atelier/ADAPTER_CONTRACT.md
assertions:
  - assertion_id: AST-OTHER-EF53B0C62D
    text: Command discovery uses package-manager-specific Nx commands and non-Nx
      fallback before declaring unavailable tools.
    modality: must
    severity: P1
    testability: executable
allowed_files:
  - state/command-discovery/command-discovery-2026-06-04.md
forbidden_files:
  - harness/knowledge/product-specs/atelier/**
  - product/apps/atelier/**/implementation-control*
required_gates:
  - VG-000
  - VG-002
required_fixtures:
  - repo_inventory_2026_06_04
  - command_discovery_2026_06_04
required_tests:
  - name: DAG-01C-VG-000
    test_command: bun nx show projects && bun nx show project atelier
    expected_failure_before_implementation: Failing or missing test must be recorded
      before implementation when practical.
    expected_pass_after_implementation: Packet-specific validation command passes and writes evidence.
    negative_cases:
      - tool unavailable before fallback exhaustion
  - name: DAG-01C-VG-002
    test_command: bun nx run atelier:check
    expected_failure_before_implementation: Failing or missing test must be recorded
      before implementation when practical.
    expected_pass_after_implementation: Packet-specific validation command passes and writes evidence.
    negative_cases:
      - check failure or unavailable command
validation_profile:
  profile_id: VP-DAG-01C
  global_guards:
    - bun run validate:graph
    - bun run validate:coverage
  packet_gates:
    - VG-000
    - VG-002
  test_commands:
    - bun nx show projects && bun nx show project atelier
    - bun nx run atelier:check
  evidence_required:
    - state/evidence/DAG-01C-VG-000.json
    - state/evidence/DAG-01C-VG-002.json
  skip_global_checks_reason: Packet work uses this bounded profile; global checks
    remain mother-agent guards.
acceptance_criteria:
  - Command discovery uses package-manager-specific Nx commands and non-Nx
    fallback before declaring unavailable tools.
evidence_expectations:
  - gate_id: VG-000
    expected_artifact: state/command-discovery/command-discovery-2026-06-04.md
  - gate_id: VG-002
    expected_artifact: state/validations/<run-id>-VG-002.md
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
