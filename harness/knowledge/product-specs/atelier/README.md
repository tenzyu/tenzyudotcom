---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
id: knowledge.product-spec.atelier
pattern: multi-context
title: Atelier
status: active
summary: Agentic Software Development Control Plane for continuously reconciled project artifacts, governed agent work, role-routed context, and progressively autonomous software production.
tags:
  - domain:atelier
  - domain:harness
  - kind:spec
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

# Atelier

Atelier is an **Agentic Software Development Control Plane**.

It manages the knowledge, tasks, roles, permissions, checks, skills, hooks,
runtime traces, and agent work needed to make software projects progressively
automatable without turning the project into a pile of hidden prompts, stale
Markdown, or uncontrolled autonomous agents.

Atelier's long-term goal is a development environment where humans primarily
act as product owners:

- humans define intent, priorities, constraints, and unacceptable risks;
- agents perform investigation, implementation, verification, documentation,
  and handoff work;
- Atelier keeps the system coherent, governed, observable, reversible, and
  progressively more deterministic.

Atelier is not a generic chatbot, not a Markdown CMS, not a vector database
first system, and not an uncontrolled autonomous agent. In early phases it does
not own the agent runtime. In later phases it may host governed agent loops, but
every autonomous action must pass through Artifact Graph, Policy Engine, Task
state, and Trace.

In Japanese:

```text
Atelier は、LLMエージェントによるソフトウェア開発を、
知識・権限・タスク・検証・実行・協調の面から制御する
Agentic Software Development Control Plane である。
```

## 1. Position

Atelier is the control layer between a software project and agentic execution
surfaces such as CLI agents, MCP clients, coding assistants, local tools,
workflow engines, CI, and future Atelier-controlled agent loops.

It does not begin as a runtime. It begins as the kernel that makes runtime work
safe and meaningful:

```text
Project working tree
  -> observed artifacts
  -> Artifact Graph
  -> Reconciler
  -> Selector
  -> Policy Engine
  -> Materializer
  -> Trace
  -> agent / human / CI surfaces
```

Atelier's core claim is:

```text
Natural language project intent and project knowledge should be pushed as far
as possible toward deterministic, inspectable, programmable control artifacts.
```

This does not mean all natural language becomes a hard boolean check. Atelier
classifies knowledge and intent into the strongest safe form available:

```text
deterministic control
  when the rule can be checked by program, schema, AST, graph, policy, or test

semantic review
  when interpretation is required but the review question can be structured

human decision
  when product intent, risk tolerance, or unresolved ambiguity remains
```

## 2. Final State Model

The old adoption model, "Markdown as source of truth / Atelier as compiler", is
useful only as a v1 migration path. It is not the final product definition.

The final model is:

```text
system state = Git working tree + Atelier Artifact Graph + Event Log
```

Markdown is one artifact type. It is not the whole truth.

The following are all artifacts:

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

Checks, skills, linters, hooks, permissions, roles, tasks, and traces may be
edited by humans or agents. Those edits are not automatically drift. They may be
new evidence, stricter controls, replacement controls, candidate knowledge, or
policy changes. Atelier observes them, relates them, reconciles them, and
materializes updated projections where appropriate.

## 3. Core Kernel

Atelier is organized around a small kernel:

```text
Artifact Graph
Event Log
Reconciler
Selector
Policy Engine
Materializer
Trace
```

### 3.1 Artifact Graph

The Artifact Graph is the central projection over project artifacts and their
relationships.

Minimum artifact shape:

```text
Artifact:
  id
  kind
  path
  contentHash
  metadata
  ownership
  status
```

Minimum edge shape:

```text
Edge:
  from
  to
  kind
  confidence
  source
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

Atelier must not assume Markdown is the only parent of operational controls. A
linter rule, hook, permission file, CI gate, check, test, skill, task, or run
trace can also reveal project knowledge.

### 3.2 Event Log

The Event Log records observations that explain graph state.

Initial event kinds:

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

The event log is durable append-only history. A graph snapshot is a materialized
projection or lock snapshot, not an independently authored source of truth. It
must remain explainable from the working tree, the event log, and curated
artifact metadata.

### 3.3 Reconciler

The Reconciler interprets change and chooses the lowest-friction safe action.

Risk actions:

```text
silent
  No user-facing action, or only a lineage update.

