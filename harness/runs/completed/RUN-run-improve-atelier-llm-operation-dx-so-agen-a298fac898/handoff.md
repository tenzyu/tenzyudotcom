# Handoff

## Run Summary

Improved Atelier's LLM-facing DX so agents get a deterministic entry command, validation-free help, registry discovery through CLI/MCP, recovery commands on missing IDs, and machine-readable run init next actions.

## Assigned Roles

- `role.domain.harness-engineer`
- `role.core.implementer`

## Required Knowledge Loaded

- Generated run context in `context.md`
- Harness actions/roles/workflow registry context selected by Atelier

## What Changed

- Added shared LLM protocol helpers in `product/apps/atelier/src/core/llm-protocol.ts`.
- Updated CLI usage, nested help, role/path inference, workflow/role list commands, recovery diagnostics, and run init next actions.
- Updated MCP with workflow/role list tools and run init `policy`/`nextActions`.
- Updated context/run generation so missing workflow/role diagnostics carry suggestions and retry commands.
- Updated generated root adapters, generated Atelier skill, and top-level agent entry files to use the exact canonical command.
- Added focused tests for CLI, context planning, generated adapters, and MCP.

## Why It Changed

Agents were failing at the first Atelier command and then falling back to manual Markdown discovery. The change moves LLM operation details into a reusable protocol layer and makes failure messages actionable.

## Affected Files

- `product/apps/atelier/src/core/llm-protocol.ts`
- `product/apps/atelier/src/cli.ts`
- `product/apps/atelier/src/core/context.ts`
- `product/apps/atelier/src/core/runs.ts`
- `product/apps/atelier/src/core/mcp.ts`
- `product/apps/atelier/src/core/generate.ts`
- root/tool/root-adapter Markdown entry files
- Atelier tests and refreshed generated indexes

## Validation Result

Passed targeted tests, MCP tests outside the default sandbox, typecheck, build, doctor, and index freshness check. See `verification.md`.

## Remaining Risks

- The default sandbox hangs on MCP stdio child-process tests; unsandboxed execution passes.
- Doctor still reports existing non-blocking warnings/info unrelated to this run.

## Follow-Up Tasks

- Consider an explicit `atelier entrypoint list --json` or preset layer if more task-specific entrypoints are needed.
- Consider extending run init next actions for review/investigation workflows with workflow-specific shell commands.

## Knowledge Updates

No durable knowledge proposal was made; the reusable protocol is implemented in source and generated adapters.

