---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
pattern: simple
id: knowledge.product-spec.atelier-roadmap
title: Atelier Roadmap
status: active
summary: Implementation roadmap for Atelier as an Agentic Software Development Control Plane, from harness safety and role-routed context to Artifact Graph, Reconciler, Policy Engine, governed Agent Loop, and Swarm Coordination.
tags:
  - domain:atelier
  - domain:harness
  - kind:roadmap
  - kind:plan
  - status:active
  - subject:agent
  - subject:governance
  - subject:verification
  - subject:context-routing
affordances:
  declared:
    - context
    - review-candidate
    - skill-candidate
freshness:
  source: authored
  update_policy: risk_based_reconcile
---

# Atelier Roadmap

This roadmap defines the implementation path for Atelier as an **Agentic
Software Development Control Plane**.

The order matters. Do not start by building a generic agent runtime. Build the
control kernel first:

```text
observable
reconciled
governed
traceable
progressively automatable
```

The kernel is:

```text
Artifact Graph
Event Log
Reconciler
Selector
Policy Engine
Materializer
Trace
```

LLM semantics are the last resort before human decision. Programmatic evidence,
structural analysis, rules, and heuristics must handle common cases.

## Milestone Overview

### v1 Adoption Path

v1 makes the existing harness safer and usable by humans and external agents.
It is the Markdown-backed adoption path, not the final product model.

```text
M0: Harness Source Contract
M1: Doctor
M2: Index Compiler
M3: Role-Routed Context Plan and Render
M4: Run Init and Context Manifest
M5: Run Close and Completion Gate
M6: Markdown Knowledge Proposal and Promotion
M7: Symbolic ID Rename
M8: Skills and Agent Adapters
M9: MCP Adapter
M10: Initial GUI
M11: Repo Map and Path Ownership
M12: Optional Semantic Expansion
```

### v2 Control Plane Kernel

v2 turns Atelier into a continuously reconciled control system.

```text
M13: Artifact Graph Kernel
M14: Event Log and Reconciler
M15: Selector v2
M15.5: Task and Role Authoring
M16: Control Mechanism Registry
M16.5: Static Policy Engine
M17: Artifact Graph UI
M18: Governance Runtime
M19: Governed Agent Loop
M20: Swarm Coordination
M21: Run Resume Materialization
```

## Guiding Rules

1. Do not build an uncontrolled autonomous agent first.
2. Do not make Markdown the only source of truth.
3. Do not make the GUI a hidden database.
4. Do not use LLM semantics where deterministic programs are enough.
5. Do not make approval the normal path.
6. Do not treat curated edits as drift by default.
7. Do not let generated artifacts become untraceable.
8. Build graph, reconciliation, selectors, and policy before agent autonomy.

## M0: Harness Source Contract

### Goal

Define the minimum object contract for authored harness files without forcing the
entire repository into a strict schema.

### Scope

Create or update:

```text
harness/knowledge/product-specs/atelier/README.md
harness/knowledge/product-specs/atelier/ROADMAP.md
product/apps/atelier/src/core/schema.ts
product/apps/atelier/src/core/frontmatter.ts
```

### Requirements

- Support `schema: harness/v1`.
- Support stable symbolic `id`.
- Support `kind`, `title`, `status`, `summary`, `tags`, and `x` extension data.
- Preserve unknown extension fields unless they conflict with reserved names.
- Keep completed run history loose.
- Do not require all Markdown to pass the same strictness level.
- Require YAML array tags for deterministic indexing where tags are used.
- Keep Knowledge-to-Role relationships one-way: roles select knowledge; knowledge does not maintain reverse role lists.

### Strictness Levels

```text
strict
  roles, workflows, phases, policies that participate in routing or governance

indexed
  knowledge, product specs, ADRs, active operational docs

loose
  completed runs, historical handoffs, legacy notes

generated
  reproducible projections and generated adapter outputs
```

### Acceptance Criteria

- Parser reads frontmatter and body from every relevant Markdown file.
- Missing frontmatter does not fail loose areas.
- Strict areas fail on invalid or missing required fields.
- IDs are collected into a symbol table.
- Unknown fields are preserved.

