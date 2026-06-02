# TASK-0013: Rebuild AI Organization Harness

## Background

The owner reported that the current harness is fragmented across `docs/`, `harness/ai-org/`, and `harness/ai-org/legacy/docs/`. Human-facing docs may remain in `docs/`, but LLM-facing material should be consolidated into `harness/ai-org/`. `harness/ai-org/legacy/docs` should be removed.

## Problem

AI workflow, role, ADR, execution-plan, rule, reference, and report documents are split across several roots. This makes it unclear which documents agents should read, how to create tasks, how to review work, where ADRs live, and how tool guardrails are discovered.

## Goal

Make `harness/ai-org/` the single canonical location for LLM-facing harness material, define a developer-friendly operating model, add agent roles for task creation, work, review, and ADR distillation, document usage in `HARNESS.md`, and add tool guardrail skills for Git, Nx, and the custom linter.

## Scope

Allowed files:

- `harness/ai-org/**`
- `HARNESS.md`
- root AI adapter files when needed
- documentation indexes that reference moved LLM-facing docs
- `harness/ai-org/legacy/docs/**` for deletion
- package/workspace docs only when references need updating

Forbidden files:

- Product source code under `product/apps/**`
- Runtime package source under `product/packages/**`, except reading linter configuration
- CI behavior changes
- Dependency changes

## Non-Goals

- Do not rewrite product architecture or product specs.
- Do not implement new linter rules in this stage.
- Do not create or change public package APIs.
- Do not remove human-facing product documentation from `docs/`.

## Constraints

- Root adapter files must stay short.
- Durable policy, workflows, task history, memory, ADRs, and LLM-facing references must live under `harness/ai-org/`.
- Ask the owner before ADR-location decisions or other material architecture tradeoffs.
- Preserve existing information by moving or indexing it rather than deleting it.

## Role Assignment

- Lead role: Harness Engineer
- Supporting roles: Chief of Staff, Architect, Reviewer, Docs Librarian, Repo Ops Engineer

## Worktree Isolation

- Branch: `ai/harness/ai-org-rebuild`
- Worktree path: `/home/tenzyu/Documents/.worktrees/tenzyudotcom/harness-ai-org-rebuild`
- Base branch: `develop`
- Owning role/session: Harness Engineer
- Expected merge target: `develop`
- Cleanup expectation: remove worktree and delete branch after review/merge or abandonment

## Validation Commands

- `git diff --check`
- `bun run policy:deps`
- `bun nx run linter:check`
- `bun nx run-many -t check`

## Acceptance Criteria

- LLM-facing docs currently under `docs/` are moved or indexed under `harness/ai-org/`.
- Existing ADRs are moved to `harness/ai-org/memory/decisions/adr/`.
- `harness/ai-org/legacy/docs` is removed.
- Agents and workflows are reorganized enough that developers can find task intake, implementation, review, and ADR distillation paths.
- `HARNESS.md` explains how to use the harness.
- Tool guardrail skill files exist for Git, Nx, and `@tenzyu/linter`.
- Verification and handoff are recorded.

## Risks

- Bulk moves may leave stale links.
- Existing scripts may still assume `docs/design-docs` or `docs/exec-plans` paths.
- Some human-facing docs may reference historical paths intentionally.

## Open Questions

- Answered by owner: move all LLM-facing docs into `harness/ai-org/`.
- Answered by owner: move ADRs into `harness/ai-org/` rather than keeping `docs/ADR` canonical.
