# Workflow: Run To PR

Move a completed or nearly completed run into a reviewable pull request.

## Role assignment

Use:

- primary: role that owns the changed domain
- support: `roles/governance/release-manager.md` when rollout, packaging, or public API risk exists
- review: `roles/core/reviewer.md` when not already reviewed

## Required inputs

- run folder
- changed file list
- verification evidence
- handoff
- review, when available

## Required PR contents

- linked run ID
- problem
- goal
- summary of changes
- affected files and packages
- validation commands and results
- screenshots or Storybook references for UI changes
- public API impact
- migration notes, if needed
- risk assessment
- follow-up tasks

## Rules

- The PR must match the run scope.
- Handoff and verification must be complete before requesting review.
- Public API, release, and migration impact must be explicit.
