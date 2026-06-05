---
description: Build atelier-* from atelier-design-docs
agent: atelier-builder
---

# Build atelier-\* from atelier-design-docs

Use the `atelier-design-docs` skill.

The user wants the saved Atelier design documents to drive implementation of:

```txt
atelier-indexer
atelier-reader
atelier-transformer
atelier-executor
atelier-operation
```

## Required behavior

Read the design docs and implement the components in dependency order:

1. indexer
2. reader
3. transformer
4. executor
5. operation

## Source docs

Look for design docs in:

```txt
atelier-design-docs/
docs/atelier-design-docs/
harness/knowledge/atelier-design/
```

Do not proceed if the design docs cannot be found. Report the missing expected paths.

## Target tooling root

```txt
.atelier-bootstrap/
  indexer/
  reader/
  transformer/
  executor/
```

## Target output root

```txt
.atelier/v0/
```

## Hard constraints

- `.atelier-bootstrap/**` is tooling only.
- `.atelier/v0/**` is generated output and state.
- Use NDJSON for objects and edges.
- Do not introduce SQLite.
- Do not use `canonical/**` as the primary architecture.
- Do not treat implementation-control as the root concept.
- Do not edit product specs.
- Do not claim validation passed unless it actually ran.
- Do not create a giant monolithic script.

## Minimum accepted command surface

Implement or document exact equivalent commands:

```bash
bun run atelier:index
bun run atelier:affected
bun run atelier:index:render
bun run atelier:index:validate

bun run atelier:sample
bun run atelier:attention -- --task "<task>"
bun run atelier:deep-read -- --attention <id>
bun run atelier:reader:validate

bun run atelier:transform:md-to-code
bun run atelier:transform:validate
bun run atelier:transform:render

bun run atelier:packet:create
bun run atelier:packet:context
bun run atelier:packet:complete
bun run atelier:evidence:add
bun run atelier:executor:validate

bun run atelier:ready
bun run atelier:verify
bun run atelier:render
```

## Validation

After implementation, run:

```bash
bun run atelier:index
bun run atelier:index:validate
bun run atelier:sample
bun run atelier:reader:validate
bun run atelier:transform:md-to-code
bun run atelier:transform:validate
bun run atelier:executor:validate
bun run atelier:ready
bun run atelier:verify
```

If a command is not yet implemented, implement it or report it as a machine-readable blocker.

## Final report

Return JSON plus a short summary.

```json
{
  "schema": "atelier.build-report/v1",
  "status": "pass | blocked | partial",
  "commands_run": [],
  "commands_not_run": [],
  "files_changed": [],
  "components_completed": [],
  "blockers": [],
  "next_action": "none"
}
```
