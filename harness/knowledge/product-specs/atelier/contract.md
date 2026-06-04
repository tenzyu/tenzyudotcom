---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-contract
title: Atelier Contract
status: active
pattern: simple
tags:
  - product:atelier
  - subject:contract
  - domain:harness
  - layer:product
  - criticality:fatal
  - status:active
affordances:
  declared:
    - context
    - check-candidate
    - review-candidate
    - test-source
---

# Atelier Contract

## 1. Status and Authority

This document is the normative product and behavior contract for Atelier.

`Ideal.md` defines why Atelier exists. This document defines the durable behavior that implementation, tests, CLI output, MCP tools, GUI text, adapters, run packets, and generated next actions must satisfy.

If implementation conflicts with this document, implementation is wrong.

If tests conflict with this document, either the tests are wrong or this document must be explicitly revised.

If README, ROADMAP, or POSITIONING conflicts with this document on behavior, this document wins.

If this document conflicts with `Ideal.md`, do not silently let this document win. Treat the conflict as a product-design decision and revise one or both documents explicitly.

## 2. Document Precedence

For product direction:

```txt
Ideal.md > contract.md > POSITIONING.md > ROADMAP.md > README.md
```

For implementation correctness:

```txt
contract.md > tests > implementation > README.md > ROADMAP.md > POSITIONING.md
```

For execution planning:

```txt
ROADMAP.md > task artifacts > run packets > work orders
```

For market and strategic positioning:

```txt
POSITIONING.md
```

For human onboarding:

```txt
README.md
```

## 3. Product Definition

Atelier is a runtime-agnostic artifact operating layer for coding agents, human product owners, and repository-local software work.

It treats implicit knowledge, Markdown, tests, checks, skills, linters, roles, permissions, hooks, tasks, product specs, traces, verification records, reviews, prompts, handoffs, source files, and configuration as graph-managed project artifacts.

Atelier resolves attention, manages artifact transformations, preserves provenance, verifies outcomes, and presents decisions.

Atelier does not directly own coding agent execution.

Atelier is not merely a context planner. Attention Management is one plane of the product, not the whole product.

## 4. Core Vocabulary

### Artifact

An artifact is any repository-relevant object that Atelier can observe, classify, relate, resolve, transform, verify, or present.

Examples:

```txt
Markdown knowledge
product spec
contract
roadmap
task
run handoff
check
skill
linter
role
permission
hook
workflow
prompt
trace
verification record
review record
generated index
source file
configuration file
```

Artifacts must retain source identity.

A transformation may derive a new artifact from an old one, but must not erase the old artifact or make its origin unknowable.

### Source Artifact

A source artifact is an authored or externally meaningful repository artifact.

Examples:

```txt
harness/knowledge/**/*.md
harness/tasks/**/*.md
harness/runs/**/handoff.md
product/**
docs/**
tests
linters
hooks
policies
package configuration
```

Source artifacts must remain useful without requiring a hidden Atelier runtime.

### Derived State

Derived state is generated resolution, cache, index, trace, or debug output.

Derived state belongs under `.atelier`.

Derived state may be regenerated.

Derived state must not be the only source of product truth.

### Attention

Attention is the set of artifacts a runner should consider for a unit of work, plus the order, depth, injection mode, and exclusions for those artifacts.

### Transformation

Transformation is a traceable movement from one artifact representation to another.

Examples:

```txt
Markdown -> check
Markdown -> linter
Markdown -> hook
Markdown -> task
Markdown -> prompt
Markdown -> skill
Markdown -> role
Markdown -> policy
tests -> markdown
linter -> markdown
trace -> handoff
review -> task
verification -> roadmap update
```

Transformations must have provenance and maturity.

### Task

A task is a durable work item or product-intent artifact.

A task is not a run.

A task represents what should be done or decided.

### Run

A run is a portable, resumable work packet for an external runner.

A run is not the external runtime.

A run does not prove completion by existing.

### Context Plan

