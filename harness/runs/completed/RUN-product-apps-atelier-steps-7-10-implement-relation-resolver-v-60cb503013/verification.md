# Verification

## Completed Steps

### Step 7: Relation Resolver
- Added `resolveRelations()` function to context.ts
- Handles `pattern: inheritance` → `relations.inherit` base injection with depth checking
- Handles `relations.require_context` with mode: full/summary/reference
- Handles `require_constant`, `require_decision`, `conflicts`, `related`
- Worklist-based transitive resolution with cycle avoidance
- Trace entries with relation resolution info
- Fixed `conditionalPhaseIds` to properly handle explicit empty `conditional_phases: []`

### Step 8: Validator
- Added `addKnowledgeCardDiagnostics()` to doctor.ts
- Valid pattern field values (simple, conditional, inheritance, collector, constants, fragment, factory, multi-context)
- Tag format check (prefix:value format via regex)
- Pattern-specific requirements (inheritance→relations.inherit, conditional→conditions, collector→require_context)
- affordances.declared presence check
- id namespace vs domain tag consistency check
- criticality:fatal coverage check

### Step 9: Affordance Pipeline
- Added `suggestAffordances()` heuristic function to knowledge.ts
- Added `checkAffordances()` public function for CLI/tooling
- Affordance patterns: migration-candidate, check-candidate, context, skill-candidate, adr-candidate, implementation-reference, design-guideline
- Trace enrichment with affordances.declared/inferred/accepted

### Step 10: Meta-workflow
- Created `workflows/design-session.md` — Problem→Direction→Design→Implementation→Close workflow
- Created `phases/design-direction.md` — direction exploration and trade-off analysis phase
- Created `phases/design-detailing.md` — detailed design specification phase

## Test Results
- `bun test`: 64 pass, 0 fail
- `atelier doctor`: 318 documents, Knowledge Card diagnostics running
- `atelier context plan --workflow workflow.design-session`: Works correctly

## Files Changed
- product/apps/atelier/src/core/context.ts: Relation resolver, phase logic fix, trace enrichment
- product/apps/atelier/src/core/doctor.ts: Knowledge Card validation
- product/apps/atelier/src/core/knowledge.ts: Affordance suggestion, recordOf helper
- product/apps/atelier/src/core/schema.ts: New DiagnosticCode values
- harness/actions/workflows/design-session.md: New workflow
- harness/actions/phases/design-direction.md: New phase
- harness/actions/phases/design-detailing.md: New phase
