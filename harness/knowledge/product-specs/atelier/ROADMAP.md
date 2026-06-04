---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-roadmap
title: Atelier Roadmap
status: active
pattern: simple
tags:
  - product:atelier
  - subject:roadmap
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - task-candidate
---

# Atelier Roadmap

## Status

This roadmap is derived from `Ideal.md` and constrained by `contract.md`.

It is not the product truth. It is the current implementation sequence.

If this roadmap conflicts with `contract.md`, `contract.md` wins. If this roadmap no longer supports `Ideal.md`, revise the roadmap.

## Strategic Shape

Atelier should not start by building a full autonomous agent runtime.

The correct wedge is:

```txt
Attention + Verification
```

The durable product becomes:

```txt
Artifact Graph + Transformation + Human Product Owner UI
```

The long-term coordination layer becomes:

```txt
Runtime Adapters + Swarm Coordination
```

Do not jump directly to swarm coordination, GUI polish, or runtime ownership before artifact alignment exists.

## Roadmap

### 1. Product Spec Canonicalization

Goal: make the product ideal, contract, roadmap, README, and positioning coherent.

Scope:

- `Ideal.md` as canonical product ideal.
- `contract.md` as normative behavior contract.
- `POSITIONING.md` as strategic market and phase positioning.
- `ROADMAP.md` as implementation sequence.
- `README.md` as human entry point.
- `GOAL.md` removed or demoted from active canonical status.

Done when:

- All five active docs exist under `harness/knowledge/product-specs/atelier/`.
- Document precedence is explicit.
- The docs agree that Atelier is not merely a context planner.
- The docs agree that Attention Management is only the first slice.

### 2. Contract-First Test Gate

Goal: convert contract-critical behavior into tests before large implementation changes.

Scope:

- Removed command absence.
- Context plan read-only effects.
- Task/run separation.
- Run event correctness.
- Run packet reading order.
- `.atelier` derived-state boundary.
- Verification honesty.
- Interface parity.
- Transform maturity boundaries where practical.

Done when:

- Tests fail if active surfaces advertise removed commands.
- Tests fail if `context plan` mutates state.
- Tests fail if task closure emits run completion.
- Tests fail if resume prompts read `manifest.json` first.
- Tests fail if transform candidates are silently accepted as deterministic artifacts.

### 3. Active Surface Cleanup

Goal: make active CLI, MCP, GUI, adapters, README, and generated output match `contract.md`.

Scope:

- Remove old command references from active UX.
- Ensure active run commands are `create`, `list`, `inspect`, `resume`, `handoff`, `verify`, `complete`.
- Keep historical records readable without advertising historical commands.
- Ensure generated next actions are copy-pasteable and contract-compliant.

Done when:

- Stale-command grep passes against active surfaces.
- CLI help, MCP tool list, GUI copy, README usage, and adapter prompts agree.
- No active route recommends `atelier run init` or related removed commands.

### 4. Run Packet and Provenance Hardening

Goal: rebuild run behavior around the LLM-readable packet and `.atelier` provenance boundary.

Scope:

- Canonical reading order: `handoff.md`, `brief.md`, `plan.md`, `context.md`, `verification.md`, `review.md`, `worklog.md`, `artifacts.md`.
- Demote `manifest.json` to debug/provenance.
- Move or mirror trace/debug/context hash state under `.atelier/runs/<run-id>/`.
- Strengthen `resumeRun()` prompt.
- Strengthen completion gates.

Done when:

- Runners are not instructed to read `manifest.json` first.
- Trace is available for debugging but not required for normal handoff.
- Completion requires verification and handoff state, not just file existence.

### 5. Task / Product Plane Hardening

Goal: make tasks durable product-intent artifacts rather than transient run setup.

Scope:

- Task schema clarity.
- Acceptance criteria.
- Risk constraints.
- Product spec references.
- Parent/subtask semantics.
- Task-to-run materialization.
- Task closure event correctness.

Done when:

