---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
id: knowledge.product-spec.atelier
title: Atelier Product Spec
status: active
summary: Local harness console and compiler for role-routed agent work in tenzyudotcom.
tags:
  - atelier
  - harness
  - context-routing
  - doctor
  - agent-workflow
freshness:
  source: authored
  update_policy: review_required
---

# Atelier Product Spec

Atelier is the local control plane for the `tenzyudotcom` harness.

It is not an autonomous agent.  
It is not a generic RAG system.  
It is not a Markdown CMS.  
It is not the source of truth for repository policy.

Atelier exists to make the Markdown-based harness executable, inspectable, reproducible, and difficult to corrupt.

## 1. Problem

The repository already has useful harness material:

- reusable knowledge under `harness/knowledge`
- policies under `harness/policies`
- callable workflows under `harness/actions/workflows`
- roles, phases, and artifact templates under `harness/actions`
- run records under `harness/runs`
- root and tool adapters under `harness/adapters`

This is valuable, but raw Markdown does not maintain itself.

Without a compiler and operation layer, the harness tends to decay through:

- stale paths
- broken Markdown links
- duplicated guidance
- old `legacy ai-org path` references
- inconsistent role and workflow references
- knowledge that no role ever selects
- role files that require broad manual search
- run records that do not preserve the selected context
- agent behavior that falls back to `grep` instead of using the harness contract

The current design direction is role-routed context development:

```text
human request
  -> workflow selection
  -> role assignment
  -> context query
  -> run manifest
  -> execution
  -> observation
  -> knowledge proposal
  -> promotion
```

Atelier is the tool that makes this loop operational.

## 2. Goals

Atelier must reduce the cost of using and maintaining the harness.

### 2.1 Context Selection

Atelier selects context from the harness without requiring agents to manually search all Markdown.

It must support queries such as:

```bash
atelier context preview \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth"
```

The result must explain:

- selected documents
- skipped documents
- selection reasons
- estimated context cost
- required versus optional context
- missing metadata or weak routing signals

### 2.2 Run Creation

Atelier materializes selected context into a run.

A run must preserve:

- workflow
- assigned roles
- user intent
- target paths
- selected documents
- selection reasons
- document hashes
- generated time
- required artifacts

`context.md` is the first file an agent should read for a run. It is an
agent-readable compiled context pack, not a simple link list and not a raw copy
of every selected source document. It must embed the constraints, procedures,
excerpts, and judgment material needed to start the task, while preserving paths
and IDs for provenance and expansion.

`context.manifest.json` is the machine evidence for the pack. It stores source
paths, IDs, hashes, selection reasons, generated time, budget estimates, and
later expansion records. It must not become a duplicate body store.

Atelier must generate:

```text
harness/runs/active/<RUN-ID>/
  brief.md
  context.md
  context.manifest.json
```

Context generation modes:

```text
compact
  default mode; embed required constraints and excerpts

full
  embed required source bodies when practical

linked
  link-centered mode for low-cost preview or human checks
```

Additional context may be expanded only when the context pack allows it, the
investigation proves the pack is insufficient, or a command/error references
uncovered context. Expansions should be recorded in `context.manifest.json` and
`worklog.md`.

Additional run artifacts are created or completed later:

```text
plan.md
worklog.md
verification.md
review.md
handoff.md
knowledge-proposals/
```

### 2.3 Harness Integrity

Atelier must detect corruption and drift.

`atelier doctor` must check:

- invalid frontmatter
- duplicate IDs
- missing IDs
- unresolved symbolic references
- broken Markdown links
- old path references
- stale `legacy ai-org path` references
- workflows referencing missing phases
- roles referencing missing documents
- context manifests with hash mismatches
- generated indexes that are stale
- orphan knowledge that no selector can reach
- selectors that are too broad or too narrow

### 2.4 Knowledge Growth

Atelier must allow the harness to grow from run evidence without turning the knowledge base into a dumping ground.

The default knowledge workflow is:

```text
run evidence
  -> proposal
  -> validation
  -> human or policy-gated approval
  -> promotion
  -> index regeneration
```

Atelier must not automatically promote raw logs, guesses, or one-off observations into durable knowledge.

### 2.5 Agent Compatibility

Atelier must be usable by humans, shell scripts, and agents.

The same core operations must be available through:

- CLI
- future MCP server
- future GUI
- generated skills or adapter documents

Atelier must not require a specific agent runtime.

## 3. Non-Goals

Atelier must not become:

