# Phase: Intake

Intake converts a human request into a bounded run.

## Primary perspective

Intake coordinator. This is a phase responsibility, not a standalone role.

## Output

Create or update:

```txt
brief.md
```

Use `../artifacts/templates/task.md` when creating a new brief.

## Required sections

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
- worktree isolation expectation
- validation commands
- acceptance criteria
- risks
- open questions

## Role assignment

Assign the smallest safe role set:

- primary role: owns the domain or main concern
- supporting roles: only when their knowledge bundle is needed
- reviewer role: for non-trivial or risky changes
- governance role: for cost, release, or policy concerns

## Rules

- Do not start broad implementation from a vague request.
- Ask for human decisions only when the scope cannot be bounded safely.
- Mark assumptions explicitly.
- Prefer a small first run over a broad rewrite.
- If an ADR-relevant decision is needed, interview the owner before implementation.
- For non-trivial mutable work, apply `worktree-isolation.md` before implementation or parallel AI handoff.
- Require `projectRoot/.worktrees/<task-slug>` for the worktree path; do not use `../.worktrees`.
- If the request is trivial documentation or formatting, use `workflows/direct-run.md`.
