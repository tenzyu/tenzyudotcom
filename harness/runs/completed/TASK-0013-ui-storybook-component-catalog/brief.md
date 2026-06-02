# TASK-0013: Build `@tenzyu/ui` Component Storybook Catalog

## Background

`product/packages/ui` is the shared `@tenzyu/ui` design-system package. It already has Storybook setup and a few provisional stories, but the component catalog does not cover all components and is not useful enough for package distribution review.

## Problem

Most components under `product/packages/ui/src/components/ui` do not have Storybook examples. Existing component stories are provisional and do not consistently expose variants, states, composition rules, or interaction surfaces.

## Goal

Create a Storybook catalog that covers every visual component under `product/packages/ui/src/components/ui` and makes component correctness easy to inspect through meaningful examples, interactive states, and at-a-glance overviews.

## Scope

Allowed files:

- `product/packages/ui/src/components/ui/**/*.stories.tsx`
- `product/packages/ui/src/stories/**`
- `product/packages/ui/src/testing/**`
- `product/packages/ui/.storybook/**` only if Storybook catalog behavior requires it
- task documentation under `harness/runs/completed/TASK-0013-ui-storybook-component-catalog`

Forbidden files:

- `product/apps/**`
- component runtime API changes unless required only to make stories compile and explicitly recorded
- unrelated package source outside `product/packages/ui`

## Non-Goals

- Do not redesign component APIs.
- Do not migrate application usage.
- Do not introduce app-specific logic into `@tenzyu/ui`.
- Do not add screenshot automation in this task.

## Constraints

- Existing provisional stories may be rewritten.
- Stories should prioritize useful visual verification over placeholder examples.
- Components with non-visual exports are covered through visual/provider usage stories instead of standalone hook stories.
- Use existing package dependencies only.

## Role Assignment

- Lead role: Design System Engineer
- Supporting role: Test Engineer for verification notes

## Worktree Isolation

- Branch: `ai/ui/storybook-components`
- Worktree path: `/home/tenzyu/Documents/.worktrees/tenzyudotcom/ui-storybook-components`
- Base branch: `develop`
- Expected merge target: `develop`
- Cleanup expectation: remove worktree after review/merge or abandonment

## Validation Commands

- `bun nx show project ui --json` to confirm available targets when Nx is available
- `bun nx run ui:typecheck`
- `bun nx run ui:build`
- `bun nx run ui:build:storybook` or equivalent resolved Storybook build target
- `bun nx run ui:lint` when available

## Acceptance Criteria

- Every `src/components/ui/*.tsx` visual component has Storybook coverage.
- Existing provisional component stories are replaced with useful examples.
- Stories expose variants, states, compound composition, and interactions where relevant.
- Pattern/regression stories remain separate from component catalog stories.
- Verification and handoff are recorded.

## Risks

- Many overlay/interactive components may require careful default-open stories or trigger-based stories to avoid confusing canvas behavior.
- Existing Nx/Bun environment may lack installed dependencies in the isolated worktree.
- Lint may fail on existing shadcn-style helper exports unrelated to story work.

## Open Questions

- Assumption: colocated component story files are acceptable for component catalog coverage.
- Assumption: non-visual exports such as hooks/providers are considered covered when their visible behavior is demonstrated.
