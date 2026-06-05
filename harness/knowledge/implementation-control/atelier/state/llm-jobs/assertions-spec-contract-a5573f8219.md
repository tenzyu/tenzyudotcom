# LLM Job: Extract Normative Assertions

job_id: assertions-spec-contract-a5573f8219
kind: assertions
source_section_id: SPEC-CONTRACT-A5573F8219
source_path: harness/knowledge/product-specs/atelier/contract.md
heading_path: Atelier Contract > 8a. Transform Transition Rules > 8a.3 Required Evidence per Transition

## Input Section

```markdown
### 8a.3 Required Evidence per Transition

```txt
0 -> 1: source artifact presence and identity.
1 -> 2: candidate rule and target kind.
2 -> 3: draft artifact, content hash, source section reference.
3 -> 4: accepting actor, acceptance evidence, receipt id.
4 -> 5: deterministic output schema, content hash, path in durable location.
5 -> 6: enforcement mechanism, severity, registration actor.
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
