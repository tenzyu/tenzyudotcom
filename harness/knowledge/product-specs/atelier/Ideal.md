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

This document is the philosophy root. It deliberately links only to `GRAPH_SEMANTICS.md` and `ADAPTER_CONTRACT.md`. All other implementation concerns belong in `contract.md`, the test matrix, the surfaces document, and the roadmap.

## Product Thesis

Atelier is a repository-native artifact alignment layer for agentic software development.

It is runtime-agnostic. It treats implicit knowledge, Markdown, tests, checks, skills, linters, roles, permissions, hooks, tasks, product specs, traces, verification records, reviews, prompts, run handoffs, source files, and configuration as graph-managed project artifacts.

Atelier does not exist to directly control agents.

Atelier exists to resolve, contextualize, transform, verify, and present project artifacts so that external coding agents can work with high freedom while the repository remains able to reject unacceptable outcomes.

The source of truth remains the repository. Derived resolution state may exist under `.atelier`, but `.atelier` must never become the only location where product truth exists.

## Artifact Alignment

The world-class problem Atelier addresses is **artifact alignment**: the property that every project-relevant object has a stable identity, an authority level, a known provenance, explicit relations, a maturity stage, and a verification status, so that an external agent can know what matters and the repository can mechanically reject unacceptable outcomes.

Artifact alignment is achieved by the artifact graph plus the evidence lifecycle, the verification gates, and the human acceptance events. The graph alone does not solve artifact alignment. The graph is the central mechanism; the lifecycle, the gates, and the acceptance events are the other three. The four together make artifact alignment real.

The graph kernel's schema, identity model, authority model, hash rules, regeneration rules, and stale detection are defined in `GRAPH_SEMANTICS.md`. The verification substrate is in `VERIFICATION_SCHEMA.md`. The acceptance event model is in `EVENT_MODEL.md`. The ideal does not redefine them; the ideal is consistent with them.

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

## Three Artifact Classes

Every artifact in the Atelier universe belongs to exactly one of three classes. The class determines placement, ownership, deletion behavior, and acceptance.

```txt
Source Artifact:
  Authored or externally meaningful repository material.
  Lives anywhere in the repository except .atelier/.
  Durable product truth.

Accepted Durable Evidence:
  Verification records, review records, accepted decisions, and
  accepted transformation receipts that the repository has chosen
  to keep outside .atelier/.
  Lives anywhere in the repository except .atelier/.
  Durable product truth.
  Promoted from a source artifact or a candidate only by an
  explicit acceptance event.

Derived State:
  Generated resolution, cache, index, trace, or debug output.
  Lives exclusively under .atelier/.
  Regenerable.
  Must not be the only place product truth lives.
```

The class boundary is defined by an explicit acceptance event, not by file extension or path prefix. `.atelier` is not product truth.

Product truth is the union of source artifacts and accepted durable evidence. Derived state is generated from product truth plus documented external inputs; it is not downstream of accepted durable evidence. The linear transition diagram from the v4 spec was incorrect. The corrected model is in `GRAPH_SEMANTICS.md` §2.4.

The detailed class rules, identity model, and promotion rules are defined in `GRAPH_SEMANTICS.md`.

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

This is the first implementation slice (illustrative estimate, not a precise percentage). The remainder of the product is the artifact graph kernel, the verification layer, the transformation system, the runtime adapter contract, and the human product owner surface.

`atelier context plan` is only one surface over Attention Management. It must not be mistaken for the whole product.

## The Larger Ideal

Atelier is not merely a context planner.

The larger ideal is an artifact transformation system with a verifiable, runtime-agnostic execution surface.

Atelier should be able to transform artifacts across representations while preserving source identity and provenance. Examples:

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

These are long-term transformation possibilities, not active MVP commitments. The MVP is the narrow end-to-end loop defined in `ROADMAP.md` Phase 1; transformation pilots come in Phase 3 after the accepted evidence lifecycle is stable.

The ideal is not to collapse everything into Markdown.

The ideal is to let each artifact remain independently meaningful while Atelier manages the graph of relations, affordances, transformations, maturity, and enforcement around it. A transformation may derive a new artifact from an old one, but the source artifact remains identifiable.

