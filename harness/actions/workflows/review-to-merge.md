# Workflow: Review To Merge

Use this workflow after review findings are available.

## Role assignment

Use the role that owns the fix area. Keep `roles/core/reviewer.md` available for final confirmation when findings were blocking.

## Steps

1. Address required findings or document why they need human decision.
2. Re-run validation that covers changed areas.
3. Update `verification.md`.
4. Update `handoff.md`.
5. Confirm migration and release notes, if needed.

## Rules

- Do not merge with unresolved blocking findings.
- Do not treat reviewer approval as a replacement for verification evidence.
- Do not hide follow-up work inside the merge.
