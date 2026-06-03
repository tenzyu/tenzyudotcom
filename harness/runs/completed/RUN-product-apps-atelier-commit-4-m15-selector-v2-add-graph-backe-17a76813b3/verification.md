# Verification: Commit 4 (M15: Selector v2)

## Typecheck
- `bun run typecheck` — passes ✓

## Tests
- `bun run test` — 122 pass, 0 fail ✓

## Changes
- `src/core/schema.ts`: Added SelectorV2Input, SelectorV2Trace, PermissionEnvelope types
- `src/core/context.ts`: Added buildGraphContextPlan, computePermissionEnvelope, SelectorV2Trace to ContextPlan
- `src/cli.ts`: Added --selector-v2 flag to context plan command
- `src/index.ts`: Exported new types and functions
- `src/__tests__/index-context-run.test.ts`: 3 new Selector v2 tests
