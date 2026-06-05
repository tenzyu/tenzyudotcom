# LLM Job: Extract Normative Assertions

job_id: assertions-spec-event_model-7ebb5e97ce
kind: assertions
source_section_id: SPEC-EVENT_MODEL-7EBB5E97CE
source_path: harness/knowledge/product-specs/atelier/EVENT_MODEL.md
heading_path: Atelier Event Model > 4. Payload Invariants > 4.4 Policy Events

## Input Section

```markdown
### 4.4 Policy Events

```txt
policy_decision_emitted   { decision_id, policy_id, subject_id, severity, reason, emitted_by, evidence_refs, active }
policy_decision_revoked   { decision_id, revoked_by, revoked_at, reason }
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
