# LLM Job: Extract Normative Assertions

job_id: assertions-spec-graph_semantics-081b3656a4
kind: assertions
source_section_id: SPEC-GRAPH_SEMANTICS-081B3656A4
source_path: harness/knowledge/product-specs/atelier/GRAPH_SEMANTICS.md
heading_path: Atelier Graph Semantics > 4. Node Schema > 4.1 Required Fields

## Input Section

```markdown
### 4.1 Required Fields

```txt
id:         string  (primary or secondary identity per §3)
kind:       enum    (one of the canonical kinds; see §4.4)
class:      enum    (source | accepted_durable_evidence | derived)
path:       string  (repository-relative; null for purely ephemeral)
hash:       string  (content hash of canonical form)
owner:      string  (role or actor identifier)
authority:  integer (level on the scale in §7; not all kinds carry graph authority)
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
