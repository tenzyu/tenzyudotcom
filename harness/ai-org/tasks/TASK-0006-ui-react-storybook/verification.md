# Verification: TASK-0006

## Commands Run

- `bun nx g @nx/storybook:configuration ui-react --uiFramework=@storybook/react-vite --interactionTests=false --skipFormat --dry-run --no-interactive`
- `bun nx g @nx/storybook:configuration ui-react --uiFramework=@storybook/react-vite --interactionTests=false --skipFormat --no-interactive`
- `bun add --dev storybook@10.3.6 @storybook/react-vite@10.3.6 @storybook/addon-a11y@10.3.6 @storybook/addon-docs@10.3.6 @storybook/addon-vitest@10.3.6`
- `bun add --dev vite@^8.0.11 @vitejs/plugin-react@^6.0.1`
- `bun add --dev vitest@~4.1.0`
- `bun install`
- `bun nx run ui-react:format`
- `bun nx run ui-react:typecheck`
- `bun nx run ui-react:test`
- `bun nx run ui-react:build`
- `bun nx run ui-react:storybook:build`
- `bun nx run ui-react:lint`
- `bun run lint` from `product/packages/ui-react`
- `bun nx run ui-react:storybook`
- `bun run storybook` from `product/packages/ui-react`
- `bun nx run ui-react:static-storybook`
- `curl -I http://127.0.0.1:6010`

## Command Results

- Storybook generator dry-run and real run completed.
- Dependency installation completed and updated `bun.lock`.
- `bun nx run ui-react:format`: passed.
- `bun nx run ui-react:typecheck`: passed.
- `bun nx run ui-react:test`: passed.
- `bun nx run ui-react:build`: passed after removing stale ignored local Vite 7
  package folders and aligning Vite devDependencies.
- `bun nx run ui-react:storybook:build`: passed.
- `bun nx run ui-react:lint`: failed.
- `bun nx run ui-react:storybook`: exited successfully without keeping a dev
  server alive in this environment.
- Storybook dev server attempts using `storybook dev` prompted incorrectly for
  an unavailable port and did not stay running.
- `bun nx run ui-react:static-storybook`: failed because the underlying static
  server exited in this environment.
- A small local static server for the built Storybook output was started on
  `http://127.0.0.1:6010`; `curl -I` returned `HTTP/1.1 200 OK`.

## Lint Failure

`ui-react:lint` fails on existing source files unrelated to the added Storybook
stories:

- `react-refresh/only-export-components`: `badge.tsx`, `button-group.tsx`,
  `button.tsx`, `carousel.tsx`, `combobox.tsx`, `direction.tsx`,
  `navigation-menu.tsx`, `sidebar.tsx`, `tabs.tsx`, `toggle.tsx`
- `react-hooks/set-state-in-effect`: `carousel.tsx`, `hooks/use-mobile.ts`

The package lint script now ignores `storybook-static` so Storybook build output
is not linted.

## Files Inspected

- `product/packages/ui-react/package.json`
- `product/packages/ui-react/project.json`
- `product/packages/ui-react/vite.config.mts`
- `product/packages/ui-react/tsconfig*.json`
- `product/packages/ui-react/src/index.ts`
- `product/packages/ui-react/src/index.css`
- `product/packages/ui-react/src/components/ui/{button,dialog,accordion,card}.tsx`
- `product/packages/ui-react/src/components/theme-provider.tsx`
- `product/packages/ui-react/src/hooks/use-mobile.ts`
- `product/packages/ui/.storybook/*`
- `nx.json`

## Visual Checks Performed

- Static Storybook build completed successfully.
- Built Storybook output is being served locally at `http://127.0.0.1:6010`.
- No browser screenshot pass was performed.

## Tests Added

- `button.test.tsx`
- `dialog.test.tsx`
- `accordion.test.tsx`
- `card.test.tsx`

## Skipped Checks

- Broad `bun nx run-many -t check` was not run because this task is scoped to
  `ui-react` and narrow build/test/storybook checks already exposed the relevant
  package state.

## Follow-Up Recommendations

- Decide whether to fix existing `ui-react` lint debt or adjust the package ESLint
  policy for shadcn-style component modules that intentionally export helpers.
- Add browser screenshot checks later if Storybook becomes a visual regression
  gate.
