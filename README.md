# tenzyudotcom

`tenzyudotcom` is a monorepo for tenzyu.com, osu! tools, shared product code, and repository operation assets.

## Repository Structure

```txt
tenzyudotcom/
  product/
    apps/
      web/
      osu-skin-workbench/

    packages/
      ui/
      osu-domain/
      osu-skin-core/

  repo-ops/
    harness/
    linter/
    scripts/
    biome/
    shell/

  .codex/
  .gemini/
  .serena/
  .vscode/

  AGENTS.md
  CLAUDE.md
  README.md
  package.json
  flake.nix
  bun.lock
```

## Directory Policy

### `product/`

Product code that is delivered to users.

```txt
product/apps/
  Runnable applications.

product/packages/
  Runtime/shared code used by product apps.
```

Examples:

```txt
product/apps/web
  tenzyu.com

product/apps/osu-skin-workbench
  osu! skin workbench app

product/packages/*
  Shared product libraries
```

Product code must not depend on `repo-ops/`.

### `repo-ops/`

Non-product code for repository operation, automation, AI harnesses, linting, migration, and generation.

```txt
repo-ops/harness/
  AI instructions, ExecPlans, workflows, repository knowledge, reports

repo-ops/linter/
  Custom lint rules

repo-ops/scripts/
  Repository maintenance scripts

repo-ops/biome/
  Biome support files

repo-ops/shell/
  Shell helpers
```

`repo-ops/` may inspect or transform `product/`, but product runtime code should not import from `repo-ops/`.

## Root Files

Root files are kept minimal.

```txt
package.json
  Workspace and command entrypoint

flake.nix
  Development shell

AGENTS.md / CLAUDE.md
  AI agent bootstrap instructions

README.md
  Repository overview
```

Detailed AI harness assets live under:

```txt
repo-ops/harness/
```

## Workspaces

The repository uses Bun workspaces.

```json
{
  "workspaces": [
    "product/apps/*",
    "product/packages/*",
    "repo-ops/*"
  ]
}
```

## Command Convention

Root scripts follow this format:

```txt
<action>:<scope>[:<target>]
```

Examples:

```txt
dev:web
build:web
verify:web

dev:skin-workbench
build:skin-workbench
verify:skin-workbench

build:harness:map
rename:harness:docs
verify:repo-ops

verify:product
verify:all
```

## Common Commands

```bash
bun install
```

```bash
bun run dev:web
bun run build:web
bun run verify:web
```

```bash
bun run dev:skin-workbench
bun run build:skin-workbench
bun run verify:skin-workbench
```

```bash
bun run verify:product
bun run verify:repo-ops
bun run verify:all
```

## Development Shell

```bash
nix develop
```

Then run Bun commands inside the shell.

## Boundary Rules

```txt
product/apps/*       -> product/packages/*
product/packages/*   -> product/packages/*
product/*            -> repo-ops/*          prohibited
repo-ops/*           -> product/*           allowed when needed
```

Keep product code, shared runtime code, and repository operation code separate.

