---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-positioning
title: Atelier Positioning
status: active
pattern: simple
tags:
  - product:atelier
  - subject:positioning
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - strategy-source
    - roadmap-source
---

# Atelier Positioning

## Status

This document defines Atelier's strategic position.

It explains the problem class, adjacent categories, market evidence, absorption threats, the strategic sequence, the wedge, failure modes, and long-term product shape.

It is not the normative behavior contract. If this document conflicts with `contract.md` on product behavior, `contract.md` wins.

This document mirrors the phase order in `ROADMAP.md`. The roadmap is the canonical source for execution order; this document reflects that order for strategic purposes. If they diverge, the roadmap wins for execution and this document is updated to mirror.

## Positioning Thesis

Atelier solves the artifact alignment problem in agentic software development.

Coding agents are workers.

Agent runtimes are workplaces.

Atelier is the repository-native artifact alignment layer that tells the workplace what matters, proves what happened, and turns the residue of work back into product knowledge.

## Primary Category Phrase

The primary category phrase for Atelier is:

```txt
Repository-native artifact alignment layer for agentic software development.
```

This is the phrase to use first. Other phrases are clarifying variants only:

```txt
Runtime-agnostic artifact operating layer for coding agents.
Repository-native artifact governance layer for agentic software development.
Agentic SDLC control layer.
```

Use the primary phrase in marketing, README, docs, and external messaging. Use the variants only when clarifying adjacent markets.

## World-Class Problem

The world-class problem is not simply that coding agents need better prompts.

The world-class problem is that agentic development produces and consumes more project artifacts than humans can manually align:

```txt
AGENTS.md
CLAUDE.md
Cursor rules
Codex prompts
opencode configs
skills
hooks
permissions
checks
linters
tests
product specs
roadmaps
task notes
review logs
run handoffs
verification records
runtime traces
```

These artifacts have different lifetimes, owners, levels of authority, and enforcement power.

Without an artifact operating layer, teams accumulate:

- stale instructions;
- duplicated rules;
- runtime-specific lock-in;
- docs not connected to checks;
- tests that encode behavior without explaining intent;
- hooks whose origin is unknown;
- prompts that cannot be audited;
- run histories that never become product knowledge;
- manual review as the only remaining source of truth.

The artifact alignment problem is not solved by stronger models. It is solved by making artifacts identifiable, classifiable, relational, transformable, verifiable, and presentable to humans.

## What Atelier Is Not

Atelier should not compete as the best version of these categories.

```txt
Coding Agent:
  Claude Code, Codex, Cursor Agent, Devin, Aider, SWE-agent, local agents.

Agent Orchestration Runtime:
  LangGraph, CrewAI, AutoGen, custom swarm runtimes.

IDE / Editor Experience:
  Cursor, VS Code extensions, JetBrains plugins.

CI / Policy Enforcement:
  GitHub Actions, pre-commit, lint-staged, security scanners, policy-as-code.

Documentation System:
  docs, ADRs, runbooks, README generators.

Task Manager:
  Linear, GitHub Issues, Jira, local task Markdown.

Prompt Library:
  prompt templates, reusable instruction snippets, model-specific configs.
```

Atelier may integrate with these categories.

Atelier should not become only one of them.

## What Atelier Is

Atelier is a repository-native artifact alignment layer for agentic software development.

It observes project artifacts, builds a graph, resolves task-specific attention, prepares external runners through the Runtime Adapter Plane, records traces and verification, detects drift, and transforms artifact residue back into durable project knowledge.

The central mechanism is the artifact graph kernel defined in `GRAPH_SEMANTICS.md`. The cross-runtime boundary is operationalized by `ADAPTER_CONTRACT.md`. The behavioral obligations are defined in `contract.md`. The verification substrate is defined in `VERIFICATION_SCHEMA.md`. The event backbone is defined in `EVENT_MODEL.md`. The HPO state projection is defined in `HPO_STATE_MODEL.md`.

## Market Evidence

