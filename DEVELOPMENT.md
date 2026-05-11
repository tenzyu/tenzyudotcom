# Development

## Setup

```bash
bun install
```

Use Nix shells when native or Tauri dependencies are needed:

```bash
nix develop
nix develop .#skin-workbench
```

## Common Commands

```bash
bun run policy:deps
bun nx run-many -t typecheck
bun nx run-many -t test
bun nx run-many -t check
bun nx affected -t build
```

Package smoke targets:

```bash
bun nx run ui:package-smoke
bun nx run osu-skin-core:package-smoke
```

Workbench native checks:

```bash
bun nx run skin-workbench:cargo-check
bun nx run skin-workbench:cargo-clippy
```
