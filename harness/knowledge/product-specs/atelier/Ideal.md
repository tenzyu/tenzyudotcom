---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-ideal
title: Atelier Ideal
status: active
pattern: simple
tags:
  - product:atelier
  - subject:ideal
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - contract-source
    - roadmap-source
---

# Atelier Ideal

## Status

This document is the canonical product ideal for Atelier.

It should remain stable unless Atelier pivots. It does not define every command, schema, API, route, or implementation detail. Those belong in `contract.md`.

If this document conflicts with `contract.md`, the conflict must be treated as a product-design issue. Do not silently resolve the conflict by letting either document win. Revise the ideal or revise the contract explicitly.

`GOAL.md` is no longer required as an active canonical document. The active product ideal belongs here.

## Product Thesis

Atelier is a runtime-agnostic artifact operating layer for coding agents, human product owners, and repository-local software work.

It treats implicit knowledge, Markdown, tests, checks, skills, linters, roles, permissions, hooks, tasks, product specs, traces, verification records, reviews, prompts, run handoffs, source files, and configuration as project artifacts.

Atelier does not exist to directly control agents.

Atelier exists to resolve, contextualize, transform, verify, and present project artifacts so that external coding agents can work with high freedom while the repository remains able to reject unacceptable outcomes.

The source of truth remains the repository. Derived resolution state may exist under `.atelier`, but `.atelier` must never become the only location where product truth exists.

## The World-Class Problem

Agentic software development creates more artifacts than humans can manually align.

The problem is not only whether a coding agent can edit code. Increasingly, agents can edit code, run tools, and complete local tasks. The harder problem is artifact alignment:

- which artifacts matter for the task;
- how those artifacts relate;
- what those artifacts imply;
- what can be derived from them;
- what verifies them;
- what drifted;
- what an external runner may do;
- what a human product owner must still decide.

As coding agents become stronger and more parallel, this problem grows. A stronger agent can create more diffs, more traces, more tests, more notes, more generated prompts, and more unreviewed assumptions. Without an artifact layer, every runtime invents its own ritual and every project accumulates stale instructions, stale checks, stale docs, and unverifiable handoffs.

Atelier addresses this by making the repository carry the artifacts, relations, transformations, evidence, and handoff state required to coordinate coding agents without making any one runtime the owner of the project.

## Current Slice: Attention Management

The current implementation focus is only the first slice of the ideal.

That slice is Attention Management.

Attention Management determines, for a specific task, role, phase, path, and intent:

- which artifacts should be read;
- which artifacts should not be read;
- which artifacts should be read first;
- which artifacts should be injected fully;
- which artifacts should be summarized;
- which artifacts should be referenced only;
- which artifacts require semantic judgment;
- which selected artifacts need a resolution trace;
- which artifacts are stale, missing, conflicting, or unsafe to trust.

This is roughly the first ten percent of Atelier.

`atelier context plan` is only one surface over Attention Management. It must not be mistaken for the whole product.

## The Larger Ideal

Atelier is not merely a context planner.

The larger ideal is an artifact transformation system.

Atelier should be able to transform artifacts across representations while preserving source identity and provenance.

Examples:

```txt
Markdown knowledge -> check
Markdown knowledge -> linter
Markdown knowledge -> hook
Markdown knowledge -> task
Markdown knowledge -> prompt
Markdown knowledge -> skill
Markdown knowledge -> role
Markdown knowledge -> policy
Markdown knowledge -> verification gate

tests -> inferred behavior markdown
tests -> product spec candidate
lint rules -> policy markdown
hook behavior -> governance markdown
trace -> run handoff
review record -> task
verification record -> roadmap update
run history -> product insight
```

The ideal is not to collapse everything into Markdown.

The ideal is to let each artifact remain independently meaningful while Atelier manages the graph of relations, affordances, transformations, maturity, and enforcement around it.

## Positioning Thesis

Coding agents are workers. Agent runtimes are workplaces. Atelier is the artifact operating layer that tells the workplace what matters, proves what happened, and turns the residue of work back into product knowledge.

Atelier should not compete by becoming the best coding agent, IDE, CI runner, task manager, or agent orchestration runtime.

Atelier should sit between the human product owner, the repository, and external agent runtimes:

```txt
Human Product Owner
  -> intent / ideal / contract
Atelier
  -> context / checks / prompts / traces / verification / handoff
Agent Runtime
  -> code edits / shell / tool execution
Repository
  -> tests / diffs / traces / artifact graph / verification records
Atelier
  -> reconcile / summarize / transform / expose to human
Human Product Owner
```

The strategic wedge is Attention plus Verification. The durable product becomes Artifact Graph plus Transformation plus Human Product Owner UI.

See `POSITIONING.md` for the detailed market and phase positioning.

## Core Product Model

Atelier consists of these planes.

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

### Artifact Plane

The Artifact Plane observes and manages project-relevant units as graph nodes.

Markdown is an artifact. A check is an artifact. A skill is an artifact. A linter is an artifact. A role is an artifact. A permission is an artifact. A hook is an artifact. A task is an artifact. A product spec is an artifact. A trace is an artifact.