## M1: Doctor

### Goal

Detect project and harness corruption before adding more automation.

### Commands

```bash
atelier doctor
atelier doctor --json
atelier doctor --fix
```

### Diagnostics

Initial diagnostics:

```text
DUPLICATE_ID
MISSING_ID
INVALID_FRONTMATTER
UNKNOWN_KIND
BROKEN_MARKDOWN_LINK
UNRESOLVED_ID_REFERENCE
OLD_PATH_REFERENCE
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

```text
duplicate ID
invalid YAML in strict documents
unresolved required reference
broken required Markdown link
missing workflow / role / phase referenced by a strict document
```

Warnings:

```text
missing metadata in indexed documents
orphan knowledge
old paths in completed run history
broad selectors
low-value optional context
legacy fields preserved under x.legacy
```

### Safe Fixes

`--fix` may apply only deterministic mechanical fixes:

```text
stale generated indexes
known old paths with one unambiguous replacement
formatting of generated files
generated adapter refresh
```

It must not:

```text
edit design decisions
promote knowledge
change policy semantics
delete run history
infer architecture from weak evidence
```

### Acceptance Criteria

- Broken local Markdown links are reported.
- Duplicate IDs are reported.
- Missing required references are reported.
- `--json` output is stable and machine-readable.
- `--fix` previews or clearly reports all writes.

## M2: Index Compiler

### Goal

Compile authored Markdown into rebuildable generated indexes.

### Status

Historical v1 milestone. The generated-index CLI surface has been retired in
favor of graph observation, reconciliation, and control coverage.

### Generated Files

```text
.harness/generated/docs.json
.harness/generated/ids.json
.harness/generated/knowledge-index.json
.harness/generated/workflow-index.json
.harness/generated/role-bundles.json
.harness/generated/diagnostics.json
```

### Requirements

- Indexes are reproducible.
- Deleted docs disappear from indexes.
- File moves do not change symbolic IDs.
- Generated indexes are projections, not hand-maintained source.
- `--check` fails when generated indexes are stale.

### Acceptance Criteria

- Rebuilding generated projections twice produces stable output where a
  projection still exists.
- ID collision fails.
- Role bundles include selected documents and selection reasons.
- Diagnostics are emitted in machine-readable form.

## M3: Role-Routed Context Plan and Render

### Goal

Create selected context from workflow + role + path + intent without creating a
run.

### Commands

```bash
atelier context plan \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth" \
  --mode compact
```

### Requirements

The plan must show:

```text
required context
optional context
skipped context
selection reasons
warnings
token estimate
    validation commands
    external-runner handoff notes
```

Render modes:

```text
linked
  links and reasons only

compact
  compiled required constraints, excerpts, and procedures

full
  larger source bodies when practical
```

### Acceptance Criteria

- Plan works without creating a run.
- Plan explains every selected document.
- Plan lists skipped broad contexts.
- Context modes visibly change plan detail.
- Required context remains deterministic.
- Semantic expansion is optional and labeled.

## M4: Run Materialization and Context Manifest

### Goal

Materialize durable, portable, resumable run capsules from tasks so any
external LLM runner or human operator can pick up the work in progress.

### Capsule Structure

```text
harness/runs/active/<RUN-ID>/
  manifest.json
  handoff.md
  brief.md
  plan.md
  context.md
  verification.md
  review.md
  worklog.md
  artifacts.md
