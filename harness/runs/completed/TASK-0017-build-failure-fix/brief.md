# Brief: build failure fix

## title

Build failure fix

## background

`skin-workbench:build` and `web:build` fail on TypeScript errors involving `@tenzyu/ui` subpath declarations and shared UI component props. After those type errors are fixed, `web:build` also fails during prerender because the root TypeScript configuration forces the `development` condition into Next's production build resolution.

## problem

The UI package export map points declaration paths at files that do not exist after the package build. Some UI component prop types also make defaulted props appear required to consumers. The remaining `web:build` failure is caused by root `tsconfig.json` setting `compilerOptions.customConditions` to `["development"]`, which makes Next/Turbopack select development React/RSC entries during a production build.

## goal

Fix the build failures with minimal source changes from the root checkout.

## scope

- UI package export/type declarations
- UI shared component prop types needed by consumers
- Root TypeScript condition resolution used by Next production builds
- Direct web component type error shown by build
- task verification records

## allowed files

- `product/packages/ui/package.json`
- `product/packages/ui/src/components/ui/button.tsx`
- `product/packages/ui/src/components/ui/alert-dialog.tsx`
- `product/packages/ui/src/components/ui/pagination.tsx`
- `product/apps/web/src/app/[locale]/(admin)/editor/_features/blog-editor.tsx`
- `tsconfig.json`
- `harness/ai-org/tasks/TASK-0017-build-failure-fix/*`

## forbidden files

- generated `dist` output
- unrelated app source
- dependency lockfiles unless a package-manager action requires them

## non-goals

- redesign components
- change runtime behavior
- fix environment-only prerender data availability

## constraints

- Preserve public APIs.
- Do not add comments.
- Validate with targeted Nx builds.

## role assignment

Work Agent

## worktree isolation

- Branch: `ai/build/fix-ui-type-resolution`
- Worktree path: owner explicitly approved continuing from the root checkout for the final fix
- Base branch/commit: `develop`
- Expected merge target: `develop`
- Cleanup expectation: root checkout used with owner approval after reverting worktree-only changes

## validation commands

- `bun nx run skin-workbench:build`
- `bun nx run web:build`

## acceptance criteria

- `skin-workbench:build` passes or fails only for non-type environment/runtime packaging outside the reported issue.
- `web:build` passes from the root checkout.
- Changes are limited to allowed files.

## risks

- Some web build failures may require production-only environment variables and are outside the pasted type errors.

## open questions

None.
