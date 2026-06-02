# Phase: Review

Review checks the diff, run artifacts, and verification evidence.

## Output

Create or update:

```txt
review.md
```

Use `../artifacts/templates/review-report.md` when creating a new review file.

## Required inputs

- run brief or request
- assigned roles
- plan, when present
- diff or changed file list
- verification evidence
- handoff draft, when present
- relevant knowledge, policies, and domain role constraints

## Checks

- requirement satisfaction
- scope compliance
- role constraint compliance
- package boundary compliance
- public API impact
- regression risk
- missing tests, stories, or docs
- verification quality
- handoff quality
- residual risk

## Recommendation

End with one of:

- approve
- request changes
- block

## Rules

- Do not rubber-stamp unverified work.
- Check requirements against the brief, not intent.
- Separate correctness issues from style suggestions.
- Call out missing tests or skipped checks.
- Do not rewrite the implementation during review unless explicitly assigned.
