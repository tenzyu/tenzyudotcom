# LLM Job: Extract Normative Assertions

job_id: assertions-spec-event_model-8bc1496c30
kind: assertions
source_section_id: SPEC-EVENT_MODEL-8BC1496C30
source_path: harness/knowledge/product-specs/atelier/EVENT_MODEL.md
heading_path: Atelier Event Model > 4. Payload Invariants

## Input Section

```markdown
## 4. Payload Invariants

Each event type declares a minimum payload. Implementations may add fields; required fields must be present.

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

### 4.3 Artifact and Graph Events

```txt
artifact_moved            { artifact_id, from_path, to_path, content_hash }
artifact_superseded       { old_artifact_id, new_artifact_id, kind }
artifact_accepted         { artifact_id, accepted_by, accepted_at, evidence_refs, scope, expires_at? }
artifact_rejected         { artifact_id, rejected_by, rejected_at, reason, evidence_refs }
artifact_stale_detected   { artifact_id, stale_reason, detected_at }
artifact_stale_retired    { artifact_id, retired_at, retired_by }

graph_hash_computed       { graph_hash, computed_at, fixture_id? }
graph_authority_conflict_resolved { winner_artifact_id, loser_artifact_id, resolution }
graph_endpoint_compatibility_violation { source_id, target_id, edge_kind, reason }
```

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