```

The canonical reading order is fixed and is the same for CLI, MCP, GUI, and
adapter docs. After `manifest.json`, `handoff.md` is read first so a fresh LLM
lands on the latest resume point.

### Requirements

`atelier run create --task <task-id>` materializes a capsule without invoking
an LLM or editing source code.

`manifest.json` is the only required-to-mutate file. It must store:

```text
run ID
schema (atelier/run-capsule/v1)
status (active | completed)
task ID
title
intent
scope
workflow ID
role IDs
artifact refs
validation refs
contextHash
worktree.projectRoot
createdAt
updatedAt
```

`context.md` is a snapshot of the resolved context plan, not a raw copy of all
selected source files and not merely a link list. The manifest must not become
a duplicate body store.

### Acceptance Criteria

- `atelier run create` materializes the 9 files listed above and emits
  `run_created`.
- `atelier run list` returns active and completed capsules with an optional
  status filter.
- `atelier run resume` returns a portable resume prompt using the canonical
  reading order.
- `atelier run handoff` and `atelier run verify` append to the active capsule
  and update the manifest.
- The CLI never invokes an LLM and never edits source code.

## M5: Run Close, Completion Gate, and Handoff

### Goal

Freeze a run capsule once the work has verifiable evidence and a stable
handoff point.

### Requirements

`atelier run complete <run-id>` enforces completion gates before moving the
capsule from `harness/runs/active/<run-id>/` to
`harness/runs/completed/<run-id>/`.

For non-trivial runs, require:

```text
manifest.json
handoff.md
brief.md
plan.md
context.md
verification.md
review.md
worklog.md
artifacts.md
```

Completion evidence should check:

```text
all 9 canonical files exist
context manifest is readable
selected document hashes are explainable
doctor errors do not affect the run
verification exists or is explicitly skipped with reason
handoff exists for non-trivial runs
```

### Acceptance Criteria

- Missing verification is recorded as an unresolved handoff risk.
- Missing handoff is recorded when a durable record is expected.
- Hash mismatch reports changed context.
- Trivial direct runs may close with a lighter standard.
- Output explains exactly what is missing.
- `run_completed` is emitted and `run_started` is never emitted by new code.

## M6: Markdown Knowledge Proposal and Promotion

### Goal

Allow Markdown-backed durable knowledge to grow from evidence without turning
raw logs into permanent policy.

This milestone is scoped to v1 Markdown-backed knowledge. In v2, knowledge may
also enter the graph from checks, linters, hooks, CI, code structure, failed
runs, review comments, traces, and human decisions. Promotion to Markdown is
optional, not the only knowledge path.

### Status

Historical v1 milestone. Durable knowledge is now curated through ordinary
Markdown editing, review, and reconciliation rather than a proposal CLI surface.

### Requirements

A proposal must include:

```text
source run
evidence
proposed kind
proposed title
proposed tags
why it should recur
why it is not already covered
```

Promotion must check:

```text
duplicate candidates
ID uniqueness
frontmatter validity
destination selection
links
role bundle impact
index update
```

### Acceptance Criteria

- Raw run logs are not automatically promoted.
- Promotion creates valid Markdown under `harness/knowledge`.
- Promotion records provenance.
- Duplicate warning is shown before write.
- Rejected proposals can be archived without deleting evidence.

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
- Refuse if `NEW_ID` exists.
- Preserve path-independent ID philosophy.

### Acceptance Criteria

- All references to `OLD_ID` are updated.
- Generated indexes contain `NEW_ID`.
- Doctor reports no unresolved `OLD_ID`.
- Dry-run mode is supported.

## M8: Skills and Agent Adapters

### Goal

Make agents use Atelier without duplicating harness policy.

Skills and adapters are control artifacts. Some are generated, some are
managed, some are curated, and some are observed from external agent
environments. Curated edits are valid inputs to the Artifact Graph.

### Outputs

Examples:

```text
.harness/generated/skills/atelier.md
.harness/generated/skills/workflows/isolated-run.md
.harness/generated/skills/roles/web-app-engineer.md
harness/adapters/root/AGENTS.md
harness/adapters/root/CLAUDE.md
harness/adapters/root/GEMINI.md
```

### Requirements

Adapters should be short routing layers:

```text
Do not manually discover harness context first.
Use Atelier.
Run init.
Read context.md.
Run close.
```

They must not duplicate full policies or knowledge bodies.

### Acceptance Criteria

- Generated skills do not duplicate full knowledge.
- Root adapters route agents to Atelier.
- Adapter generation is reproducible.
- Manual or curated edits are either observed, reconciled, or explicitly owned.

## M9: MCP Adapter

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
- MCP server does not implement separate behavior.
- Tool outputs are concise and agent-readable.
- Mutating tools support preview, confirmation, or dry-run where applicable.

### Acceptance Criteria

- MCP context plan matches CLI plan.
- MCP run init creates the same files as CLI.
- MCP run close enforces the same gates as CLI.
- MCP failure messages are actionable.

## M10: Initial GUI

### Goal

Provide a local GUI for inspection, previewed mutations, and bulk maintenance.

### Initial Screens

```text
Doctor
Role Bundle Preview
Context Plan
Knowledge Inbox
ID Rename
Bulk Edit
```

### Requirements

- GUI calls the same core APIs as CLI and MCP.
- GUI is not the source of truth.
- GUI stores no hidden state that cannot be reproduced or explained.
- Mutations show diffs before writing.

### Acceptance Criteria

- GUI reads generated indexes.
- GUI can launch core operations.
- GUI shows diffs before mutation.
- GUI can approve, reject, or defer Markdown knowledge proposals.
- GUI can plan and render context bundles.

## M11: Repo Map and Path Ownership

### Goal

Stop hand-maintaining repository ownership facts.

### Inputs

```text
package.json
workspace config
project config files
tsconfig
Cargo manifests
Nix files
filesystem tree
existing ownership hints
```

### Generated Outputs

```text
.harness/generated/repo-map.json
.harness/generated/path-ownership.json
```

### Status

Historical v1 milestone. Repository understanding is now surfaced through graph
observation, impact, blame, status, and active Nx project inspection.

### Acceptance Criteria

- Path maps to likely owning role or scope.
- Product apps and packages are detected.
- Generated facts are not manually edited.
- Human-facing repo map docs stay short.

## M12: Optional Semantic Expansion

### Goal

Add recall support without replacing deterministic routing.

### Use Cases

```text
find similar past runs
find related lessons
search unknown terms
suggest optional context
detect duplicate knowledge candidates
```

### Requirements

- Semantic results are optional.
- Deterministic required context does not depend on embeddings.
- Selection reasons distinguish semantic hits from rule-based hits.
- Semantic indexes are rebuildable from project artifacts.

### Acceptance Criteria

- Required context remains deterministic.
- Semantic results are labeled optional.
- Context plan remains reproducible with semantic expansion disabled.

## M13: Artifact Graph Kernel

### Goal

Make the Artifact Graph the central projection over project knowledge, controls,
runs, source files, generated files, tasks, and traces.

### Initial Types

```text
Artifact:
  id
  kind
  path
  contentHash
  metadata
  ownership
  status

