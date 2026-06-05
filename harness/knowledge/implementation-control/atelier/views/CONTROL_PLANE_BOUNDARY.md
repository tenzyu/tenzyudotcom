<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

# Control-Plane Boundary

This view makes the **Project vs Artifacts** boundary explicit and the dependency direction unambiguous.

## Boundary rule

```
product-specs/atelier  →  [compiler]  →  canonical/* (artifacts)
                                          ↑
canonical/* (project seed, manual_control_record) — feed
                                          ↓
                                       long-run
```

- **Project seed** (manual_control_record): hand-curated, declares what to compile.
- **Artifacts** (deterministic_fact, llm_extracted): compiled by CLI; LLM may propose via `llm:jobs`/`llm:accept`.
- **No circular dependency**: project seed → compiler → artifacts → ready audit. Artifacts do **not** mutate project seed.

## Project seed (manual_control_record)

| File | Records | Role |
| | ---: | |
| canonical/dag.yaml | 7 | Implementation DAG (manual plan) |
| canonical/gates.yaml | 11 | Validation gates (manual plan) |
| canonical/fixtures.yaml | 26 | Test fixtures (manual plan) |
| canonical/validation-profiles.yaml | 7 | Validation profiles (manual plan) |
| canonical/edit-boundaries.yaml | — | File-edit boundaries |
| canonical/roles.yaml | — | Subagent roles |
| canonical/scope.yaml | 2 | Active-scope policy |

These are the **inputs** to the compiler. They declare `provenance_kind: manual_control_record`.

## Compiled artifacts (deterministic_fact / llm_extracted)

| File | Provenance | Source |
| | | |
| canonical/spec-sections.ndjson | deterministic_fact | product-specs (compile) |
| canonical/source-classifications.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/assertions.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/definitions.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/non-goals.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/risks.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/open-questions.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/assertion-links.ndjson | deterministic_fact | assertions + DAG + gates (control:link) |
| canonical/product-spec-manifest.json | deterministic_fact | product-specs (compile) |
| canonical/bootstrap-facts.json | deterministic_fact | repo (derive:bootstrap) |
| canonical/repository-shape.json | deterministic_fact | repo (derive:bootstrap) |
| canonical/project-brief.yaml | deterministic_fact | 5 sample files (derive:brief) |
| canonical/control-graph.yaml | deterministic_fact | project seed (derive:control) |
| canonical/routes.yaml | deterministic_fact | project seed (derive:control) |
| canonical/packet-templates.yaml | deterministic_fact | project seed (derive:control) |

## Dependency direction

```
compile        ← product-specs
derive:deep    ← spec-sections.ndjson
derive:control ← project seed + assertions
control:link   ← assertions + project seed
ready          ← scope + all artifacts
```

The compiler never reads its own output. Project seed is read-only. Artifacts flow forward.
