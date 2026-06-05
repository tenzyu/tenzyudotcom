# LLM Job: Extract Normative Assertions

job_id: assertions-spec-examples-b6cf4444a9
kind: assertions
source_section_id: SPEC-EXAMPLES-B6CF4444A9
source_path: harness/knowledge/product-specs/atelier/EXAMPLES.md
heading_path: Atelier Examples > Example 2: Verification and Completion States > Scenario D: Required Missing

## Input Section

```markdown
### Scenario D: Required Missing

Fixture id: `example_2_required_missing`.

`chk.identity.location` has no verification record. Missing required evidence is a hard block.

```yaml
records:
  required:
    chk.identity.primary:   { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.secondary: { status: passed, evidence_artifact_refs: [GRAPH_SEMANTICS.md#3.1] }
    chk.identity.location:  { status: not-run }
gate:
  all_required_passed:                     false
  all_required_resolved:                   false
  any_required_skipped_or_unavailable:     false
  required_unavailable_blocking:           false
  hard_block:                              true
  prior_state:                             resumed
  user_force_close:                        false
  consequence:                             run_blocked_terminal
  event:                                   run_blocked_terminal
  hard_block_source:                       required_check_not_run:chk.identity.location
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
