# Workflow: Review Change

Use this workflow for independent review of an existing diff or completed run.

## Role assignment

Required:

```txt
primary: roles/core/reviewer.md
```

Add the relevant domain role when domain-specific knowledge is needed.

## Required phases

- `../phases/review.md`
- `../phases/verification.md`, when validation evidence is missing or suspicious
- `../phases/handoff.md`, when review produces follow-up work

## Required inputs

- run brief or request
- changed file list or diff
- verification evidence
- handoff draft, if present
- assigned role knowledge and policies

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
