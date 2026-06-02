# TASK-0005: Define App-Side UI Migration Guide

## Problem

Apps should consume shared UI through approved public APIs, but migration rules
need to be documented before broad app changes.

## Goal

Define how app-side UI should move toward `@tenzyu/ui` without leaking app logic
into shared packages.

## Scope

Allowed files:

- `harness/knowledge/rules/ui-ux/ui-migration-guide.md`, if created
- `harness/knowledge/product-specs/design-system.md`, if updated
- relevant app files for investigation only, unless implementation is explicitly approved
- relevant task docs under `harness/runs/backlog/TASK-0005-app-side-ui-migration-guide`

Forbidden files:

- broad app migrations
- public API changes in `@tenzyu/ui` without a separate approved task

## Non-Goals

- Do not migrate app components in this task.
- Do not redesign app pages.

## Validation

- Inspect representative app UI usage.
- Run docs or relevant app checks only if implementation changes are made.

## Acceptance Criteria

- Migration guidance separates app concerns from shared UI concerns.
- Approved imports and forbidden paths are clear.
- Follow-up implementation tasks are identified.
- `verification.md` and `handoff.md` are completed.
