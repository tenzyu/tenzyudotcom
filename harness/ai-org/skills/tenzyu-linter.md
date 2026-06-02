# Skill: Tenzyu Linter Guardrails

Read this before using or changing `@tenzyu/linter`.

## Triggers

Use when running `bun run lint:workspace`, `bun nx run linter:*`, `tenzyu-linter`, or editing `product/packages/linter/**`.

## Current Linter

`@tenzyu/linter` lives at `product/packages/linter` and exposes CLI rules through `src/cli.ts`.

Default CLI rules:

- `no-reexport`
- `feature-slice-boundaries`
- `symbol-ownership`
- `server-action-guards`
- `restricted-import-usage`
- `forbidden-files`
- `workspace-boundaries`

The optional `rules` document linter is not fully exposed through the CLI yet.

## Commands

```bash
bun nx run linter:check
bun nx run linter:lint-rules
bun run lint:workspace
```

## Rules

- Run linter tasks through Nx when possible.
- Treat linter findings as policy boundary signals, not formatting suggestions.
- If changing rules, update the matching design rule or guardrail document.
- Do not loosen policy checks without task approval and verification.
- Record skipped linter checks in `verification.md`.
