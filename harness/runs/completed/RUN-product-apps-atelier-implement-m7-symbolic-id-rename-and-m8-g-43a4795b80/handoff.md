# Handoff: RUN-product-apps-atelier-implement-m7-symbolic-id-rename-and-m8-g-43a4795b80

## Run Summary

- Run ID: `RUN-product-apps-atelier-implement-m7-symbolic-id-rename-and-m8-g-43a4795b80`
- Workflow: `workflow.isolated-run`
- Primary role: `role.domain.harness-engineer`
- Supporting roles: `role.core.implementer`
- Reviewer role: `role.core.reviewer`
- Intent: Implement M7 (Symbolic ID Rename) and M8 (Generated Skills and Adapters) from the Atelier roadmap.

## Assigned Roles

- `role.domain.harness-engineer` — owns the harness compiler surface and the M0–M6 acceptance criteria.
- `role.core.implementer` — kept the change small, scoped, and reversible.
- `role.core.reviewer` — required because the run changes the public CLI surface.

## Required Knowledge Loaded

- `harness/knowledge/product-specs/atelier/ROADMAP.md` (M7 and M8 sections).
- `harness/knowledge/product-specs/atelier/README.md` (ID rules, source-contract asymmetry, MCP and skills sections).
- `harness/actions/roles/domain/harness-engineer.md` (role scope, pinned context, review criteria).
- `harness/policies/repository.md` (workspace conventions, no manual grep rule).
- `harness/canon/model.md` (Run = Task + Roles + Knowledge + Policy + Action + Observation + Handoff).
- `harness/canon/completion-standard.md` (evidence-based completion).
- `harness/canon/classification.md` (Knowledge / Action / Observation / Run / Policy / Adapter).

## What Changed

- `product/apps/atelier/src/core/rename.ts` — new core for `atelier id rename` (preview-first, refuses on collision, regenerates indexes on write).
- `product/apps/atelier/src/core/generate.ts` — new core for `atelier generate` (writes per-source skills and short root adapters, idempotent).
- `product/apps/atelier/src/cli.ts` — added `id rename` and `generate` subcommands with `--write` and `--json` flags.
- `product/apps/atelier/src/index.ts` — re-exported `renameId`, `generateGeneratedFiles`, and their types.
- `product/apps/atelier/project.json` — added `id-rename` and `generate` Nx targets.
- `product/apps/atelier/package.json` — added `id` and `generate` Bun scripts.
- `product/apps/atelier/README.md` — documented the new commands and the M7/M8 scope.
- `product/apps/atelier/src/__tests__/rename-generate.test.ts` — new test file covering preview, write, refuse, manifest update, generate preview/write/idempotence.
- `harness/adapters/root/AGENTS.md`, `CLAUDE.md`, `GEMINI.md` — regenerated to the M8 short form.
- `.harness/generated/skills/atelier.md` — new generated main skill.
- `.harness/generated/skills/workflows/<id>.md` — 10 new workflow skills.
- `.harness/generated/skills/roles/<id>.md` — 13 new role skills.
- `.harness/generated/{docs,ids,knowledge-index,workflow-index,role-bundles,diagnostics}.json` — refreshed by `atelier index` after `atelier generate`.

## Why It Changed

The Atelier roadmap reaches M7 and M8 once M0–M6 are accepted. The two milestones close the loop on harness integrity by making id renames safe and turning hand-written adapter content into reproducible generated skills. The CLI is the canonical surface area, and the existing core modules provide the building blocks the new commands need.

## Affected Files

- New source: `product/apps/atelier/src/core/{rename,generate}.ts`.
- New tests: `product/apps/atelier/src/__tests__/rename-generate.test.ts`.
- Modified source: `product/apps/atelier/src/{cli,index}.ts`, `product/apps/atelier/{project.json,package.json,README.md}`.
- Regenerated: `harness/adapters/root/{AGENTS,CLAUDE,GEMINI}.md`.
- Generated: `.harness/generated/skills/**` (gitignored) and `.harness/generated/*.json` (gitignored).

## Validation Result

- `bun nx run atelier:typecheck` — pass.
- `bun nx run atelier:test` — 24 pass, 0 fail.
- `bun nx run atelier:doctor` — same 6 pre-existing errors and 40 pre-existing warnings, no new diagnostics.
- `bun nx run atelier:index --check` — pass ("Generated indexes are fresh.").
- `bun nx run atelier:generate` — 24 files written, no diagnostics.
- `bun nx run atelier:id-rename` preview — reports 4 affected changes, performs no writes.

## Remaining Risks

- The regenerated `harness/adapters/root/AGENTS.md` is much shorter than the prior hand-written version. The detailed guidance now lives in `harness/adapters/tool/AGENTS.md` and `.harness/generated/skills/atelier.md`. Reviewers should compare and confirm no required content was lost.
- `atelier id rename` only replaces backticked body references and JSON string values. Plain-text mentions of ids in body content are intentionally not touched and will need manual review.
- Generated skill files use a new `kind: generated-skill` value. Doctor emits no `UNKNOWN_KIND` warning because the scan only inspects `harness/**/*.md`, and the generated skills live under `.harness/generated/`. If generated skills are later committed or moved under `harness/`, the schema's `KNOWN_KINDS` set will need to be extended.

## Follow-up Tasks

- Add an `UNKNOWN_KIND` / `NON_ARRAY_TAGS` exemption for `kind: generated-skill` files in case future work moves them under `harness/`.
- Add a M11 task that wires `atelier repo owner` to the new repo map generation so role selectors can also reference generated path-ownership facts.
- Consider expanding `atelier id rename` to optionally rewrite plain-text body mentions behind a separate flag once the safe (backticked-only) path has been used in production.

## Knowledge Updates Made or Proposed

- None. M7 and M8 are operational improvements, not new durable knowledge. No knowledge proposals were created.

## Commands for the Next Agent

```bash
bun nx run atelier:generate --write
bun nx run atelier:index --check
bun nx run atelier:doctor
bun nx run atelier:test
```

To exercise M7 with a real rename (preview only):

```bash
bun nx run atelier:id-rename -- knowledge.product-spec.atelier knowledge.product-spec.atelier-v2
```

To apply:

```bash
bun nx run atelier:id-rename -- knowledge.product-spec.atelier knowledge.product-spec.atelier-v2 --write
```
