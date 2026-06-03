---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
pattern: simple
id: knowledge.product-spec.atelier-roadmap
title: Atelier Roadmap
status: active
summary: Implementation roadmap for the local harness compiler, doctor, context router, and run control plane.
tags:
  - atelier
  - roadmap
  - harness
  - implementation-plan
  - domain:atelier
  - kind:roadmap
  - domain:harness
  - kind:plan
  - kind:spec
  - status:active
freshness:
  source: authored
  update_policy: review_required
affordances:
  declared: [context, skill-candidate]
---

# Atelier Roadmap

This roadmap defines the implementation path for Atelier.

The order matters. Atelier must first make the existing harness safer before it attempts to become a GUI, MCP server, or automatic knowledge growth system.

## Guiding Rule

Do not build a general platform first.

Build the minimum system that makes the current harness:

```text
inspectable
validatable
queryable
reproducible
agent-usable
```

Only after this loop works should the project add MCP, GUI, bulk editing, or automatic promotion.

## Milestone Overview

```text
M0: Harness source contract
M1: Doctor
M2: Index compiler
M3: Role-routed context plan and render
M4: Run init and context manifest
M5: Run close and completion gate
M6: Knowledge proposal and promotion
M7: Symbolic ID rename
M8: Generated skills and adapters
M9: MCP server
M10: Atelier GUI
M11: Repo-map and path ownership generation
M12: Optional semantic expansion
```

## M0: Harness Source Contract

### Goal

Define the minimum object contract for harness Markdown without forcing the whole repository into a strict schema.

### Scope

Create or update:

```text
harness/knowledge/product-specs/atelier/README.md
harness/knowledge/product-specs/atelier/ROADMAP.md
product/apps/atelier/src/core/schema.ts
product/apps/atelier/src/core/frontmatter.ts
```

### Requirements

- Define common frontmatter fields.
- Support `schema: harness/v1`.
- Support `kind`.
- Treat completed run history as loose historical text; it should not require stable IDs.
- Preserve legacy metadata under `x.legacy` when it should not become routing metadata.
- Require YAML array tags for deterministic indexing.
- Keep Knowledge-to-Role links one-way by forbidding hand-maintained `knowledge.roles`.
- Require domain roles to provide routing metadata through `selectors` and `pinned`.
- Support stable symbolic `id`.
- Support permissive parsing with unknown extension fields.
- Do not require completed runs to pass strict schema.
- Define strictness levels.

### Implementation Notes

Recommended strictness:

```text
strict:
  harness/actions/roles/**
  harness/actions/workflows/**
  harness/actions/phases/**

indexed:
  harness/knowledge/**
  harness/policies/**

loose:
  harness/runs/**
  harness/legacy/**
  harness/canon/legacy/**
```

### Acceptance Criteria

- A parser can read frontmatter and body from every `harness/**/*.md`.
- Missing frontmatter is reported but does not fail loose areas.
- Strict areas fail on invalid or missing required fields.
- IDs are collected into a symbol table.
- Unknown frontmatter fields are preserved.

### Non-Goals

- No GUI.
- No MCP.
- No vector search.
- No automatic knowledge promotion.

## M1: Doctor

### Goal

Detect harness corruption before adding more automation.

### Commands

```bash
atelier doctor
atelier doctor --json
atelier doctor --fix
```

### Diagnostics

Implement diagnostics for:

```text
DUPLICATE_ID
MISSING_ID
INVALID_FRONTMATTER
UNKNOWN_KIND
BROKEN_MARKDOWN_LINK
UNRESOLVED_ID_REFERENCE
OLD_HARNESS_AI_ORG_REFERENCE
STALE_GENERATED_INDEX
MISSING_ROLE
MISSING_WORKFLOW
MISSING_PHASE
ORPHAN_KNOWLEDGE
ROLE_SELECTOR_EMPTY
ROLE_SELECTOR_TOO_BROAD
CONTEXT_BUDGET_EXCEEDED
```

### Error / Warning Policy

Errors:

- duplicate ID
- invalid YAML in strict documents
- unresolved required reference
- broken required Markdown link
- missing workflow or role referenced by a strict document

