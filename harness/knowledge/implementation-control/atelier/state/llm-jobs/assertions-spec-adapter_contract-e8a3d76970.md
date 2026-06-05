# LLM Job: Extract Normative Assertions

job_id: assertions-spec-adapter_contract-e8a3d76970
kind: assertions
source_section_id: SPEC-ADAPTER_CONTRACT-E8A3D76970
source_path: harness/knowledge/product-specs/atelier/ADAPTER_CONTRACT.md
heading_path: Atelier Adapter Contract > 8. Adapter Inventory Stages > 8.0 Stage 0: Generic Export (required for MVP)

## Input Section

```markdown
### 8.0 Stage 0: Generic Export (required for MVP)

```txt
Scope:
  - Generic human/shell adapter.
  - Emits a markdown handoff and a shell command list.
  - No runtime-specific packet.

Done when:
  - The generic adapter passes `adapter_packet_portability_fixture`
    against a no-op reference adapter.
  - The generic adapter is the first adapter shipped.
  - The no-op reference adapter is itself a registered adapter with its own
    capability descriptor and version.
  - The `packet_portability_claim` may be made as a contract claim.

Notes:
  - The no-op reference adapter is a schema fixture, not a second runtime.
  - Stage 0 does NOT establish runtime agnosticism against real agent runtimes.
  - For runtime agnosticism, see §7.2 and Stage 1 (Phase 2A-2C in ROADMAP.md).
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
