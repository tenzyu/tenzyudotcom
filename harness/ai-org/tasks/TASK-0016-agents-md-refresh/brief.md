# TASK-0016: Refresh root AGENTS.md

## Background

Root AI bootstrap guidance needs to stay short, accurate, and aligned with the current Bun + Nx monorepo layout.

## Problem

The current root adapter is mostly policy placeholders and misses some high-signal repository facts that future agents need immediately.

## Goal

Keep `AGENTS.md` compact while preserving only verified, repo-specific guidance that helps agents avoid common mistakes.

## Scope

Allowed files:

- `AGENTS.md`
- `harness/ai-org/tasks/TASK-0016-agents-md-refresh/*`

Forbidden files:

- product source
- build artifacts
- unrelated docs

## Non-Goals

- No code changes.
- No repository-wide policy rewrite.

## Constraints

- Prefer executable sources of truth over prose.
- Keep only facts an agent would likely miss without help.
- Preserve the harness-based workflow model.

## Role Assignment

- Lead role: work-agent
- Supporting roles: repo-ops reviewer, memory update if needed

## Validation

- Read back the updated `AGENTS.md`.
- Capture verification notes in `verification.md`.

## Acceptance Criteria

- Root `AGENTS.md` is concise and current.
- It includes the repo-specific workflow and boundary facts that matter most.
- It omits generic filler.

## Risks

- Overstating conventions that are only partially enforced.
- Keeping stale instructions from older workflow versions.

## Open Questions

- None
