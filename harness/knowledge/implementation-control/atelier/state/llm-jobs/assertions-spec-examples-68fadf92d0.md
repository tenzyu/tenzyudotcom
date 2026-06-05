# LLM Job: Extract Normative Assertions

job_id: assertions-spec-examples-68fadf92d0
kind: assertions
source_section_id: SPEC-EXAMPLES-68FADF92D0
source_path: harness/knowledge/product-specs/atelier/EXAMPLES.md
heading_path: Atelier Examples > Example 2: Verification and Completion States > Scenario B: Required Unavailable Defaults to Dirty

## Input Section

```markdown
### Scenario B: Required Unavailable Defaults to Dirty

Fixture id: `example_2_required_unavailable_default_dirty`.

`chk.identity.location` is required and unavailable, but its declaration uses the default `unavailable_effect=dirty`.

```yaml
records:
  required:
    chk.identity.primary:   { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location:
      status: unavailable
      unavailable_reason_code: runner_unavailable
gate:
  all_required_passed:                     false
  all_required_resolved:                   true
  any_required_skipped_or_unavailable:     true
  required_unavailable_blocking:           false
  hard_block:                              false
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             completed_dirty
  event:                                   run_completed_dirty
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
