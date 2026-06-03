---
schema: harness/v1
kind: artifact
id: handoff.run-run-commit-6-static-policy-engine-m16-5-add--de9c2ff5f6
title: "Handoff: Commit 6 — Static Policy Engine"
status: active
---

## Run summary

Implemented M16.5 Static Policy Engine: permission modes, path/command/tool/approval rules, policy check/explain/simulate, CLI + MCP + GUI + Nx targets + tests.

## Assigned roles

- Primary: `role.core.implementer`

## Required knowledge loaded

- `role.core.implementer` (compiled by Atelier)
- `workflow.isolated-run` lifecycle
- `policy.repository` (repository conventions)

## What changed

### New file: `src/core/policy.ts`
- Types: `PermissionMode`, `PathRule`, `CommandRule`, `ToolRule`, `ApprovalPolicy`, `PolicyDecision`, `PolicyResult`, `PolicyConfig`
- Core functions: `evaluatePath` (glob matching), `evaluateCommand` (regex matching), `evaluateTool` (pipe-separated patterns), `evaluateApproval`, `checkPolicy`, `explainPolicy`, `simulatePolicy`
- Config: `loadPolicyConfig`, `savePolicyConfig` with sensible defaults (7 path rules, 6 command rules, 5 tool rules, 2 approval policies)

### Updated: `src/cli.ts`
- Imported `checkPolicy`, `explainPolicy`, `simulatePolicy`
- Added usage: `atelier policy check/explain/simulate`
- Added command description
- Added handler blocks for all three subcommands

### Updated: `src/core/mcp.ts`
- Imported `checkPolicy`, `explainPolicy`
- Added 2 MCP tools: `atelier_policy_check`, `atelier_policy_explain`
- Added to `MCP_TOOL_NAMES`

### Updated: `src/core/gui.ts`
- Imported `checkPolicy`, `explainPolicy`
- Added 2 GUI endpoints: `GET /api/policy/check?...`, `GET /api/policy/explain?...`

### Updated: `src/index.ts`
- Exported all policy types and functions

### Updated: `project.json`
- Added 3 Nx targets: `policy-check`, `policy-explain`, `policy-simulate`

### New file: `src/__tests__/policy.test.ts`
- 29 tests covering all core functions

## Why it changed

Roadmap M16.5: Static Policy Engine needed for governance of path, command, tool, and approval decisions before execution.

## Affected files

- `product/apps/atelier/src/core/policy.ts` (new)
- `product/apps/atelier/src/__tests__/policy.test.ts` (new)
- `product/apps/atelier/src/cli.ts`
- `product/apps/atelier/src/core/mcp.ts`
- `product/apps/atelier/src/core/gui.ts`
- `product/apps/atelier/src/index.ts`
- `product/apps/atelier/project.json`

## Validation result

- `bun run typecheck` — pass
- `bun test` — 165 pass, 0 fail across 14 files

## Remaining risks

- Default policy rules are hardcoded; users should customize via `harness/policies/config.json`
- Simulate MCP tool is not exposed (only check + explain are stateless)

## Follow-up tasks

- M17: Artifact Graph UI (next in roadmap)
- Customize default policy rules for the tenzyu.com monorepo
- Add `atelier_policy_simulate` MCP tool if needed

## Knowledge updates made or proposed

None.
