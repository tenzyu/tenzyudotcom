# Repository Map

This memory summarizes stable repository ownership. Inspect the current tree
before editing because this file may lag behind active work.

## Workspace

- Root package manager: Bun.
- Task runner: Nx, invoked through Bun.
- Apps root: `product/apps`.
- Packages root: `product/packages`.
- AI organization root: `harness/ai-org`.
- Repository operations root: `repo-ops`.
- Legacy repo-ops harness content was moved into `docs/`; `repo-ops/harness` is a redirect only.

## Projects

| Project | Path | Owner role |
| --- | --- | --- |
| `web` | `product/apps/web` | Web App Engineer |
| `skin-workbench` | `product/apps/osu-skin-workbench` | Workbench App Engineer and Rust/Tauri Engineer |
| `ui` | `product/packages/ui` | Design System Engineer |
| `osu-skin-core` | `product/packages/osu-skin-core` | Architect / domain package owner |
| `linter` | `product/packages/linter` | Repo Ops Engineer |
| `ui-react` | `product/packages/ui-react` | TODO: confirm ownership and target status |

## Boundary Memory

- Apps may depend on packages.
- Packages must not depend on apps.
- `@tenzyu/osu-skin-core` is runtime-pure.
- `@tenzyu/ui` owns shared UI primitives and must not absorb app-specific logic.
- Tauri/native behavior belongs under the workbench native boundary.
- Repository validation and policy automation belongs under `repo-ops` or `@tenzyu/linter`.

## Validation Memory

- Use `bun nx run <project>:<target>` for project checks.
- Use `bun nx run-many -t check` for broad checks when scope warrants it.
- Use `bun run policy:deps` for dependency policy validation.
- Record Nx loading failures in task verification instead of silently switching tools.
