# tenzyudotcom

The [tenzyu.com](https://tenzyu.com) monorepo contains a Next.js 16 personal website, a Tauri/Rust osu! skin workbench, a personal Firefox conversation exporter, and shared TypeScript packages. The toolchain uses Bun 1.4.5 (as declared in the package manifest), Nx 24, TypeScript 7.0.2, Node.js 22 and Nix devShells.

TypeScript 7 runs the native `tsc` executable (`@typescript/native`). The official `@typescript/typescript6` compatibility alias supplies the JavaScript compiler API for Nx, declaration generation and framework tooling. `@typescript/old` is pinned explicitly to avoid Bun resolving the compatibility package to itself. CI verifies both compiler paths. The native TypeScript 7 compiler remains in use.

## Workspace projects

| Project | Path | Responsibility |
| --- | --- | --- |
| Web | `product/apps/web` | Public routes, blog/MDX, notes, scraps, osu!, portfolio, Intlayer and editor |
| Skin workbench | `product/apps/osu-skin-workbench` | React/Vite UI and Tauri Rust native file operations |
| ChatGPT HTML exporter | `product/apps/chatgpt-partial-html-export` | Firefox extension that exports the visible DOM to local HTML |
| UI | `product/packages/ui` | Shared components, styles and Storybook |
| Skin core | `product/packages/osu-skin-core` | Runtime-pure classification, models and contracts |
| Publishing domain | `product/packages/publishing-domain` | Blog, Notes, Links and Scraps domain API, independent of Next.js |
| Revisioned content | `product/packages/revisioned-content` | Versioned persistence, conflict detection and atomic publication |
| Repository tools | `repo-ops` | Observation, maintenance and verification tools |

Apps may import packages; packages must not import apps. Product runtime code must not import `repo-ops`. Authored content lives in the separate `tenzyudotcom-content` repository.

## Development commands

See the following commands for the Web development environment:

```sh
nix develop             # only if not already inside an approved devShell
bun install --frozen-lockfile --ignore-scripts
bun nx show projects
bun nx run web:dev
```

The root `bun.lock` is the only JavaScript lockfile for the workspace. Run dependency installation commands from the repository root. On neko7, the approved `.envrc` loads the development shell with nix-direnv. Execute commands directly instead of wrapping each call in `nix develop -c`. Next.js prints the Web development URL when the server starts. Production builds may require read-only access to external content. Do not replace failed reads with synthetic empty data.

For native work, run `nix develop .#skin-workbench`, then `bun nx run skin-workbench:dev`. For Vite-only work, run `bun nx run skin-workbench:dev-vite`. The Firefox extension has its [own installation guide](product/apps/chatgpt-partial-html-export/README.md).

## Verification commands

```sh
bun run policy:deps
bun run test:scripts
bun nx show project web --json
bun nx run web:check
bun nx affected -t check --base=origin/develop --head=HEAD
```

To list a project's targets, run `bun nx show project <project> --json`. Use `bun nx run-many -t verify` to verify more projects. GitHub CI runs an explicit workspace verification DAG, a separate native toolchain job, and production publication/editor acceptance. The isolated [browser acceptance suite](product/apps/web/.claude/skills/verify/SKILL.md) covers desktop and mobile Chromium. It does not cover Firefox, WebKit or production deployment.

## Documentation and contribution rules

- [LLM Wiki / OKF index](docs/wiki/index.md) documents architecture, failure modes, operations and decisions in separate files.
- [`AGENTS.md`](AGENTS.md) defines the agent contract. Source code, manifests and tests are authoritative.
- [Renewal closure](docs/renewal/12-completion.md) and [historical ADRs](harness/README.md) record past evidence rather than current service status.
- [Repository observation tools](repo-ops/operations/README.md) cover isolated verification and preservation.

Atelier, Castalia, pointers, puzzles, recommendations and the legacy agent tooling were retired. The integration process uses topic branches based on `develop`, reviewed pull requests into `develop`, and subsequent integration into `main`. Do not push to `main` directly.