The artifact alignment problem exists because adjacent categories have grown into the same space. The following evidence is sourced from official documentation at the time of writing.

### Coding Agents Already Cover a Wide Surface

- Claude Code is an agentic coding tool that reads the codebase, edits files, runs commands, and integrates with development tools. It supports `CLAUDE.md`, auto memory, rules, skills, hooks, subagents, and scheduled or background work. Source: [Claude Code overview](https://docs.anthropic.com/en/docs/claude-code/overview), [Claude Code memory](https://docs.anthropic.com/en/docs/claude-code/memory), [Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks).
- OpenAI positions Codex as a coding agent for real engineering work, multi-agent workflows, skills, automations, CI/CD, and code review. Source: [OpenAI Codex](https://openai.com/codex/).

### Agent Runtimes Cover Execution Flow and Memory

- The OpenAI Agents SDK centers on agents, handoffs, guardrails, agent loops, sessions, human-in-the-loop, sandbox agents, and tracing. Source: [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/).
- LangGraph is explicitly a low-level orchestration framework and runtime for long-running, stateful agents with durable execution, persistence, human-in-the-loop, and debugging. Source: [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview).

### CI and Policy Tools Cover Enforcement and Provenance

- GitHub Actions automates repository workflows and includes artifact attestations for build provenance. Source: [GitHub Actions](https://docs.github.com/en/actions).
- Open Policy Agent (OPA) is a general-purpose policy engine that decouples policy decision-making from enforcement across CI/CD, Kubernetes, APIs, and more. Source: [OPA](https://www.openpolicyagent.org/docs/latest/).
- SLSA provides supply-chain artifact provenance and verification concepts. Source: [SLSA v1.2](https://slsa.dev/spec/v1.2/about).

### Documentation and Instruction Ecosystems Cover Fragments

- `AGENTS.md` is an open agent-instruction format used by 60k+ open-source projects. Source: [AGENTS.md](https://agents.md/).
- Aider supports read-only convention files. Source: [Aider conventions](https://aider.chat/docs/usage/conventions.html).
- Linear and other issue trackers already manage issues, projects, relations, and workflows. Source: [Linear Docs](https://linear.app/docs).

The artifact alignment problem is real because no single adjacent category owns it.

## Absorption Threats

A weak version of Atelier would be absorbed by adjacent categories. The following threats are real and durable.

```txt
- Claude Code, Codex, and similar coding agents may absorb
  context selection, rules, skills, memory, and verification
  hooks inside their runtime.
- LangGraph and similar orchestration frameworks may absorb
  task routing, durable execution, and human-in-the-loop
  sequencing.
- OpenAI Agents SDK and similar SDKs may absorb handoffs,
  guardrails, sessions, and tracing.
- GitHub Actions and CI providers may absorb provenance,
  attestations, and enforcement.
- OPA and policy engines may absorb policy as code.
- AGENTS.md and Aider conventions may absorb instruction
  formats.
- Linear, GitHub Issues, and similar trackers may absorb
  task and product state.
```

A weak Atelier, defined as "a context planner with ambitions", would be absorbed by any of the above. The defensible Atelier is the one that survives absorption. See "Why This Still Exists" below.

## Why This Still Exists

Atelier survives absorption because of four properties that adjacent categories do not jointly own.

```txt
Cross-runtime artifact semantics:
  Atelier defines identity, authority, edge semantics, and
  maturity across runtimes. A single runtime cannot make a
  cross-runtime claim.

Source-owned evidence:
  Verification records, accepted decisions, and accepted
  transformation receipts are durable repository artifacts,
  not hidden runtime state. Deleting the runtime does not
  delete the evidence.

Provenance-preserving transformation:
  The transform maturity model records provenance at every
  level change. A transformation cannot erase the source
  artifact, cannot skip levels, and cannot promote itself
  to enforced without an acceptance event.

Human Product Owner decision visibility:
  Atelier presents drift, verification, risk, and unresolved
  decisions to a human in a way that does not imply
  verification that does not exist. Decorative dashboards
  cannot fake this.
```

These four properties are the defensible boundary. The artifact graph kernel defined in `GRAPH_SEMANTICS.md` and the adapter contract defined in `ADAPTER_CONTRACT.md` are the load-bearing mechanisms.

Runtime agnosticism is operationalized by `ADAPTER_CONTRACT.md` §7.2 and gated on two distinct proof levels:

- `packet_portability_claim`: contract claim only after `adapter_packet_portability_fixture` passes for the human-shell + noop-reference adapter pair (Stage 0). This is the only adapter proof claim that ships in the MVP.
- `runtime_agnosticism_claim`: contract claim only after `adapter_runtime_parity_fixture` passes for at least one pair of real runtime adapters (Stage 1, e.g. codex + opencode). Each claim is gated independently. The two are not interchangeable.

## Absorption Test

The defensible boundary can be stated as a test:

```txt
If a coding agent or adjacent category can replace a feature without
preserving cross-runtime graph identity and durable evidence, that
feature is not core Atelier.
```

A feature that does not preserve both is decoration. A feature that does preserve both is part of the durable boundary.

## Adjacent Category Boundaries

### Versus Coding Agents

Coding agents perform work.

Atelier determines what matters around that work.

Agents edit files, run commands, inspect diffs, and produce outputs. Atelier prepares context, constrains behavior, records evidence, detects drift, and converts outputs into artifacts.

### Versus Agent Orchestration

Orchestration frameworks manage agent control flow.

Atelier manages repository artifact semantics.

An orchestration runtime may call agents in a graph. Atelier decides which repository artifacts should influence that work and how outputs become product knowledge.

### Versus IDEs

IDEs optimize the developer interaction surface.

Atelier optimizes the artifact lifecycle across runtimes.

It should not require the user to live inside one editor.

### Versus CI

CI runs checks.

Atelier relates checks to product knowledge, contracts, tasks, traces, and verification records.

CI can enforce. Atelier explains what is being enforced and why.

### Versus Documentation

Documentation stores explanations.

Atelier treats documentation as transformable artifact material that can afford checks, hooks, tasks, prompts, policies, and tests.

### Versus Task Management

Task systems track work.

Atelier connects tasks to product specs, context plans, run packets, verification, traces, and artifact transformations.

## Insertion Phases

Atelier is not inserted at only one software development phase.

It is inserted at the boundaries of agentic development.

### 1. Product Intent Phase

Atelier captures or references product intent.

Artifacts:

```txt
Ideal.md
contract.md
POSITIONING.md
ROADMAP.md
tasks
acceptance criteria
risk constraints
```

Value:

- product direction becomes durable;
- agent work can be compared against contract;
- roadmap can be derived instead of improvised.

### 2. Attention Resolution Phase

Atelier computes what a runner should read.

Artifacts:

```txt
context plans
selectors
roles
paths
phases
knowledge cards
resolution decision records
```

Value:

- less context bloat;
- fewer stale instructions;
- deterministic or traceable attention;
- model cost control.

This is the current implementation wedge. Attention Management v1 means a context plan plus a required verification map, not a prompt generator.

### 3. Agent Preparation Phase

Atelier prepares the work packet for a runtime through the Runtime Adapter Plane.

Artifacts:

```txt
handoff.md
brief.md
plan.md
context.md
verification.md
review.md
worklog.md
artifacts.md
runtime adapter packets
prompts
permission envelopes
```

Value:

- external runners start with the right packet;
- runtime-specific rituals do not become product truth;
- handoff becomes portable across runtimes.

### 4. Runtime Execution Phase

The agent runtime performs work.

Atelier does not own this execution.

Atelier may observe, record, and prepare boundaries through the adapter. The adapter behavior is defined in `ADAPTER_CONTRACT.md`.

Value:

- users can keep Codex, opencode, Claude Code, ChatGPT, Gemini, local scripts, CI, or human operators;
- Atelier remains runtime-agnostic;
- the adapter parity fixture is the proof of agnosticism.

### 5. Verification Phase

Atelier records whether the result was checked.

Artifacts:

```txt
tests
checks
linters
review records
verification records
completion gates
skipped check reasons
unavailable command reasons
```

Value:

- completion becomes evidence-aware;
- false claims about verification are easier to catch;
- humans can distinguish passed, failed, skipped, unavailable, and not-run;
- `completed_dirty` is presented honestly as not-success.

### 6. Reconciliation Phase

Atelier detects drift between artifacts.

Examples:

```txt
contract vs tests
README vs CLI
Markdown vs hooks
policy vs permissions
run handoff vs diff
runtime config vs canonical docs
roadmap vs implementation
```

Value:

- old assumptions stop leaking into active workflows;
- source artifacts and enforcement artifacts stay aligned.

The minimum reconciliation set ships in Phase 1E. Broad reconciliation is deferred to Phase 3 and beyond.

### 7. Transformation Phase

Atelier turns artifact residue into new artifact candidates.

Examples:

```txt
Markdown -> check
Markdown -> hook
Markdown -> task
tests -> markdown
trace -> product insight
review -> task
verification -> roadmap update
```

Value:

- agent work compounds into project knowledge;
- tests can explain behavior;
- reviews can become tasks;
- traces stop dying in logs.

Transformations are proposal-only until an acceptance event promotes them. The maturity model is in `contract.md` §8 and §8a. The `accepts` and `rejects` event shape is in `EVENT_MODEL.md` §5.

### 8. Human Product Owner Phase

Atelier presents decisions, risk, verification, and drift to the human owner.

The HPO state model is defined in `HPO_STATE_MODEL.md`. The states include verified, unverified, dirty, blocked, stale, proposed, accepted, and forced_closed, each with a required evidence set.

Value:

- the human does not need to inspect every code change;
- uncertainty is visible;
- product direction remains human-owned;
- the UI does not imply verification that does not exist;
- forced_close is presented as not-success.

## Strategic Sequence

The strategic sequence mirrors the execution phase order in `ROADMAP.md`. The roadmap is the canonical source; this section reflects it.

```txt
Phase 0: Spec and Contract Stabilization
  0.1 Spec Pack v4 Cut
  0.2 Active Surface Cleanup
  0.3 Run / Task Boundary Hardening
  0.4 Contract Test Matrix v1

Phase 0.5: Contract Blocking Repairs (v5 Cut)
  (no sub-phases; deliverables enumerated in ROADMAP.md)

Phase 1: MVP
  1A  Artifact Graph v0-min + Verification Schema v0
  1B  Generic Runtime Packet Export + Adapter Parity Fixture
  1C  Attention Management v1
  1D  End-to-End Run Completion Wedge
  1E  (Optional) Narrow Reconciliation

Phase 2: Runtime-Specific Adapters
  2A  First real runtime adapter
  2B  Second real runtime adapter
  2C  Pairwise parity between two real adapters (runtime_agnosticism_claim gate)
  2D  Additional adapters (Stage 1 + Stage 2 expansion)

Phase 3: Transformation Pilots
  3.1 Markdown-to-check
  3.2 Test-to-markdown
  3.3 Review-to-task

Phase 4: Human Product Owner UI
  4.1 State evidence table rollout
  4.2 Forbidden claims enforcement
  4.3 Allowed actions surface

Phase 5: Swarm Coordination
  5.1 Role routing
  5.2 Subagent packets
  5.3 Merge readiness
```

The wedge is Attention plus Verification plus Generic Runtime Packet Export, delivered on top of the artifact graph kernel. The durable product is the artifact graph plus transformation plus HPO UI. The long-term layer is the Runtime Adapter Plane plus Swarm Coordination.

This sequence avoids four traps:

```txt
Trap 1: Building an agent runtime too early.
Trap 2: Building a GUI before semantics exist.
Trap 3: Automating transformations before provenance and acceptance exist.
Trap 4: Claiming runtime-agnosticism before the adapter parity fixture passes.
```

The fourth trap is a new entry for v5. The v4 roadmap claimed runtime-agnosticism as an active product claim; the v5 roadmap makes the claim contingent on the parity fixture. Until the fixture passes, runtime-agnosticism is a product goal, not a contract claim.

## Wedge, Durable, Long-Term

```txt
Wedge:
  Attention Management v1
  + Verification Schema v0
  + Generic Runtime Packet Export
  + End-to-End Run Completion Wedge
  (= context plan + required verification map + completion honesty
   + Stage 0 packet portability proof)

Durable Product:
  Artifact Graph Kernel
  + Transformation Plane
  + Human Product Owner UI
  (with provenance-preserving transformation and accepted evidence lifecycle)

Long-Term Coordination:
  Runtime Adapter Plane
  + Swarm Coordination
```

## Competitive Advantage

Atelier's advantage is not model quality.

Atelier's advantage is repository-native artifact alignment.

It can coordinate across tools because it does not try to become the tool.

It can survive runtime churn because source artifacts remain in the repository and derived state remains regenerable under `.atelier/`.

It can support stronger agents because it focuses on what stronger agents make harder: more artifacts, more traces, more diffs, more stale instructions, and more verification burden.

## Failure Modes

Atelier fails strategically if it becomes:

- only a context packer;
- only an AGENTS.md generator;
- only a prompt template store;
- only a GUI over Markdown;
- only a task manager;
- only a CI wrapper;
- only a runtime-specific harness;
- a hidden autonomous agent;
- a system that accepts generated artifacts without maturity;
- a system that mints new identities for moved or renamed artifacts;
- a system that hides uncertainty from the human owner;
- a system that claims runtime-agnosticism without a passing parity fixture;
- a system that confuses `packet_portability_claim` with `runtime_agnosticism_claim`;
- a system that treats `completed_dirty` as success.

## Final Position

Atelier should not make LLMs safe by reducing their freedom.

Atelier should make LLM work safe by making repository artifacts aligned, traceable, transformable, and mechanically rejectable when outcomes violate the contract.

That is the product boundary. The artifact graph kernel in `GRAPH_SEMANTICS.md`, the verification substrate in `VERIFICATION_SCHEMA.md`, the event backbone in `EVENT_MODEL.md`, the runtime adapter contract in `ADAPTER_CONTRACT.md`, and the HPO state model in `HPO_STATE_MODEL.md` are the load-bearing mechanisms of that boundary.

## v5 Revision Notes

- Mirrored the new phase order from `ROADMAP.md`, including Phase 0.5 "Contract Blocking Repairs (v5 Cut)" and the 1A-1E split of Phase 1.
- Updated the wedge to "Attention + Verification + Generic Runtime Packet Export" so the MVP proves the cross-runtime boundary.
- Added the explicit "runtime-agnosticism is a contract claim only after the adapter parity fixture passes" rule in "Strategic Sequence" and in "Failure Modes".
- Added the "Absorption Test" section that codifies the defensible boundary.
- Updated "Insertion Phases" to reference `EVENT_MODEL.md` and `HPO_STATE_MODEL.md` by name.
- Updated the long-term coordination framing to include the HPO state model and the accepted evidence lifecycle.
- Added a fourth strategic trap: claiming runtime-agnosticism before the parity fixture passes.
- Added a final "Final Position" paragraph that names all five load-bearing mechanisms.

## v5.1 Revision Notes

- §"Why This Still Exists" added a paragraph distinguishing `packet_portability_claim` (Stage 0) from `runtime_agnosticism_claim` (Stage 1). Each claim is gated independently.
- §"Failure Modes" added a bullet: "a system that confuses `packet_portability_claim` with `runtime_agnosticism_claim`."
- §"Strategic Sequence" phase order block updated to use the v5.1 sub-phases (2A-2D) for Phase 2, mirroring the `ROADMAP.md` change.
