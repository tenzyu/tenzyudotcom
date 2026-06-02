# tenzyudotcom

`tenzyudotcom` contains the tenzyu.com web app, the osu! skin workbench desktop app, Castalia, shared product packages, repository policy tooling, and the local AI work harness used to maintain them.

This README is the repository entrypoint. Treat the files below as the source of truth when details may have changed:

- `package.json`: Bun version, workspace packages, and root scripts.
- `nx.json`: Nx workspace layout, inferred target plugins, cache defaults, and target defaults.
- `bun nx show projects`: current project list.
- `bun nx show project <project> --json`: current targets for one project.
- `harness/README.md`: AI harness operating model.

## Workspace

- Package manager: `bun@1.3.10`.
- Task runner: Nx, invoked as `bun nx ...` or through root `bun run ...` scripts.
- Product apps live under `product/apps`.
- Workspace packages live under `product/packages`.
- Bun workspaces include `product/apps/*` and `product/packages/*`.

Current project snapshot:

| Project | Path | Role |
| --- | --- | --- |
| `web` | `product/apps/web` | Next.js site, public routes, assets, admin editor, and site-local feature code. |
| `skin-workbench` | `product/apps/osu-skin-workbench` | Tauri + Vite desktop app for osu! skin workbench workflows. |
| `castalia` | `product/apps/castalia` | Linux-first Rust CLI/launcher for local AI prompt workflows. |
| `ui` | `product/packages/ui` | Shared React UI package, CSS runtime layers, and Storybook surface. |
| `osu-skin-core` | `product/packages/osu-skin-core` | Runtime-pure TypeScript osu! skin domain package. |
| `linter` | `product/packages/linter` | Bun CLI for repository policy and architecture lint rules. |

Refresh the snapshot before relying on it:

```bash
bun nx show projects
```

## Boundaries

- Put product surfaces in `product/apps/*`.
- Put reusable package contracts in `product/packages/*`.
- Apps may depend on packages; packages must not depend on apps.
- Product runtime code must not import from `repo-ops/`.
- Keep repository automation in `repo-ops/` or `@tenzyu/linter`.
- Keep AI workflow, policy, task, and handoff material in `harness/`.
- Keep `@tenzyu/osu-skin-core` runtime-pure: no DOM, React, Tauri, Node runtime APIs, or app imports.
- Keep `@tenzyu/ui` focused on shared UI primitives and CSS contracts; app-specific behavior belongs in the owning app.
- Keep web route-local `_features` code route-local until there is a real shared contract.

## Setup

Install dependencies:

```bash
bun install
```

Use Nix when native, Rust, Tauri, or repo-ops tools are needed:

```bash
nix develop
```

Use the narrower workbench shell for Tauri work:

```bash
nix develop .#skin-workbench
```

## Run

Inspect project targets first when you are unsure:

```bash
bun nx show project web --json
```

Web app:

```bash
bun nx run web:dev
```

osu! skin workbench:

```bash
nix develop .#skin-workbench
```

Then run inside that shell:

```bash
bun nx run skin-workbench:dev
```

Frontend-only workbench loop:

```bash
bun nx run skin-workbench:dev-vite
```

Castalia:

```bash
nix develop
```

Then run inside that shell:

```bash
bun nx run castalia:launch
```

Castalia through the root flake:

```bash
nix run .#castalia --
```

## Validate

Standard broad handoff checks:

```bash
bun run policy:deps
bun nx run-many -t check
```

Targeted check for projects that define `check`:

```bash
bun nx run <project>:check
```

Inspect the project first when the target is not obvious:

```bash
bun nx show project <project> --json
```

Build affected projects when build output matters:

```bash
bun nx affected -t build
```

Full verification is heavier and may build more than a normal handoff needs:

```bash
bun run verify
```

Repository policy checks:

```bash
bun run lint:workspace
bun run verify:workspace
```

## Root Scripts

Root scripts are convenience entrypoints over Nx or repo scripts. Check `package.json` for the complete list.

Common scripts:

```bash
bun run build
bun run check
bun run lint
bun run test
bun run typecheck
bun run graph
```

Repository scripts:

```bash
bun run policy:deps
bun run test:scripts
bun run build:docs-map
bun run docs-rename
```

## More Detail

- `ARCHITECTURE.md`: repository architecture and boundaries.
- `DEVELOPMENT.md`: setup and validation commands.
- `PACKAGES.md`: package export contracts.
- `CONTRIBUTING.md`: contribution and dependency rules.
- `PLANS.md`: pointer to active and historical plans under `harness/runs/`.
- `harness/README.md`: AI harness operating model.