Warnings:

- missing metadata in indexed documents
- completed run history that still has generated frontmatter
- legacy metadata left at top level instead of under `x.legacy`
- orphan knowledge
- old paths in completed run history
- broad selectors
- low-value optional context

Current harness guidance outside completed run history should treat removed legacy paths as errors.

### Safe Fixes

`--fix` may fix:

- stale generated indexes
- known old paths with a single unambiguous replacement
- generated adapter content
- generated skills

`--fix` must not:

- edit decisions
- promote knowledge
- change policy semantics
- delete run history

### Acceptance Criteria

- `atelier doctor` reports old `legacy ai-org path` references.
- `atelier doctor` reports broken local Markdown links.
- `atelier doctor` reports duplicate IDs.
- `atelier doctor --json` produces stable machine-readable diagnostics.
- `atelier doctor --fix` is dry-run by default or clearly reports all writes.

## M2: Index Compiler

### Goal

Compile harness Markdown into generated indexes.

### Commands

```bash
atelier index
atelier index --check
```

### Generated Files

```text
.harness/generated/docs.json
.harness/generated/ids.json
.harness/generated/knowledge-index.json
.harness/generated/workflow-index.json
.harness/generated/role-bundles.json
.harness/generated/diagnostics.json
```

### docs.json

Must include:

- id
- kind
- path
- title
- status
- summary
- tags
- sha256
- frontmatter
- headings

### ids.json

Must map:

```text
symbolic id -> path, kind, status, sha256
```

### knowledge-index.json

Must group knowledge by:

- knowledge_type
- tags
- scope paths
- status
- impact

### workflow-index.json

Must list callable workflows and referenced phases.

### role-bundles.json

First version may include:

- pinned documents
- selector declarations
- matched documents
- reasons
- warnings

### Acceptance Criteria

- Running `atelier index` twice produces stable output.
- Running `atelier index --check` fails when generated files are stale.
- Deleted docs disappear from indexes.
- File moves do not change IDs.
- ID collision fails.

## M3: Role-Routed Context Plan and Render

### Goal

Create selected context from workflow + role + path + intent, and render the agent-readable context pack without creating a run.

### Commands

```bash
atelier context plan \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth" \
  --mode compact

atelier context render \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth" \
  --mode compact
```

### Selection Phases

1. Load workflow.
2. Load primary role.
3. Load supporting roles, if provided.
4. Add workflow phases.
5. Add role pinned documents.
6. Add repository policy.
7. Match knowledge by path selectors.
8. Match knowledge by tag selectors.
9. Add known problems or incidents when directly relevant.
10. Emit optional candidates separately.

### Output

Human-readable output:

```text
Required Context
Optional Context
Skipped Context
Diagnostics
Token Estimate
Next Render Command
Next Run Init Command
```

JSON output:

```bash
atelier context plan ... --json
```

### Acceptance Criteria

- Plan works without creating a run.
- Plan explains why each selected document was included.
- Plan lists skipped broad contexts.
- Plan warns when selected context exceeds budget.
- Plan supports `--required-only`.
- Render supports `--mode compact`, `--mode full`, and `--mode linked`, and those modes visibly change the rendered context body.

## M4: Run Init and Context Manifest

### Goal

Materialize the rendered context pack into a run.

### Command

```bash
atelier run init \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth" \
  --mode compact
```

### Generated Run Structure

```text
harness/runs/active/<RUN-ID>/
  brief.md
  context.md
  context.manifest.json
```

### context.md

Must be optimized for agents as the first file they read for the run.

It is not only a selected-source link list and it is not a raw copy of all
selected source documents. It is a compiled context pack that embeds the
required constraints, excerpts, procedures, and judgment material needed to
start the task.

It should include:

- workflow
- assigned roles
- agent contract
- scope
- compiled required context
- selected context files
- exact instructions
- skipped context
- expansion policy
- required artifacts
- closing command

### context.manifest.json

Must include:

- run ID
- workflow ID
- role IDs
- input path and intent
- selected documents
- selection reasons
- sha256 of selected documents
- generated timestamp
- budget estimate
- context mode
- expansion records

