# GOAL: Atelier Autopoiesis Runtime

## Objective

Transform the current Atelier implementation into a self-improving semantic control plane for agentic development.

The system must not merely index files, build a relation demo, or produce documentation. It must implement a runtime that can make repository artifacts operational: typed, anchored, stateful, authority-aware, queryable, verifiable, stale-aware, conflict-aware, and usable by agents before/during/after edits.

The repository must progressively implement the mission in `MISSION.md` and keep discovering obvious missing capabilities until the evaluator passes. Do not ask the user to choose implementation steps. Generate the missing work, implement it, evaluate it, and continue.

## Core product definition

Atelier is the repository-side semantic control plane for long-running LLM/coding-agent work.

It exists to answer, mechanically and at task time:

```txt
What is currently valid?
What is merely observed, inferred, proposed, accepted, verified, superseded, rejected, archived, or quarantined?
What authority does each artifact have, in which scope, and by what evidence?
What can this agent read, edit, materialize, or promote?
What checks are required to claim completion?
What is stale, conflicted, blocked, or missing?
Which task-local control packet should be given to the agent?
Which implementation proposal is allowed to materialize into files?
```

## Required runtime capabilities

The final implementation must provide concrete code, schemas, validators, commands, and tests for these capability families. Equivalent names are allowed only when the evaluator confirms semantic equivalence.

### C1 Artifact compiler

Compile repository/vault files into typed semantic nodes with stable anchors. Required node families include at least:

```txt
source_unit
source_anchor
requirement
decision
invariant
test_contract
review_finding
handoff
implementation_task
permission_rule
check_result
materialization_proposal
conflict
staleness_record
```

Each record must preserve origin, scope, provenance, confidence, lifecycle state, evidence refs, and source anchors.

### C2 Lifecycle and promotion policy

Implement lifecycle state transitions:

```txt
observed -> inferred -> proposed -> accepted -> verified
observed/proposed/accepted -> superseded|rejected|archived|quarantined|invalidated
```

LLM output must be unable to become `accepted` or `verified` directly. Promotion requires policy checks, scope, authority, conflict check, evidence, and, where required, human approval.

### C3 Authority model

Implement authority resolution. Relation graph alone is insufficient. The runtime must distinguish authority by artifact class and scope. Examples:

```txt
accepted ADR constrains architecture
accepted spec + verified test governs behavior contract
current implementation + runtime evidence governs actual behavior
permission rule + task scope governs edit authority
risk policy governs destructive or broad operations
```

Conflicts must be surfaced, not silently collapsed.

### C4 Semantic graph and query runtime

Implement typed relations that connect requirements, decisions, invariants, tests, code/source anchors, review findings, tasks, evidence, and materialization proposals. The runtime must support queries needed by agents:

```txt
active requirements for task/scope
accepted decisions for task/scope
required checks
allowed/forbidden operations
open findings
stale artifacts
conflicts
blocked reasons
evidence anchors
next recommended task
```

### C5 Task-local control packet

Generate task-local control packets from runtime state. A packet must contain active requirements, accepted decisions, allowed operations, forbidden operations, required checks, open findings, stale artifacts, conflicts, evidence anchors, and materialization rules. It must not be a long free-form context dump.

### C6 Materialization gate

Agents must not simply edit files and declare success. They must produce or be validated against a proposal stating which requirements/findings/tests/decisions the change affects. Runtime must check proposal scope, authority, lifecycle, staleness, conflicts, required checks, and evidence before accepting materialization.

### C7 Drift, stale, supersede, archive

Implement detection and state transitions for stale artifacts, superseded handoffs, obsolete decisions, changed anchors, invalidated evidence, and drift between spec/test/code. Stale artifacts must retain historical meaning; do not delete them as a substitute for lifecycle state.

### C8 Self-improvement loop

Implement repository-native self-improvement support:

```txt
evaluate current capability state
emit structured findings for missing/weak capabilities
compile findings into implementation packets/control packets
let coding agents patch within bounded authority
validate patches against evaluator and runtime checks
record evidence and unresolved blockers
continue until no P0/P1 evaluator defects remain
```

This loop may use OpenCode agents as the executor, but the repository must contain the schemas, commands, evaluators, and packet contracts that make the loop repeatable.

## Forbidden false completions

The goal is not complete if any are true:

- The product is still mainly RAG/search/docs/AGENTS.md/prompt management.
- It only creates a graph without lifecycle, authority, promotion, and conflict semantics.
- Handoff is treated as truth.
- Generated Markdown views are treated as truth.
- LLM output can directly become accepted or verified.
- Task packets are context summaries instead of operational control packets.
- Agent edits are not linked to requirements/findings/tests/decisions.
- Validators can be weakened to hide defects.
- Stale/superseded artifacts are deleted or ignored instead of represented.
- The evaluator returns pass without command/static evidence.

## Completion policy

The coordinator may emit `[goal:complete]` only when all are true:

1. `atelier-autopoiesis-evaluator` returns `status: "pass"`.
2. Every C1-C8 capability has implementation evidence.
3. Every P0/P1 evaluator defect is resolved or has an explicit, recorded product-author waiver.
4. Required commands have run successfully, or unavailable tooling is explicitly recorded and static evidence still demonstrates the implementation.
5. No completion claim depends on prose-only reasoning.

If any code/edit work remains and no product-author decision is required, continue dispatching implementation and evaluation agents.
