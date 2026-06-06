# REVIEW: atelier-transformer

## P0 fail conditions

- Transformer creates tasks from path heuristics only.
- Ready task lacks accepted relation trace.
- Ready TestContract is empty, blocked, or points to nonexistent tests.
- Allowed/forbidden boundaries conflict.
- Packet requires broad repository exploration.
- Product specs or design docs are writable implementation targets.
- Toy/sample task is used as operational proof.

## Required proof

Reviewer should verify:

```txt
1. at least one task derives from accepted relation(s)
2. source anchors and relation ids are preserved
3. test contract is non-empty and executable or explicitly blocked
4. packet template has no broad search requirement
5. allowed/forbidden files are non-conflicting
```
