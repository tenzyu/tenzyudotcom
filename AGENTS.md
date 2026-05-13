# AGENTS.md

This repository uses `harness/ai-org` as the canonical AI organization system.
Tool-specific root files are adapters only; durable policy, workflow, memory,
and handoff rules live under `harness/ai-org`.

Also read `docs/AGENTS.md` for repository-local engineering constraints.

Before changing code:

1. Read `harness/ai-org/org/charter.md`.
2. Read `harness/ai-org/memory/repo-map.md`.
3. Read the relevant role file under `harness/ai-org/agents/`.
4. Read the relevant workflow under `harness/ai-org/workflows/`.
5. Create or update a task folder under `harness/ai-org/tasks/` for non-trivial work.
6. Do not claim completion without `verification.md` and `handoff.md`.

Hard rules:

- Do not remove existing features unless explicitly requested.
- Do not rewrite large areas without an ExecPlan.
- Do not change public component APIs without migration notes.
- Do not introduce app-specific logic into `@tenzyu/ui`.
- Do not bypass typecheck, lint, tests, build, Storybook, or affected Nx validation when relevant.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->
