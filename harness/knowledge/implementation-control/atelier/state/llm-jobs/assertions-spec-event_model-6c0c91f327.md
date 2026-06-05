# LLM Job: Extract Normative Assertions

job_id: assertions-spec-event_model-6c0c91f327
kind: assertions
source_section_id: SPEC-EVENT_MODEL-6C0C91F327
source_path: harness/knowledge/product-specs/atelier/EVENT_MODEL.md
heading_path: Atelier Event Model > 4. Payload Invariants > 4.2 Run Events

## Input Section

```markdown
### 4.2 Run Events

```txt
run_created            { run_id, task_id, packet_id, runtime, adapter_id }
run_resumed            { run_id, resumed_at, resume_reason }
handoff_appended       { run_id, append_text, appender }
verification_recorded  { run_id, check_id, status, evidence_refs, recorded_at, recorded_by }
run_blocked_waiting    { run_id, reason, expected_resolution, terminal: false }
run_blocked_terminal   { run_id, reason, hard_block_source, terminal: true }
run_unblocked          { run_id, resolution, prior_state: blocked_waiting }
run_completed_clean    { run_id, completed_at, required_passed, optional_summary }
run_completed_dirty    { run_id, completed_at, dirty_reasons, evidence_refs }
run_forced_closed      { run_id, reason, forced_by, forced_at, prior_state: run_blocked_terminal }
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
