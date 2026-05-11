# Architecture

tenzyudotcom is a monorepo for the personal site and product experiments that
are promoted into stable packages when they need shared contracts.

## Layout

- `product/apps/web`: Next.js site and admin editor.
- `product/apps/osu-skin-workbench`: Tauri + Vite desktop app.
- `product/packages/ui`: shared React UI package and CSS runtime layers.
- `product/packages/osu-skin-core`: pure TypeScript osu! skin domain package.
- `product/packages/linter`: repository policy and architecture linter.
- `repo-ops`: repository maintenance scripts and AI harness material.

## Boundaries

Apps can depend on packages. Packages cannot depend on apps. Package consumers
must import only public package exports. Internal `src/lib` layout is not a
consumer contract.

The web app uses route-local `_features` slices. Shared code belongs in
`src/features` or `src/lib` only after it has multiple owners or a clear
cross-route contract.

## Tooling

Bun owns installation. Nx owns orchestration, cache boundaries, affected
selection, and CI entrypoints. Nix provides the reproducible shell.
