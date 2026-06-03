---
schema: harness/v1
kind: run
id: run.active.run-run-improve-atelier-llm-operation-dx-so-agen-a298fac898.context
title: "RUN-run-improve-atelier-llm-operation-dx-so-agen-a298fac898 Context"
status: active
summary: "Compiled context pack for Improve Atelier LLM operation DX so agents do not misuse Atelier, centralizing entrypoint specs/errors across CLI, MCP, docs, skills, and tests"
tags:
  - harness
  - context
---

# Context: RUN-run-improve-atelier-llm-operation-dx-so-agen-a298fac898

## Agent Contract

- Read this file first and use it as the initial working context pack.
- Do not manually scan `harness/knowledge/**` before following this context.
- Read additional files only when this context says to expand, investigation proves this pack is insufficient, or a command/error references uncovered context.
- When expanding context, run `atelier context expand <RUN-ID> <DOC-ID-OR-PATH>` when possible and record the reason in `worklog.md`.

## Run

- Workflow: `workflow.isolated-run`
- Roles: `role.domain.harness-engineer`, `role.core.implementer`
- Target path: ``
- Intent: Improve Atelier LLM operation DX so agents do not misuse Atelier, centralizing entrypoint specs/errors across CLI, MCP, docs, skills, and tests
- Context mode: `compact`

## Scope

Allowed by default:

- ``
- `harness/runs/active/RUN-run-improve-atelier-llm-operation-dx-so-agen-a298fac898`

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

### Actions

Source: `harness/actions/README.md`
ID: `actions.index`
Reason: required by role 'role.domain.harness-engineer'

Compiled context:

```md
# Actions

Actions define how AI-assisted work moves through the harness.

Start here:

1. `workflows/README.md` — choose the callable workflow.
2. `roles/README.md` — assign the smallest safe role set.
3. Load only the knowledge listed by the assigned roles.
4. Use `phases/` as lifecycle modules when the workflow asks for them.
5. Use `artifacts/templates/` for run record output shapes.

## Directory contract

```txt
workflows/ = callable entrypoints
roles/     = context routing profiles and responsibility boundaries
phases/    = lifecycle modules
artifacts/ = output shapes
```

## Core rule

Roles are not personas. A role is a context selector.

```txt
Role = scope + required knowledge + optional knowledge + allowed actions + outputs + review criteria
```

Do not load all `harness/knowledge` by default. Assign roles first, then load only the knowledge named by those roles plus the workflow and phase files needed for the run.

## Phase rule

A phase is a lifecycle step. It should define common procedure, not product-specific context.

If a role only exists to execute one phase, inline that responsibility into the phase file. Keep only roles that can be assigned independently or own a durable domain boundary.

## Role assignment rule

Each non-trivial run should identify:

- primary role
- supporting roles, when needed
- reviewer role, when risk is non-trivial
- governance role, when cost, release, or policy concerns are material

## Stable flow

```txt
request
  -> workflow selection
  -> role assignment
  -> role knowledge loading
  -> phase execution
  -> observation evidence
  -> handoff
  -> knowledge promotion, only when durable
```
```

### Implementer

Source: `harness/actions/roles/core/implementer.md`
ID: `role.core.implementer`
Reason: requested supporting role

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

### Harness Engineer

Source: `harness/actions/roles/domain/harness-engineer.md`
ID: `role.domain.harness-engineer`
Reason: requested primary role

Compiled context:

