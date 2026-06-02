# Verification: Atelier M2-M4

## Commands

- `bun nx run atelier:check`
  - Passed.
  - 9 tests passed across 3 files.
- `bun nx run atelier:build`
  - Passed.
- `bun nx run atelier:doctor -- --json`
  - Passed.
  - Summary: `ok: true`, `documentCount: 239`, `errorCount: 0`, `warningCount: 144`, `infoCount: 0`.
  - Remaining warnings are existing harness warnings for completed run metadata, legacy harness path references, and known broken doc links.
- `bun run ./src/cli.ts index --project-root ../../..`
  - Passed and wrote `.harness/generated/*.json`.
- `bun run ./src/cli.ts index --project-root ../../.. --check`
  - Passed; generated indexes are fresh.
- `bun nx run atelier:index-check`
  - Passed; generated indexes are fresh through the Nx target.
- `bun nx run atelier:context-preview -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --required-only`
  - Passed; argument forwarding through the Nx target works.
- `bun run ./src/cli.ts context preview --project-root ../../.. --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --required-only`
  - Passed; required context, skipped context, diagnostics, budget, and next command were emitted.
- `bun run policy:deps`
  - Passed.
- `git diff --check`
  - Passed.
