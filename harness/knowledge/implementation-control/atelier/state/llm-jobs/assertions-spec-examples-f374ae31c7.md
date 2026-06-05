# LLM Job: Extract Normative Assertions

job_id: assertions-spec-examples-f374ae31c7
kind: assertions
source_section_id: SPEC-EXAMPLES-F374AE31C7
source_path: harness/knowledge/product-specs/atelier/EXAMPLES.md
heading_path: Atelier Examples > Example 1: Context Plan and Resolution Decisions > Step 5: Required Verification Map (Co-Emitted)

## Input Section

```markdown
### Step 5: Required Verification Map (Co-Emitted)

The context plan co-emits a required verification map per `VERIFICATION_SCHEMA.md` §3. In v5.1 the map is the closure of acceptance criteria and registry bindings for the task's path scope and role. The policy registry term is a Phase C placeholder and contributes zero entries until a policy schema exists.

```yaml
required_verification_map:
  - check_id:   chk.identity.primary-present
    required:   true
    blocking:   true
    source:     task_acceptance_criteria
  - check_id:   chk.identity.secondary-present
    required:   true
    blocking:   true
    source:     task_acceptance_criteria
  - check_id:   chk.identity.location-decoupled
    required:   true
    blocking:   true
    source:     check_registry.binding(task=implementation, path=GRAPH_SEMANTICS.md)
  - check_id:   chk.identity.ephemeral-documented
    required:   false
    blocking:   false
    source:     check_registry.binding(task=implementation, path=GRAPH_SEMANTICS.md)
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
