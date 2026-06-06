# REVIEW: atelier-operation

## P0 fail conditions

- `atelier:ready` passes from scaffold existence.
- Relation graph has only `contains` edges.
- Ready path does not require anchors and accepted relations.
- Ready path allows empty/blocked TestContracts.
- Ready path allows evidence without runtime proof.
- Ready path allows unrelated evidence to satisfy a contract.
- Sample validation feeds operational pass.
- Reviewer cannot distinguish pass/fail/blocker with machine-readable defects.

## Required proof

Reviewer should verify:

```txt
1. ready fails before invariants are satisfied
2. verify reports precise defects
3. pass requires relation-kernel behavior, not view generation
4. open questions are surfaced as blocked only when user/product-author input is required
```
