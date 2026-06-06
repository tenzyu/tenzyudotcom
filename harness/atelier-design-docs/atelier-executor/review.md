# REVIEW: atelier-executor

## P0 fail conditions

- Packet completes without runtime-backed evidence.
- Evidence does not correspond to the referenced TestContract.
- Unrelated command output satisfies a contract.
- Blocked/empty/nonexistent TestContract can be completed.
- Duplicate packet lifecycle current state is possible.
- Executor writes outside allowed files.

## Required proof

Reviewer should verify:

```txt
1. packet lifecycle reducer produces one current state per packet
2. completion rejects missing/invalid evidence
3. passed evidence includes runtime proof
4. evidence maps to packet and test contract
5. handoff schema rejects prose-only reports
```
