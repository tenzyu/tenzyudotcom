# Role Parts

Roles are reusable perspectives and ownership boundaries.

Do not create a role for a single phase. If a role only exists to execute one phase, inline it into the phase file.

## Core roles

| Role | Responsibility |
| --- | --- |
| `core/architect.md` | boundaries, plans, dependency impact |
| `core/implementer.md` | scoped source or documentation changes |
| `core/reviewer.md` | independent requirement, risk, and verification review |
| `core/librarian.md` | handoff, durable knowledge, documentation continuity |

## Domain roles

| Role | Scope |
| --- | --- |
| `domain/web-app-engineer.md` | `product/apps/web` |
| `domain/workbench-app-engineer.md` | Workbench frontend |
| `domain/rust-tauri-engineer.md` | Tauri and Rust backend |
| `domain/design-system-engineer.md` | `@tenzyu/ui` |
| `domain/repo-ops-engineer.md` | Nx, Bun, Nix, CI, scripts, linter |
| `domain/harness-engineer.md` | `harness` |

## Governance roles

| Role | Scope |
| --- | --- |
| `governance/cost-controller.md` | context budget and duplicate research prevention |
| `governance/release-manager.md` | rollout, release notes, rollback |

## Rule

Assign the smallest role set that can safely move the run forward.
