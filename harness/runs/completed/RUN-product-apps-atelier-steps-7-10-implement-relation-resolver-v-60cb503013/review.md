# Review
## Summary
Steps 7-10 implementation review.

### Step 7 (Relation Resolver)
- resolveRelations() with worklist for transitive expansion
- Inheritance: base injection before child, tag inheritance, depth check (warn at 3+)
- require_context: full (re-evaluate), summary (inject), reference (trace only)
- require_constant, require_decision, conflicts, related all handled
- Fixed conditionalPhaseIds to respect explicit conditional_phases: []

### Step 8 (Validator)
- addKnowledgeCardDiagnostics() adds 8 new checks
- All 64 tests pass

### Step 9 (Affordance Pipeline)
- Heuristic suggestAffordances() with 7 pattern types
- Trace entries enriched with affordances.declared/inferred/accepted
- checkAffordances() public API

### Step 10 (Meta-workflow)
- workflow.design-session with 5 required phases
- phase.design-direction (trade-off analysis)
- phase.design-detailing (detailed design specs)

### Test Results
64/64 pass, doctor works on 318 documents, context plan generates correctly
