---
schema: harness/v1
kind: run
id: run.active.run-run-update-atelier-product-spec-in-readme-md-81c786517f.context
title: "RUN-run-update-atelier-product-spec-in-readme-md-81c786517f Context"
status: active
summary: "Compiled context pack for Update Atelier Product Spec in README.md and ROADMAP.md to position Atelier as an Agentic Software Development Control Plane centered on Artifact Graph, Reconciler, Policy Engine, and Agent Runtime, and prepare the work for implementation."
tags:
  - harness
  - context
---

# Context: RUN-run-update-atelier-product-spec-in-readme-md-81c786517f

## Agent Contract

- Read this file first and use it as the initial working context pack.
- Do not manually scan `harness/knowledge/**` before following this context.
- Read additional files only when this context says to expand, investigation proves this pack is insufficient, or a command/error references uncovered context.
- When expanding context, run `atelier context expand <RUN-ID> <DOC-ID-OR-PATH>` when possible and record the reason in `worklog.md`.

## Run

- Workflow: `workflow.isolated-run`
- Roles: `role.core.implementer`
- Target path: `.`
- Intent: Update Atelier Product Spec in README.md and ROADMAP.md to position Atelier as an Agentic Software Development Control Plane centered on Artifact Graph, Reconciler, Policy Engine, and Agent Runtime, and prepare the work for implementation.
- Context mode: `compact`

## Scope

Allowed by default:

- `.`
- `harness/runs/active/RUN-run-update-atelier-product-spec-in-readme-md-81c786517f`

Forbidden by default:

- unrelated product apps or packages
- dependency changes unless the task requires them
- broad harness restructuring outside this run
- completed run history unless diagnosing a repeated harness problem

## Compiled Required Context

### Handoff

Source: `harness/actions/phases/handoff.md`
ID: `phase.handoff`
Reason: required workflow phase 'phase.handoff'

Compiled context:

```md
# Phase: Handoff

Handoff is the minimum unit of cross-agent continuity.

## Output

Create or update:

```txt
handoff.md
```

Use `../artifacts/templates/handoff.md` when creating a new handoff file.

## Required sections

- run summary
- assigned roles
- required knowledge loaded
- what changed
- why it changed
- affected files
- validation result
- remaining risks
- follow-up tasks
- knowledge updates made or proposed

## Rules

- Write handoff for the next agent, not for status theater.
- Keep it concise and factual.
- Include skipped checks and known failures.
- Separate completed work from follow-ups.
- Do not copy raw command noise unless it is needed to diagnose a failure.
- Handoff should make the next human or agent cheaper.
```

### Implementation

Source: `harness/actions/phases/implementation.md`
ID: `phase.implementation`
Reason: required workflow phase 'phase.implementation'

Compiled context:

```md
# Phase: Implementation

Implementation makes the approved change inside scope.

## Output

- source or documentation diff
- `worklog.md` entries for important discoveries
- updated docs or migration notes when required

## Rules

- Make small, reversible changes.
- Stay inside allowed files.
- Follow the assigned role's scope and forbidden scope.
- Do not remove existing features unless explicitly approved.
- Do not silently change public APIs.
- Do not put app-specific logic inside shared packages.
- Do not perform unrelated refactors.
- Record follow-ups instead of broadening the run.
- If mutable work is happening, keep it inside `projectRoot/.worktrees/<task-slug>` as required by `worktree-isolation.md`.

## Quality gates

- Scope is respected.
- Role constraints are respected.
- Existing behavior is preserved unless intentionally changed.
- Follow-up work is recorded instead of hidden in the diff.
```

### Intake

Source: `harness/actions/phases/intake.md`
ID: `phase.intake`
Reason: required workflow phase 'phase.intake'

Compiled context:

```md
# Phase: Intake

Intake converts a human request into a bounded run.

## Primary perspective

Intake coordinator. This is a phase responsibility, not a standalone role.

## Output

Create or update:

```txt
brief.md
```

Use `../artifacts/templates/task.md` when creating a new brief.

## Required sections

- title
- background
- problem
- goal
- scope
- allowed files
- forbidden files
- non-goals
- constraints
- role assignment
- worktree isolation expectation
- validation commands
- acceptance criteria
- risks
- open questions

## Role assignment

Assign the smallest safe role set:

- primary role: owns the domain or main concern
- supporting roles: only when their knowledge bundle is needed
- reviewer role: for non-trivial or risky changes
- governance role: for cost, release, or policy concerns

## Rules

- Do not start broad implementation from a vague request.
- Ask for human decisions only when the scope cannot be bounded safely.
- Mark assumptions explicitly.
- Prefer a small first run over a broad rewrite.
- If an ADR-relevant decision is needed, interview the owner before implementation.
- For non-trivial mutable work, apply `worktree-isolation.md` before implementation or parallel AI handoff.
- Require `projectRoot/.worktrees/<task-slug>` for the worktree path; do not use `../.worktrees`.
- If the request is trivial documentation or formatting, use `workflows/direct-run.md`.
```

