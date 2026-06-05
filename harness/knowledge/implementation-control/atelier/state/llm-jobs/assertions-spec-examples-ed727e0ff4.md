# LLM Job: Extract Normative Assertions

job_id: assertions-spec-examples-ed727e0ff4
kind: assertions
source_section_id: SPEC-EXAMPLES-ED727E0FF4
source_path: harness/knowledge/product-specs/atelier/EXAMPLES.md
heading_path: Atelier Examples > Example 2: Verification and Completion States > Scenario C: Required Unavailable Blocking

## Input Section

```markdown
### Scenario C: Required Unavailable Blocking

Fixture id: `example_2_required_unavailable_blocking`.

`chk.identity.secondary` is required and unavailable. Its declaration explicitly sets `unavailable_effect=blocked`, so the run becomes terminal blocked.

```yaml
records:
  required:
    chk.identity.primary:  { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary:
      status: unavailable
      unavailable_reason_code: environment_unavailable
gate:
  all_required_passed:                     false
  all_required_resolved:                   true
  any_required_skipped_or_unavailable:     true
  required_unavailable_blocking:           true
  hard_block:                              true
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             run_blocked_terminal
  event:                                   run_blocked_terminal
  hard_block_source:                       required_unavailable_blocking:chk.identity.secondary
```

No `run_completed_*` event is emitted. The run is terminal at `run_blocked_terminal`. The HPO state projection is `blocked_terminal`, not `run_blocked_terminal`.

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
