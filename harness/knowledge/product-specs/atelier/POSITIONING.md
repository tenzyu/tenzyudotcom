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

It explains the problem class, adjacent categories, insertion phases, wedge, failure modes, and long-term product shape.

It is not the normative behavior contract. If this document conflicts with `contract.md` on product behavior, `contract.md` wins.

## Positioning Thesis

Atelier solves the artifact alignment problem in agentic software development.

Coding agents are workers.

Agent runtimes are workplaces.

Atelier is the artifact operating layer that tells the workplace what matters, proves what happened, and turns the residue of work back into product knowledge.

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

Atelier targets this layer.

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

Atelier is a repository-native artifact governance and transformation layer for agentic software development.

It observes project artifacts, builds a graph, resolves task-specific attention, prepares external runners, records traces and verification, detects drift, and transforms artifact residue back into durable project knowledge.

A compact market-category phrase:

```txt
Runtime-agnostic artifact operating layer for coding agents.
```

A more explicit phrase:

```txt
Repository-native artifact governance layer for agentic software development.
```

A process-oriented phrase:

```txt
Agentic SDLC control layer.
```

Use the first phrase as the primary product definition. Use the others only when clarifying adjacent markets.

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
resolution traces
```

Value:

- less context bloat;
- fewer stale instructions;
- deterministic or traceable attention;
- model cost control.

This is the current implementation wedge.

### 3. Agent Preparation Phase

Atelier prepares the work packet for a runtime.

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
- handoff becomes portable.

### 4. Runtime Execution Phase

The agent runtime performs work.

Atelier does not own this execution.

Atelier may observe, record, and prepare boundaries.

Value:

- users can keep Codex, opencode, Claude Code, ChatGPT, Gemini, local scripts, CI, or human operators;
- Atelier remains runtime-agnostic.

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
- humans can distinguish passed, failed, skipped, unavailable, and not-run.

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

### 8. Human Product Owner Phase

Atelier presents decisions, risk, verification, and drift to the human owner.

Value:

- the human does not need to inspect every code change;
- uncertainty is visible;
- product direction remains human-owned.

## Product Wedge

The first wedge should be:

```txt
Attention + Verification
```

Reason:

- Attention reduces model cost and failure rate.
- Verification makes high-freedom agent work acceptable.
- Together they create immediate value without requiring Atelier to own execution.

The second wedge should be:

```txt
Artifact Graph + `.atelier` derived state
```

Reason:

- selection, verification, drift, and transformation need a graph;
- derived state must be regenerable and separate from product truth.

The third wedge should be:

```txt
Transformation Plane
```

Reason:

- this is where Atelier becomes more than a context planner;
- artifact residue compounds into durable project intelligence.

The fourth wedge should be:

```txt
Human Product Owner UI
```

Reason:

- the product owner needs to see risk, drift, evidence, and unresolved decisions;
- dashboards are useful only after semantics exist.

The fifth wedge should be:

```txt
Swarm Coordination
```

Reason:

- multi-agent coordination requires strong artifact boundaries;
- without artifact graph and verification, swarm creates noise faster than truth.

## Competitive Advantage

Atelier's advantage is not model quality.

Atelier's advantage is repository-native artifact continuity.

It can coordinate across tools because it does not try to become the tool.

It can survive runtime churn because source artifacts remain in the repository and derived state remains regenerable.

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
- a system that hides uncertainty from the human owner.

## Strategic Sequence

The correct strategic sequence is:

```txt
1. Attention Layer
2. Verification Layer
3. Artifact Graph
4. Runtime Adapters
5. Transformation Layer
6. Human Product Owner UI
7. Swarm Coordination
```

This sequence avoids three traps:

```txt
Trap 1: Building an agent runtime too early.
Trap 2: Building a GUI before semantics exist.
Trap 3: Automating transformations before provenance and maturity exist.
```

## Final Position

Atelier should not make LLMs safe by reducing their freedom.

Atelier should make LLM work safe by making repository artifacts aligned, traceable, transformable, and mechanically rejectable when outcomes violate the contract.

That is the product boundary.
