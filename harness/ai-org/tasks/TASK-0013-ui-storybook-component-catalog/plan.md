# ExecPlan: `@tenzyu/ui` Component Storybook Catalog

## Task

TASK-0013

## Investigation

- Affected files: `product/packages/ui/src/components/ui`, `product/packages/ui/src/stories`, `product/packages/ui/src/testing`, task docs.
- Existing conventions: Storybook React Vite config loads `../src/**/*.mdx` and `../src/**/*.stories.@(ts|tsx)`. Component examples are colocated under `src/components/ui` and foundations/patterns/regressions live under `src/stories`.
- Current behavior: only Accordion, Button, Card, and Dialog have colocated provisional stories; many components have no stories.
- Uncertain areas: exact Nx targets could not be resolved initially because `bun nx` failed with `nx: command not found` in this worktree before dependency verification.

## Current Behavior

Storybook exists but does not serve as a complete component catalog. Existing stories are short examples and do not sufficiently document states, variants, composition, or interaction surfaces for distribution review.

## Target Behavior

Storybook provides complete component coverage for `src/components/ui/*.tsx` with examples that can be visually scanned and interacted with. Complex primitives have composition examples; small primitives have state/variant matrices; provider/hook-like exports are demonstrated through visible use cases.

## Strategy

1. Keep foundations, patterns, and regression stories under `src/stories`.
2. Rewrite existing provisional colocated stories.
3. Add missing colocated stories for each UI component source file.
4. Use shared story helpers/fixtures to keep examples consistent and scannable.
5. Avoid component runtime changes unless compilation reveals a story-only issue that cannot be solved otherwise.

## File-Level Impact

| File | Planned change |
| --- | --- |
| `product/packages/ui/src/components/ui/*.stories.tsx` | Add or replace component stories for all visual UI components. |
| `product/packages/ui/src/testing/story-helpers.tsx` | Improve reusable story layout helpers if needed. |
| `product/packages/ui/src/testing/fixtures.ts` | Add reusable sample data if needed. |
| `product/packages/ui/src/stories/**` | Keep pattern/regression docs separate; adjust only if they conflict with catalog. |
| `harness/ai-org/tasks/TASK-0013-ui-storybook-component-catalog/*` | Record task brief, plan, verification, handoff, and worklog. |

## Dependency and Boundary Impact

No new dependencies are planned. Work stays inside `@tenzyu/ui` and task docs. No app imports or app-specific logic should be introduced.

## Public API Impact

None planned. Stories should not change package exports or component APIs.

## Validation Commands

- `bun nx run ui:typecheck`
- `bun nx run ui:build`
- `bun nx run ui:build:storybook`
- `bun nx run ui:lint`

## Rollback Considerations

Story additions are isolated to story/testing/task files. Rollback can remove the new/rewritten story files and restore any edited story helpers.

## Explicit Non-Goals

- No app migration.
- No component redesign.
- No screenshot automation.
- No dependency upgrades unless required for existing Storybook to run.
