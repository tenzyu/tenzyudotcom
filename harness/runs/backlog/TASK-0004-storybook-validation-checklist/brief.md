# TASK-0004: Add Design-System Storybook Validation Checklist

## Problem

Storybook can be an AI-friendly validation surface only if agents know what to
check consistently.

## Goal

Create a practical checklist for validating shared UI components and stories.

## Scope

Allowed files:

- `harness/policies/quality-gates.md`
- `harness/knowledge/product-specs/design-system.md`, if created or updated
- `product/packages/ui/**`, only if existing Storybook metadata needs minimal updates
- relevant task docs under `harness/runs/backlog/TASK-0004-storybook-validation-checklist`

Forbidden files:

- app source changes
- broad component redesigns

## Non-Goals

- Do not implement all missing stories.
- Do not replace automated tests with visual checks.

## Validation

- Checklist maps to existing `ui` Storybook targets and scripts.
- Run relevant docs or `ui` validation if files changed require it.

## Acceptance Criteria

- Checklist covers variants, states, dark theme where relevant, accessibility expectations, and app-CSS independence.
- Checklist distinguishes automated and manual checks.
- `verification.md` and `handoff.md` are completed.