### Acceptance Criteria

- `run init` creates a deterministic run ID unless a custom ID is provided.
- Generated `context.md` is readable by an agent without reading the entire harness.
- Default `context.md` mode is `compact`.
- `full` mode embeds larger required source bodies when practical.
- `linked` mode remains available for low-cost human plan review.
- Generated manifest can be checked later for hash mismatch.
- No full document bodies are copied into the manifest.

### Context Expansion

```bash
atelier context expand RUN-ID knowledge.rule.example
```

Expansion must append the new context to `context.md`, record provenance and
hashes in `context.manifest.json`, and update `worklog.md` when it exists.

## M5: Run Close and Completion Gate

### Goal

Prevent agents from claiming completion without evidence.

### Command

```bash
atelier run close RUN-ID
```

### Checks

For non-trivial runs, require:

- `brief.md`
- `context.md`
- `context.manifest.json`
- `verification.md`
- `handoff.md`

Require review when:

- workflow requires review
- security-sensitive files changed
- public API changed
- broad refactor occurred
- the run explicitly assigned a review role

### Validation

`run close` must check:

- context manifest exists
- selected document hashes are recorded
- doctor errors do not affect the run
- verification exists
- handoff exists
- skipped checks are justified
- knowledge proposals are handled or explicitly deferred

### Acceptance Criteria

- Missing `verification.md` fails for non-trivial runs.
- Missing `handoff.md` fails for non-trivial runs.
- Hash mismatch reports changed context.
- Completed trivial direct runs may close with a lighter standard.
- Command output explains exactly what is missing.

## M6: Knowledge Proposal and Promotion

### Goal

Allow the harness to grow from evidence without corrupting durable knowledge.

### Commands

```bash
atelier knowledge propose --from-run RUN-ID --kind rule --title "..."
atelier knowledge promote PROPOSAL_PATH
atelier knowledge reject PROPOSAL_PATH
```

### Proposal Location

Preferred:

```text
harness/runs/active/<RUN-ID>/knowledge-proposals/
```

For cross-run proposals:

```text
.harness/proposals/knowledge/
```

### Proposal Rules

A proposal must include:

- source run
- evidence
- proposed knowledge type
- proposed title
- proposed tags
- why it should recur
- why it is not already covered

### Promotion Checks

Before promotion:

- check duplicate candidates
- validate frontmatter
- assign stable ID
- choose destination
- update index
- update diagnostics
- preview role bundle impact

### Acceptance Criteria

- Knowledge is not promoted automatically from raw run logs.
- Promotion creates valid Markdown under `harness/knowledge`.
- Promotion records provenance.
- Duplicate knowledge warning is shown before write.
- Rejected proposals can be archived without deleting run evidence.

## M7: Symbolic ID Rename

### Goal

Make ID changes safe and global.

### Commands

```bash
atelier id rename OLD_ID NEW_ID
atelier id rename OLD_ID NEW_ID --write
```

### Requirements

- Preview affected files.
- Update frontmatter.
- Update symbolic references.
- Update generated indexes.
- Refuse if `NEW_ID` already exists.
- Preserve path-independent ID philosophy.

### Acceptance Criteria

- All references to `OLD_ID` are updated.
- Generated indexes contain `NEW_ID`.
- Doctor reports no unresolved `OLD_ID`.
- Operation can run in dry-run mode.

## M8: Generated Skills and Adapters

### Goal

Make agents use Atelier without duplicating harness policy.

### Generated Outputs

```text
.harness/generated/skills/atelier.md
.harness/generated/skills/workflows/isolated-run.md
.harness/generated/skills/roles/web-app-engineer.md
harness/adapters/root/AGENTS.md
harness/adapters/root/CLAUDE.md
harness/adapters/root/GEMINI.md
```

Generated adapter content must be short.

It should say:

```text
Do not manually discover harness context first.
Use Atelier.
Run init.
Read context.md.
Run close.
```

### Acceptance Criteria

- Generated skills do not duplicate full knowledge.
- Root adapters route agents to Atelier.
- Adapter generation is reproducible.
- Manual changes to generated adapters are detected or overwritten by explicit command only.

