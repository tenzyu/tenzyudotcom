# Plan: Establish Initial AI Organization Standard

## Investigation

- `goal.md` defines `harness/ai-org` as canonical and gives a first implementation prompt.
- `docs/AGENTS.md` defines existing Bun + Nx repository constraints.
- Existing root `AGENTS.md` contained a generated Nx guidance block that should be preserved.
- Existing root `CLAUDE.md` only pointed at `docs/AGENTS.md`.
- `GEMINI.md`, `docs/STRUCTURE.md`, `docs/ARCHITECTURE.md`, `docs/QUALITY_GATES.md`, and `harness/ai-org/` did not exist.
- `bun nx show projects --json` failed before returning project data, so visible project files were used as fallback evidence.

## Strategy

1. Add short root adapter files.
2. Add repository structure, architecture, and quality gate docs under `docs/`.
3. Add organization, workflow, role, template, memory, and task docs under `harness/ai-org/`.
4. Record Nx query failure in known problems.
5. Add the fuller standard layout files named by `goal.md` as lightweight initial docs.
6. Seed the five initial design-system pilot task briefs without implementing them.

## File-Level Impact

| File area | Planned change |
| --- | --- |
| Root adapters | Route agents to `harness/ai-org` and `docs/AGENTS.md` |
| `docs/` | Add structure, architecture, and quality gates |
| `harness/ai-org/org/` | Add charter, decision, cost, quality, and context policy |
| `harness/ai-org/workflows/` | Add task, plan, verification, handoff, and memory workflows |
| `harness/ai-org/agents/` | Add initial role definitions |
| `harness/ai-org/templates/` | Add copyable task artifact templates |
| `harness/ai-org/memory/` | Add index, repo map, and known problems |
| `harness/ai-org/tasks/` | Add this task and initial pilot task briefs |
| `harness/ai-org/adapters/` | Add adapter guidance for root tool files |
| `harness/ai-org/memory/decisions/adr/` | Add initial ADRs named by the standard |

## Public API Impact

None. Documentation-only.

## Boundary Impact

No application or package runtime boundary changes are intended.

## Validation

- `bun nx show projects --json`
- `NX_DAEMON=false bun nx show projects --json`
- File existence checks for required deliverables
- `git diff --name-only` review to confirm this task did not edit runtime source

## Rollback

Revert the documentation and adapter file changes from this task.

## Non-Goals

- No app source changes.
- No package manager or build script changes.
- No design-system implementation.
