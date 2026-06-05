# REVIEW_LEDGER.md

## Purpose

Track reviewer findings for Atelier bootstrap scope. Apology-driven local patches are forbidden. A fix is incomplete until the bad state is mechanically prevented, mechanically detected, or explicitly recorded as unresolved.

## Issue format

Each issue is a block with these fields:

```txt
id:
status: open | closed
class:
evidence:
required_fix:
verification:
```

Field guidance:

- `id`: short stable identifier, for example `RL-0001`.
- `status`: `open` while the issue blocks completion; `closed` only after `verification` is satisfied.
- `class`: one of `mechanism`, `schema`, `validator`, `generator`, `agent-instruction`, `acceptance`, `other`.
- `evidence`: file paths, command output, or commit references that prove the bad state.
- `required_fix`: the mechanism change that prevents or detects the bad state.
- `verification`: the command, check, or condition that proves the fix.

## Open issues

(none)

## Closed issues

(none)
