# LLM Job: Extract Normative Assertions

job_id: assertions-spec-verification_schema-cfcb99a7d3
kind: assertions
source_section_id: SPEC-VERIFICATION_SCHEMA-CFCB99A7D3
source_path: harness/knowledge/product-specs/atelier/VERIFICATION_SCHEMA.md
heading_path: Atelier Verification Schema > 3. Required Verification Map Derivation

## Input Section

```markdown
## 3. Required Verification Map Derivation

The required verification map of a task is the set of checks that must resolve to `passed` for the task to be eligible for `completed_clean`. The map is derived, not invented.

```txt
required_verification_map(task) =
  task_acceptance_criteria
  union  check_registry.bindings(task.kind, task.path_scope)
  union  policy_registry.phase_c_placeholder(task.kind, task.path_scope, task.role)
      # Phase C placeholder. Contributes zero entries in v5.1. The
      # policy_registry term is a placeholder until POLICY_SCHEMA.md
      # exists. See contract.md §5.5 for the Phase C marker.
  filter applicable_paths intersects task.path_scope
  filter applicable_roles intersects task.role
  filter status == active
```

The map is a closed set at task creation time. Adding a check to the map after task creation requires a new `task_assigned` event with reason `verification_map_extended` and a new acceptance event binding the added check to the task.

A required check whose verification record is in any state other than `passed`, `skipped-with-reason`, or `unavailable-with-reason` is unresolved. An unresolved required check contributes to `hard_block`.

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
