# TASK-0003: Define `@tenzyu/ui` Styling Responsibility Boundary

## Problem

Shared UI must render correctly without depending on app-local CSS patches, but
the exact styling responsibility boundary needs to be documented.

## Goal

Define what styling belongs in `@tenzyu/ui`, what belongs in apps, and how shared
tokens or CSS should be validated.

## Scope

Allowed files:

- `product/packages/ui/**`, if evidence is needed
- `docs/DESIGN_SYSTEM.md`, if created or updated
- `docs/ARCHITECTURE.md`, if boundary wording needs refinement
- relevant task docs under `harness/ai-org/tasks/TASK-0003-define-ui-styling-boundary/`

Forbidden files:

- app runtime migrations
- unrelated package changes

## Non-Goals

- Do not rewrite the styling system.
- Do not migrate apps to new styles.

## Validation

- Inspect shared UI CSS and Storybook setup.
- Run relevant `ui` checks if code changes are made.

## Acceptance Criteria

- Styling ownership is explicit.
- App-local CSS limitations are documented.
- Validation expectations are documented.
- `verification.md` and `handoff.md` are completed.