Edge:
  from
  to
  kind
  confidence
  source
```

Initial artifact kinds:

```text
markdown
knowledge
check
skill
linter
role
task
permission
hook
agent
team
run
trace
source-file
generated-file
decision
product-intent
control-mechanism
```

Initial edge kinds:

```text
derives_from
implements
satisfies
guards
validates
selects
scopes
supersedes
conflicts_with
observed_from
emitted_as
edited_by
```

### Commands

```bash
atelier scan
atelier graph
atelier impact --path product/packages/ui
atelier blame ARTIFACT_ID
atelier status
```

### Storage

```text
harness/atelier/events.ndjson
harness/atelier/graph.json
```

`events.ndjson` is durable append-only history. `graph.json` is a tracked
materialized projection or lock snapshot, not an independently authored source
of truth.

### Acceptance Criteria

- `scan` observes Markdown, generated files, run records, source files, and known controls without requiring new frontmatter.
- `graph` emits stable JSON sorted by artifact ID and edge tuple.
- `status` summarizes graph counts, stale artifacts, orphaned controls, and unresolved findings.
- Graph generation is deterministic for an unchanged working tree.
- v1 commands keep working.

## M14: Event Log and Reconciler

### Goal

Treat change, deletion, drift, and replacement as events to interpret and
reconcile continuously.

### Event Kinds

```text
file_changed
file_moved
file_deleted
artifact_observed
artifact_edited
artifact_deleted
artifact_emitted
run_started
run_completed
rule_changed
policy_decision
reconciliation_finding
```

### Reconciliation Actions

```text
silent
auto-reconcile
advisory
task
human-decision
block
```

### Commands

```bash
atelier reconcile
atelier repair --dry-run
```

### Requirements

- Classify deleted artifacts as intentional removal, move/rename, replacement, accidental deletion, or policy violation.
- Detect when knowledge remains but enforcement disappeared.
- Detect when enforcement remains but authored source disappeared.
- Treat stricter curated controls as candidate knowledge updates, not drift by default.
- Block only explicit high-risk policy violations.
- Use advisory or task findings for medium-risk cases.

### Acceptance Criteria

- Moved Markdown with stable content preserves lineage without human approval.
- Deleted Markdown with active enforcement produces an orphan-source finding.
- Deleted enforcement for active knowledge produces a missing-control task finding.
- Dangerous permission relaxation produces `human-decision` or `block`.
- `repair --dry-run` previews changes and never mutates policy semantics.

## M15: Selector v2

### Goal

Generalize role-routed context selection into graph selection.

### Selector Inputs

```text
role
task
phase
scope
diff
risk
permissions
budget
```

### Requirements

- Keep Role, Task, Agent, Phase, and Scope separate.
- Preserve v1 Markdown-backed context selection as a compatibility path.
- Explain graph-based selection, skipped artifacts, and permission envelope.
- Support context preview without creating a run.

### Acceptance Criteria

- Existing `context plan` output can be explained as a Selector v2 query.
- Role Matrix and Context Preview data can be derived from Selector output.
- Required context remains deterministic without semantic expansion.

## M15.5: Task and Role Authoring

### Goal

Create and edit roles, tasks, phases, scopes, and product intents through CLI,
MCP, GUI, and later agent interaction without making the GUI a separate source
of truth.

### Commands

```bash
atelier role create
atelier role edit
atelier task create
atelier task split
atelier task assign
atelier task status
atelier task close
```

### Requirements

- Role, Task, Agent, Phase, and Scope remain separate artifact kinds.
- Task creation produces graph artifacts and event log entries.
- Role edits update Selector output through previewed reconciliation.
- Bulk role/context edits are possible through GUI and core APIs.
- LLM-assisted task/role drafting may propose changes but must go through the same mutation path.

### Acceptance Criteria

- A product intent can be turned into a task artifact.
- A task can be assigned role, phase, scope, and agent/team metadata.
- Role edits can be previewed against affected context plans.
- GUI, CLI, MCP, and agent interactions call the same core mutation APIs.

## M16: Control Mechanism Registry

### Goal

Unify checks, linters, hooks, permissions, tests, templates, review rules,
runtime guards, context selectors, UI constraints, and CI gates.

### Control Mechanism Types

```text
check
linter
typecheck
test
hook
permission
generator
codemod
template
runtime-guard
review-rule
context-selector
ci-gate
ui-constraint
```

### Commands

```bash
atelier controls list
atelier controls coverage
atelier controls missing
```

### Requirements

- Observe controls from generated checks, linter config, hooks, package scripts, CI files, tests, permissions, and selectors.
- Map knowledge and product intent to control mechanisms.
- Report missing and orphaned controls as reconciliation findings.
- Treat curated control edits as graph facts without immediately rewriting Markdown.

### Acceptance Criteria

- Coverage answers what guards each active knowledge or intent.
- Missing enforcement is reported as a task or advisory.
- Orphaned enforcement is reported without assuming it is invalid.
- Controls have ownership modes and provenance.

## M16.5: Static Policy Engine

### Goal

Evaluate governance policy without executing tools.

### Concepts

```text
PermissionMode
PathRule
CommandRule
ToolRule
ApprovalPolicy
RiskAction
```

### Commands

```bash
atelier policy check
atelier policy explain
atelier policy simulate
```

### Requirements

- Evaluate path operations.
- Evaluate command patterns.
- Evaluate tool permissions.
- Evaluate approval policy.
- Produce deterministic allow / deny / ask / advisory / task / block results.
- Explain the policy source and graph edges behind each decision.

### Acceptance Criteria

- A proposed file edit can be checked before execution.
- A proposed command can be checked before execution.
- Dangerous operations return `human-decision` or `block`.
- Low-risk operations can be allowed automatically.
- Every decision is traceable.

## M17: Artifact Graph UI

### Goal

Turn the GUI into an Artifact Graph Editor and product-owner control surface.

### Views

```text
Knowledge Inventory
Role Matrix
Scope Map
Task Builder
Control Coverage
Drift Dashboard
Permission Console
Run Trace Viewer
Team Registry
Context Preview
```

### Requirements

- GUI reads the same graph, selector, controls, reconciler, and policy core APIs as CLI and MCP.
- Role Matrix supports bulk include/exclude/conditional/deprecated edits.
- Drift Dashboard distinguishes silent, advisory, task, human-decision, and block findings.
- Permission Console cannot create invalid path or command rules.
- Task Builder creates graph artifacts and event log entries.

### Acceptance Criteria

- Bulk role/context edits preview affected context plans.
- Control Coverage maps knowledge and intent to mechanisms.
- Drift Dashboard can turn findings into tasks.
- Context Preview shows exact selected and skipped artifacts.
- GUI has no independent source-of-truth state.

## M18: Governance Runtime

### Goal

Evaluate path, command, tool, hook, approval, and permission policy before and
after tool use.

### Runtime Hooks

```text
PreToolUse
PostToolUse
PreCommand
PostCommand
PreFileWrite
PostFileWrite
RunStart
RunClose
EmergencyStop
```

### Requirements

- Low-risk operations can be allowed automatically.
- Medium-risk operations can produce post-run advisories or tasks.
- High-risk operations require human decision.
- Explicitly forbidden operations block before execution.
- Policy decisions are recorded in Trace and Event Log.

### Acceptance Criteria

- Tool requests pass through Policy Engine.
- File writes can be blocked or allowed by path rules.
- Commands can be blocked or sandboxed by command rules.
- Hook outputs can update graph, trace, or reconciliation findings.
- Emergency stop can halt autonomous mutation modes.

## M19: Governed Agent Loop

### Goal

Provide an Atelier-controlled tool-call loop integrated with graph, governance,
tasks, controls, and trace.

### Loop

```text
1. receive task
2. resolve role/context/permission
3. plan
4. request tools
5. PreToolUse governance check
6. execute tool
7. PostToolUse observation
8. update artifact graph
9. run relevant checks
10. decide continue / delegate / ask / stop
11. emit trace
```

### Requirements

- Tool calls pass through Policy Engine.
- Tool results update Trace and may update Artifact Graph.
- Streaming tool-call lifecycle is observable in Trace.
- API retries use explicit exponential backoff policy.
- Timeout behavior is explicit.
- Token and cost accounting are recorded per task, agent, run, and delegated subtask.
- Parallel tool execution is allowed only when Policy Engine confirms no path, state, or command conflict.
- Observe and suggest modes ship before autonomous mutation modes.

### Acceptance Criteria

- The loop can run read-only investigations.
- The loop can run suggestion-only edits.
- Mutating work is governed by path, command, and permission policy.
- Every tool call has trace and policy decision records.
- Cost and token summaries are visible at run and task levels.

## M20: Swarm Coordination

### Goal

Add permissioned delegation and background task lifecycle.

### Concepts

```text
Team
Task
DelegationRule
BackgroundRun
```

### Requirements

- Subagents receive reduced context and narrower permissions than parent tasks by default.
- Delegation records expected handoff format and allowed tools.
- Background runs expose lifecycle, logs, cost, retries, cancellation, and stale detection.
- Swarm coordination integrates with Task Graph, Selector, Policy Engine, Control Mechanisms, and Trace.

### Acceptance Criteria

- A task can spawn a scoped subtask with narrower context and permissions.
- Delegation is visible in Trace and Event Log.
- Background work can be cancelled or marked stale.
- Teams can declare capabilities, cost profiles, and permission modes.
- Swarm cannot bypass governance.

## M21: Run Resume Materialization

### Goal

Make a run capsule the canonical handoff for any external LLM runner or human
operator. The capsule is durable, portable, and resumable without chat history.

### Commands

```bash
atelier run resume <run-id>
atelier run refresh <run-id>
atelier run list [--status active|completed]
```

### Canonical Reading Order

```text
manifest.json
handoff.md
brief.md
plan.md
context.md
verification.md
review.md
worklog.md
artifacts.md
```

### Requirements

- `atelier run resume` returns a portable prompt that includes the capsule
  path, the canonical reading order, and the next concrete step from
  `handoff.md`.
- `atelier run refresh` re-resolves `context.md` from the current artifact
  graph and updates `manifest.contextHash`. Drift is reported, not silently
  rewritten.
- `atelier run list` exposes active and completed capsules for the GUI, MCP,
  and CI to observe.
- The same reading order is enforced in CLI, MCP, GUI, adapter docs, and
  tests.

### Acceptance Criteria

- A fresh LLM can read the capsule directory in the canonical order and start
  work without prior context.
- A resumed run with the same `contextHash` is recognized as fresh; a changed
  `contextHash` is reported as drift.
- GUI and MCP both expose the same list / inspect / resume surface as CLI.
- Tests assert the canonical order across `requiredRunFiles`,
  `resumeRun().readingOrder`, and the contract tests.

## Next Implementation Order

### Commit 1

```text
feat(atelier): add artifact graph kernel
```

Contents:

```text
graph types
artifact identity
Markdown observer
run observer
generated-file observer
source-file observer
edge extraction from existing indexes and manifests
atelier scan
atelier graph
atelier status
deterministic graph output tests
```

### Commit 2

```text
feat(atelier): add event log and reconciliation findings
```

Contents:

```text
append-only event types
move/delete/replacement classification
orphan-source findings
missing-control findings
curated-control edit handling
atelier reconcile
repair dry-run preview
```

### Commit 3

```text
feat(atelier): add control mechanism registry
```

Contents:

```text
control mechanism types
observers for checks, linters, hooks, package scripts, CI, tests, permissions, selectors
atelier controls list
atelier controls coverage
atelier controls missing
```

### Commit 4

```text
feat(atelier): generalize selector over graph inputs
```

Contents:

```text
Selector v2 types
graph-backed context preview
role/task/phase/scope/diff/risk/permission/budget trace
compatibility layer for context plan
```

### Commit 5

```text
feat(atelier): add task and role authoring core
```

Contents:

```text
task artifact types
role mutation preview
task create/split/assign/status/close
role create/edit
selector impact preview
```

### Commit 6

```text
feat(atelier): add static policy engine
```

Contents:

```text
permission modes
path rules
command rules
tool rules
approval policy
policy check/explain/simulate
traceable policy decisions
```

### Commit 7

```text
feat(atelier): surface graph and drift in gui and mcp
```

Contents:

```text
MCP tools for graph/status/reconcile/controls/policy
GUI views for Artifact Graph Overview, Control Coverage, Drift Dashboard, Context Preview
read-only defaults with explicit mutation confirmation
```

### Later Commits

```text
feat(atelier): add governance runtime
feat(atelier): add governed agent loop
feat(atelier): add swarm coordination
feat(atelier): add run resume materialization
```

## CI Strategy

### Phase 1: Observability

```bash
atelier doctor --json
atelier scan --json
atelier status --json
```

Runs in CI and uploads diagnostics/graph summaries. Warnings do not fail.

### Phase 2: Deterministic Gates

```bash
atelier doctor --json
atelier status --json
atelier policy check --json
```

Fails only on deterministic errors and explicit policy violations.

### Phase 3: Governance Gates

Selected reconciliation `block` findings and governance policies become hard
gates.

### Phase 4: Agent Runtime Gates

Agent runs must produce trace, verification, handoff, and policy-decision
records before close.

## Risks and Mitigations

### Risk: Markdown Schema Becomes Too Strict

Mitigation:

```text
progressive strictness
warnings before errors
completed runs remain loose
curated artifacts can exist outside Markdown
```

### Risk: Graph Becomes a Second Hidden Truth

Mitigation:

```text
events are durable history
graph is a projection / lock snapshot
every edge records source and confidence
graph can be rebuilt or explained from working tree + event log + curated metadata
```

### Risk: Reconciler Asks Too Often

Mitigation:

```text
risk actions instead of approval as normal flow
auto-reconcile low-risk moves and deterministic lineage updates
advisory/task findings for medium risk
human decisions only for product judgment, dangerous policy changes, and unresolved ambiguity
```

### Risk: Curated Edits Are Misread as Drift

Mitigation:

```text
ownership modes
curated edits become graph facts
stricter controls can produce candidate knowledge
missing controls become tasks or advisories, not automatic failure
```

### Risk: LLM Handles Too Much

Mitigation:

```text
decision hierarchy: exact, structural, rule-based, heuristic, cached semantic, LLM semantic, human
test deterministic classification first
trace every LLM judgment with confidence and source evidence
```

### Risk: Agent Runtime Arrives Before Governance

Mitigation:

```text
Artifact Graph, Reconciler, Selector, Control Mechanism Registry, and Static Policy Engine come first
observe/suggest modes ship before autonomous mutation modes
all tool calls pass through Policy Engine
```

### Risk: GUI Becomes a Hidden Database

Mitigation:

```text
GUI calls core APIs
all mutations write repository artifacts or event log entries
no independent GUI-only state
preview before mutation
```

## Done Definition for v1

Atelier v1 is done when a non-trivial harness task can be performed through:

```text
atelier doctor
atelier context plan
external runner receives the plan
agent works
agent or human records verification and handoff notes when useful
normal project checks pass
```

or, when durable handoff is needed, through:

```text
atelier context plan
atelier task create
atelier run create --task <task-id>
atelier run resume <run-id>
external runner reads the capsule in the canonical order
agent works
atelier run handoff
atelier run verify --record
atelier run complete
normal project checks pass
```

and the following are true:

```text
no manual grep is needed to find starting context
selected context is explainable
selected context is reproducible
broken Markdown is detected
old paths are detected
run completion is gated by evidence
Markdown knowledge proposals do not immediately pollute durable knowledge
root adapters remain short
the Run Plane exposes 7 subcommands: create, list, inspect, resume, handoff, verify, complete
the canonical run reading order is enforced in CLI, MCP, GUI, and tests
```

## Done Definition for v2 Kernel

Atelier v2 kernel is done when this loop works without treating Markdown as the
only source of truth:

```text
atelier scan
atelier graph
atelier status
atelier reconcile
atelier controls coverage
atelier policy simulate
atelier context plan
external runner works through selected context and policy envelope
normal project checks pass
atelier status
```

and the following are true:

```text
Artifact Graph contains Markdown, knowledge, controls, roles, tasks, runs, generated files, and source files.
Event Log records file changes, artifact observations, run lifecycle, policy decisions, and reconciliation findings.
Reconciler classifies moved, deleted, replaced, orphaned, missing-control, and dangerous-policy cases.
Control coverage maps knowledge and product intent to enforcement mechanisms.
Selector explains role, task, phase, scope, diff, risk, permission, and budget decisions.
Policy Engine can evaluate path, command, and tool risk before execution.
Human decisions are reserved for product intent, high-risk governance, destructive operations, and ambiguous value judgments.
Run Plane materializes portable, resumable task capsules with the 9-file canonical shape; harness/runs/active is observable in the graph as kind: run.
```

## Done Definition for Product Direction

Atelier's product direction is validated when humans can operate mostly as
product owners:

```text
state product intent
set priorities
set constraints
approve high-risk product or governance decisions
inspect trace and outcomes
```

while Atelier and agents handle:

```text
context routing
task decomposition
implementation work
verification
documentation updates
control coverage
reconciliation
governed execution
handoff
```
