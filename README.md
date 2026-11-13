# tenzyudotcom

This Bun and Nx workspace contains the tenzyu.com Web app, the osu! skin workbench, and shared product packages.

## Set up

Use the lightweight Web development shell and install dependencies without lifecycle scripts.

```bash
nix develop
bun install --ignore-scripts
```

The default shell contains Bun, Node.js, and Biome. Native workbench tools are optional.

```bash
nix develop .#skin-workbench
```

The `repo-ops` shell adds Serena. The `minimal` shell contains Bun and Node.js.

## Run a project

Inspect the current projects and targets.

```bash
bun nx show projects
bun nx show project web --json
```

Start the Web app.

```bash
bun nx run web:dev
```

For workbench frontend work, run `bun nx run skin-workbench:dev-vite`.
For the native app, enter the workbench shell and run `bun nx run skin-workbench:dev`.

## Check changes

```bash
bun run policy:deps
bun run verify:workspace
bun run test:scripts
bun nx run <project>:check
```

Inspect each project's targets before running broader checks. Root `build`, `check`, `lint`, `test`, `typecheck`, and `verify` commands run matching Nx targets across the workspace. Use `bun nx affected -t check` for affected projects.

## Workspace boundaries

- `product/apps/web` owns Next.js routes, site features, and the editor.
- `product/apps/osu-skin-workbench` owns the Tauri and Vite workbench.
- `product/packages/ui` owns shared React components, CSS, and Storybook.
- `product/packages/osu-skin-core` owns runtime-pure TypeScript skin contracts.
- `product/packages/linter` owns repository architecture checks.
- `repo-ops` owns repository automation. Product runtime code must not import it.
- Apps may import packages. Packages must not import apps.

## Renewal records

Atelier, Castalia, pointers, puzzles, recommendations, and the old agent harness are retired.
See [renewal decisions](docs/renewal/02-decisions.md) and the [retirement unit report](docs/renewal/11-retirement-unit.md) for the current scope and verification evidence.
Historical ADRs and useful reports remain under [harness](harness/README.md) as reference material.
`repo-ops/renewal` contains the renewal observation tools.

`package.json` owns root commands and dependency versions. `nx.json` owns workspace task defaults.
The general documentation rename command remains available as `bun run docs-rename`.