```md
## Mission

Maintain the harness itself as a role-routed, run-based, evidence-driven control layer.

## Primary scope

- `harness/**`
- root AI adapter files
- AI workflow, policy, run, and knowledge documentation

## Forbidden default scope

- product runtime changes without product/domain role
- generic agent-runtime work not tied to repo needs
- duplicating long policy text in root adapters
- adding workflows that force unnecessary context loading

## Outputs

- scoped harness diff
- updated routing or policy docs when structure changes
- reference repair notes when paths move
- `verification.md`
- `handoff.md`

## Review criteria

- root adapters stay short
- canonical policy stays under `harness`
- run history and stable knowledge remain separate
- role files route context instead of duplicating knowledge
- workflows are callable and do not require broad context loading
```

### Roles

Source: `harness/actions/roles/README.md`
ID: `roles.registry`
Reason: required by role 'role.domain.harness-engineer'

Compiled context:

```md
# Roles

Roles are context routing profiles and responsibility boundaries.

A role is not a persona. Assigning a role decides what knowledge should be loaded, what scope is allowed, what outputs are required, and how the result will be reviewed.

## Role schema

Each role should define:

- mission
- activation triggers
- primary scope
- forbidden default scope
- required knowledge
- optional knowledge
- applicable phases
- outputs
- review criteria

## Core roles

| Role | Responsibility |
| --- | --- |
| `core/architect.md` | boundaries, plans, dependency impact, ADR candidates |
| `core/implementer.md` | scoped source or documentation changes |
| `core/reviewer.md` | independent requirement, risk, and verification review |
| `core/librarian.md` | handoff, durable knowledge, documentation continuity |

## Domain roles

| Role | Scope |
| --- | --- |
| `domain/web-app-engineer.md` | `product/apps/web` |
| `domain/workbench-app-engineer.md` | Workbench frontend |
| `domain/rust-tauri-engineer.md` | Tauri and Rust backend |
| `domain/design-system-engineer.md` | `@tenzyu/ui` |
| `domain/repo-ops-engineer.md` | Nx, Bun, Nix, CI, scripts, linter |
| `domain/harness-engineer.md` | `harness` |

## Governance roles

| Role | Scope |
| --- | --- |
| `governance/cost-controller.md` | context budget and duplicate research prevention |
| `governance/release-manager.md` | rollout, release notes, rollback |

## Creation rule

Create or keep a role only when it satisfies at least one of these:

- it owns a durable domain boundary
- it has a distinct required knowledge bundle
- it has distinct review criteria
- it can be assigned across multiple workflows or phases

Do not create a role for a single phase. Inline one-phase responsibilities into `actions/phases/`.

## Assignment rule

Assign the smallest role set that can safely move the run forward.
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

### Workflow Registry

Source: `harness/actions/workflows/README.md`
ID: `workflows.registry`
Reason: required by role 'role.domain.harness-engineer'

Compiled context:

```md
# Workflow Registry

Use this file as the callable workflow entrypoint.

## Default choice

| Situation | Call |
| --- | --- |
| Non-trivial mutable work | `isolated-run.md` |
| Small scoped docs/config/reference fix | `direct-run.md` |
| Investigation only | `investigation-only.md` |
| Independent review | `review-change.md` |
| Review findings already exist | `review-to-merge.md` |
| Issue or request needs run conversion | `issue-to-run.md` |
| Completed run needs PR packaging | `run-to-pr.md` |
| Durable lesson or decision should be promoted | `promote-knowledge.md` |
| Architecture decision should become ADR | `distill-adr.md` |

## Required invocation sequence

1. Select one workflow from this registry.
2. Assign one primary role from `../roles/`.
3. Add supporting roles only when their knowledge bundle or review criteria are needed.
4. Load role files before broad knowledge exploration.
5. Load required knowledge listed by the assigned roles.
6. Execute only the phases named by the workflow.

## Rule

Workflows are callable. Roles route context. Phases are lifecycle modules.

Do not call phase files directly unless a workflow explicitly names them.

## References

- roles: `../roles/`
- phases: `../phases/`
- artifact templates: `../artifacts/templates/`
```

### Harness Classification Rules

Source: `harness/canon/classification.md`
ID: `canon.classification`
Reason: required by role 'role.domain.harness-engineer'

Compiled context:

```md
# Harness Classification Rules

Use this decision tree for Markdown placement.

```text
Does it reduce repeated human input?
  -> knowledge/

Does it constrain action or completion?
  -> policies/

Does it define a lifecycle phase, role, or artifact shape?
  -> actions/

Is it one concrete work execution or backlog item?
  -> runs/

Does it summarize evidence, risk, audit, or review across work?
  -> observations/

Does it bootstrap an external tool into the harness?
  -> adapters/

Is it historical but no longer canonical?
  -> legacy/

Is it product runtime content or conventional package documentation?
  -> keep in product/ or root.
```

Human-only documentation may stay under `docs/`. Product runtime files must not be moved merely because they are Markdown.
```

### Completion Standard

Source: `harness/canon/completion-standard.md`
ID: `canon.completion-standard`
Reason: required by role 'role.domain.harness-engineer'

Compiled context:

```md
# Completion Standard

A non-trivial run may be closed only when all of the following are true or explicitly deferred by the human owner:

- scope is bounded
- allowed and forbidden files are clear
- non-goals are preserved
- relevant validation ran or skipped checks are justified
- package and architecture boundaries are respected
- public API impact is documented when relevant
- verification evidence exists
- handoff records what changed, why, risks, and follow-ups
- durable memory updates were made or explicitly marked unnecessary

Proxy signals are not enough. A passing command that does not cover the requirement is not proof of completion.
```

### Harness Model

Source: `harness/canon/model.md`
ID: `canon.model`
Reason: required by role 'role.domain.harness-engineer'

Compiled context:

```md
# Harness Model

## Core equation

```text
Run = Task + Assigned Roles + Selected Knowledge + Policy + Action + Observation + Handoff
```

## Knowledge

Knowledge reduces repeated human input. It contains curated, durable context that future work should consult.

Examples: repo map, ADRs, product specs, design rules, known problems, lessons, component notes, tool facts, architecture contracts.

Knowledge should not be loaded globally. It should be selected through assigned roles.

## Role

Role routes context and responsibility.

```text
Role = scope + required knowledge + optional knowledge + allowed actions + outputs + review criteria
```

A role is not a persona. It is the unit that prevents the agent from searching all knowledge.

## Action

Action controls the lifecycle. It turns vague requests into bounded work.

Standard lifecycle:

```text
workflow selection -> role assignment -> knowledge loading -> intake -> investigation -> plan -> implementation -> verification -> review -> handoff -> knowledge promotion
```

## Observation

Observation reduces repeated human review. It records commands, results, failures, skipped checks, changed files, risk, review findings, and handoff.

## Promotion rule

Observation is not automatically Knowledge. Promote only durable, recurring, verified facts that reduce future work.
```

### Repository Map

Source: `harness/knowledge/repo-map.md`
ID: `knowledge.repo-map`
Reason: pinned by role 'role.domain.harness-engineer'

Compiled context:

```md
# Repository Map

This memory summarizes stable repository ownership. Inspect the current tree
before editing because this file may lag behind active work.

## Workspace

- Root package manager: Bun.
- Task runner: Nx, invoked through Bun.
- Apps root: `product/apps`.
- Packages root: `product/packages`.
- AI organization root: `harness`.
- Repository operations root: `repo-ops`.
- Legacy repo-ops harness content was moved into `harness/legacy/ai-org/docs`; `harness/legacy/ai-org/docs` is a redirect only.

## Projects

| Project | Path | Owner role |
| --- | --- | --- |
| `atelier` | `product/apps/atelier` | Repo Ops Engineer / Harness Engineer |
| `web` | `product/apps/web` | Web App Engineer |
| `skin-workbench` | `product/apps/osu-skin-workbench` | Workbench App Engineer and Rust/Tauri Engineer |
| `ui` | `product/packages/ui` | Design System Engineer |
| `osu-skin-core` | `product/packages/osu-skin-core` | Architect / domain package owner |
| `linter` | `product/packages/linter` | Repo Ops Engineer |
| `ui-react` | `product/packages/ui-react` | TODO: confirm ownership and target status |

## Boundary Memory

- Apps may depend on packages.
- Packages must not depend on apps.
- `@tenzyu/osu-skin-core` is runtime-pure.
- `@tenzyu/ui` owns shared UI primitives and must not absorb app-specific logic.
- Tauri/native behavior belongs under the workbench native boundary.
- Repository validation and policy automation belongs under `repo-ops` or `@tenzyu/linter`.

## Validation Memory

- Use `bun nx run <project>:<target>` for project checks.
- Use `bun nx run-many -t check` for broad checks when scope warrants it.
- Use `bun run policy:deps` for dependency policy validation.
- Record Nx loading failures in task verification instead of silently switching tools.
```

### Context Budget

Source: `harness/policies/context-budget.md`
ID: `policy.context-budget`
Reason: required by role 'role.domain.harness-engineer'

Compiled context:

```md
## Rules

- Start at the lowest viable level.
- Assign roles before loading broad knowledge.
- Prefer role-required knowledge over directory-wide reading.
- Prefer index files that route to specific documents.
- Load source files only after identifying the affected area.
- Do not load all docs, knowledge, or run history by default.
- Summarize discoveries in `worklog.md` and `handoff.md`.
- Keep stable knowledge small and durable.
```

### Repository Instructions

Source: `harness/policies/repository.md`
ID: `policy.repository`
Reason: pinned by role 'role.core.implementer'; pinned by role 'role.domain.harness-engineer'; repository policy; required by role 'role.core.implementer'; required by role 'role.domain.harness-engineer'

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

### tenzyudotcom Harness

Source: `harness/README.md`
ID: `harness.readme`
Reason: required by role 'role.domain.harness-engineer'

Compiled context:

```md
# tenzyudotcom Harness

This directory is the canonical local harness for AI-assisted work in `tenzyudotcom`.

It is not a generic autonomous agent framework. It is the repository-owned control layer that turns agent work into scoped tasks, reusable knowledge, constrained action, observable evidence, and durable handoff.

## Operating Model

```text
Knowledge   = reduces repeated human input
Action      = controls the task lifecycle
Observation = reduces repeated human review
Run         = one bounded execution record
Policy      = action boundary and completion constraint
Adapter     = thin external-agent entrypoint
```

The core loop is:

```text
Knowledge -> Action -> Observation -> Knowledge
```

An executor may be Codex, Claude Code, Gemini, opencode, Hermes, a shell script, or a human. The executor may change. The harness contract remains.

## Canonical Directories

| Directory | Role |
| --- | --- |
| `canon/` | Harness definition, model, glossary, and legacy source records. |
| `knowledge/` | Curated reusable context: architecture, product specs, ADRs, rules, known problems, and lessons. |
| `policies/` | Constraints: permissions, scope, quality, decision ownership, context budget, tool usage, release, and verification rules. |
| `actions/` | Work lifecycle: workflows, roles, and artifact templates. |
| `runs/` | Concrete work records: task, plan, worklog, verification, review, handoff. |
| `observations/` | Cross-run audits, reports, checklists, and observation templates. |
| `adapters/` | Thin tool-specific bootstraps for root AGENTS/CLAUDE/GEMINI and other executors. |
| `legacy/` | Historical documents retained for traceability but not canonical. |

## Completion Standard

A non-trivial run is not complete because an agent says it is complete. It is complete only when scope, non-goals, validation, evidence, risk, handoff, and memory-promotion decisions are recorded.

## Non-Core by Default

Do not add an agent engine, tool marketplace, plugin runtime, MCP runtime, dashboard, daemon, or multi-agent coordinator until the repository has a repeated problem that cannot be solved by Knowledge / Action / Observation / Run / Policy / Adapter.
```

## Expansion Policy

Optional sources are not embedded by default. Expand only when their reason matches the concrete task.

- `harness/knowledge/known-problems/index.md` - known problem or incident matched metadata signals

Skipped sources:

- `domain-specific product specs` - optional directory or unresolved reference was not expanded
- `domain-specific rules named by the assigned domain role` - optional directory or unresolved reference was not expanded
- `harness/actions/phases/adr-distillation.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/knowledge-promotion.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/planning.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/review.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/worktree-isolation.md` - conditional workflow phase is not loaded by default
- `harness/knowledge/decisions/adr/0001-ai-org-standard.md` - optional role knowledge did not match metadata signals
- `harness/knowledge/decisions/adr/0004-ai-org-llm-doc-consolidation.md` - optional role knowledge did not match metadata signals
- `harness/knowledge/known-problems/` - optional directory or unresolved reference was not expanded
- `harness/knowledge/lessons/` - optional directory or unresolved reference was not expanded
- `harness/knowledge/rules/intelligence/intelligence-decision-policy.md` - optional role knowledge did not match metadata signals
- `harness/knowledge/rules/intelligence/intelligence-harness-memory-model.md` - optional role knowledge did not match metadata signals
- `harness/legacy/ai-org/` - optional directory or unresolved reference was not expanded
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

`atelier run close RUN-run-improve-atelier-llm-operation-dx-so-agen-a298fac898`
