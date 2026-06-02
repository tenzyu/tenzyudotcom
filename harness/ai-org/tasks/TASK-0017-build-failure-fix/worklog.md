# Worklog: TASK-0017

## 2026-06-02

- Recreated the task record in the root checkout after the worktree-only changes were reverted at owner request.
- Confirmed root changes were limited to UI package typing/export fixes and the reported web editor `Card` type error.
- Ran `bun nx run web:build`; the original TypeScript failures were gone, but build failed during notes prerender with `(0, c.jsxDEV) is not a function`.
- Inspected notes page assembly and generated `.next` server chunks. The failing chunk pointed to `product/packages/ui/src/components/ui/button.tsx`, not note data or static params.
- Rebuilt `ui` with `bun nx run ui:build --skipNxCache`; generated dist switched from `react/jsx-dev-runtime` to `react/jsx-runtime`, but `web:build` still failed after `.next` clean, so stale generated output was not the root cause.
- Temporarily tested adding `"use client"` to `button.tsx`; `web:build` passed, but review rejected it because it changed `buttonVariants` into a client-module export and treated the symptom rather than the root cause.
- Removed the `"use client"` change and inspected package/build configuration. `product/packages/ui/dist/button.js` used `react/jsx-runtime`, while the failing Next server chunk used `react-rsc` `jsx-dev-runtime`.
- Removed root `compilerOptions.customConditions: ["development"]` from `tsconfig.json`.
- Re-ran `web:clean` and `web:build`; `web:build` passed from a clean `.next`.
- Re-ran `skin-workbench:build`; it passed, including Vite and Tauri release compilation.

## Decisions

- Kept the root export map fix because the generated declaration files exist under `dist/src/...`, while the old export map pointed at missing paths.
- Exported `ButtonProps` instead of deriving wrapper props from `React.ComponentProps<typeof Button>`, because defaulted variant props were being treated as required by consumers.
- Removed the root `development` custom condition because Next production builds must not resolve React/RSC through development-only conditional exports.
- Kept `Button` server-safe and did not add a `"use client"` directive because shadcn-style `buttonVariants` is intentionally reusable from server-side code.
- Did not restore earlier worktree-only environment or Turbopack root fallbacks. The root build failures were solved without them.

## Discarded Hypotheses

- Notes static params or note content data caused the prerender failure. The server chunk stack pointed at UI `Button`, not notes data.
- Stale `.next` cache alone caused the prerender failure. Cleaning `.next` did not fix it.
- Stale UI `dist` alone caused the prerender failure. Rebuilding UI corrected generated JS, but web still failed until the root `development` custom condition was removed.
- `Button` source itself required a client boundary. Adding `"use client"` made the build pass, but it created a public utility export problem and was unnecessary once config resolution was fixed.
