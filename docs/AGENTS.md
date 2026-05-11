# Repository Instructions

This repository is a Bun + Nx monorepo for tenzyu.com products.

Use Nx as the task runner for build, test, lint, typecheck, and verify work.
Prefer `bun nx run <project>:<target>` and `bun nx affected -t <target>` over
calling underlying tools directly from the root.

Core boundaries:

- `product/apps/*` may depend on `product/packages/*`.
- `product/packages/*` must not depend on app code.
- `@tenzyu/osu-skin-core` source must stay runtime-pure and must not import DOM,
  React, Tauri, Node runtime APIs, or app packages.
- `@tenzyu/ui` must expose public components through package exports, not source
  paths.
- Web route-local `_features` code must not become a shared dependency unless it
  is promoted into `src/features` or `src/lib`.

Run before handing off broad changes:

```bash
bun run policy:deps
bun nx run-many -t check
```
