---
schema: harness/v1
kind: phase
id: phase.verification
title: Verification
status: active
summary: Record validation evidence and skipped checks for a run.
tags:
  - harness
  - phase
  - verification
---

# Phase: Verification

Verification proves that the run requirements were checked with relevant evidence.

## Primary perspective

Verifier. This is a phase responsibility, not a standalone role.

## Output

Create or update:

```txt
verification.md
```

Use `../artifacts/templates/verification.md` when creating a new verification file.

## Required sections

- commands run
- command results
- files inspected
- role knowledge checked
- visual checks performed, when relevant
- tests added or not added
- skipped checks and justification
- failures and follow-up recommendations
- conclusion

## Rules

- Use Nx through Bun for build, test, lint, typecheck, and verify work.
- Run the narrowest relevant checks first.
- For broad changes, run broad checks when practical.
- Commands must map to run requirements.
- If a command fails before testing the change, record the failure exactly.
- Manual checks must be described when automation is insufficient.
- Do not hide failures.
- Do not claim completion from a proxy signal that does not cover the requirements.

## High-risk verification

When verification is high-risk, assign `../roles/core/reviewer.md` separately.
