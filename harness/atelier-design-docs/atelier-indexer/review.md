# REVIEW: atelier-indexer

Reviewer must fail the indexer if any P0 condition is true.

## P0 fail conditions

- No first-class SourceAnchor or equivalent exists.
- Source anchors are path-only when narrower deterministic anchors are possible.
- `edges.ndjson` contains only `contains` relations after relation indexing.
- Relation endpoints are not validated.
- Build artifacts are included as normal source/attention/transform candidates.
- `validate` is sample-based instead of strict full validation.
- Affected propagation uses broad text search instead of relation traversal where relations exist.

## Required proof

Reviewer should verify:

```txt
1. file anchors exist
2. at least one narrower anchor kind exists
3. at least one accepted non-contains deterministic relation exists
4. relation endpoints resolve
5. changed anchors can mark dependent records stale
6. build artifacts are excluded by default
```
