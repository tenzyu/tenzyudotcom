# LLM Job: Extract Normative Assertions

job_id: assertions-spec-contract-5a64ee1bf2
kind: assertions
source_section_id: SPEC-CONTRACT-5A64EE1BF2
source_path: harness/knowledge/product-specs/atelier/contract.md
heading_path: Atelier Contract > 13a. Adapter Parity Invariant

## Input Section

```markdown
## 13a. Adapter Parity Invariant

The Runtime Adapter Plane must satisfy the following invariants. The detailed adapter behavior is in `ADAPTER_CONTRACT.md`.

- At least two real runtime adapters must pass the canonical packet through the runtime parity fixture defined in `ADAPTER_CONTRACT.md` §7 and verified by `adapter_runtime_parity_fixture` in `CONTRACT_TEST_MATRIX.md` §2.7.
- No adapter may persist state outside the canonical packet, the canonical result, and the run record.
- No adapter may invent verification records.
- No adapter may alias a removed command.
- The adapter runtime parity invariant is the proof of runtime agnosticism. A claim of runtime agnosticism without a passing `adapter_runtime_parity_fixture` is a marketing claim, not a contract claim.

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
