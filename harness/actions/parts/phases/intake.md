# Phase: Intake

Intake converts a human problem into a bounded run.

This phase absorbs the old one-off `chief-of-staff` and `task-intake-agent` role responsibilities. It is a phase, not a reusable role.

## Primary perspective

Intake coordinator.

## Required outputs

- run folder when the work is non-trivial
- `brief.md`
- role selection
- allowed files
- forbidden files
- non-goals
- validation plan
- acceptance criteria
- explicit open questions or assumptions

## Required sections for `brief.md`

- title
- background
- problem
- goal
- scope
- allowed files
- forbidden files
- non-goals
- constraints
- role assignment
- worktree isolation need
- validation commands
- acceptance criteria
- risks
- open questions

## Quality gates

- Scope is small enough to review.
- Acceptance criteria are testable.
- Allowed and forbidden files are explicit.
- Validation commands are named.
- Human-owned decisions are identified.
- ADR-relevant decisions are escalated to the owner.

## Rules

- Do not start broad implementation from a vague request.
- Ask for human decisions only when the scope cannot be bounded safely.
- Mark assumptions explicitly.
- Prefer a small first run over a broad rewrite.
- If an ADR-relevant decision is needed, interview the owner before implementation.
- If the request is trivial documentation or formatting, a lightweight brief in the worklog or handoff is enough.
- For non-trivial mutable work, apply `worktree-isolation.md` before implementation or parallel AI handoff.
