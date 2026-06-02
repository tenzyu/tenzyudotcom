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
    scripts/

  harness/
    ai-org/

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

Non-product code for repository operation, automation, migration, and generation.

```txt
repo-ops/scripts/
  Repository maintenance scripts
```

`repo-ops/` may inspect or transform `product/`, but product runtime code should not import from `repo-ops/`.

### `docs/`

Human-facing repository and product contracts.

```txt
docs/product-specs/
  Product and route-specific requirements

docs/*.md
  Human-readable repository architecture, structure, quality, release, and roadmap notes
```

LLM-facing workflow, rule, ADR, execution-plan, reference, and report material lives under `harness/ai-org/`.

### `harness/ai-org/`

Canonical AI organization system for role definitions, task workflow, tool guardrails,
ADR memory, handoff, and durable LLM-facing knowledge. Root AI files such as
`AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` are adapters into this directory.
See `HARNESS.md` for the operating guide.

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

Detailed AI organization assets live under:

```txt
harness/ai-org/
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