## Positioning Thesis

Coding agents are workers. Agent runtimes are workplaces. Atelier is the repository-native artifact alignment layer that tells the workplace what matters, proves what happened, and turns the residue of work back into product knowledge.

Atelier should not compete by becoming the best coding agent, IDE, CI runner, task manager, or agent orchestration runtime.

Atelier sits between the human product owner, the repository, and external agent runtimes:

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

The strategic wedge is Attention plus Verification plus Generic Runtime Packet Export. The durable product becomes Artifact Graph plus Transformation plus Human Product Owner UI.

Runtime agnosticism is operationalized by `ADAPTER_CONTRACT.md`. The wedge and the durable product are described in more detail in `POSITIONING.md` and `ROADMAP.md`.

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
  + Runtime Adapter Plane
  + Human Product Owner UI
```

The planes are conceptual boundaries. They may share implementation modules, but they must not be collapsed semantically.

### Artifact Plane

The Artifact Plane observes and manages project-relevant units as graph nodes.

Markdown is an artifact. A check is an artifact. A skill is an artifact. A linter is an artifact. A role is an artifact. A permission is an artifact. A hook is an artifact. A task is an artifact. A product spec is an artifact. A trace is an artifact.

Atelier should not destroy source artifacts or force them to depend on Atelier-specific runtime state.

The artifact node and edge schemas, the identity model, the authority model, and the regeneration rules are defined in `GRAPH_SEMANTICS.md`.

### Attention Plane

The Attention Plane resolves what a coding agent should read for a given unit of work.

It supports selector evaluation, deterministic path matching, semantic judgment, reading order, compression, exclusion, and traceability.

### Transformation Plane

The Transformation Plane manages the movement from one artifact representation to another.

It does not silently emit final artifacts. It tracks candidates, proposals, accepted artifacts, deterministic artifacts, and enforced artifacts.

The maturity transition rules, allowed transitions, and acceptance evidence requirements are defined in `contract.md`.

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

### Runtime Adapter Plane

The Runtime Adapter Plane resolves, connects, and observes external runtimes.

Atelier may describe runtime capabilities, produce prompts, produce handoff packets, record traces, route tasks, and compare outputs.

Atelier must not lock the user into one runtime. Codex, opencode, ChatGPT, Gemini, Claude Code, local tools, CI, and human operators should remain external runners. The boundary between Atelier and any specific runtime is operationalized by `ADAPTER_CONTRACT.md`, which defines the canonical packet, the capability descriptor, the round-trip rule, the parity fixture, and the forbidden behavior for any adapter.

### Human Product Owner UI

The Human Product Owner UI presents product truth, drift, risk, evidence, verification, roadmap state, and unresolved decisions.

The product owner should not need to manually inspect every code change to know whether the repository remains acceptable. A concrete example of what the HPO sees is given in the success example below.

## Non-Negotiable Principles

### 1. The Repository Remains the Source of Truth

Atelier may generate derived indexes, traces, and resolution state, but product truth must remain recoverable from repository artifacts outside `.atelier/`.

Derived state belongs under `.atelier/`.

`.atelier` is useful for resolution, debugging, provenance, indexing, and cache. It must not be the only location where product truth exists. Accepted durable evidence, including verification records, accepted decisions, and accepted transformation receipts, lives in the repository, not under `.atelier/`.

### 2. No Runtime Lock-In

Atelier must not require a specific coding agent runtime.

The user should be able to give an Atelier-produced packet to Codex, opencode, ChatGPT, Gemini, Claude Code, a local agent, or a human and still preserve the same product contract. The round-trip and parity rules that make this testable are defined in `ADAPTER_CONTRACT.md`.

### 3. Artifacts Are Not Destroyed by Transformation

A Markdown document can afford a linter. A linter can imply a Markdown spec. A test suite can be summarized into product knowledge. A review can create a task.

But the source artifact must remain identifiable.

Atelier transforms with provenance. It does not erase origin. The identity model that makes this possible is defined in `GRAPH_SEMANTICS.md`.

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

### 8. Accepted Artifacts Require Accepted Evidence

A transformation may propose, candidate, draft, or simulate artifacts without producing durable truth. An artifact becomes durable only through an explicit acceptance event, recorded as durable evidence, with provenance, an accepting actor, and acceptance evidence. This is the boundary that prevents Atelier from collapsing into a generator of unverifiable Markdown.

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

A concrete success example: a product owner is told, without inspecting every diff, that the latest run has a context plan, the required checks all passed, one optional check was skipped with a reason, the artifact graph shows one stale knowledge artifact that needs a review, and there are two unresolved decisions. The HPO UI does not assert that verification happened when it did not, and it does not hide the unresolved decisions.

### Machine-Readable Success Criterion

A repository is in the v5 success set if and only if all of the following are true at the same commit:

```txt
1. `bun nx run <project>:check` passes (the contract test matrix is green).
2. `atelier context plan --workflow workflow.isolated-run --role role.core.implementer --path . --intent "spec v5" --json` returns a context plan with `resolution_type` and `budget_delta` on every included artifact.
3. `atelier graph --json` returns a graph whose kind set equals the canonical kind set defined in `GRAPH_SEMANTICS.md` §4.4.
4. `atelier run verify --record --json` accepts the recorded verification record and emits an `artifact.accepted_verification_record` event with `evidence_refs` populated.
5. `atelier run complete --run-id <run> --json` returns one of `clean | dirty | blocked | forced_closed` from the completion truth table in `VERIFICATION_SCHEMA.md` §8, and the emitted event is the matching one (`run_completed_clean | run_completed_dirty | run_completed_blocked | run_forced_closed`).
6. `atelier run force-close --run-id <run> --reason "<...>" --json` on a `blocked` run returns success, emits `run_forced_closed`, and does not emit any `run_completed_*` event.
7. The adapter proof fixtures in `ADAPTER_CONTRACT.md` §7 have green entries: `adapter_packet_portability_fixture` for Stage 0 packet portability and `adapter_runtime_parity_fixture` for at least one Stage 1 real-runtime pair. Until the Stage 1 fixture is green, the "runtime-agnostic" claim is a product goal, not a contract claim.
8. No emitted event of any of the four `run_completed_*` or `run_forced_closed` types is in a state where its `evidence_refs` is empty when the completion truth table says it must be non-empty.
```

If any of (1)-(8) fails, the repository is not yet in the v5 success set. The first failing rule is the next thing to fix.

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
- a system that makes humans trust agents instead of making repositories reject bad outcomes;
- a system that mints new identities for moved or renamed artifacts instead of recording the move.

## Pivot Boundary

Changing commands, file locations, schemas, or adapters is not a pivot.

Changing the idea that Atelier is a repository-local, runtime-agnostic artifact alignment layer would be a pivot.

Changing the idea that artifacts must preserve source identity would be a pivot.

Changing the idea that agent work should be verified by repository evidence rather than trust would be a pivot.

Changing the three-class rule (source / accepted durable evidence / derived state) would be a pivot.

## v5 Revision Notes

This document was updated in v5 with the following small wording changes; no scope expansion.

- Artifact Alignment section now lists all four load-bearing pieces (graph, evidence lifecycle, verification gates, acceptance events) and points the graph-as-central-mechanism claim at the other three.
- Three Artifact Classes section replaces the linear transition implication with the product-truth model: product truth is the union of source and accepted durable evidence; derived state is a function of product truth and external inputs, not a downstream of accepted durable evidence.
- The Larger Ideal section marks the transformation examples as long-term possibilities, not active MVP commitments; transformation pilots are Phase 3 in `ROADMAP.md`.
- Positioning Thesis section updates the strategic wedge to "Attention + Verification + Generic Runtime Packet Export".
- A new "Machine-Readable Success Criterion" section lists eight ordered checks that, all green at one commit, define the v5 success set. The list is derived from `contract.md`, `VERIFICATION_SCHEMA.md`, `EVENT_MODEL.md`, `GRAPH_SEMANTICS.md`, `ADAPTER_CONTRACT.md`, and `SURFACES.md`.
