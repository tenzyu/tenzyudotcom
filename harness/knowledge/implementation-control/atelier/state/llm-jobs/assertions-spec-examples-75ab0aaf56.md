# LLM Job: Extract Normative Assertions

job_id: assertions-spec-examples-75ab0aaf56
kind: assertions
source_section_id: SPEC-EXAMPLES-75AB0AAF56
source_path: harness/knowledge/product-specs/atelier/EXAMPLES.md
heading_path: Atelier Examples > Example 2: Verification and Completion States > Scenario A: Clean Completion (All Required Passed)

## Input Section

```markdown
### Scenario A: Clean Completion (All Required Passed)

Fixture id: `example_2_clean_completion`.

All required checks pass. The optional check is unavailable, which is reported as a warning and does not dirty the required verification state.

```yaml
records:
  required:
    chk.identity.primary:   { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location:  { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
  optional:
    chk.identity.ephemeral:
      status: unavailable
      unavailable_reason_code: tool_not_installed
```

Completion evaluation:

```yaml
gate:
  all_required_passed:                     true
  all_required_resolved:                   true
  any_required_skipped_or_unavailable:     false
  required_unavailable_blocking:           false
  hard_block:                              false
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             completed_clean
  event:                                   run_completed_clean
  emitted_at:                              "2026-06-04T12:05:00Z"
  hard_block_source:                       null
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
