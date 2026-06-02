# Atelier

Atelier is the local control plane for the repository harness.

Atelier is CLI-first and file-backed. It reads Markdown under `harness/`, reports
source-contract diagnostics, compiles generated indexes, previews role-routed
context, initializes active run folders, closes runs through an evidence gate,
and promotes durable knowledge only from explicit proposals.

`context.md` is the first file an agent should read for a run. It is a compiled
context pack, not just a list of links and not a raw copy of every selected
source document. `context.manifest.json` stores provenance, hashes, selection
reasons, and expansion records.

## Commands

```bash
bun nx run atelier:doctor
bun nx run atelier:doctor -- --json
bun nx run atelier:index
bun nx run atelier:index-check
bun nx run atelier:context-preview -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --mode compact
bun nx run atelier:run-init -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --mode compact
bun nx run atelier:context-expand -- RUN-ID knowledge.rule.security.example
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
- Preview context from workflow, role, input path, intent, and context mode.
- Initialize run folders with `brief.md`, compiled `context.md`, and
  provenance-only `context.manifest.json`.
- Support context modes:
  - `compact`: default, embeds compiled excerpts of required context.
  - `full`: embeds larger required source bodies when practical.
  - `linked`: keeps output link-centered for low-cost preview or human checks.
- Expand active run context with manifest, context, and worklog records.
- Close non-trivial runs only after required artifacts, context hashes,
  verification, handoff, review, and proposal state pass the completion gate.
- Create, promote, and reject knowledge proposals without automatically turning
  raw run logs into durable knowledge.

## Non-Goals

- GUI
- MCP server
- automatic fixes
- automatic knowledge promotion
