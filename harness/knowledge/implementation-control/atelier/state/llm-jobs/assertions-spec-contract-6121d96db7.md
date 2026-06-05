# LLM Job: Extract Normative Assertions

job_id: assertions-spec-contract-6121d96db7
kind: assertions
source_section_id: SPEC-CONTRACT-6121D96DB7
source_path: harness/knowledge/product-specs/atelier/contract.md
heading_path: Atelier Contract > 6. Artifact Graph Contract (Invariant)

## Input Section

```markdown
## 6. Artifact Graph Contract (Invariant)

The Artifact Graph is the central mechanism of the product. Its kernel is defined in `GRAPH_SEMANTICS.md`.

Atelier must treat project-relevant artifacts as graph nodes and relations as graph edges.

Invariants:

- Node identity, edge identity, edge direction, allowed endpoint kinds, hash rules, determinism rules, regeneration rules, and stale detection rules are defined in `GRAPH_SEMANTICS.md`. This contract defers to that document.
- The graph must support source artifacts and derived artifacts.
- The graph must support provenance.
- The graph must be deterministic for unchanged input.
- The graph must be regenerable from repository artifacts plus documented external inputs.
- A reproduction of the graph from a committed fixture must produce a byte-identical graph hash. The golden fixture is described in `CONTRACT_TEST_MATRIX.md` §2.1.

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
