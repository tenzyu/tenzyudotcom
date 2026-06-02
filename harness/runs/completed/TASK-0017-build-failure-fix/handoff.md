# Handoff: TASK-0017

## Summary

Fixed root Nx build failures for `skin-workbench:build` and `web:build`.

## What Changed

- Corrected `@tenzyu/ui` declaration paths in `product/packages/ui/package.json`.
- Exported `ButtonProps` from the UI button module and reused it in alert dialog and pagination wrappers.
- Added `className="overflow-hidden"` to the empty-state `Card` in the web blog editor.
- Removed root `compilerOptions.customConditions: ["development"]` from `tsconfig.json`.

## Why It Changed

The UI package export map pointed TypeScript at missing declaration files. After that was fixed, wrapper prop inference made defaulted UI props appear required in consumers. The final `web:build` prerender failure came from root TypeScript condition resolution: `customConditions: ["development"]` made Next/Turbopack select development React/RSC entries during production prerender, producing a server chunk that called `jsxDEV` where the runtime did not provide it.

## Affected Files

- `product/packages/ui/package.json`
- `product/packages/ui/src/components/ui/button.tsx`
- `product/packages/ui/src/components/ui/alert-dialog.tsx`
- `product/packages/ui/src/components/ui/pagination.tsx`
- `product/apps/web/src/app/[locale]/(admin)/editor/_features/blog-editor.tsx`
- `tsconfig.json`
- `harness/ai-org/tasks/TASK-0017-build-failure-fix/*`

## Validation

- `bun nx run web:build`: passed.
- `bun nx run skin-workbench:build`: passed.
- `bun nx run ui:build --skipNxCache`: passed during investigation.
- `bun nx run ui:test`: passed.

## Remaining Risks

- Next build still emits non-blocking warnings for `NO_COLOR`/`FORCE_COLOR`, EventEmitter listeners, and private tweet `2001518051955793947`.

## Follow-Up Tasks

- Consider removing or replacing private tweet `2001518051955793947` from web content.

## Memory Updates

- Made: none.
- Proposed: record that root TypeScript `customConditions` affects Next/Turbopack production condition resolution and should not force `"development"` globally.