- a generic autonomous agent runtime
- a chat UI
- a vector database first system
- a generic note-taking app
- a replacement for Git
- a replacement for Nx, Bun, or existing repo tooling
- a source of truth separate from the repository
- a UI-only stateful database
- a system that requires all completed runs to be migrated to a strict schema
- a system that forces every small code change to create new durable knowledge

Atelier may later expose MCP tools or a GUI, but the first implementation must be CLI-first and file-backed.

## 4. Core Principles

### 4.1 Markdown Is Authoring Source, Not the Database

Markdown remains useful for human-readable meaning:

- design rules
- product specs
- ADRs
- workflows
- policies
- handoffs
- verification notes

Markdown should not manually carry derived data such as:

- reverse role indexes
- full repo maps
- dependency graphs
- link graphs
- stale status
- context bundle results
- generated role bundles

Derived data belongs under `.harness/generated`.

### 4.2 One-Way Authored References

Do not create bidirectional hand-maintained links.

Allowed:

- roles define selectors
- knowledge declares intrinsic metadata
- generated indexes compute reverse relationships

Avoid:

- `knowledge.roles`
- `knowledge.required_by`
- hand-maintained reverse role lists
- duplicated role bundles inside knowledge files

Knowledge should not need to know every role that may read it.

### 4.3 Role as Context Router

A role is not an agent personality.  
A role is a context routing profile.

A role defines:

- activation conditions
- path selectors
- tag selectors
- pinned documents
- default phases
- outputs
- review criteria

Atelier uses roles to select context.

### 4.4 Runs Lock Context

A run must lock the selected context before execution.

This preserves:

- what the agent read
- why those documents were selected
- which version was read
- whether the context changed during work

Do not copy full knowledge bodies into run records unless explicitly needed for evidence. Store IDs, paths, reasons, and hashes.

### 4.5 Doctor Before Expansion

Do not add new complexity until `atelier doctor` can detect existing corruption.

The first value of Atelier is not a GUI.  
The first value is making the harness hard to silently break.

### 4.6 Progressive Strictness

Do not apply strict schema requirements to all Markdown equally.

Recommended levels:

```text
Level 0: Free Markdown
  completed runs
  historical handoffs
  legacy notes

Level 1: Indexed Markdown
  knowledge
  policies
  product specs
  ADRs

Level 2: Routable Markdown
  roles
  workflows
  phases

Level 3: Generated Data
  repo map
  path ownership
  role bundles
  diagnostics
```

Completed run history should be readable and searchable, but it should not be forced through every future schema migration.


### 4.7 Maintainer Decisions For Source Contracts

The current source-contract policy is intentionally asymmetric. It minimizes manual maintenance while preserving reproducibility.

- Completed run history is loose historical text. It should not be forced through future frontmatter migrations.
- Knowledge must not manually point back to roles. Role-to-knowledge relationships are produced by role selectors and generated indexes.
- Knowledge may keep intrinsic signals such as `read_when` and `skip_when`, but not callable-skill fields.
- Legacy display fields such as `impactDescription`, `chapter`, `name`, `description`, and `user-invocable` belong under `x.legacy` when preservation is useful. They are not routing fields.
- Tags must be YAML arrays. Scalar comma-separated tags are invalid for deterministic indexing.
- Domain roles must declare routing metadata with `selectors` and `pinned` context.
- Root and tool adapters must route non-trivial work through `atelier run init` and `atelier run close`.
- Small direct edits to existing knowledge are allowed when the correction is narrow and obvious. New durable knowledge should go through proposal and promotion.
- Current harness guidance must not reference removed legacy paths. Historical completed runs may keep historical text.

## 5. Source Layout

### 5.1 Authored Sources

```text
harness/
  canon/
  knowledge/
  policies/
  actions/
    workflows/
    roles/
    phases/
    artifacts/
  runs/
  observations/
  adapters/
```

### 5.2 Generated Sources

```text
.harness/
  generated/
    docs.json
    ids.json
    knowledge-index.json
    role-bundles.json
    workflow-index.json
    repo-map.json
    path-ownership.json
    link-graph.json
    diagnostics.json
```

Generated files are cache artifacts. They must be reproducible from repository source and may be deleted and rebuilt.

### 5.3 Implementation Location

Atelier currently lives as a CLI-first application under:

```text
product/apps/atelier/
  src/core/
    docs.ts
    frontmatter.ts
    indexer.ts
    doctor.ts
    context.ts
    runs.ts
    knowledge.ts
  src/cli.ts
```

The app must keep core operations reusable from CLI, future MCP tools, and future GUI surfaces.

