# Workflow: Isolated Run

Use this as the default workflow for non-trivial mutable work.

A non-trivial run is any work that may change source code, package configuration, build behavior, product behavior, security boundaries, release behavior, or durable harness structure.

## Core equation

```txt
Run = Task + Selected Knowledge + Policy + Action + Observation + Handoff
```

## Required phases

Load these phase modules in order:

1. `../parts/phases/intake.md`
2. `../parts/phases/worktree-isolation.md`
3. `../parts/phases/investigation.md`
4. `../parts/phases/planning.md`, when the change is broad, risky, or multi-step
5. `../parts/phases/implementation.md`
6. `../parts/phases/verification.md`
7. `../parts/phases/review.md`, when independent review is requested or risk warrants it
8. `../parts/phases/handoff.md`
9. `../parts/phases/knowledge-promotion.md`, only when durable reusable knowledge exists
10. `../parts/phases/adr-distillation.md`, only when an architecture decision should become an ADR

## Required outputs

Create or update a run directory under:

```txt
harness/runs/active/<RUN-ID-or-TASK-ID>/
```

Expected files:

- `brief.md`
- `plan.md`, when needed
- `worklog.md`
- `verification.md`
- `review.md`, when needed
- `handoff.md`

## Role selection

Use the smallest role set that can safely move the run forward.

Common role choices:

- `../parts/roles/core/architect.md`
- `../parts/roles/core/implementer.md`
- `../parts/roles/core/reviewer.md`
- `../parts/roles/core/librarian.md`
- domain role from `../parts/roles/domain/`
- governance role from `../parts/roles/governance/`, when cost or release control matters

## Rules

- Do not start broad implementation from a vague request.
- Do not silently broaden scope.
- Keep mutable work isolated in one branch, one worktree, and one run.
- Verification evidence is required before claiming completion.
- Handoff must make the next human or agent cheaper.
- Observation does not automatically become knowledge.
