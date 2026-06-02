# Worklog: RUN-product-apps-atelier-implement-m7-symbolic-id-rename-and-m8-g-43a4795b80

## Investigation

- Read `product/apps/atelier/src/core/{schema,docs,frontmatter,indexer,context,runs,knowledge,doctor}.ts` to understand the existing core patterns.
- Read `harness/knowledge/product-specs/atelier/{README,ROADMAP}.md` for the canonical M7/M8 acceptance criteria.
- Read `harness/adapters/root/{AGENTS,CLAUDE,GEMINI}.md` (the hand-written adapters being replaced) and `harness/adapters/tool/AGENTS.md` (the short source pattern they should match).
- Read existing `__tests__/index-context-run.test.ts` to mirror the fixture pattern and verify the new M7/M8 test surface lives next to M2–M4 work.
- Surveyed the repository for current id reference patterns: `pinned`/`phases`/`required_phases`/`conditional_phases`/`supersedes`/`superseded_by` in frontmatter, backticked ids in body, and plain id strings inside `.harness/generated/*.json` and `harness/runs/active/**/context.manifest.json`.
- Verified `.harness` is gitignored, so generated files do not need to be committed and the generate command always writes a fresh copy.

## Design Decisions

- **M7 scope**: rename replaces the document's own frontmatter `id`, references in canonical frontmatter arrays and the `superseded_by` scalar, backticked body references, generated JSON files, and active run `context.manifest.json` plus the body of any active run file. Completed runs and `harness/legacy/**` are deliberately excluded so historical text stays untouched.
- **M7 safety**: validate that `oldId` and `newId` are non-empty, distinct, and that `newId` matches a dotted lowercase pattern (`^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_-]*)+$`). Refuse when the new id already exists in any harness document. The preview run returns a sorted list of affected files; only `--write` performs any mutation.
- **M7 index refresh**: after a successful write, `atelier index --write` is invoked so `.harness/generated/*.json` and the id table reflect the rename. Doctor is expected to be re-runnable to confirm no unresolved references remain.
- **M8 scope**: generate two artifact families — per-source skills and short root adapters — both reproducible and idempotent. Root adapters must match the spec's "short" rule (~30 lines) and keep `tool_source:` so the human-authored `harness/adapters/tool/*` files remain the source of truth for adapter intent.
- **M8 output paths**: `.harness/generated/skills/atelier.md`, `.harness/generated/skills/workflows/<short-id>.md` per workflow, `.harness/generated/skills/roles/<short-id>.md` per role, plus the three root adapters.
- **M8 idempotence**: a `generated_at` timestamp is embedded so re-running is observable but only rewrites files whose content actually changed.

## Implementation Notes

- Added `product/apps/atelier/src/core/rename.ts` with `renameId({ projectRoot, oldId, newId, write })` and the `IdRenameResult` shape.
- Added `product/apps/atelier/src/core/generate.ts` with `generateGeneratedFiles({ projectRoot, write })` and the `GenerateResult` shape.
- Extended `product/apps/atelier/src/cli.ts` with `atelier id rename` and `atelier generate` subcommands, both supporting `--write` and `--json`.
- Extended `product/apps/atelier/src/index.ts` to re-export the new functions and types.
- Extended `product/apps/atelier/project.json` with `id-rename` and `generate` Nx targets.
- Extended `product/apps/atelier/package.json` scripts so the local Bun scripts can call the new commands without going through Nx.
- Added `product/apps/atelier/src/__tests__/rename-generate.test.ts` covering preview, write, refuse-on-collision, and `generate --write` idempotence.
- Updated `product/apps/atelier/README.md` to document the new commands.

## Discoveries During Implementation

- `parseFrontmatter` returns `error` when the YAML fails to parse, so the rename scan has to skip documents whose frontmatter is broken rather than treating them as having no `id`.
- The `compileIndexes` function depends on `loadHarnessDocuments` which uses `parseFrontmatter` indirectly. The circular import concern is one-directional (`rename.ts` → `indexer.ts`), so it is safe.
- The doc count baseline of 264 includes the existing root adapters. After `atelier generate --write`, the doc count stayed at 264 (the new skill files live under `.harness/generated/`, which the doctor does not scan).
- The rename preview output is intentionally split into "Source File Changes" vs "Generated File Changes" so the operator can see what affects authored sources versus the derived indexes.

## Context Expansions

- None beyond the originally selected context. The implementation stayed inside the assigned role's knowledge bundle.

## Skipped Checks

- `bun nx run-many -t check` was not run; the run is scoped to `product/apps/atelier` and the cross-project `check` is unaffected by the change. Justification: the touched files are inside the atelier app and do not modify shared package interfaces.
- `bun run policy:deps` was not run; no package dependency changes were introduced. Justification: `package.json` only added scripts and a new Nx target entry, no runtime or dev dependencies were added.
