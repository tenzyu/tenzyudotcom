---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-state-repo-inventory-2026-06-04
title: Repository Inventory 2026-06-04
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Repository Inventory 2026-06-04

```yaml
repository_inventory:
  inventory_id: repo-inventory-2026-06-04
  recorded_at: 2026-06-04T00:00:00Z
  recorded_by: control-doc-repair
  baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
  validity_status: passed
  validity_audit_ref: harness/knowledge/implementation-control/atelier/state/validations/at-ctrl-001-acceptance-2026-06-04.md
  package_manager: bun
  package_manager_evidence:
    - root package.json packageManager: bun@1.3.10
    - bun.lock exists
    - command `bun --version` output: 1.3.13
  workspace_system: nx
  workspace_system_evidence:
    - nx.json exists
    - root package.json devDependency nx: 22.7.2
    - command `bun nx --version` output: Local v22.7.2; Global not found
  projects:
    - id: "@tenzyu/chatgpt-partial-html-export"
      root: packages/chatgpt-partial-html-export
      source_roots: []
      test_roots: []
      fixture_roots: []
      generated_roots: []
      commands:
        typecheck: unresolved
        test: unresolved
        check: unresolved
        lint: unresolved
    - id: skin-workbench
      root: packages/skin-workbench
      source_roots: []
      test_roots: []
      fixture_roots: []
      generated_roots: []
      commands:
        typecheck: unresolved
        test: unresolved
        check: unresolved
        lint: unresolved
    - id: osu-skin-core
      root: packages/osu-skin-core
      source_roots: []
      test_roots: []
      fixture_roots: []
      generated_roots: []
      commands:
        typecheck: unresolved
        test: unresolved
        check: unresolved
        lint: unresolved
    - id: linter
      root: packages/linter
      source_roots: []
      test_roots: []
      fixture_roots: []
      generated_roots: []
      commands:
        typecheck: unresolved
        test: unresolved
        check: unresolved
        lint: unresolved
    - id: castalia
      root: packages/castalia
      source_roots: []
      test_roots: []
      fixture_roots: []
      generated_roots: []
      commands:
        typecheck: unresolved
        test: unresolved
        check: unresolved
        lint: unresolved
    - id: atelier
      root: product/apps/atelier
      source_roots:
        - product/apps/atelier/src
      test_roots:
        - product/apps/atelier/src/__tests__
      fixture_roots:
        - product/apps/atelier/src/__tests__
      generated_roots:
        - product/apps/atelier/dist
        - harness/atelier
      commands:
        typecheck: bun nx run atelier:typecheck
        test: bun nx run atelier:test
        check: bun nx run atelier:check
        lint: bun nx run atelier:lint (unresolved; project does not declare a lint target)
  atelier_modules:
    - path: product/apps/atelier/src/cli.ts
      detected_role: surface-implementer
      existing_interfaces:
        - cli entry
    - path: product/apps/atelier/src/index.ts
      detected_role: surface-implementer
      existing_interfaces:
        - public surface exports
    - path: product/apps/atelier/src/core/context.ts
      detected_role: attention-planner
      existing_interfaces:
        - context plan selection
    - path: product/apps/atelier/src/core/controls.ts
      detected_role: contract-auditor
      existing_interfaces:
        - control coverage
    - path: product/apps/atelier/src/core/doctor.ts
      detected_role: contract-auditor
      existing_interfaces:
        - harness health check
    - path: product/apps/atelier/src/core/docs.ts
      detected_role: contract-auditor
      existing_interfaces:
        - knowledge lookup
    - path: product/apps/atelier/src/core/events.ts
      detected_role: event-lifecycle-implementer
      existing_interfaces:
        - event identity and durability
    - path: product/apps/atelier/src/core/frontmatter.ts
      detected_role: contract-auditor
      existing_interfaces:
        - knowledge frontmatter parsing
    - path: product/apps/atelier/src/core/graph.ts
      detected_role: graph-kernel-implementer
      existing_interfaces:
        - graph identity, schema, hash
    - path: product/apps/atelier/src/core/gui-server.ts
      detected_role: surface-implementer
      existing_interfaces:
        - GUI HTTP surface
    - path: product/apps/atelier/src/core/gui.ts
      detected_role: surface-implementer
      existing_interfaces:
        - GUI surface
    - path: product/apps/atelier/src/core/llm-protocol.ts
      detected_role: surface-implementer
      existing_interfaces:
        - LLM context plan schema
    - path: product/apps/atelier/src/core/mcp.ts
      detected_role: surface-implementer
      existing_interfaces:
        - MCP server
    - path: product/apps/atelier/src/core/policy.ts
      detected_role: governance-policy-boundary
      existing_interfaces:
        - policy decision hard-block
    - path: product/apps/atelier/src/core/reconciler.ts
      detected_role: graph-kernel-implementer
      existing_interfaces:
        - reconciliation
    - path: product/apps/atelier/src/core/runs.ts
      detected_role: event-lifecycle-implementer
      existing_interfaces:
        - run lifecycle
    - path: product/apps/atelier/src/core/schema.ts
      detected_role: schema-implementer
      existing_interfaces:
        - schema utilities
    - path: product/apps/atelier/src/core/tasks.ts
      detected_role: event-lifecycle-implementer
      existing_interfaces:
        - task lifecycle
    - path: product/apps/atelier/src/__tests__/fixture-alias-consistency.test.ts
      detected_role: fixture-author
      existing_interfaces:
        - fixture alias registry consistency check (VG-045)
        - validates that every fixture_id is unique, every command_file exists or is pending, every gate_id references a real VG-NNN, every non-null negative_case_id references a real matrix case
  git_state:
    status_porcelain: "?? harness/knowledge/implementation-control/"
    staged_files: []
    unstaged_files: []
    untracked_files:
      - harness/knowledge/implementation-control/
  editable_roots:
    source:
      - product/apps/atelier/src/**
    tests:
      - product/apps/atelier/src/__tests__/**
    fixtures:
      - product/apps/atelier/src/__tests__/**
    generated:
      - product/apps/atelier/dist/**
      - harness/atelier/**
  forbidden_roots:
    - harness/knowledge/product-specs/atelier/**
    - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_ORCHESTRATOR.md
    - harness/knowledge/implementation-control/atelier/SPEC_READ_PLAN.md
    - harness/knowledge/implementation-control/atelier/CONTRACT_TO_BUILD_MATRIX.md
    - harness/knowledge/implementation-control/atelier/IMPLEMENTATION_DAG.md
    - harness/knowledge/implementation-control/atelier/AGENT_PACKET_PROTOCOL.md
    - harness/knowledge/implementation-control/atelier/SUBAGENT_ROLE_CATALOG.md
    - harness/knowledge/implementation-control/atelier/VALIDATION_GATE_REGISTRY.md
    - harness/knowledge/implementation-control/atelier/SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md
    - harness/knowledge/implementation-control/atelier/FULL_COMPLETION_DEFINITION.md
    - harness/knowledge/implementation-control/atelier/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md
    - .git/**
  durable_evidence_roots: unresolved; product code packets may not write durable evidence until the assigned invariant defines a concrete durable path
  product_spec_drift_status: clean
  product_spec_drift_proof_ref:
    - harness/knowledge/implementation-control/atelier/state/validations/VG-001-product-spec-clean-2026-06-04.md
    - harness/knowledge/implementation-control/atelier/state/validations/VG-036-product-spec-hash-2026-06-04.md
  control_doc_baseline_ref: harness/knowledge/implementation-control/atelier/state/validations/VG-037-control-doc-baseline-2026-06-04.md
  product_code_packet_status: blocked_until_traceability_and_gate_records_are_concrete_for_assigned_rows
  fixture_alias_registry_ref: harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-2026-06-04.yaml
```

## Inventory Validity Audit

The inventory above satisfies the `inventory_validity_criteria` defined in `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md`:

- `package_manager: bun` is in the allowed enum.
- `workspace_system: nx` is in the allowed enum.
- `atelier_modules` is non-empty; every entry has `detected_role` and at least one `existing_interfaces` entry.
- `editable_roots.source`, `editable_roots.tests`, `editable_roots.fixtures`, `editable_roots.generated` are all present and non-empty.
- `forbidden_roots` includes `harness/knowledge/product-specs/atelier/**` and all ten immutable implementation-control core docs.
- `git_state.untracked_files` is recorded; the only untracked content is the in-progress control-doc-repair under `harness/knowledge/implementation-control/`.
- `product_spec_drift_status: clean` with current proof refs.
- `commands.check: bun nx run atelier:check` resolves to a `command_discovery_ref` recorded in `state/command-discovery/command-discovery-2026-06-04.md`.
- `fixture_alias_registry_ref` is recorded and resolves to a parseable YAML registry with 45 fixture rows; VG-045 proof is at `state/validations/VG-045-2026-06-04.md`.