auto-reconcile
  Update graph state and derived projections automatically.

advisory
  Surface a warning without blocking work.

task
  Create or suggest follow-up work.

human-decision
  Ask a human product owner or maintainer for a specific decision.

block
  Stop execution because explicit policy would be violated.
```

Deletion is first-class. A deleted Markdown file, check, skill, linter, hook,
role, or permission may mean:

```text
intentional removal
move / rename
replacement
accidental deletion
policy violation
```

Approval dialogs are exceptional. The normal flow should be policy-based,
auto-reconciled, advisory, or task-producing. Human attention is reserved for
product judgment, high-risk governance changes, destructive operations, and
unresolved intent.

### 3.4 Selector

The Selector chooses context and controls for a concrete work situation.

```text
Context = f(role, task, phase, scope, diff, risk, permissions, budget)
```

Role, Task, Agent, Phase, and Scope are separate concepts:

```text
Role
  Perspective, responsibility, and knowledge/control set.

Task
  Work to accomplish.

Agent
  Execution subject.

Phase
  Work stage.

Scope
  Affected paths, packages, features, or domains.
```

Role-routed context development is a Selector use case, not the whole system.

### 3.5 Policy Engine

The Policy Engine evaluates whether an operation is allowed before and after a
tool, command, file edit, agent delegation, or background task step.

Initial concepts:

```text
PermissionMode
PathRule
CommandRule
Hook
ApprovalPolicy
```

Permission modes:

```text
observe
suggest
edit
restricted-edit
autonomous
maintainer
emergency-stop
```

### 3.6 Materializer

The Materializer writes project-facing artifacts from graph state:

```text
context packs
checks
skills
linters
hooks
permission files
role bundles
run manifests
review prompts
CI outputs
GUI projections
MCP responses
```

Materialized files must preserve provenance and ownership. They may be fully
generated, managed in marked sections, curated, observed, external, or
deprecated.

### 3.7 Trace

Trace records why Atelier selected context, allowed or blocked a tool call,
emitted a task, changed graph state, or asked for a human decision.

Trace is not optional. A control plane without trace becomes another hidden
source of confusion.

## 4. Planes

Atelier grows through cooperating planes.

```text
Knowledge Plane
Governance Plane
Verification Plane
Task / Product Plane
Run Plane
Swarm Coordination Plane
Agent Runtime Plane
Human Product Owner UI
```

### 4.1 Knowledge Plane

Knowledge is not limited to Markdown.

Knowledge may be authored or observed from:

```text
Markdown
checks
linters
hooks
CI
package scripts
code structure
import graphs
test names
failed runs
review comments
agent traces
human decisions
product tasks
```

Markdown remains the best human-readable authoring format for many meanings:

```text
design rules
product specs
ADRs
workflows
policies
handoffs
verification notes
```

But Markdown should not manually carry derived data such as reverse role
indexes, full repo maps, dependency graphs, stale status, or generated role
bundles.

### 4.2 Governance Plane

Governance is a peer of Knowledge, not a subfeature.

It covers:

```text
multi-level permission modes
path-level rules
command-level rules
tool-level rules
PreToolUse hooks
PostToolUse hooks
interactive approval dialogs
emergency stop
```

The goal is not to ask more often. The goal is to ask only when the decision is
actually human.

### 4.3 Verification Plane

Verification converts knowledge and intent into operational control mechanisms.

`check` and `linter` are only two examples. The broader term is:

```text
Control Mechanism
```

Initial control mechanism types:

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

Coverage must answer:

```text
Which knowledge or product intent is guarded by which mechanism?
Where did enforcement disappear?
Where is a control orphaned from its original source?
Where is a control stricter than the authored docs?
Where is an active rule only semantically reviewed but not mechanically guarded?
```

### 4.4 Task / Product Plane

Atelier must support product-owner operation.

Humans should be able to create and refine:

```text
product intent
tasks
subtasks
phases
roles
scopes
acceptance criteria
risk constraints
release decisions
```

This must be available through CLI, MCP, GUI, and later agent interaction.
The GUI must not own independent state.

### 4.5 Run Plane

The Run Plane materializes durable, portable, resumable task capsules. It is
not an execution lifecycle: the CLI never invokes an LLM and never owns the
agent runtime. It only writes, inspects, refreshes, and freezes capsules.

A run capsule lives under `harness/runs/active/<run-id>/` while open and is
moved to `harness/runs/completed/<run-id>/` on completion. A capsule contains:

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

The canonical reading order is fixed and is the same for CLI, MCP, GUI, and
adapter docs. After `manifest.json` a fresh LLM always lands on `handoff.md`
first so it sees the latest resume point before any other durable file.

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

A run capsule is created from a task via `atelier run create --task <id>`. The
`manifest.json` carries the run id, task id, workflow id, role ids, scope,
intent, artifact refs, validation refs, a `contextHash` for freshness, and
links to the originating task. The `context.md` is a snapshot of the resolved
context plan and is allowed to drift; staleness is reported, not auto-rewritten.

Run surface commands are:

```bash
atelier run create --task <task-id>
atelier run list [--status active|completed]
atelier run inspect RUN-ID
atelier run resume RUN-ID
atelier run handoff RUN-ID --append <text>
atelier run verify RUN-ID --list
atelier run verify RUN-ID --record "<check-id>::<status>::<note>"
atelier run complete RUN-ID
```

`atelier run resume` returns a portable resume prompt that any external LLM
runner (Codex, opencode, ChatGPT, Claude, Gemini) or a human operator can read
to pick up the work in progress. The CLI never launches the runner.

The Run Plane is not mandatory for every task. Durable records are written only
when handoff, review, migration, decision, or audit value justifies the
artifact. Tasks that are completed inside a chat session may remain in the Task
Plane only.

### 4.6 Swarm Coordination Plane

Swarm means permissioned division of labor, not uncontrolled parallelism.

Initial concepts:

```text
Team
Task
DelegationRule
BackgroundRun
```

Subagents should receive reduced context and narrower permissions than parent
tasks by default.

### 4.7 Agent Runtime Plane

Atelier may eventually host a governed tool-call loop.

The value of this loop is not ReAct by itself. The value is that every tool call
is integrated with Artifact Graph, Policy Engine, Task state, Control
Mechanisms, and Trace.

Loop shape:

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

The loop must support streaming tool-call observation, explicit retry policy,
timeout policy, token counting, cost tracking, and safe parallel execution only
when Policy Engine confirms no path, state, or command conflict.

### 4.8 Human Product Owner UI

The target GUI is an Artifact Graph Editor and product-owner control surface,
not a generic chat UI.

Target views:

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

The GUI must call the same core APIs as CLI and MCP.

## 5. Decision Hierarchy

Atelier must not waste tokens on work that programs can do.

Decision hierarchy:

```text
Level 0: Exact
  hash, id, path, schema, AST, git diff

