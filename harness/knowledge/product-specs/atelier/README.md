---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-readme
title: Atelier Product Specs README
status: active
pattern: simple
tags:
  - product:atelier
  - subject:readme
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
---

# Atelier Product Specs

This directory contains the human-readable product spec pack for Atelier.

Atelier is a runtime-agnostic artifact operating layer for coding agents, human product owners, and repository-local software work.

It treats Markdown, tests, checks, skills, linters, roles, permissions, hooks, tasks, product specs, traces, verification records, reviews, prompts, handoffs, source files, and configuration as graph-managed artifacts.

The current implementation focus is Attention Management: deciding what a coding agent should read for a specific task. That is only the first slice of the ideal.

## Documents

Read in this order:

```txt
Ideal.md
contract.md
POSITIONING.md
ROADMAP.md
README.md
```

### `Ideal.md`

Defines why Atelier exists.

This document changes only when the product ideal changes.

### `contract.md`

Defines durable product behavior.

Implementation, tests, CLI output, MCP tools, GUI text, adapters, run packets, and generated prompts must conform to this document.

### `POSITIONING.md`

Defines where Atelier sits relative to coding agents, agent runtimes, orchestration frameworks, IDEs, CI, documentation, and task systems.

This document is strategic. It should not override `contract.md`.

### `ROADMAP.md`

Defines the current implementation sequence.

The roadmap is derived from `Ideal.md` and constrained by `contract.md`.

### `README.md`

This file.

It is the short human entry point.

## Document Authority

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

## One-Screen Summary

Atelier is not trying to be the best coding agent.

Atelier is the layer around coding agents that manages project artifacts:

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
```

Current wedge:

```txt
Attention + Verification
```

Long-term product:

```txt
Artifact Graph + Transformation + Human Product Owner UI
```

## Active Product Claims

- Atelier is runtime-agnostic.
- The repository remains the source of truth.
- `.atelier` is derived state.
- Attention Management is only the first slice.
- Artifacts are not destroyed by transformation.
- Transformations require provenance and maturity.
- External runners remain replaceable.
- Verification beats trust.
- Human product owner judgment remains explicit.

## LLM-Readable Run Packet Order

Normal runners should read run packet files in this order:

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

`manifest.json` is not part of the normal LLM reading order. Manifest-like state belongs to debug/provenance and should be inspected only as a last resort.

## Current Non-Goals

Atelier is not:

- a standalone coding agent;
- an IDE replacement;
- a CI replacement;
- a generic chatbot;
- a vector database;
- a hidden autonomous runtime;
- a runtime-specific wrapper;
- a Markdown-only documentation system;
- a task manager with extra steps.

Atelier may integrate with all of those categories, but its durable boundary is repository-native artifact alignment for agentic software development.