Atelier should not destroy source artifacts or force them to depend on Atelier-specific runtime state.

### Attention Plane

The Attention Plane resolves what a coding agent should read for a given unit of work.

This includes selector evaluation, deterministic path matching, semantic judgment, reading order, compression, exclusion, and traceability.

### Transformation Plane

The Transformation Plane manages the movement from one artifact representation to another.

It does not silently emit final artifacts. It tracks candidates, proposals, accepted artifacts, deterministic artifacts, and enforced artifacts.

### Knowledge Plane

The Knowledge Plane manages tacit and explicit project knowledge as durable artifacts.

Knowledge can afford context, checks, skills, prompts, tasks, policies, and reviews. Knowledge does not directly become those artifacts without a traceable maturity step.

### Governance Plane

The Governance Plane manages rules, permissions, roles, hooks, boundaries, non-goals, forbidden behavior, and change policies.

Its purpose is not to block all work. Its purpose is to make unsafe, ambiguous, or contract-breaking work visible and mechanically rejectable.

### Verification Plane

The Verification Plane manages tests, checks, linters, verification records, review records, completion gates, and evidence.

Atelier should move project behavior from trust-based completion toward evidence-based completion.

### Task / Product Plane

The Task / Product Plane manages product intent, specs, tasks, acceptance criteria, roadmaps, and durable work items.

A task is not a run. A product spec is not a roadmap. A roadmap is not the product truth.

### Swarm Coordination Plane

The Swarm Coordination Plane coordinates multiple agents, roles, subagents, handoffs, conflicts, and parallel work.

It should let cheap or specialized agents perform bounded work without making them the source of project semantics.

### Agent Runtime Plane

The Agent Runtime Plane resolves, connects, and observes external runtimes.

Atelier may describe runtime capabilities, produce prompts, produce handoff packets, record traces, route tasks, and compare outputs.

Atelier must not lock the user into one runtime. Codex, opencode, ChatGPT, Gemini, Claude Code, local tools, CI, and human operators should remain external runners.

### Human Product Owner UI

The Human Product Owner UI presents product truth, drift, risk, evidence, verification, roadmap state, and unresolved decisions.

The product owner should not need to manually inspect every code change to know whether the repository remains acceptable.

## Non-Negotiable Principles

### 1. The Repository Remains the Source of Truth

Atelier may generate derived indexes, traces, and resolution state, but product truth must remain recoverable from repository artifacts.

Derived state belongs under `.atelier`.

`.atelier` is useful for resolution, debugging, provenance, indexing, and cache. It must not be the only location where product truth exists.

### 2. No Runtime Lock-In

Atelier must not require a specific coding agent runtime.

The user should be able to give an Atelier-produced packet to Codex, opencode, ChatGPT, Gemini, Claude Code, a local agent, or a human and still preserve the same product contract.

### 3. Artifacts Are Not Destroyed by Transformation

A Markdown document can afford a linter. A linter can imply a Markdown spec. A test suite can be summarized into product knowledge. A review can create a task.

But the source artifact must remain identifiable.

Atelier transforms with provenance. It does not erase origin.

### 4. Attention Is Computed, Not Guessed

A runner should not need to explore the whole repository, README files, chat history, and stale generated output just to learn what matters.

Atelier should compute a task-specific attention plan from explicit artifacts, selectors, roles, paths, phases, and traceable semantic decisions.

### 5. Verification Beats Trust

A runner's statement that work is done is not enough.

Atelier should prefer contract-derived checks, tests, verification records, review records, completion gates, and reproducible evidence.

### 6. Human Product Owner Control

The human product owner should decide product direction and unresolved tradeoffs.

Atelier should present decisions, risk, drift, and verification in a way that reduces manual inspection without hiding uncertainty.

### 7. Runtimes Are Replaceable

Atelier should integrate with agent runtimes but not become dependent on any single one.

A runtime may be excellent at editing code. Atelier is responsible for artifact alignment around that work.

## Success Definition

Atelier succeeds when a repository can support high-freedom coding agents without relying on hidden chat history or exhaustive human review.

A successful Atelier repository can answer:

```txt
What is the product ideal?
What is the contract?
What task is being done?
What should the agent read?
What must the agent not violate?
What artifacts changed?
What verifies the result?
What drifted?
What was inferred?
What was proposed?
What was accepted?
What still needs a human decision?
```

## Failure Definition

Atelier fails if it becomes any of the following:

- a thin prompt generator;
- a brittle context packer;
- a runtime-specific wrapper;
- a hidden autonomous agent;
- a stale Markdown graveyard;
- a second source of truth outside the repository;
- a UI that looks useful but cannot prove correctness;
- a system that destroys artifact identity through transformation;
- a system that makes humans trust agents instead of making repositories reject bad outcomes.

## Pivot Boundary

Changing commands, file locations, schemas, or adapters is not a pivot.

Changing the idea that Atelier is a repository-local, runtime-agnostic artifact operating layer would be a pivot.

Changing the idea that artifacts must preserve source identity would be a pivot.

Changing the idea that agent work should be verified by repository evidence rather than trust would be a pivot.