Level 1: Structural
  Markdown AST, import graph, package graph, command graph, dependency graph

Level 2: Rule-based
  selectors, path rules, command rules, permission rules

Level 3: Heuristic
  similarity, rename detection, scope inference, stale detection

Level 4: Cached Semantic
  previous summaries, block embeddings, known classifications

Level 5: LLM Semantic
  ambiguous classification, meaning diff, intent inference

Level 6: Human
  product judgment, priority, risk tolerance, dangerous change approval
```

Programmatic certainty wins over LLM interpretation. LLM semantics are used when
cheaper deterministic, structural, rule-based, or cached methods are
insufficient. Human attention is reserved for value and risk decisions.

## 6. Ownership Modes

Every artifact has an ownership mode.

```text
observed
  Atelier reads the artifact but does not write it.

generated
  Atelier may fully regenerate it.

managed
  Atelier owns specific marked ranges or records.

curated
  Humans or agents may edit it; Atelier rereads it and reconciles downstream effects.

external
  External tools own it; Atelier observes and respects it.

deprecated
  Kept for history but not selected for new work by default.
```

Checks, skills, linters, hooks, and permission rules should usually become
curated or observed over time, not permanently generated. A curated edit is not
automatically drift. It may be new knowledge.

## 7. Markdown-Backed Knowledge Model

Markdown-backed knowledge remains the v1 adoption path.

A Markdown knowledge document is:

```text
frontmatter metadata
+ human-readable body
+ graph observation
+ optional selector metadata
```

The body is the human-readable meaning. Frontmatter should carry only indexing,
selection, relationship, status, and transformability hints. It must not become
a duplicate of the body.

Body interpretation follows the decision hierarchy:

```text
exact parsing
structural analysis
rule-based classification
heuristics
cached semantic summaries
LLM semantic interpretation
human decision
```

### 7.1 Common Frontmatter

Minimum fields for strict authored objects:

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
  - domain:atelier
supersedes: []
superseded_by: ""
x:
  any experimental extension
```