A context plan is a read-only attention-resolution output.

It does not create tasks, create runs, mutate repository files, launch agents, or complete work.

### External Runner

An external runner is any system that performs work outside Atelier's direct runtime ownership.

Examples:

```txt
Codex
opencode
ChatGPT
Gemini
Claude Code
local scripts
human operator
CI job
```

## 5. Plane Model

Atelier behavior is divided into planes. The planes are conceptual boundaries and may share implementation modules, but they must not be collapsed semantically.

```txt
Atelier
  = Artifact Plane
  + Attention Plane
  + Transformation Plane
  + Knowledge Plane
  + Governance Plane
  + Verification Plane
  + Task / Product Plane
  + Swarm Coordination Plane
  + Agent Runtime Plane
  + Human Product Owner UI
```

### Artifact Plane Contract

The Artifact Plane must observe source artifacts without destroying them.

It may produce derived graph state.

It must preserve artifact identity, kind, path, hash, ownership, provenance, and relation information when available.

### Attention Plane Contract

The Attention Plane must compute what to read for a task-specific context.

It must support deterministic selection where possible.

It may use semantic judgment, but semantic judgment must be traceable.

It must not use uncontrolled relation expansion that causes context bloat.

### Transformation Plane Contract

The Transformation Plane must not silently promote generated artifacts into accepted project truth.

It must distinguish candidates, proposals, accepted artifacts, deterministic artifacts, and enforced artifacts.

It must preserve provenance from source artifact to derived artifact.

### Knowledge Plane Contract

Knowledge artifacts may afford transformations, but they do not directly emit final checks, skills, hooks, tasks, or policies without maturity steps.

Knowledge body remains natural language unless explicitly transformed into a deterministic artifact.

Frontmatter should index, route, constrain, and relate knowledge. It should not duplicate the full meaning of the body.

### Governance Plane Contract

Governance artifacts define permissions, policies, roles, hooks, forbidden behavior, boundaries, and risk actions.

Governance should make unsafe or contract-breaking changes mechanically visible.

Governance must not hide mutations from the repository.

### Verification Plane Contract

Verification artifacts include tests, checks, linters, review records, verification records, and completion gates.

Verification must distinguish passed, failed, skipped, unavailable, and not-run states.

A runner must not claim verification was performed when it was not.

### Task / Product Plane Contract

Product specs, contracts, roadmaps, and tasks must remain distinct.

Tasks may be derived from product specs.

Runs may be materialized from tasks.

Task closure must not imply run completion.

### Swarm Coordination Plane Contract

Swarm coordination may route subtasks to multiple agents or roles.

Subagents may be cheap, specialized, bounded, or read-only.

No subagent output becomes product truth without artifact provenance and appropriate maturity.

### Agent Runtime Plane Contract

The Agent Runtime Plane resolves, connects, and observes external runtimes.

It may produce prompts, packets, handoffs, runtime capability descriptions, adapter payloads, traces, and comparison records.

It must not make Atelier the only valid runtime.

It must not collapse external execution into hidden Atelier-owned state.

### Human Product Owner UI Contract

The UI must present product truth, drift, risk, evidence, verification, roadmap state, and unresolved decisions.

It must not imply that unverified work is verified.

It must prefer actionable summaries over decorative dashboards.

## 6. Artifact Graph Contract

Atelier must treat project-relevant artifacts as graph nodes.

Graph edges may represent:

```txt
derives_from
implements
verifies
enforces
references
blocks
conflicts_with
requires_context
requires_decision
supersedes
owned_by
materializes
produces_trace
summarizes
```

The graph must support source artifacts and derived artifacts.

The graph must support provenance.

The graph must be deterministic for unchanged input where deterministic data is available.

The graph must be regenerable from repository artifacts plus documented external inputs.

## 7. `.atelier` Derived State Contract

`.atelier` is the home for generated resolution state.

Allowed contents include:

