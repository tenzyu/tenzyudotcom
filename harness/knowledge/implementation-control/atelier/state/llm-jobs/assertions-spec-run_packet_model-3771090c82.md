# LLM Job: Extract Normative Assertions

job_id: assertions-spec-run_packet_model-3771090c82
kind: assertions
source_section_id: SPEC-RUN_PACKET_MODEL-3771090C82
source_path: harness/knowledge/product-specs/atelier/RUN_PACKET_MODEL.md
heading_path: Atelier Run Packet Model > 4. Handoff Promotion Invariant

## Input Section

```markdown
## 4. Handoff Promotion Invariant

```txt
working handoff under .atelier/runs/** = derived
exported handoff outside .atelier/ = source candidate
accepted handoff outside .atelier/ = accepted durable evidence
terminal verification summary outside .atelier/ = accepted durable evidence
```

Adapters may produce handoff candidates. Adapters must not promote handoffs to accepted durable evidence implicitly.

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
