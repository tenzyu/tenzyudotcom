# Brief: TASK-0022 frontmatter contract alignment

## Intent

Align Codex-added harness frontmatter with the current Atelier source-contract decisions from owner hearing.

## Decisions Applied

1. Completed run frontmatter is stripped and treated as historical text.
2. Legacy metadata is preserved under `x.legacy` rather than used as routing metadata.
3. `read_when` and `skip_when` remain allowed as intrinsic knowledge signals.
4. Domain roles must carry `selectors` and `pinned` routing metadata.
5. Root and tool adapters become Atelier-first.
6. Small direct edits to existing knowledge remain allowed, but new durable knowledge should use proposal/promotion.
7. `tags` must be YAML arrays.
8. Workflow registry stays `kind: canon`.
9. Removed legacy paths are errors outside completed run history.
10. `impactDescription` is preserved under `x.legacy.impactDescription`.
11. `chapter` is preserved under `x.legacy.chapter`.

## Scope

Allowed files:

- `harness/**/*.md`
- `product/apps/atelier/src/core/schema.ts`
- `product/apps/atelier/src/core/doctor.ts`
- `harness/knowledge/product-specs/atelier/**`
- this run folder

## Non-Goals

- Do not add a new roadmap milestone.
- Do not implement GUI, MCP, vector search, or ID rename.
- Do not rewrite the meaning of completed historical run bodies.
