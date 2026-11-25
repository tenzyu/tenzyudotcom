# tenzyudotcom

The [tenzyu.com](https://tenzyu.com) monorepo: a Next.js 16 personal website, a Tauri/Rust osu! skin workbench, a personal Firefox conversation exporter, and shared TypeScript packages. Toolchain: **Bun 1.3.10 (package declaration), Nx 22, Node.js 22, Nix devShells**.

## Workspace

| Project | Path | Responsibility |
| --- | --- | --- |
| Web | `product/apps/web` | Public routes, blog/MDX, notes, scraps, osu!, portfolio, Intlayer and editor |
| Skin workbench | `product/apps/osu-skin-workbench` | React/Vite UI and Tauri Rust native file operations |
| ChatGPT HTML exporter | `product/apps/chatgpt-partial-html-export` | Firefox extension; visible DOM → local HTML |
| UI | `product/packages/ui` | Shared components, styles and Storybook |
| Skin core | `product/packages/osu-skin-core` | Runtime-pure classification, models and contracts |
| Repository tools | `repo-ops` | Observation, maintenance and verification tools |

Apps may import packages; packages must not import apps. Product runtime code must not import `repo-ops`. Authored content lives in the **separate** `tenzyudotcom-content` repository.

## Get started

```sh
nix develop             # only if not already inside an approved devShell
bun install --frozen-lockfile --ignore-scripts
bun nx show projects
bun nx run web:dev
```

The root `bun.lock` is the only JavaScript lockfile for the workspace; run installs from the repository root. On neko7, the approved `.envrc` loads the development shell with nix-direnv; execute commands directly instead of wrapping each call in `nix develop -c`. The Web dev URL is printed by Next.js. Production builds may need legitimate read-only access to external content; do not replace failures with synthetic empty data.

For native work: `nix develop .#skin-workbench`, then `bun nx run skin-workbench:dev`. For Vite-only work: `bun nx run skin-workbench:dev-vite`. The Firefox extension has its [own installation guide](product/apps/chatgpt-partial-html-export/README.md).

## Verify changes

```sh
bun run policy:deps
bun run test:scripts
bun nx show project web --json
bun nx run web:check
bun nx affected -t check --base=origin/develop --head=HEAD
```

Use `bun nx show project <project> --json` to discover valid targets; `bun nx run-many -t verify` covers broader scopes. GitHub CI runs affected checks/builds and Rust checks. The isolated [browser acceptance harness](product/apps/web/.claude/skills/verify/SKILL.md) covers Chromium desktop/mobile, **not** Firefox, WebKit or actual production deployment.

## Knowledge and contribution

- **[LLM Wiki / OKF index](docs/wiki/index.md):** progressive-disclosure architecture, failure modes, operations and decisions.
- [`AGENTS.md`](AGENTS.md): minimal agent contract; real source, manifests and tests are authoritative.
- [Renewal closure](docs/renewal/12-completion.md) and [historical ADRs](harness/README.md): dated evidence, not current service status.
- [Repository observation tooling](repo-ops/renewal/README.md): isolated verification and preservation.

Atelier, Castalia, pointers, puzzles, recommendations and the legacy harness were retired. The integration workflow is **topic branch from `develop` → PR to `develop` → reviewed merge → `main`**. Do not push to `main` directly.
