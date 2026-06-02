# TASK-0001: Normalize `@tenzyu/ui` Button Variants

## Background

The design-system pilot starts with `@tenzyu/ui` because component contracts,
Storybook, and visible states are reviewable by agents and humans.

## Problem

Button variants may not be visually distinct enough or may lack a clear
documented validation surface.

## Goal

Button variants render visibly different states in Storybook without requiring
app-local CSS patches.

## Scope

Allowed files:

- `product/packages/ui/src/components/ui/button.tsx`
- `product/packages/ui/src/stories/**`
- `product/packages/ui/src/styles.css`, only if token or styling responsibility is documented
- relevant task docs under `harness/runs/backlog/TASK-0001-normalize-ui-button-variants`

Forbidden files:

- `product/apps/**`
- `product/apps/osu-skin-workbench/src-tauri/**`
- unrelated shared components

## Non-Goals

- Do not migrate app usage.
- Do not redesign the full component system.
- Do not change unrelated components.

## Constraints

- Public API changes require migration notes.
- Storybook must be usable as a validation surface.
- `@tenzyu/ui` must not absorb app-specific logic.

## Validation

- `bun nx run ui:typecheck`
- `bun nx run ui:test`
- `bun nx run ui:build`
- `bun nx run ui:build-storybook` or documented Storybook visual inspection

## Acceptance Criteria

- Button variants are visually distinguishable.
- Storybook contains variant and state coverage.
- No app-specific logic enters `@tenzyu/ui`.
- API impact is documented.
- `verification.md` and `handoff.md` are completed.
