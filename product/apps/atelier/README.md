# Atelier

Atelier is the local control plane for the repository harness.

Atelier is CLI-first and file-backed. It reads Markdown under `harness/`, reports
source-contract diagnostics, compiles generated indexes, previews role-routed
context, and can initialize active run folders.

## Commands

```bash
bun nx run atelier:doctor
bun nx run atelier:doctor -- --json
bun nx run atelier:index
bun nx run atelier:index-check
bun nx run atelier:context-preview -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth"
bun nx run atelier:run-init -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth"
bun nx run atelier:typecheck
bun nx run atelier:test
```

## Current Scope

- Parse Markdown frontmatter with `Bun.YAML`.
- Classify harness documents by progressive strictness.
- Report missing IDs, invalid frontmatter, unknown kinds, duplicate IDs, broken
  Markdown links, stale `harness/ai-org` references, and missing phase references.
- Compile stable generated indexes under `.harness/generated`.
- Preview context from workflow, role, input path, and intent.
- Initialize run folders with `brief.md`, `context.md`, and
  `context.manifest.json`.

## Non-Goals

- GUI
- MCP server
- automatic fixes or knowledge promotion