If the code becomes useful outside the app boundary, only the shared core may later be promoted to a package. The UI, when added, must call the same core operations and must not become a separate source of truth.

## 6. Document Model

Atelier treats harness Markdown as Markdown-backed objects.

```text
Markdown document =
  frontmatter metadata
  + body
  + compiled index entry
```

### 6.1 Common Frontmatter

Minimum common fields:

```yaml
---
schema: harness/v1
kind: knowledge
id: knowledge.rule.example
title: Example Rule
status: active
---
```

Common fields:

```yaml
schema: harness/v1
kind: knowledge | role | workflow | phase | policy | artifact-template | run | observation | adapter | canon
id: stable.symbolic.id
title: Human-readable title
status: draft | active | deprecated | archived
summary: Short summary
tags:
  - example
supersedes:
  - old.id
superseded_by: new.id
x:
  any experimental extension
```

The schema must allow extension fields. Unknown fields should be warnings only unless they conflict with reserved names.

### 6.2 ID Rules

IDs are path-independent symbols.

Good:

```text
role.domain.web-app-engineer
workflow.isolated-run
phase.verification
knowledge.rule.security.server-actions-require-auth
policy.repository
artifact.verification
```

Bad:

```text
harness.actions.roles.domain.web-app-engineer
harness.knowledge.rules.security.server-actions-require-auth
```

A file may move without changing its ID.

Atelier must provide symbolic rename:

```bash
atelier id rename OLD_ID NEW_ID
```

This must update:

- frontmatter IDs
- explicit symbolic references
- generated indexes
- context manifests when applicable
- diagnostics

Atelier must preview the change before writing.

### 6.3 Knowledge Metadata

Knowledge declares its intrinsic shape, not every consumer.

Recommended fields:

```yaml
knowledge_type: rule | product-spec | adr | repo-map | known-problem | lesson | incident | component-note | reference | generated-summary
impact: LOW | MEDIUM | HIGH | CRITICAL
scope:
  paths:
    - product/apps/web/**
  packages:
    - "@tenzyu/ui"
  products:
    - web
signals:
  read_when:
    - editing server actions
  skip_when:
    - Rust-only work
```

Knowledge should not maintain role reverse links.

### 6.4 Role Metadata

A role defines selectors.

Example:

```yaml
---
schema: harness/v1
kind: role
id: role.domain.web-app-engineer
title: Web App Engineer
status: active
role_type: domain
activation:
  use_when:
    - changing the public website
  paths:
    - product/apps/web/**
selectors:
  tags:
    - nextjs
    - routing
    - server-actions
    - admin
  paths:
    - product/apps/web/**
  knowledge_types:
    - rule
    - product-spec
    - known-problem
pinned:
  - knowledge.repo-map
  - policy.repository
phases:
  - phase.investigation
  - phase.planning
  - phase.implementation
  - phase.verification
  - phase.handoff
---
```

`pinned` is for mandatory context.  
`selectors` is for generated context expansion.

### 6.5 Workflow Metadata

A workflow is callable.

```yaml
---
schema: harness/v1
kind: workflow
id: workflow.isolated-run
title: Isolated Run
status: active
callable: true
use_when:
  - non-trivial mutable work
role_selection:
  requires_primary_role: true
  allow_supporting_roles: true
phases:
  - phase.intake
  - phase.worktree-isolation
  - phase.investigation
  - phase.planning
  - phase.implementation
  - phase.verification
  - phase.review
  - phase.handoff
---
```

### 6.6 Phase Metadata

A phase is a lifecycle module, not a role.

```yaml
---
schema: harness/v1
kind: phase
id: phase.verification
title: Verification
status: active
phase_order: 60
required_outputs:
  - verification.md
default_artifacts:
  - artifact.verification
---
```

## 7. Generated Indexes

### 7.1 docs.json

Canonical list of parsed documents.

Each entry should include:

```json
{
  "id": "knowledge.rule.example",
  "kind": "knowledge",
  "title": "Example",
  "path": "harness/knowledge/rules/example.md",
  "status": "active",
  "sha256": "...",
  "frontmatter": {},
  "headings": []
}
```

### 7.2 ids.json

Symbol table:

```json
{
  "knowledge.rule.example": {
    "path": "harness/knowledge/rules/example.md",
    "status": "active",
    "sha256": "..."
  }
}
```

### 7.3 role-bundles.json

Generated role context.

