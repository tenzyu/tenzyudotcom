# LLM Job: Extract Normative Assertions

job_id: assertions-spec-contract_test_matrix-8a1bfd23b4
kind: assertions
source_section_id: SPEC-CONTRACT_TEST_MATRIX-8A1BFD23B4
source_path: harness/knowledge/product-specs/atelier/CONTRACT_TEST_MATRIX.md
heading_path: Atelier Contract Test Matrix > 2a. Tests Added in v5 > 2a.3 Required Verification Map Derivation Fixture

## Input Section

```markdown
### 2a.3 Required Verification Map Derivation Fixture

```yaml
test_name:   required_verification_map_derivation_fixture
covers:      VERIFICATION_SCHEMA.md §3
fixture:     verification_map_derivation_v1
purpose: |
  Verify that the required verification map of a task is derived from
  task acceptance criteria and check registry bindings, and is not
  invented by the context planner. The policy registry term contributes
  zero entries in v5.1 until a policy schema exists.
assertions:
  - map = task_acceptance_criteria union check_registry.bindings
  - policy registry contribution is the empty set in v5.1
  - map is filtered by applicable_paths intersects task.path_scope
  - map is filtered by applicable_roles intersects task.role
  - map is filtered by check.status == active
  - map is closed at task creation time
  - extending the map after task creation emits
    verification_map_extended event
```

```

## Output Contract

Return JSONL only. Each line must match:

{
  "source_section_id": "string",
  "text": "string",
  "modality": "must | must_not | should | invariant | definition",
  "domain": "graph | verification | event | adapter | surface | hpo | run | write_authority | product | positioning | roadmap | other",
  "testability": "executable | oracle_gap | semantic_review | non_goal",
  "severity": "P0 | P1 | P2",
  "closed_terms": ["string"],
  "ambiguity_status": "clear | ambiguous | conflicting",
  "notes": "string"
}
