# LLM Job: Extract Normative Assertions

job_id: assertions-spec-event_model-0e8623196a
kind: assertions
source_section_id: SPEC-EVENT_MODEL-0E8623196A
source_path: harness/knowledge/product-specs/atelier/EVENT_MODEL.md
heading_path: Atelier Event Model > 4. Payload Invariants > 4.1 Task Events

## Input Section

```markdown
### 4.1 Task Events

```txt
task_created       { task_id, title, description, phase, scope, parent_task_id }
task_assigned      { task_id, role_id, agent_name }
task_split         { task_id, children: [task_id, ...] }
task_blocked       { task_id, reason, expected_resolution }
task_unblocked     { task_id, resolution }
task_closed        { task_id, outcome: completed|cancelled, accepted_by, evidence_refs }
task_assignee_changed { task_id, from_actor, to_actor, reason }
verification_map_extended { task_id, added_check_ids: [...], reason }
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
