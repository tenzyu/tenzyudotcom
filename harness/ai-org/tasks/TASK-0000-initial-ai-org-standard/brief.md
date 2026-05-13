# TASK-0000: Establish Initial AI Organization Standard

## Background

`goal.md` asks for a vendor-neutral AI organization operating layer for this
monorepo. The goal is for the human owner to provide problems, decisions, and
constraints while AI agents maintain task decomposition, implementation,
verification, handoff, and durable memory.

## Problem

The repository did not have a canonical `harness/ai-org` operating layer or root
adapter files that point Codex, Claude, Gemini, and future agents to shared
workflow and memory documents.

## Goal

Create initial documentation that makes AI work role-bounded, scope-bounded,
verifiable, handoff-ready, context-efficient, and independent from any single AI
vendor.

## Scope

Allowed files:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `docs/STRUCTURE.md`
- `docs/ARCHITECTURE.md`
- `docs/QUALITY_GATES.md`
- `harness/ai-org/**`

Forbidden files:

- `product/apps/**`
- `product/packages/**`
- package manager, dependency, or build script changes
- runtime source files

## Non-Goals

- Do not implement the design-system pilot.
- Do not change application runtime behavior.
- Do not fix unrelated dirty worktree changes.
- Do not invent repository facts that are not visible from the current tree.

## Constraints

- Root adapter files must not duplicate long-lived policy.
- Uncertain areas must be marked as `TODO` or `Assumption`.
- Documentation must remain useful to Codex, Claude, Gemini, and future agents.

## Role Assignment

- Lead role: Harness Engineer
- Supporting roles: Architect, Docs Librarian

## Validation

- Inspect required files after creation.
- Confirm no runtime source files were modified by this task.
- Attempt relevant Nx workspace query; record failure if it cannot run.

## Acceptance Criteria

- The repository has a clear AI organization standard.
- Adapter files point to the canonical files.
- Docs describe repository structure, boundaries, quality gates, task workflow, and handoff rules.
- No runtime behavior changes are introduced by this task.

## Risks

- Existing worktree changes outside this task may obscure `git status`.
- Nx project queries may fail in the local environment.

## Open Questions

- TODO: confirm whether `product/packages/ui-react` is a stable project and who owns it.
