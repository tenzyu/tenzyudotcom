---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-commit-4-m15-selector-v2-add-graph-backe-17a76813b3.context
title: "RUN-product-apps-atelier-commit-4-m15-selector-v2-add-graph-backe-17a76813b3 Context"
status: active
summary: "Compiled context pack for Commit 4 (M15: Selector v2) — Add graph-backed selector v2 to context.ts with SelectorV2Input, SelectorV2Trace, computePermissionEnvelope, and --selector-v2 CLI flag."
tags:
  - harness
  - context
---

# Context: RUN-product-apps-atelier-commit-4-m15-selector-v2-add-graph-backe-17a76813b3

## Agent Contract

- Read this file first and use it as the initial working context pack.
- Do not manually scan `harness/knowledge/**` before following this context.
- Read additional files only when this context says to expand, investigation proves this pack is insufficient, or a command/error references uncovered context.
- When expanding context, run `atelier context expand <RUN-ID> <DOC-ID-OR-PATH>` when possible and record the reason in `worklog.md`.

## Run

- Workflow: `workflow.isolated-run`
- Roles: `role.core.implementer`
- Target path: `product/apps/atelier`
- Intent: Commit 4 (M15: Selector v2) — Add graph-backed selector v2 to context.ts with SelectorV2Input, SelectorV2Trace, computePermissionEnvelope, and --selector-v2 CLI flag.
- Context mode: `linked`

## Scope

Allowed by default:

- `product/apps/atelier`
- `harness/runs/active/RUN-product-apps-atelier-commit-4-m15-selector-v2-add-graph-backe-17a76813b3`

Forbidden by default:

- unrelated product apps or packages
- dependency changes unless the task requires them
- broad harness restructuring outside this run
- completed run history unless diagnosing a repeated harness problem

## Compiled Required Context

## Required Context

- `harness/actions/phases/handoff.md` - required workflow phase 'phase.handoff'
- `harness/actions/phases/implementation.md` - required workflow phase 'phase.implementation'
- `harness/actions/phases/intake.md` - required workflow phase 'phase.intake'
- `harness/actions/phases/investigation.md` - required workflow phase 'phase.investigation'
- `harness/actions/phases/verification.md` - required workflow phase 'phase.verification'
- `harness/actions/roles/core/implementer.md` - requested primary role
- `harness/actions/workflows/isolated-run.md` - requested workflow
- `harness/policies/repository.md` - pinned by role 'role.core.implementer'; repository policy; required by role 'role.core.implementer'

## Optional Context

- `harness/knowledge/incidents/README.md` - known problem or incident matched metadata signals
- `harness/knowledge/known-problems/index.md` - known problem or incident matched metadata signals
- `harness/knowledge/rules/foundations/foundation-authored-content-management.md` - matched role selectors
- `harness/knowledge/rules/foundations/foundation-dependency-inversion.md` - matched role selectors
- `harness/knowledge/rules/foundations/foundation-owner-placement-layers.md` - matched role selectors
- `harness/knowledge/rules/foundations/foundation-promotion-by-usage.md` - matched role selectors
- `harness/knowledge/rules/foundations/foundation-tool-boundaries.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-actions-mount-through-assemble.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-apply-di-before-ui-assembly.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-component-separation.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-editor-errors-and-blog-saving-should-cross-boundaries-via-port.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-file-role-contract.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-site-owned-github-content-assembly.md` - matched role selectors
- `harness/knowledge/rules/intelligence/intelligence-decision-policy.md` - matched role selectors
- `harness/knowledge/rules/reliability/reliability-content-version-normalization.md` - matched role selectors
- `harness/knowledge/rules/reliability/reliability-fault-tolerance.md` - matched role selectors
- `harness/knowledge/rules/reliability/reliability-metadata-safety.md` - matched role selectors

## Skipped Context

- `domain-specific product specs` - optional directory or unresolved reference was not expanded
- `domain-specific rules named by the assigned domain role` - optional directory or unresolved reference was not expanded
- `harness/actions/phases/adr-distillation.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/knowledge-promotion.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/planning.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/review.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/worktree-isolation.md` - conditional workflow phase is not loaded by default
- `harness/knowledge/known-problems/` - optional directory or unresolved reference was not expanded
- `harness/knowledge/lessons/` - optional directory or unresolved reference was not expanded
- `harness/runs/completed/**` - completed run history is skipped by default

## Expansion Policy

Optional sources are not embedded by default. Expand only when their reason matches the concrete task.

- `harness/knowledge/incidents/README.md` - known problem or incident matched metadata signals
- `harness/knowledge/known-problems/index.md` - known problem or incident matched metadata signals
- `harness/knowledge/rules/foundations/foundation-authored-content-management.md` - matched role selectors
- `harness/knowledge/rules/foundations/foundation-dependency-inversion.md` - matched role selectors
- `harness/knowledge/rules/foundations/foundation-owner-placement-layers.md` - matched role selectors
- `harness/knowledge/rules/foundations/foundation-promotion-by-usage.md` - matched role selectors
- `harness/knowledge/rules/foundations/foundation-tool-boundaries.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-actions-mount-through-assemble.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-apply-di-before-ui-assembly.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-component-separation.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-editor-errors-and-blog-saving-should-cross-boundaries-via-port.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-file-role-contract.md` - matched role selectors
- `harness/knowledge/rules/implementation/impl-site-owned-github-content-assembly.md` - matched role selectors
- `harness/knowledge/rules/intelligence/intelligence-decision-policy.md` - matched role selectors
- `harness/knowledge/rules/reliability/reliability-content-version-normalization.md` - matched role selectors
- `harness/knowledge/rules/reliability/reliability-fault-tolerance.md` - matched role selectors
- `harness/knowledge/rules/reliability/reliability-metadata-safety.md` - matched role selectors

Skipped sources:

- `domain-specific product specs` - optional directory or unresolved reference was not expanded
- `domain-specific rules named by the assigned domain role` - optional directory or unresolved reference was not expanded
- `harness/actions/phases/adr-distillation.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/knowledge-promotion.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/planning.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/review.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/worktree-isolation.md` - conditional workflow phase is not loaded by default
- `harness/knowledge/known-problems/` - optional directory or unresolved reference was not expanded
- `harness/knowledge/lessons/` - optional directory or unresolved reference was not expanded
- `harness/runs/completed/**` - completed run history is skipped by default

## Investigation Steps

- Identify the concrete files and exported surfaces involved.
- Check whether selected constraints apply before editing.
- Record findings and any context expansion in `worklog.md`.
- Update `brief.md` or `plan.md` before expanding scope materially.

## Implementation Steps

- Keep edits scoped to the target path and assigned role boundaries.
- Preserve repository dependency boundaries and local project conventions.
- Avoid unrelated refactors.
- Record verification evidence before claiming completion.

## Verification

- `bun nx run atelier:check`
- `bun nx run atelier:build`
- `bun run policy:deps when the change is broad`

## Required Artifacts

- `brief.md`
- `context.md`
- `context.manifest.json`
- `worklog.md` for non-trivial implementation notes
- `verification.md`
- `handoff.md`

## Diagnostics

- None

## Closing Command

`atelier run close RUN-product-apps-atelier-commit-4-m15-selector-v2-add-graph-backe-17a76813b3`
