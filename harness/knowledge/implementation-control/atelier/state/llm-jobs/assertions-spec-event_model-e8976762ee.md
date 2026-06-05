# LLM Job: Extract Normative Assertions

job_id: assertions-spec-event_model-e8976762ee
kind: assertions
source_section_id: SPEC-EVENT_MODEL-E8976762EE
source_path: harness/knowledge/product-specs/atelier/EVENT_MODEL.md
heading_path: Atelier Event Model > 4. Payload Invariants > 4.3 Artifact and Graph Events

## Input Section

```markdown
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
