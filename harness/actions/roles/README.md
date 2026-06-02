# Roles

Roles are context routing profiles and responsibility boundaries.

A role is not a persona. Assigning a role decides what knowledge should be loaded, what scope is allowed, what outputs are required, and how the result will be reviewed.

## Role schema

Each role should define:

- mission
- activation triggers
- primary scope
- forbidden default scope
- required knowledge
- optional knowledge
- applicable phases
- outputs
- review criteria

## Core roles

| Role | Responsibility |
| --- | --- |
| `core/architect.md` | boundaries, plans, dependency impact, ADR candidates |
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

## Creation rule

Create or keep a role only when it satisfies at least one of these:

- it owns a durable domain boundary
- it has a distinct required knowledge bundle
- it has distinct review criteria
- it can be assigned across multiple workflows or phases

Do not create a role for a single phase. Inline one-phase responsibilities into `actions/phases/`.

## Assignment rule

Assign the smallest role set that can safely move the run forward.
