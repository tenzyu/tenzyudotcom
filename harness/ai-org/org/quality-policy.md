# Quality Policy

Quality means satisfying the task requirements with evidence, not merely
producing a plausible diff.

## Completion Standard

A task is complete only when:

- every acceptance criterion is satisfied or explicitly deferred by the human owner
- relevant validation has run or skipped checks are justified
- package and architecture boundaries are respected
- public API impact is documented
- `verification.md` records commands and results
- `handoff.md` records what changed, why, risks, and follow-ups
- durable memory updates are made or explicitly marked unnecessary

## Review Standard

Reviewer context should be separate from implementer context where practical.
Reviewers check:

- requirement satisfaction
- scope violations
- regressions and deleted behavior
- package boundary violations
- public API breakage
- missing tests, stories, or documentation
- maintenance risk
- workaround risk

## Evidence Standard

Evidence can include command output, file inspection, screenshots, Storybook
inspection, diff review, or explicit task artifacts. Proxy signals are not
enough by themselves.
