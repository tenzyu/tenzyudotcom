# REVIEW: atelier-reader

## P0 fail conditions

- Reader emits only prose summaries and no schema-bound objects/proposals.
- AttentionSet is empty but treated as sufficient.
- LLM-derived relation is accepted as fact without an accept/review path.
- RelationProposal lacks source anchors/source refs.
- Deep read reads broad repository context by default.
- Reader output is used directly as packet truth without transformer/operation validation.

## Required proof

Reviewer should verify:

```txt
1. at least one non-empty task-scoped AttentionSet exists
2. selected anchors are traceable to indexer anchors
3. at least one RelationProposal exists for a real task
4. proposals are not execution truth until accepted
5. unresolved/gap state is explicit when context is insufficient
```