## M9: MCP Server

### Goal

Expose Atelier operations to MCP-capable agents.

### Tools

```text
atelier.doctor
atelier.index
atelier.context.plan
atelier.run.init
atelier.run.status
atelier.run.close
atelier.knowledge.propose
atelier.knowledge.promote
atelier.id.rename
atelier.repo.owner
```

### Requirements

- MCP tools call the same core as CLI.
- MCP server must not implement separate behavior.
- Tool outputs must be concise and agent-readable.
- Every mutating tool must support preview or dry-run where applicable.

### Acceptance Criteria

- MCP context plan matches CLI plan.
- MCP run init creates the same files as CLI.
- MCP run close enforces the same gates as CLI.
- MCP failure messages are actionable.

**Status (2026-06-02): shipped.** The MCP server lives at `product/apps/atelier/src/core/mcp.ts` and is launched via `atelier mcp` (stdio). It exposes 12 tools (`atelier_doctor`, `atelier_index`, `atelier_context_plan`, `atelier_run_init`, `atelier_run_status`, `atelier_run_close`, `atelier_knowledge_propose`, `atelier_knowledge_promote`, `atelier_knowledge_reject`, `atelier_id_rename`, `atelier_repo_owner`, `atelier_generate`). Every mutating tool requires `confirm: true` or the server being launched with `--allow-mutations`. Coverage: `src/__tests__/mcp.test.ts` (8 tests).

## M10: Atelier GUI

### Goal

Provide a local GUI for inspection, approval, and bulk maintenance.

### Initial Screens

1. Doctor
2. Role Bundle Preview
3. Context Plan
4. Knowledge Inbox
5. ID Rename
6. Bulk Edit

### Non-Goals

- Do not make GUI the source of truth.
- Do not require GUI for CLI workflows.
- Do not store hidden state only in the app.

### Acceptance Criteria

- GUI reads generated indexes.
- GUI can launch core operations.
- GUI shows diffs before mutating source files.
- GUI can approve or reject knowledge proposals.
- GUI can plan and render context bundles.

**Status (2026-06-02): shipped.** The GUI server lives at `product/apps/atelier/src/core/gui-server.ts` and is launched via `atelier gui` (Bun.serve on 127.0.0.1). Static assets live in `product/apps/atelier/src/gui/` (no build step). It serves 5 screens (Doctor, Role Bundles, Context Plan, Knowledge Inbox, ID Rename) and a JSON API at `/api/*`. Mutations follow the same `confirm: true` / `--allow-mutations` policy as MCP. Coverage: `src/__tests__/gui.test.ts` (11 tests).

## M11: Repo Map and Path Ownership Generation

### Goal

Stop hand-maintaining repo ownership facts.

### Inputs

- `package.json`
- `nx.json`
- project config files
- `tsconfig.base.json`
- Cargo manifests
- Nix files
- filesystem tree

### Generated Outputs

```text
.harness/generated/repo-map.json
.harness/generated/path-ownership.json
```

### Query

```bash
atelier repo owner --path product/apps/web/src/app/page.tsx
```

### Acceptance Criteria

- Path maps to likely owning role.
- Product apps and packages are detected.
- Nx project metadata is included when available.
- Generated facts are not manually edited.
- Human-facing `harness/knowledge/repo-map.md` remains short.

**Status (2026-06-02): shipped.** `src/core/repo-map.ts` produces `RepoMap` (workspace markers, projects, files, ownership hints, warnings) and `PathOwnership` (sorted lookup of project roots → owning role). Both are written to `.harness/generated/repo-map.json` and `.harness/generated/path-ownership.json` by `atelier index` and consumed by `repoOwner` (`src/core/owner.ts`) for fast path resolution. Manual ownership from `harness/knowledge/repo-map.md` is parsed and merged as `harness-repo-map` hints. New CLI: `atelier repo map`. New Nx target: `bun nx run atelier:repo-map`. New GUI endpoints: `GET /api/repo-map`, `GET /api/path-ownership`. Coverage: `src/__tests__/repo-map.test.ts` (6 tests), plus 2 GUI tests and 1 MCP test for the new outputs.