### Investigation

Source: `harness/actions/phases/investigation.md`
ID: `phase.investigation`
Reason: required workflow phase 'phase.investigation'

Compiled context:

```md
# Phase: Investigation

Investigation gathers enough evidence to plan safely.

## Output

Record findings in `plan.md` or `worklog.md`.

## Required checks

- affected files
- existing conventions
- current behavior
- suspected root cause, when debugging
- dependency impact
- uncertain areas
- required role knowledge checked
- optional role knowledge deliberately skipped

## Rules

- Inspect before implementing except for trivial edits.
- Prefer precise searches and project facts over broad reading.
- Mark assumptions explicitly.
- Do not invent repository facts.
- Use visible source, Nx project facts, package scripts, and existing docs as evidence.
- Do not load all `harness/knowledge`; follow the assigned role knowledge bundle.
```

### Verification

Source: `harness/actions/phases/verification.md`
ID: `phase.verification`
Reason: required workflow phase 'phase.verification'

Compiled context:

```md
# Phase: Verification

Verification proves that the run requirements were checked with relevant evidence.

## Primary perspective

Verifier. This is a phase responsibility, not a standalone role.

## Output

Create or update:

```txt
verification.md
```

Use `../artifacts/templates/verification.md` when creating a new verification file.

## Required sections

- commands run
- command results
- files inspected
- role knowledge checked
- visual checks performed, when relevant
- tests added or not added
- skipped checks and justification
- failures and follow-up recommendations
- conclusion

## Rules

- Use Nx through Bun for build, test, lint, typecheck, and verify work.
- Run the narrowest relevant checks first.
- For broad changes, run broad checks when practical.
- Commands must map to run requirements.
- If a command fails before testing the change, record the failure exactly.
- Manual checks must be described when automation is insufficient.
- Do not hide failures.
- Do not claim completion from a proxy signal that does not cover the requirements.

## High-risk verification

When verification is high-risk, assign `../roles/core/reviewer.md` separately.
```

### Implementer

Source: `harness/actions/roles/core/implementer.md`
ID: `role.core.implementer`
Reason: requested primary role

Compiled context:

```md
## Mission

Make source or documentation changes inside approved scope.

## Primary scope

- file edits listed by the run or plan
- focused fixes needed to satisfy acceptance criteria
- worklog updates for important discoveries

## Forbidden default scope

- removing existing features without explicit approval
- broad rewrites without a plan
- public API changes without migration notes
- app-specific logic inside shared packages
- unrelated refactors

## Outputs

- implementation diff
- `worklog.md` entries for important discoveries
- updated docs or migration notes when required

## Review criteria

- scope is respected
- existing behavior is preserved unless intentionally changed
- follow-up work is recorded instead of hidden in the diff
- assigned domain role constraints are not violated
```

### Isolated Run

Source: `harness/actions/workflows/isolated-run.md`
ID: `workflow.isolated-run`
Reason: requested workflow

Compiled context:

```md
## Purpose

Convert a human request into one bounded run executed through assigned roles, selected knowledge, lifecycle phases, verification evidence, and handoff.

## Completion standard

A run is not complete until:

- scope and non-goals are explicit
- assigned roles are recorded
- required role knowledge was checked or skipped with reason
- changed files stay inside scope
- relevant validation ran or skipped checks are justified
- verification evidence exists
- handoff records what changed, why, risks, and follow-ups
- durable knowledge updates were made or explicitly marked unnecessary
```

### Repository Instructions

Source: `harness/policies/repository.md`
ID: `policy.repository`
Reason: pinned by role 'role.core.implementer'; repository policy; required by role 'role.core.implementer'

Compiled context:

```md
# Repository Instructions

This repository is a Bun + Nx monorepo for tenzyu.com products.

Use Nx as the task runner for build, test, lint, typecheck, and verify work.
Prefer `bun nx run <project>:<target>` and `bun nx affected -t <target>` over
calling underlying tools directly from the root.

Core boundaries:

- `product/apps/*` may depend on `product/packages/*`.
- `product/packages/*` must not depend on app code.
- `@tenzyu/osu-skin-core` source must stay runtime-pure and must not import DOM,
  React, Tauri, Node runtime APIs, or app packages.
- `@tenzyu/ui` must expose public components through package exports, not source
  paths.
- Web route-local `_features` code must not become a shared dependency unless it
  is promoted into `src/features` or `src/lib`.

Run before handing off broad changes:

```bash
bun run policy:deps
bun nx run-many -t check
```
```

## Expansion Policy

Optional sources are not embedded by default. Expand only when their reason matches the concrete task.

- `harness/knowledge/incidents/README.md` - known problem or incident matched metadata signals
- `harness/knowledge/known-problems/index.md` - known problem or incident matched metadata signals
- `harness/knowledge/known-problems/tech-debt-tracker.md` - known problem or incident matched metadata signals
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

- `bun nx affected -t check`
- `bun run policy:deps`

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

`atelier run close RUN-run-update-atelier-product-spec-in-readme-md-81c786517f`