```txt
.atelier/graph/**
.atelier/indexes/**
.atelier/context/**
.atelier/runs/**
.atelier/traces/**
.atelier/cache/**
.atelier/debug/**
```

`.atelier` may contain:

- artifact graph snapshots;
- context resolution traces;
- run provenance;
- context hashes;
- debug manifests;
- runtime capability caches;
- generated indexes;
- transform proposal indexes.

`.atelier` must not be the only place where product truth exists.

Deleting `.atelier` may lose cache and debug detail, but it must not delete the canonical product ideal, contract, tasks, source artifacts, accepted specs, or verification records that are intended as durable repository truth.

## 8. Transform Maturity Contract

Atelier must not treat all transformations as final.

Transformations use this maturity model.

```txt
Level 0: Source Artifact
  The artifact exists as authored or externally meaningful project material.

Level 1: Resolved Artifact
  Atelier has identified, classified, related, or indexed the artifact.

Level 2: Transform Candidate
  The artifact appears able to produce another artifact representation.

Level 3: Proposed Artifact
  A draft transformation exists.

Level 4: Accepted Artifact
  A human, contract, validator, or accepted policy has approved the transformation.

Level 5: Deterministic Artifact
  The artifact can run, verify, or be referenced without LLM interpretation.

Level 6: Enforced Artifact
  The artifact has active force through check, linter, hook, CI, policy, permission, or completion gate.
```

No implementation may skip from Level 0 or Level 1 to Level 6 without preserving provenance and acceptance evidence.

LLM-inferred transformations are proposals unless explicitly accepted.

## 9. Knowledge Contract

Knowledge artifacts may use Dendritic Patterns.

Accepted patterns include:

```txt
simple
conditional
inheritance
multi-context
collector
constants
fragment
factory
```

Knowledge selection must be based on explicit selectors, deterministic conditions, semantic decisions, or traceable relations.

Generic `requires` must not become an uncontrolled injection mechanism.

Knowledge does not emit artifacts. Knowledge affords transformations.

## 10. Attention / Context Plan Contract

`atelier context plan` is read-only.

Normal context planning effects must be:

```json
{
  "mutated": false,
  "createdRun": false,
  "createdTask": false
}
```

A context plan must not:

- create a task;
- create a run;
- mutate task state;
- mutate run state;
- write source files;
- update indexes as a hidden side effect;
- launch an external runner;
- mark work complete.

A context plan may:

- resolve relevant artifacts;
- report selected artifacts;
- report exclusions;
- report reading order;
- report injection mode;
- report semantic decisions;
- report next recommended actions;
- report stale or missing artifacts.

## 11. Task Plane Contract

Task artifacts are durable work items or product-intent artifacts.

Task lifecycle events are:

```txt
task_created
task_assigned
task_split
task_closed
```

Task closure must emit `task_closed`.

Task closure must not emit `run_completed`.

Tasks may reference:

- product specs;
- acceptance criteria;
- risk constraints;
- assigned roles;
- parent tasks;
- subtasks;
- related runs;
- verification requirements.

## 12. Run Plane Contract

A run is a portable, resumable work packet for an external runner.

A run does not launch or own an external LLM runtime.

A run packet's LLM-readable files are read in this order:

```txt
handoff.md
brief.md
plan.md
context.md
verification.md
review.md
worklog.md
artifacts.md
```

`manifest.json` is not part of the normal LLM reading order.

Manifest-like data, context hashes, provenance, and debug traces belong under `.atelier` or equivalent debug/provenance state. They may be inspected as a last resort, but runners should not be instructed to read manifest first.

Active run commands are:

```bash
atelier run create --task <task-id>
atelier run list [--status active|completed] [--json]
atelier run inspect <run-id>
atelier run resume <run-id>
atelier run handoff <run-id> --append "<text>"
atelier run verify <run-id> --list
atelier run verify <run-id> --record "<check-id>::<status>::<note>"
atelier run complete <run-id>
```

Run lifecycle events are:

