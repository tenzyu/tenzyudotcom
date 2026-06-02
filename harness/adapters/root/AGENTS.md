# AGENTS.md

`harness` is the canonical AI organization system for this repository.
Root adapter files are pointers only; durable policy, workflow, memory, and handoff live under `harness`.
Read `harness/canon/legacy/root-HARNESS.md` and `harness/policies/repository.md` before changing code.

## High-signal facts

- Workspace package manager: Bun 1.3.10.
- Task runner: Nx, invoked as `bun nx ...`.
- Apps live in `product/apps`; packages live in `product/packages`.
- `product/apps/*` may depend on `product/packages/*`; packages must not depend on apps.
- `repo-ops/` is for repository automation and may inspect or transform `product/`, but product runtime code must not import from it.
- `@tenzyu/osu-skin-core` must stay runtime-pure.
- `@tenzyu/ui` must not absorb app-specific logic.
- Root AI files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) are adapters, not separate policy stores.
- `projectRoot/.worktrees/<task-slug>` is the required worktree location.

## Workflow expectations

- For non-trivial work, create or update a task folder under `harness/ai-org/tasks/`.
- Use the smallest relevant role and workflow files from `harness/actions/roles/` and `harness/actions/workflows/`.
- Record `verification.md` and `handoff.md` before claiming completion.
- Preserve existing features unless explicitly requested otherwise.
- Do not change public component APIs without migration notes.
- Do not bypass typecheck, lint, tests, build, Storybook, or affected Nx validation when relevant.

## Nx and validation

- Prefer `bun nx run <project>:<target>` and `bun nx affected -t <target>` over direct tool invocations.
- Check Nx config with `bun nx show projects` or `bun nx show project <name> --json` when needed.
- Do not guess unfamiliar Nx flags.
- For broad changes, `bun run policy:deps` and `bun nx run-many -t check` are the repo-standard checks.
- If Nx loading fails, record that in verification instead of silently switching tools.