```json
{
  "role.domain.web-app-engineer": {
    "pinned": ["knowledge.repo-map", "policy.repository"],
    "selected": ["knowledge.rule.security.server-actions-require-auth"],
    "selectionReasons": {
      "knowledge.rule.security.server-actions-require-auth": [
        "selector.tags:server-actions",
        "selector.paths:product/apps/web/**"
      ]
    }
  }
}
```

### 7.4 diagnostics.json

Machine-readable doctor result.

Diagnostics must include:

```json
{
  "severity": "error",
  "code": "BROKEN_MARKDOWN_LINK",
  "message": "Link target does not exist",
  "file": "harness/knowledge/index.md",
  "target": "../old-path.md"
}
```

## 8. Commands

Atelier must expose a small, stable command surface.

### 8.1 Doctor

```bash
atelier doctor
atelier doctor --json
atelier doctor --fix
```

`doctor` reports corruption.

`--fix` may only apply safe mechanical fixes:

- stale generated files
- old known paths with unambiguous replacements
- formatting of generated files

It must not invent knowledge or silently change policies.

### 8.2 Index

```bash
atelier index
atelier index --check
```

Build generated JSON indexes.

`--check` fails if generated artifacts are stale.

### 8.3 Context Preview

```bash
atelier context preview \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth"
```

The preview must not create a run by default.

Output must include:

- selected required context
- selected optional context
- skipped context
- reasons
- warnings
- token estimate
- command to materialize a run

### 8.4 Run Init

```bash
atelier run init \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth"
```

Creates a run folder with:

```text
brief.md
context.md
context.manifest.json
```

### 8.5 Run Status

```bash
atelier run status RUN-ID
atelier run status RUN-ID --json
```

Shows:

- current artifacts
- missing artifacts
- context manifest state
- verification state
- doctor result scoped to the run

### 8.6 Run Close

```bash
atelier run close RUN-ID
```

Checks:

- context manifest exists
- selected document hashes are still explainable
- required artifacts exist
- verification is present or explicitly skipped
- handoff is present for non-trivial runs
- no blocking doctor errors affect the run
- knowledge proposals are either promoted, rejected, or left explicitly pending

### 8.7 Knowledge Propose

```bash
atelier knowledge propose \
  --from-run RUN-ID \
  --kind rule \
  --title "Server Actions Require Auth"
```

Creates a proposal, not durable knowledge.

### 8.8 Knowledge Promote

```bash
atelier knowledge promote PROPOSAL_PATH
```

Promotes proposal into `harness/knowledge` after validation.

Must check:

- duplicate candidates
- ID uniqueness
- frontmatter validity
- destination selection
- links
- role bundle impact
- generated index update

### 8.9 ID Rename

```bash
atelier id rename OLD_ID NEW_ID
atelier id rename OLD_ID NEW_ID --write
```

Must preview all affected files.

### 8.10 Repo Map

```bash
atelier repo map
atelier repo owner --path product/apps/web
```

Generates or queries derived repository facts.

## 9. Context Selection Algorithm

Atelier context selection must be deterministic first.

Priority order:

```text
1. workflow required phases and artifacts
2. role pinned documents
3. repository policies
4. path ownership
5. direct path matches
6. tag matches
7. product/package matches
8. known problems and incidents
9. optional semantic or full-text expansion
```

Vector or semantic search may be added later as optional expansion only. It must not replace deterministic role/path/policy routing.

### 9.1 Required Context

Required context includes:

- selected workflow
- assigned role files
- pinned policies
- pinned role documents
- phases used by the workflow
- path owner facts
- directly matched high-impact rules

### 9.2 Optional Context

Optional context includes:

- medium-impact rules
- related product specs
- known problems
- lessons
- recent related run handoffs

### 9.3 Skipped Context

Atelier must explicitly list skipped broad context when relevant:

- completed run history
- unrelated product specs
- unrelated domain roles
- deprecated knowledge
- superseded documents

This prevents agents from assuming missing context was forgotten.

## 10. Run Manifest

A run context manifest is the reproducibility boundary.

Required shape:

```json
{
  "schema": "harness-run-context/v1",
  "runId": "RUN-20260602-example",
  "workflow": "workflow.isolated-run",
  "primaryRole": "role.domain.web-app-engineer",
  "supportingRoles": ["role.core.implementer"],
  "reviewRoles": ["role.core.reviewer"],
  "input": {
    "intent": "fix server action auth",
    "paths": ["product/apps/web/**"]
  },
  "selectedDocuments": [
    {
      "id": "knowledge.rule.security.server-actions-require-auth",
      "path": "harness/knowledge/rules/security/security-server-actions-require-auth-even-for-helper-actions.md",
      "sha256": "...",
      "reason": [
        "tag:server-actions",
        "path:product/apps/web/**",
        "impact:HIGH"
      ],
      "required": true
    }
  ],
  "generatedAt": "2026-06-02T00:00:00.000Z"
}
```

