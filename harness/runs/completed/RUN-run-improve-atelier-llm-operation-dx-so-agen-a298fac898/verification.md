# Verification

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `bun test product/apps/atelier/src/__tests__/index-context-run.test.ts product/apps/atelier/src/__tests__/rename-generate.test.ts` | passed | 29 tests, 145 assertions. Covers role inference, retry diagnostics, validation-free help, CLI JSON run init, generated adapters. |
| `bun test product/apps/atelier/src/__tests__/mcp.test.ts` | passed outside sandbox | 11 tests, 39 assertions. The same stdio MCP tests hang inside the default sandbox before initialize; rerun with approved unsandboxed `bun test`. |
| `bun nx run atelier:context-plan -- --workflow workflow.isolated-run --role role.domain.harness-engineer --path product/apps/atelier --intent "verify atelier llm dx changes"` | passed | Context plan produced canonical render/run commands and no diagnostics. |
| `bun run ./product/apps/atelier/src/cli.ts run init --help` | passed | Nested help returns usage without requiring role/path/intent. |
| `bun run ./product/apps/atelier/src/cli.ts workflow list --json` | passed | Returns workflow registry JSON. |
| `bun run ./product/apps/atelier/src/cli.ts context plan --workflow isolated-run --intent "debug old agent command"` | expected failure with recovery | Reports `MISSING_WORKFLOW`, suggests `workflow.isolated-run`, and prints retry command with `--role role.core.implementer --path .`. |
| `bun nx run atelier:typecheck` | passed | TypeScript no-emit check. |
| `bun nx run atelier:build` | passed | Bun build and build tsconfig check. |
| `bun nx run atelier:doctor -- --json` | passed with existing warnings/info | 0 errors, 338 warnings, 54 info. Warnings are pre-existing harness hygiene items. |
| `bun nx run atelier:index` | passed | Refreshed generated indexes after source/generated doc changes. |
| `bun nx run atelier:index-check` | passed | Generated indexes are fresh. |

## Conclusion

The CLI, MCP, generated adapters, generated skill, run manifest, and tests now share the LLM entrypoint/recovery protocol. Remaining doctor warnings are unrelated existing harness metadata warnings.

