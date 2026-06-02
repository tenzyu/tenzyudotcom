# Workflow: Task Lifecycle

Use this workflow as the top-level route for non-trivial work.

## 1. Intake

- Read `workflows/task-intake.md`.
- Create or update `tasks/TASK-*/brief.md`.
- Assign the smallest safe role set.
- Apply `workflows/worktree-task-isolation.md` before mutable work.

## 2. Investigation

- Read only context needed for the task.
- Prefer indexes and exact searches before broad reads.
- Record important discoveries in `worklog.md`.

## 3. Plan

- Use `workflows/exec-plan.md` for broad, risky, or multi-step changes.
- Keep simple changes in the brief and worklog.
- Escalate ADR-relevant choices to the owner.

## 4. Implementation

- Use `workflows/implementation.md`.
- Stay inside allowed files.
- Do not remove features or broaden scope silently.

## 5. Verification

- Use `workflows/verification.md`.
- Run narrow relevant checks first.
- Run broader Nx checks when scope warrants it.
- Record failures and skipped checks.

## 6. Review

- Use `workflows/review.md` for independent review.
- Review against the brief and validation evidence.

## 7. ADR Distillation

- Use `workflows/adr-distillation.md` when a task changes architecture, package boundaries, validation strategy, public APIs, or repeated future work.

## 8. Handoff and Memory

- Use `workflows/handoff.md`.
- Use `workflows/memory-update.md` only for durable recurring knowledge.
