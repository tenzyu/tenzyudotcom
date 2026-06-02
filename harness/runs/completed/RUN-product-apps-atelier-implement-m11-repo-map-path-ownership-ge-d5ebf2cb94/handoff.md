# Handoff

## What landed

- **M11 repo-map generation** — deterministic build of `RepoMap` (workspace markers, projects, file kinds, ownership hints) and `PathOwnership` (sorted lookup). Both written to `.harness/generated/`.
- **M12 semantic expansion** — optional deterministic TF recall (`runSemanticExpansion`) wired into `buildContextPlan` and the `atelier_context_plan` MCP tool. Never affects required context.
- **`atelier repo map`** CLI subcommand and `bun nx run atelier:repo-map` Nx target.
- **GUI endpoints** `GET /api/repo-map` and `GET /api/path-ownership`.

## Files added

- `product/apps/atelier/src/core/repo-map.ts`
- `product/apps/atelier/src/core/semantic.ts`
- `product/apps/atelier/src/__tests__/repo-map.test.ts`
- `product/apps/atelier/src/__tests__/semantic.test.ts`

## Files modified

- `product/apps/atelier/src/core/indexer.ts` — `repo-map.json` and `path-ownership.json` added to `GeneratedFileName`
- `product/apps/atelier/src/core/owner.ts` — fast lookup from generated cache; new `harness-repo-map` source
- `product/apps/atelier/src/core/context.ts` — `plan.semantic.{enabled,hits,unknownTerms}` when `options.semantic === true`
- `product/apps/atelier/src/core/knowledge.ts` — `duplicateCandidatesWithSemantic` exported
- `product/apps/atelier/src/core/mcp.ts` — `atelier_context_plan` gains `semantic` and `semanticMaxResults`
- `product/apps/atelier/src/core/gui.ts` — `GET /api/repo-map` and `GET /api/path-ownership`
- `product/apps/atelier/src/index.ts` — exports new modules
- `product/apps/atelier/src/cli.ts` — `atelier repo map` subcommand and usage line
- `product/apps/atelier/project.json` — `repo-map` Nx target
- `harness/knowledge/product-specs/atelier/ROADMAP.md` — M11/M12 status: shipped

## How to use

### Nx targets

```bash
bun nx run atelier:repo-map
bun nx run atelier:index          # rebuilds all generated indexes (incl. repo-map.json)
bun nx run atelier:repo-owner -- --path <p>
bun nx run atelier:context-plan   # build a context plan
```

### MCP

`atelier_index` and `atelier_context_plan` now expose the new outputs:

```json
{
  "name": "atelier_context_plan",
  "arguments": {
    "workflowId": "workflow.isolated-run",
    "roleIds": ["role.domain.harness-engineer"],
    "inputPath": "product/apps/atelier",
    "intent": "inspect harness decision",
    "semantic": true,
    "semanticMaxResults": 5
  }
}
```

`plan.semantic.hits` is labeled optional; `plan.required` is identical whether `semantic` is on or off.

### GUI

`GET /api/repo-map` and `GET /api/path-ownership` (in addition to the existing endpoints).

### Direct CLI

```bash
bun product/apps/atelier/src/cli.ts repo map
bun product/apps/atelier/src/cli.ts repo owner --path product/apps/web/src
```

## Release notes

None — user instructed to skip version bump, CHANGELOG, git tag, and release commit. Roadmap updated inline with shipped status.

## Follow-ups (out of scope)

- M11.1: emit `path-ownership.json` even when the harness tree is empty (currently requires at least one role to populate owner role).
- M12.1: swap the TF scoring for embeddings without changing the public API.
- M12.2: wire `duplicateCandidatesWithSemantic` into `promoteKnowledgeProposal` so `atelier_knowledge_promote` surfaces both rule-based and semantic duplicates side-by-side.
- Resolve the 5 pre-existing `BROKEN_MARKDOWN_LINK` diagnostics in `harness/knowledge/rules/compiled/AGENTS.md`.