- Tasks can drive run creation without being collapsed into runs.
- Task closure does not imply run completion.
- Product intent can be traced from spec to task to run.

### 6. Artifact Graph and `.atelier` Derived State

Goal: make artifact resolution explicit and regenerable.

Scope:

- Source artifact identity.
- Derived graph snapshots under `.atelier`.
- Edge kinds for derivation, implementation, verification, enforcement, relation, and provenance.
- Deterministic graph output.
- Stale graph detection.
- Orphaned source/control detection.

Done when:

- `.atelier` contains generated resolution state.
- Product truth remains in source artifacts.
- Deleting `.atelier` does not delete product truth.
- The graph can be regenerated from repository artifacts.

### 7. Attention Management v1

Goal: make context planning an explicit Attention Plane surface.

Scope:

- Selectors.
- Role routing.
- Phase routing.
- Path and intent matching.
- Injection modes: full, summary, reference, decision, constant.
- Exclusion logic.
- Resolution trace references.
- Context hash and freshness checks.

Done when:

- A task can produce a deterministic or traceable attention plan.
- Semantic decisions are recorded.
- Context is not inflated through uncontrolled `requires` relationships.
- The context plan explains why each selected artifact matters.

### 8. Verification Layer v1

Goal: make verification part of completion, not an afterthought.

Scope:

- Verification records.
- Review records.
- Check registry.
- Skipped/unavailable/not-run states.
- Completion gates.
- Validation honesty.
- Contract-derived test mapping.

Done when:

- A run cannot be completed cleanly while required verification is missing.
- Skipped checks require reasons.
- Unavailable commands are reported as unavailable, not passed.
- Verification can be summarized for the human product owner.

### 9. Transformation Plane v1

Goal: introduce artifact transformation maturity without over-automating.

Scope:

- Transform candidates.
- Proposed artifacts.
- Accepted artifacts.
- Deterministic artifacts.
- Enforced artifacts.
- Provenance edges.
- Markdown-to-check pilot flow.
- Test-to-markdown pilot flow.
- Review-to-task pilot flow.

Done when:

- Atelier can propose transformations without silently accepting them.
- Accepted transformations preserve provenance.
- Enforced transformations correspond to real checks, hooks, linters, policies, or CI gates.

### 10. Runtime Adapter Layer

Goal: connect to external runtimes without owning them.

Scope:

- Codex packet adapter.
- opencode packet adapter.
- Claude Code / AGENTS.md adapter.
- ChatGPT handoff adapter.
- Generic shell/human operator adapter.
- Runtime capability descriptions.
- Adapter parity tests.

Done when:

- The same task can be prepared for multiple runtimes.
- Runtime-specific prompts do not become product truth.
- Adapter output remains contract-compliant.

### 11. Human Product Owner UI

Goal: expose artifact alignment, risk, verification, and drift to a human.

Scope:

- Product truth overview.
- Contract coverage.
- Verification state.
- Drift dashboard.
- Transform candidates.
- Unresolved decisions.
- Run handoff state.
- Roadmap state.

Done when:

- A product owner can identify what is safe, unsafe, verified, unverified, stale, proposed, and blocked without reading every changed file.
- The UI does not imply verification that does not exist.

### 12. Swarm Coordination Kernel

Goal: coordinate multiple agents, roles, subagents, and handoffs after the artifact layer is stable.

Scope:

- Role-based task routing.
- Subagent packet generation.
- Parallel run boundaries.
- Conflict detection.
- Review handoff.
- Merge readiness.
- Cheap-model scout/research roles.
- Human decision gates.

Done when:

- Multiple agents can work without making their outputs canonical by default.
- Conflicts are surfaced through artifact graph and verification state.
- Swarm work remains runtime-agnostic.

## Non-Roadmap Items

The following should not be prioritized before the earlier foundations are stable:

- full autonomous runtime ownership;
- decorative GUI before verification semantics;
- runtime-specific lock-in;
- uncontrolled transform automation;
- implicit acceptance of generated artifacts;
- old command compatibility aliases;
- context packing without artifact graph provenance.
