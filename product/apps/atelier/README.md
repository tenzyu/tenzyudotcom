# Atelier

Atelier is the local control plane for the repository harness.

This first implementation is CLI-first and file-backed. It reads Markdown under
`harness/` and reports source-contract and doctor diagnostics without changing
the harness.

## Commands

```bash
bun nx run atelier:doctor
bun nx run atelier:doctor -- --json
bun nx run atelier:typecheck
bun nx run atelier:test
```

## Current Scope

- Parse Markdown frontmatter with `Bun.YAML`.
- Classify harness documents by progressive strictness.
- Report missing IDs, invalid frontmatter, unknown kinds, duplicate IDs, broken
  Markdown links, stale `harness/ai-org` references, and missing phase references.
- Emit stable JSON for agent and script consumption.

## Non-Goals

- GUI
- MCP server
- context preview
- run creation
- automatic fixes or knowledge promotion