```txt
run_created
run_completed
```

`run_started` is legacy. Readers may tolerate historical records, but new Run Plane code must not emit it.

## 13. External Runner Boundary

Atelier may prepare work for external runners.

Atelier may observe and record what external runners did.

Atelier may generate prompts, handoffs, checks, verification records, traces, and review packets.

Atelier must not pretend to have executed work that was executed by an external runner.

Atelier must not require all work to pass through one runtime.

Runtime adapters must be replaceable.

Runtime-specific configuration must not become product truth unless it is explicitly represented as an artifact with provenance.

## 14. Interface Parity Contract

CLI, MCP, GUI, adapters, generated prompts, and README usage must not advertise conflicting active surfaces.

If a command is removed from active use, it must not appear in:

- CLI help;
- MCP tool descriptions;
- GUI labels;
- generated next actions;
- retry commands;
- recovery output;
- active adapter instructions;
- README usage;
- product spec active examples.

Historical run records and archived notes may contain old text, but active surfaces must not recommend it.

## 15. Removed / Forbidden Surfaces

The following active command names are removed and must not be advertised or emitted by active surfaces:

```txt
atelier run init
atelier run status
atelier run close
atelier context render
atelier context expand
atelier index
atelier knowledge
atelier repo map
atelier repo owner
atelier generate
```

Do not add compatibility aliases unless this contract is explicitly revised.

A dedicated review-diff surface is not part of the current contract. It may be designed later, but it must not reintroduce `atelier run init` as an active surface.

## 16. Verification and Completion Contract

Completion must be evidence-aware.

A run may not be considered cleanly complete only because required files exist.

Completion should consider:

- handoff state;
- verification records;
- review records;
- required checks;
- skipped check reasons;
- unavailable tool reasons;
- unresolved product-owner decisions;
- contract violations;
- dangerous policy drift.

A verification record must distinguish:

```txt
passed
failed
skipped
unavailable
not-run
unknown
```

Claims about command execution must match actual execution evidence.

## 17. Reconciliation and Drift Contract

Atelier must treat stale artifacts as first-class risk.

Drift may occur between:

- Ideal and contract;
- contract and tests;
- README and active commands;
- roadmap and implementation;
- Markdown and checks;
- tests and product knowledge;
- hooks and policies;
- run handoff and actual diff;
- runtime-specific instructions and canonical product specs.

Atelier should detect drift where possible and surface it with risk actions.

## 18. Positioning Boundary Contract

Atelier must not collapse into adjacent categories.

It must not become merely:

- a coding agent;
- an IDE extension;
- an agent orchestration runtime;
- a CI wrapper;
- a documentation generator;
- a task manager;
- a prompt library;
- a vector database;
- a hidden autonomous runtime.

Atelier may integrate with all of those categories.

Atelier's durable boundary is repository-native artifact alignment for agentic software development.

## 19. Acceptance Criteria

Contract-critical tests should cover at least:

- active surfaces do not advertise removed commands;
- `context plan` has read-only effects;
- `context plan` does not create tasks or runs;
- task closure emits `task_closed`;
- task closure does not emit `run_completed`;
- run creation emits `run_created`;
- run creation does not emit `run_started`;
- historical `run_started` can be read if needed;
- run resume uses the LLM-readable order beginning with `handoff.md`;
- run resume does not instruct normal runners to read `manifest.json` first;
- `.atelier` state is treated as derived state;
- transform candidates are not silently accepted;
- verification records distinguish not-run from passed;
- active CLI, MCP, GUI, adapters, and README surfaces agree;
- stale command grep excludes historical archives where appropriate;
- runtime adapters are replaceable and do not own product truth.

## 20. Contract Revision Policy

Changing this contract requires updating tests or explicitly documenting why tests are not yet available.

If implementation intentionally diverges from this contract, the divergence must be represented as a contract revision, not an undocumented implementation choice.

If the product ideal changes, revise `Ideal.md` first, then revise this contract.