## M12: Optional Semantic Expansion

### Goal

Add recall support without replacing deterministic routing.

### Use Cases

- Find similar past runs.
- Find related lessons.
- Search unknown terms.
- Suggest optional context.
- Detect duplicate knowledge candidates.

### Requirements

- Semantic results must be optional.
- Deterministic required context must not depend on embeddings.
- Selection reasons must distinguish semantic hits from rule-based hits.
- Vector index may be rebuilt from Markdown and generated data.

### Acceptance Criteria

- Required context remains deterministic.
- Semantic results are labeled optional.
- Context plan remains reproducible with semantic expansion disabled.

**Status (2026-06-02): shipped.** `src/core/semantic.ts` provides a deterministic TF-style recall (no embeddings, no external deps) with optional flag. Functions: `runSemanticExpansion`, `buildSemanticQuery`, `findDuplicateKnowledgeCandidates`. Wired into `buildContextPlan` as the `plan.semantic` field (`{ enabled, hits, unknownTerms }`) — never affects `required`. The `atelier_context_plan` MCP tool gained `semantic: bool` and `semanticMaxResults` arguments. `duplicateCandidatesWithSemantic` is exported from `core/knowledge.ts` for future promotion-time duplicate detection. Coverage: `src/__tests__/semantic.test.ts` (6 tests) plus 1 MCP test for the wired `semantic` flag.

## Suggested Implementation Order

### First commit

```text
feat(atelier): add harness document parser and doctor
```

Contents:

- schema parser
- frontmatter reader
- doctor diagnostics
- old path checker
- broken link checker
- duplicate ID checker

### Second commit

```text
feat(atelier): compile harness indexes
```

Contents:

- docs.json
- ids.json
- diagnostics.json
- index check mode

### Third commit

```text
feat(atelier): add role-routed context plan and render
```

Contents:

- role parser
- workflow parser
- context selector
- plan output

### Fourth commit

```text
feat(atelier): initialize runs from rendered context plans
```

Contents:

- run ID generation
- brief generation
- context.md
- context.manifest.json

### Fifth commit

```text
feat(atelier): enforce run close checks
```

Contents:

- run status
- run close
- verification/handoff gates
- scoped doctor checks

### Sixth commit

```text
feat(atelier): add knowledge proposal workflow
```

Contents:

- proposal generation
- promotion
- duplicate detection
- index update

## CI Strategy

Start with non-blocking CI.

Phase 1:

```bash
atelier doctor --json
```

runs in CI and uploads diagnostics, but does not fail on warnings.

Phase 2:

```bash
atelier doctor --ci
atelier index --check
```

fails only on errors.

Phase 3:

selected policies become hard gates.

## Risks

### Risk: Markdown Schema Becomes Too Strict

Mitigation:

- progressive strictness
- warnings before errors
- completed runs remain loose

### Risk: Role Selectors Become Magic

Mitigation:

- every selected document must have a reason
- context plan must show skipped context
- generated role bundle is inspectable

### Risk: Agents Ignore Atelier

Mitigation:

- root adapters route to Atelier
- generated context.md gives next steps
- run close fails when context manifest is missing

### Risk: Knowledge Growth Becomes Spam

Mitigation:

- proposal before promotion
- duplicate detection
- promotion criteria
- human approval for durable policy or architecture changes

### Risk: Generated Files Become Noisy

Mitigation:

- stable sort
- compact JSON
- optional non-committed mode
- `index --check` for reproducibility

## Done Definition for v1

Atelier v1 is done when a non-trivial harness task can be performed through this loop:

```text
atelier doctor
atelier context plan
atelier run init
agent reads context.md
agent works
agent updates verification.md and handoff.md
atelier run close
atelier knowledge propose, when useful
atelier index --check
```

and the following are true:

- no manual grep is needed to find starting context
- selected context is explainable
- selected context is reproducible
- broken Markdown is detected
- old paths are detected
- run completion is gated by evidence
- knowledge proposals do not immediately pollute durable knowledge
- root adapters remain short
