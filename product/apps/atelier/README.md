# Atelier

Atelier is the local control plane for the repository harness.

Atelier is CLI-first and file-backed. It reads Markdown under `harness/`, reports
source-contract diagnostics, compiles generated indexes, previews role-routed
context, initializes active run folders, closes runs through an evidence gate,
and promotes durable knowledge only from explicit proposals.

## Commands

```bash
bun nx run atelier:doctor
bun nx run atelier:doctor -- --json
bun nx run atelier:index
bun nx run atelier:index-check
bun nx run atelier:context-preview -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth"
bun nx run atelier:run-init -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth"
bun nx run atelier:run-close -- RUN-ID
bun nx run atelier:knowledge -- propose --from-run RUN-ID --kind rule --title "..."
bun nx run atelier:knowledge -- promote harness/runs/active/RUN-ID/knowledge-proposals/example.md
bun nx run atelier:knowledge -- reject harness/runs/active/RUN-ID/knowledge-proposals/example.md --reason "..."
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
- Close non-trivial runs only after required artifacts, context hashes,
  verification, handoff, review, and proposal state pass the completion gate.
- Create, promote, and reject knowledge proposals without automatically turning
  raw run logs into durable knowledge.

## Non-Goals

- GUI
- MCP server
- automatic fixes
- automatic knowledge promotion
