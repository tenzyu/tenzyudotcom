# Workflow: Review Change

Use this workflow for independent review of an existing diff or completed run.

## Required phases

- `../parts/phases/review.md`
- `../parts/phases/verification.md`, when validation evidence is missing or suspicious
- `../parts/phases/handoff.md`, when review produces follow-up work

## Required inputs

- task brief or request
- changed file list or diff
- verification evidence
- handoff draft, if present
- relevant knowledge and policies

## Output

Create or update:

```txt
review.md
```

## Recommendation

End with exactly one of:

- approve
- request changes
- block

Do not rubber-stamp unverified work.
