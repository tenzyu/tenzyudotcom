# Role Map

Agents are context boundaries. Assign the smallest role set that can safely move
the task forward.

## Core Roles

| Role | Primary responsibility |
| --- | --- |
| Chief of Staff | Intake, decomposition, scope, role assignment |
| Architect | Boundaries, plans, dependency impact |
| Implementer | Scoped changes |
| Reviewer | Independent review of requirements, risk, and verification |
| Test Engineer | Reproduction and validation |
| Docs Librarian | Handoff and durable memory |
| Cost Controller | Context budget and duplicate research prevention |
| Release Manager | Rollout, release notes, rollback |

## Product Roles

| Role | Primary scope |
| --- | --- |
| Design System Engineer | `product/packages/ui` |
| Web App Engineer | `product/apps/web` |
| Workbench App Engineer | `product/apps/osu-skin-workbench` frontend |
| Rust/Tauri Engineer | `product/apps/osu-skin-workbench/src-tauri` |
| Repo Ops Engineer | Nx, Bun, Nix, CI, scripts, linter |
| Harness Engineer | `harness/ai-org` |

## Initial Operating Set

Start with Chief of Staff, Architect, Implementer, Reviewer, and Docs Librarian.
Add specialized roles when scope requires them.
