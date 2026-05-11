# Packages

## `@tenzyu/ui`

Shared React component package. The root export is curated and lightweight.
Normal components use flat subpaths such as `@tenzyu/ui/button`. Heavy or
environment-sensitive components use `@tenzyu/ui/advanced/*`.

Public CSS imports are:

- `@tenzyu/ui/styles.css`
- `@tenzyu/ui/workbench.css`

## `@tenzyu/osu-skin-core`

Pure TypeScript skin-domain package. It builds to `dist` and exposes stable
subpaths:

- `@tenzyu/osu-skin-core/classification`
- `@tenzyu/osu-skin-core/project`
- `@tenzyu/osu-skin-core/contract`
- `@tenzyu/osu-skin-core/domain`

Do not import `src/lib` or `lib/*` from consumers.

## `@tenzyu/linter`

Bun CLI for repository policy. It checks route feature boundaries, server action
guards, storage ownership, symbol ownership, and monorepo package boundaries.