Unknown fields should be warnings only unless they conflict with reserved names.
Completed run history should remain loose historical text and should not be
forced through every future schema migration.

### 7.2 ID Rules

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

## 8. Role-Routed Context Development

A role is not an agent personality. A role is a context routing profile.

A role may define:

```text
activation conditions
path selectors
tag selectors
pinned documents
default phases
outputs
review criteria
permission envelope
```

A context plan must explain:

```text
selected artifacts
skipped artifacts
selection reasons
required versus optional context
estimated context cost
weak routing signals
permission envelope
trace
```

Required context remains deterministic. Semantic expansion is optional and must
be labeled as optional.

## 9. Task Records, Run Capsules, and External Runners

The current product model splits the work into three layers:

```text
Task Plane  -> durable work item or intent (harness/tasks/<task-id>.md)
Run Plane   -> portable, resumable task capsule (harness/runs/...)
Context     -> read-only preflight resolution (atelier context plan)
```

Atelier does not own the execution lifecycle of an LLM task. The Task Plane
holds the intent, the Run Plane materializes a resumable capsule for that task
when durable handoff is useful, and `atelier context plan` is a read-only
resolver that picks relevant context, risks, and validation commands without
mutating anything. External runners (Codex, opencode, ChatGPT, Claude, Gemini)
or a human operator perform the actual edits.

### 9.1 Task Records

When a durable task record is useful, it should preserve:

```text
workflow
task
assigned roles
agent or team
user intent
target paths
selected context and controls
selection reasons or trace
source hashes where relevant
recorded time
required artifacts
permission envelope
trace
```

The current task preflight artifact is a context plan, not a generated run
directory. The plan must explain selected artifacts, skipped artifacts, risks,
permission envelope, and relevant validation commands.

### 9.2 Run Capsule

For tasks that need durable handoff, review, or pause-and-resume, the Run
Plane materializes a portable task capsule under
`harness/runs/active/<run-id>/`. The capsule is a projection of the artifact
graph plus the originating task, not an execution runtime. Any LLM runner can
read the directory and resume the work.

The canonical reading order is fixed and is the same for CLI, MCP, GUI, and
adapter docs:

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

Rules:

- `manifest.json` is the only required-to-mutate file. It carries the run id,
  task id, workflow id, role ids, scope, intent, artifact refs, validation
  refs, a `contextHash` for freshness, and links to the originating task.
- `handoff.md` is the resume point. It is the second file a fresh LLM reads
  after `manifest.json`. It is append-only while the run is active.
- `context.md` is a snapshot of the resolved context plan. It is allowed to
  drift from the current artifact graph; staleness is reported, not silently
  rewritten.
- `worklog.md` is append-only history of what was done, what was confirmed,
  and what was deferred.
- `verification.md` lists executed checks, expected results, and skipped
  checks with reasons.
- `review.md` carries open and resolved review notes.
- `artifacts.md` lists artifacts consumed, produced, and changed.

Run commands are:

```bash
atelier run create --task <task-id>
atelier run list [--status active|completed]
atelier run inspect RUN-ID
atelier run resume RUN-ID
atelier run handoff RUN-ID --append <text>
atelier run verify RUN-ID --list
atelier run verify RUN-ID --record "<check-id>::<status>::<note>"
atelier run complete RUN-ID
```