The manifest must not contain full document bodies unless explicitly requested.

## 11. Agent Protocol

Agents must not manually discover harness context first.

Default protocol:

```text
1. Run or call `atelier run init`.
2. Read generated `context.md`.
3. Follow the selected workflow and roles.
4. Update required artifacts.
5. Run `atelier run close`.
```

If MCP is available, agents should use MCP tools.  
If MCP is unavailable, agents should use CLI.

Root adapters and generated skills must route agents into this protocol.

## 12. MCP Interface

MCP is an adapter, not the core.

Future tools:

```text
atelier.doctor
atelier.index
atelier.context.preview
atelier.run.init
atelier.run.status
atelier.run.close
atelier.knowledge.propose
atelier.knowledge.promote
atelier.id.rename
atelier.repo.owner
```

MCP tools must call the same core as CLI.

## 13. Skills and Generated Adapters

Skills should be generated from the harness, not hand-maintained as a separate knowledge source.

Generated skill examples:

```text
.harness/generated/skills/atelier.md
.harness/generated/skills/workflows/isolated-run.md
.harness/generated/skills/roles/web-app-engineer.md
```

Skills explain when and how to use Atelier.  
They must not duplicate full policies or knowledge bodies.

## 14. GUI Requirements

A future Atelier GUI should be an inspector and operation launcher.

Initial screens:

### Doctor

- errors
- warnings
- quick fixes
- affected files
- stale generated artifacts

### Role Bundle Preview

- role
- pinned docs
- selected docs
- optional docs
- selectors
- documents no longer reachable

### Context Preview

- workflow
- role
- path
- intent
- selected context
- skipped context
- token estimate
- manifest preview

### Knowledge Inbox

- proposals from runs
- duplicate candidates
- promote / reject / edit actions
- impact preview

### ID Rename

- old ID
- new ID
- affected files
- dry-run diff
- apply

### Bulk Edit

- tags
- status
- superseded_by
- scope paths
- migration preview

The GUI must use Atelier commands or core APIs. It must not store independent source-of-truth state.

## 15. Validation and Safety

Atelier must distinguish errors from warnings.

### Errors

Errors block run close or index check.

Examples:

- duplicate ID
- invalid YAML frontmatter
- missing referenced workflow
- missing referenced role
- missing referenced phase
- broken required Markdown link
- context manifest hash mismatch
- generated index stale under `--check`

### Warnings

Warnings do not block by default.

Examples:

- knowledge has no tags
- knowledge has no selector hits
- role selector is broad
- optional context exceeds budget
- completed run uses old paths
- deprecated knowledge still appears in optional results

### Fixes

Atelier may auto-fix only deterministic mechanical issues.

It must not silently:

- promote knowledge
- change a policy
- delete run history
- rewrite design decisions
- infer architecture decisions from weak evidence

## 16. Performance and Context Budget

Atelier must protect context windows.

Context preview must show:

- estimated token count
- required tokens
- optional tokens
- budget warnings
- skipped high-cost files

Context selection must support limits:

```bash
atelier context preview --budget 12000
atelier context preview --required-only
atelier context preview --include-optional known-problems
```

Large documents may later support generated summaries, but summaries must be traceable to source documents.

## 17. Acceptance Criteria

Atelier MVP is acceptable when:

- `atelier doctor` detects broken links, duplicate IDs, stale old paths, and missing references
- `atelier index` generates `docs.json`, `ids.json`, and `diagnostics.json`
- role files can be parsed into routable objects
- workflow files can be parsed as callable objects
- `atelier context preview` returns deterministic selected context for role + path + workflow
- `atelier run init` creates `brief.md`, `context.md`, and `context.manifest.json`
- `atelier run close` blocks missing verification and handoff for non-trivial runs
- generated output is reproducible
- root adapters can instruct agents to use Atelier without duplicating long harness policy
- no completed run history migration is required for MVP

## 18. Open Questions

- Should generated files be committed or rebuilt locally?
- Should context manifests store document hashes for generated files only or all selected Markdown?
- Should `atelier run init` create Git worktrees directly or only instruct the agent to follow the worktree phase?
- How strict should `doctor` be in CI?
- Should knowledge proposals live under `.harness/proposals` or under each run folder?
- Should MCP ship before GUI?
- Should role selector scoring be deterministic-only in v1, or include optional full-text matching?
