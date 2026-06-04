# Atelier

Atelier is the repository-local control plane for context planning, task
artifacts, resumable run capsules, graph inspection, governance checks, control
coverage, and handoff support.

Task execution is owned by an external LLM runner such as Codex, opencode,
ChatGPT, Gemini, or a human operator. Atelier materializes durable task and run
capsule artifacts; it does not launch or supervise the LLM runtime.

## LLM Task Workflow

Atelier does not own the execution lifecycle of an LLM task.

The current workflow is:

1. Define the task intent.
2. Run `atelier context plan` to inspect relevant context, expected files, risks,
   and validation commands.
3. Optionally create a durable task with `atelier task create`.
4. Optionally materialize a resumable capsule with `atelier run create --task <task-id>`.
5. Give the resulting plan or capsule to an external LLM runner.
6. Let the runner edit the repository directly.
7. Validate with normal project commands such as typecheck, tests, Nx project
   inspection, and stale-command grep.
8. Use `atelier run handoff`, `atelier run verify`, and `atelier run complete`
   when a run capsule needs durable handoff and completion records.

`harness/runs` stores portable run capsules. Active capsules live under
`harness/runs/active/<run-id>/`; completed capsules are moved to
`harness/runs/completed/<run-id>/`.

## Usage

Inside the root dev shell, use `atelier` directly:

```bash
atelier doctor
atelier doctor --json
atelier scan --json
atelier scan --write
atelier graph --json
atelier status --json
atelier impact --path product/apps/atelier
atelier blame ARTIFACT_ID
atelier context plan --workflow workflow.isolated-run --role role.core.implementer --path product/apps/atelier --intent "inspect atelier" --mode compact
atelier controls list
atelier controls coverage
atelier controls missing
atelier policy check --path product/apps/atelier/src/cli.ts
atelier policy explain
atelier policy simulate '{"changes":[]}'
atelier task create --title "Example" --description "Describe the work"
atelier task status TASK-ID
atelier task assign TASK-ID --role role.core.implementer
atelier task split TASK-ID --subtask "Child::Describe child work"
atelier task close TASK-ID --outcome completed
atelier run create --task TASK-ID
atelier run list
atelier run inspect RUN-ID
atelier run resume RUN-ID
atelier run handoff RUN-ID --append "Current state and next step"
atelier run verify RUN-ID --list
atelier run verify RUN-ID --record "atelier:check::passed::All checks passed"
atelier run complete RUN-ID
atelier role create --id role.example --title "Example"
atelier role edit role.example
atelier reconcile
atelier repair --dry-run
atelier mcp
atelier gui
```

Outside the dev shell, route through the root flake:

```bash
nix run .#atelier -- doctor
nix run .#atelier -- context plan --workflow workflow.isolated-run --role role.core.implementer --path product/apps/atelier --intent "inspect atelier"
```

Development checks can run from this package directory:

```bash
bun run typecheck
bun run test
bun run check
```

Or through Nx from the repository root:

```bash
bun nx show project atelier --json
bun nx run atelier:typecheck
bun nx run atelier:test
bun nx run atelier:check
```

## Current Scope

- Parse Markdown frontmatter and validate authored harness documents.
- Observe repository artifacts into the Artifact Graph.
- Report graph health, stale artifacts, orphaned controls, and control coverage.
- Plan task context from workflow, role, path, intent, task, and context mode
  without creating task or run state.
- Create and edit task and role Markdown artifacts through guarded mutations.
- Materialize, inspect, resume, handoff, verify, and complete portable run
  capsules without launching an LLM.
- Evaluate static policy checks for paths, commands, and tools.
- Serve a local GUI over the same core APIs without hidden GUI-only state.
- Expose a read-only-by-default MCP adapter for doctor, graph, context plan,
  task, run, controls, reconcile, repair, and policy operations.

## Nix Distribution Modes

Atelier has three separate Nix-facing paths:

1. External consumers use `product/apps/atelier` as the lightweight subflake.
   Its default package is the fixed-output release binary from
   `nix/package.nix`. This path must not run `bun install` in the consumer's
   Nix sandbox.
2. Monorepo dogfooding uses the root flake app/dev-shell runner. In this repo,
   `nix run .#atelier -- <args>`, `nix build .#atelier`, and `nix develop`
   route `atelier` to the current checkout's `product/apps/atelier/src/cli.ts`,
   so development can use the latest source before a release asset exists.
3. Source-build packaging should stay separate from the default release package.
   If we adopt `bun2nix`, use it for an explicit source-build package after
   generating and committing the matching `bun.nix`; do not replace the external
   default until `bun build --compile` reproducibility has been proven.

Release packages are published from `.github/workflows/release-atelier.yml` via
`workflow_dispatch`. Set `update_package_nix=true` and `publish_release=true`
with a tag matching the package version, such as `atelier-v0.1.0`.

## Non-Goals

- Owning the runtime lifecycle for every external LLM task.
- Requiring every task to create a durable run capsule.
- Acting as a generic chatbot or vector database.
- Silently promoting task notes into durable knowledge.
- Maintaining compatibility aliases for removed v1 commands.