Event log:

- `run_created` is emitted when a capsule is materialized.
- `run_completed` is emitted when a capsule passes its gates and is moved to
  `harness/runs/completed/<run-id>/`.
- `run_started` is the deprecated v1 lifecycle event. New code must not emit
  it; readers may still accept historical records for compatibility.

The Run Plane is not mandatory for every task. Tasks that complete inside a
single chat session may remain in the Task Plane. Durability is opted into
when handoff, review, migration, or audit value justifies the artifact.

## 10. Commands

The stable command surface should stay small and composable.

Read and inspect:

```bash
atelier doctor
atelier scan
atelier graph
atelier status
atelier impact
atelier blame
atelier controls list
atelier controls coverage
atelier controls missing
```

Context preflight:

```bash
atelier context plan
```

Reconciliation:

```bash
atelier reconcile
atelier repair --dry-run
```

Task and role authoring:

```bash
atelier role create
atelier role edit
atelier task create
atelier task split
atelier task assign
atelier task status
atelier task close
```

Run capsule authoring (Run Plane):

```bash
atelier run create --task <task-id>
atelier run list [--status active|completed]
atelier run inspect RUN-ID
atelier run resume RUN-ID
atelier run handoff RUN-ID --append <text>
atelier run verify RUN-ID --list
atelier run verify RUN-ID --record "<check-id>::<status>::<note>"
atelier run complete RUN-ID
```

Governance:

```bash
atelier policy check
atelier policy explain
atelier policy simulate
```

Mutating commands must support preview, dry-run, or explicit confirmation where
appropriate.

## 11. Adapter Surfaces

The same core operations must be available through:

```text
CLI
MCP server
GUI
generated skills
adapter documents
future governed agent loop
```

MCP is an adapter, not the core. GUI is an adapter, not the source of truth.
Generated skills and adapter documents should be short routing layers that tell
agents how to use Atelier, not duplicated policy dumps.

## 12. Non-Goals

Atelier must not become:

```text
an uncontrolled generic autonomous agent
an agent personality
a generic chat-first coding UI
a UI-only stateful database
a vector database first system
a generic note-taking app
a replacement for Git
a replacement for existing language, build, test, or package tooling
a system that requires every project document to be rewritten into a strict schema
a system that forces every small code change to create durable knowledge
a system that owns the LLM execution runtime
a system that requires every task to materialize a run capsule
```

Atelier may expose CLI, MCP, GUI, hooks, adapters, and agent-runtime surfaces,
but those surfaces must call the same core operations and must not create
independent state.

## 13. Validation and Safety

Errors block the relevant operation. Warnings do not block by default.

Examples of errors:

```text
duplicate ID
invalid YAML in strict documents
unresolved required symbolic reference
missing referenced workflow / role / phase
broken required Markdown link
context manifest hash mismatch
explicit path / command / secret / permission policy violation
```

Examples of warnings:

```text
knowledge has no tags
knowledge has no selector hits
role selector matches nothing
role selector is too broad
optional context exceeds token budget
semantic condition was used
completed run references old paths
curated control source disappeared but enforcement remains
knowledge remains but enforcement disappeared
```

Atelier may auto-fix deterministic mechanical issues only. It must not silently
promote knowledge, change policy semantics, delete history, rewrite design
decisions, or infer architecture decisions from weak evidence.

## 14. Acceptance Direction

Atelier's current active CLI surface is acceptable when it makes the existing
harness safer and more agent-usable without owning external runner lifecycle:

```text
doctor
scan / graph / status
context plan
controls coverage
static policy checks
task and role authoring
reconciliation preview
MCP and GUI surfaces calling the same core
short adapters that route agents to context planning
```

Atelier v2 kernel is acceptable when it no longer relies on Markdown as the only
source of truth:

```text
scan
graph
status
reconcile
controls coverage
selector over role/task/phase/scope/diff/risk/permissions/budget
policy simulation
traceable task and handoff operation
```

The product becomes mature when humans can operate mainly as product owners and
Atelier can route intent into governed, observable, verified agent work with
minimal manual context handling.
