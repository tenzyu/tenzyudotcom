# Workflow: Task Intake

Task intake converts a human problem into a bounded work unit.

## Output

Create or update `brief.md` in the task folder.

## Required Sections

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
- worktree isolation
- validation commands
- acceptance criteria
- risks
- open questions

## Rules

- Do not start broad implementation from a vague request.
- Ask for human decisions only when the scope cannot be bounded safely.
- Mark assumptions explicitly.
- Prefer a small first task over a broad rewrite.
- If an ADR-relevant decision is needed, interview the owner before implementation.
- For non-trivial mutable work, apply `workflows/worktree-task-isolation.md` before implementation or parallel AI handoff.
- If the request is trivial documentation or formatting, record a lightweight brief in the worklog or handoff.
