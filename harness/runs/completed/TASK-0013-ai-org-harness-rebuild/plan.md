# ExecPlan: AI Org Harness Rebuild

## Task

TASK-0013

## Investigation

- Affected files: `harness/ai-org/**`, `HARNESS.md`, root adapters, docs indexes, repo-ops docs references, linter/document-rule paths.
- Existing conventions: root adapters remain short; `harness/ai-org` is canonical; non-trivial work requires task artifacts, verification, and handoff.
- Current behavior: LLM-facing docs were split between `docs/`, `harness/ai-org/`, and `repo-ops/harness/`.
- Uncertain areas: owner was interviewed for ADR location and LLM-doc consolidation scope.

## Strategy

1. Create an isolated worktree and task folder.
2. Move LLM-facing docs and ADRs under `harness/ai-org/`.
3. Remove `repo-ops/harness`.
4. Add developer-facing `HARNESS.md`.
5. Add focused agent roles for intake, work, review, and ADR distillation.
6. Add lifecycle and ADR workflows.
7. Add tool guardrail skills for Git, Nx, and `@tenzyu/linter`.
8. Update indexes, references, and scripts that point at old paths.
9. Run validation and record verification/handoff.

## File-Level Impact

| File | Planned change |
| --- | --- |
| `HARNESS.md` | Add top-level harness operating guide |
| `harness/ai-org/README.md` | Update directory map and start sequence |
| `harness/ai-org/agents/*.md` | Add intake/work/review/ADR roles |
| `harness/ai-org/workflows/*.md` | Add lifecycle and ADR distillation workflows |
| `harness/ai-org/skills/*.md` | Add Git, Nx, and linter guardrails |
| `harness/ai-org/memory/**` | Move ADRs and update memory routing |
| `harness/ai-org/knowledge/**` | Move design-doc rules and references |
| `harness/ai-org/exec-plans/**` | Move active/completed plans |
| `harness/ai-org/references/**` | Move workflow references |
| `harness/ai-org/reports/**` | Move AI reports |
| `repo-ops/harness/**` | Delete legacy redirect |
| `repo-ops/scripts/compile-agents-md.ts` | Update generated design-doc path |
| `product/packages/linter/src/rules/document-rules.ts` | Update document linter target path |

## Public API Impact

None. This is repository organization and documentation/tooling path work.

## Boundary Impact

- AI organization boundaries change: LLM-facing docs and ADRs move under `harness/ai-org/`.
- Human-facing product and repository docs remain under `docs/`.
- Product runtime code is not changed.

## Validation

- `git diff --check`
- `bun run policy:deps`
- `bun nx run linter:check`
- `bun nx run-many -t check`

## Rollback

Revert the branch or move the affected directories back to their previous paths and restore `repo-ops/harness/README.md`.

## Non-Goals

- Do not implement new linter rules.
- Do not migrate product specs wholesale.
- Do not change product runtime behavior.
