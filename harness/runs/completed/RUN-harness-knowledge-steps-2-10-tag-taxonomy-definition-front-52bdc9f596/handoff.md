# Handoff

## Summary
Documented and implemented the Knowledge Card Model across the harness:

### Design (atelier product-spec)
- Replaced old Knowledge Metadata with Knowledge Card Model (6.3)
- Added Dendritic Patterns (6.4), Tag Taxonomy (6.5), Resolution Trace (6.6)
- Updated Context Selection Algorithm (9)
- Updated Validation Items (15)

### Implementation
- Tag migration: 78 knowledge files tagged with prefixed tags
- Role selector update: 12 roles converted to require_all/require_any/exclude
- Context Compiler update: new selector parsing, tag matching, trace output

### Key Decisions
- Tags use prefix:value format (domain:site, kind:rule, subject:auth, etc.)
- Selectors use require_all (AND) / require_any (OR) / exclude (NOT)
- affordances.declared as author hint (not hard gate)
- read_when/skip_when deprecated in favor of conditions.deterministic/semantic

## Files Changed
- harness/knowledge/product-specs/atelier/README.md (Knowledge Card Model)
- product/apps/atelier/src/core/context.ts (Context Compiler)
- 78 knowledge files under harness/knowledge/ (tag migration)
- 12 role files under harness/actions/roles/ (selector format)

## Next Steps
1. Implement Relation Resolver (Step 7) - require_context/inherit resolution
2. Add Validator (Step 8) - frontmatter schema validation
3. Implement Affordance Pipeline (Step 9) - declared/inferred/accepted
4. Meta-workflow harnessization (Step 10)
