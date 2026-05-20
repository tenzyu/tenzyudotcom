# Handoff: TASK-0006

## Task Summary

Added Storybook to `product/packages/ui-react` with colocated component stories
and separated design-system docs/pattern/regression stories.

## What Changed

- Added `.storybook/main.ts` and `.storybook/preview.tsx`.
- Added Storybook dependencies, scripts, Vitest dependency, and lockfile updates.
- Added colocated stories and tests for Button, Dialog, Accordion, and Card.
- Added `src/stories` docs, foundations, patterns, and regression examples.
- Added `src/testing` story helpers, fixtures, and a reusable Storybook decorator.
- Added `useMobile` as a root API alias while preserving `useIsMobile`.
- Excluded stories from library build declarations.

## Why It Changed

The package needs Storybook as a design-system workshop while keeping component
stories close to component implementation and keeping package public API
structure aligned with subpath exports.

## Affected Files

- `product/packages/ui-react/.storybook/*`
- `product/packages/ui-react/src/components/ui/*.stories.tsx`
- `product/packages/ui-react/src/components/ui/*.test.tsx`
- `product/packages/ui-react/src/stories/**`
- `product/packages/ui-react/src/testing/**`
- `product/packages/ui-react/package.json`
- `product/packages/ui-react/tsconfig*.json`
- `product/packages/ui-react/src/index.ts`
- `bun.lock`

## Validation Result

Passed:

- `bun nx run ui-react:format`
- `bun nx run ui-react:typecheck`
- `bun nx run ui-react:test`
- `bun nx run ui-react:build`
- `bun nx run ui-react:storybook:build`
- `curl -I http://127.0.0.1:6010`

Failed:

- `bun nx run ui-react:lint` due existing `ui-react` lint errors outside the new
  story files.
- Native Storybook dev/static Nx server targets did not keep a server alive in
  this environment; built Storybook output is served with a small local static
  server at `http://127.0.0.1:6010`.

## Remaining Risks

- Existing lint debt means `ui-react` still cannot pass the package lint target.
- Storybook addon-vitest is registered, but browser-mode interaction testing has
  not been configured beyond the addon dependency.
- Visual regression has static stories but no screenshot automation yet.

## Follow-Up Tasks

- Resolve or explicitly policy-exempt existing `ui-react` fast-refresh and hooks
  lint failures.
- Add Storybook browser visual checks if this package becomes a release gate.

## Memory Updates Made Or Proposed

- No durable repo memory update was made. Proposed: confirm `ui-react` ownership
  in `harness/ai-org/memory/repo-map.md` if this package is now active.
