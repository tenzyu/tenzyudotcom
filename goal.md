# GOAL

Act as the verification layer for the `implementation-control` hardening work.

Your job is to prevent premature closure.

Do not end the task merely because files were created, commands exist, or the implementation "looks close". The task may be closed only when the implementation-control workspace is actually ready to drive long-running, product-grade implementation from product-specs through bounded packets, deterministic validation, resumable DAG state, and subagent-safe contracts.

If the system is not ready and you can still fix it within the current goal scope, continue implementing the fixes. Do not stop at a review report.

# ROLE

You are both:

1. Verification auditor
2. Corrective implementation agent

You must first verify the current state. If verification finds gaps that are within scope and fixable, you must implement the fixes, then verify again.

Only stop when one of these is true:

```txt
READY
BLOCKED_BY_EXTERNAL_INPUT
BLOCKED_BY_ENVIRONMENT
BLOCKED_BY_SCOPE_CONFLICT
```

Do not stop with "NOT_READY" if you can still perform corrective work.

# ORIGINAL PURPOSE

The original problem this work must solve was:

```history
いまの implementation-control なんだけど、これを詰めるのにトークン消費がひどすぎる。構造を変えるべき。質は下げずに、作業に移るときにツールで必要な情報をクエリできる状態が好ましいよなぁ。これらの implementation-control を product-specs から生成する段階でもすでに LLM が全部の情報をうまく扱おうとしてコンテキストや thinking でコンテキストを消費しすぎている。ある程度は初期投資でトークン消費するのはいいけど、なにかしらトークン消費を抑えられる構造体と、決定的な作業はスクリプトで表現したほうが良いんじゃないか？
```

The final system must satisfy:

```txt
LLM-readable docs are views.
Machine-queryable records are truth.
Scripts decide routing, validity, and boundaries.
LLM decides meaning only when scripts cannot.
```

The operational workflow must be:

```txt
product-specs
  ↓
deterministic compiler
  ↓
queryable implementation-control graph
  ↓
frontier / resume resolver
  ↓
packet resolver
  ↓
subagent reads one bounded packet
  ↓
subagent writes tests first
  ↓
subagent implements within allowed files
  ↓
scripts run packet-specific validation
  ↓
evidence/state/views update
  ↓
next frontier packet
```

# HARD NON-NEGOTIABLES

Do not violate these:

- Do not implement `atelier ic`.
- Do not modify the main Atelier CLI.
- Do not modify product specs.
- Do not make broad Markdown reading part of ordinary implementation.
- Do not keep old root control Markdown files as active entrypoints.
- Do not require agents to read `state/legacy/**`.
- Do not require agents to read all generated LLM jobs.
- Do not dispatch implementation from `legacy_unresolved` links.
- Do not dispatch implementation from non-executable required fixtures.
- Do not let subagents explore unrelated Markdown to discover context.
- Do not run broad global validation for every packet unless the validation profile explicitly justifies it.
- Do not claim commands passed unless they actually ran.
- Do not close while fixable P0/P1 gaps remain.

# REQUIRED READY STATE

The implementation-control workspace is READY only if all of the following are true.

## A. Structure

The active root is clean:

```txt
harness/knowledge/implementation-control/atelier/
  README.md
  package.json
  tsconfig.json
  scripts/
  schemas/
  canonical/
  state/
  views/
  archive/        # optional
```

Old root control docs must not remain active entrypoints:

```txt
AGENT_PACKET_PROTOCOL.md
CONTRACT_TO_BUILD_MATRIX.md
FULL_COMPLETION_DEFINITION.md
IMPLEMENTATION_DAG.md
IMPLEMENTATION_LEDGER.md
IMPLEMENTATION_ORCHESTRATOR.md
REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md
SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md
SPEC_READ_PLAN.md
SUBAGENT_ROLE_CATALOG.md
VALIDATION_GATE_REGISTRY.md
```

They may exist only as preserved legacy/archive material.

## B. Canonical records

Required canonical records exist and validate:

```txt
canonical/product-spec-manifest.json
canonical/spec-sections.ndjson
canonical/assertions.ndjson
canonical/assertion-links.ndjson
canonical/dag.yaml
canonical/gates.yaml
canonical/fixtures.yaml
canonical/edit-boundaries.yaml
canonical/roles.yaml
canonical/validation-profiles.yaml
```

`canonical/assertions.ndjson` must not be empty.

Dispatchable implementation nodes must not depend on:

- missing assertions
- `legacy_unresolved`
- missing source sections
- missing gates
- missing fixtures
- pending required fixture commands
- empty allowed files

## C. DAG / graph / resume

Required commands exist and work:

```bash
bun run frontier
bun run resume
bun run graph
bun run validate:graph
```

The system must be able to answer:

```txt
What DAG nodes are ready?
What DAG nodes are blocked?
Why is each blocked node blocked?
What packet should be generated next?
What was in flight before interruption?
How does work resume after LLM usage limit, compaction, crash, failed validation, or blocker?
```

Required graph artifacts:

```txt
views/IMPLEMENTATION_GRAPH.md
views/IMPLEMENTATION_GRAPH.mmd
state/graph/implementation-graph.json
```

Required state:

```txt
state/dag-status.yaml
state/packet-lifecycle.jsonl
```

## D. Packet readiness

Required commands exist and work:

```bash
bun run packet
bun run validate:packet
```

A generated packet must include:

```txt
packet_id
dag_node_id
goal
non_goals
subagent_contract
exact source section refs
bounded source excerpts or exact read commands
normalized assertions
allowed files
forbidden files
required tests to write first
expected failing state before implementation where applicable
implementation scope
required validation profile
required gates
required fixtures
evidence expectations
handoff format
resume behavior
failure policy
```

A subagent must be able to start from one generated packet plus `views/SUBAGENT_CONTRACT.md` without broad exploration.

## E. Subagent contract

Required view exists:

```txt
views/SUBAGENT_CONTRACT.md
```

It must tell subagents:

```txt
read only the packet
do not browse product specs except exact source refs or excerpts named in the packet
do not read root legacy docs
do not edit product specs
write tests first
only edit allowed files
run only packet validation profile
record evidence
stop and return blocker if context is insufficient
return structured handoff
```

## F. TDD and test quality

Required commands exist and work:

```bash
bun run validate:tests
```

Every dispatchable implementation packet must specify:

```txt
tests to add or update
fixture files to create or use
negative cases
expected failing command before implementation where practical
expected passing command after implementation
packet-specific validation command
```

Test validation must not just check that a command string exists. It must check that the packet has a real test contract.

## G. Coverage

Required command exists and works:

```bash
bun run validate:coverage
```

It must report:

```txt
total product-spec sections
sections with normative assertions
total normalized assertions
linked assertions
implemented assertions
packeted assertions
blocked assertions
deferred assertions
oracle gaps
non-goals
unclassified normative sections
coverage percentage
```

No product-grade implementation run can be READY if normative product-spec content remains unclassified without an explicit blocker or deferral.

## H. Views

Required views exist and are generated:

```txt
views/README.md
views/OPERATING_KERNEL.md
views/SUBAGENT_CONTRACT.md
views/RESUME_PROTOCOL.md
views/IMPLEMENTATION_DAG.md
views/IMPLEMENTATION_GRAPH.md
views/CONTRACT_TO_BUILD_MATRIX.md
views/VALIDATION_GATE_REGISTRY.md
views/SPEC_READ_PLAN.md
views/IMPLEMENTATION_LEDGER.md
views/CLEANUP_PLAN.md
```

Views must be human-readable.

Specifically:

- `views/OPERATING_KERNEL.md` must be concise enough for mother-agent always-on context.
- `views/SUBAGENT_CONTRACT.md` must be concise and actionable.
- `views/RESUME_PROTOCOL.md` must describe interruption recovery and delegate actual state recovery to `bun run resume`.
- `views/SPEC_READ_PLAN.md` must not dump all spec sections in a giant table.
- Large indexes belong in `canonical/**`, not views.

## I. Cleanup

Required commands exist and work:

```bash
bun run cleanup:plan
bun run cleanup:apply
```

`cleanup:plan` must classify files:

```txt
active_source
generated_view
legacy_archive
safe_to_remove
blocked_from_removal
```

`cleanup:apply` must:

- default to dry run unless `--yes`
- never delete product specs
- never delete canonical records
- never delete state evidence
- never delete files referenced by current packets, evidence, blockers, or ledger
- remove or archive obsolete active legacy docs only after `cleanup:plan` marks them safe

## J. Validation

Required commands exist and work:

```bash
bun run validate
bun run validate:packet
bun run validate:graph
bun run validate:tests
bun run validate:coverage
```

Validation must guarantee:

```txt
product specs unchanged
graph acyclic
frontier computable
no dispatchable packet uses unresolved legacy links
no dispatchable packet uses non-executable required fixtures
no dispatchable packet has missing tests
no dispatchable packet has empty allowed files
no packet requires global validation unless justified
views are generated and current
evidence exists for completed DAG nodes
resume plan is computable
```

# VERIFICATION LOOP

Run this loop.

## Step 1: Inspect

Inspect:

```txt
harness/knowledge/implementation-control/atelier/package.json
harness/knowledge/implementation-control/atelier/scripts/**
harness/knowledge/implementation-control/atelier/schemas/**
harness/knowledge/implementation-control/atelier/canonical/**
harness/knowledge/implementation-control/atelier/state/**
harness/knowledge/implementation-control/atelier/views/**
```

Also verify forbidden mutation boundaries:

```txt
product/apps/atelier/**
harness/knowledge/product-specs/atelier/**
```

## Step 2: Run commands

From:

```bash
cd harness/knowledge/implementation-control/atelier
```

Run if available:

```bash
bun install
bun run doctor
bun run validate
bun run validate:graph
bun run validate:coverage
bun run frontier
bun run resume
bun run graph
bun run packet -- --dag <first-frontier-dag-id> --format md --out state/packets/generated/<id>.md
bun run validate:packet -- --packet state/packets/generated/<id>.md
bun run validate:tests -- --packet state/packets/generated/<id>.md
bun run render
bun run cleanup:plan
bun run validate
```

If Bun is unavailable, do not claim execution. Perform static inspection and report environment blockage.

## Step 3: Score readiness

Use this status model:

```txt
READY
NEEDS_MORE_WORK_CAN_CONTINUE
BLOCKED_BY_EXTERNAL_INPUT
BLOCKED_BY_ENVIRONMENT
BLOCKED_BY_SCOPE_CONFLICT
```

Do not use `READY` if any P0 remains.

Do not use `NEEDS_MORE_WORK_CAN_CONTINUE` as final output if you can still perform corrective work. Instead, implement the next fixes and repeat the verification loop.

## Step 4: Classify findings

Classify each finding:

```txt
P0 = prevents product-grade implementation or long-run operation
P1 = weakens safety, quality, token reduction, or automation
P2 = improvement after the system is operational
```

P0 examples:

```txt
canonical/assertions.ndjson empty
dispatchable nodes rely on legacy_unresolved
frontier missing
resume missing
packet generation missing or too thin
subagent contract missing
packet-specific validation missing
graph validation missing
coverage validation missing
old root docs remain active
product specs modified
main Atelier CLI modified
```

## Step 5: Fix if possible

If any P0/P1 finding is fixable within the current hardening goal, fix it.

Examples of fixable work:

- add missing commands
- add missing generated views
- move active legacy docs to archive after preserving hashes
- populate assertion records from existing traceability/spec sections using deterministic or bounded LLM-job-ready records
- resolve dispatchable links where deterministic
- mark unresolved records as blocked rather than dispatchable
- add frontier/resume/graph outputs
- add validation profiles
- add packet-specific validation
- add TDD contract fields to generated packets
- shorten human views
- archive generated LLM jobs or make them on-demand
- strengthen validation errors

Do not ask the human to do these if you can do them.

## Step 6: Stop only with valid final state

You may stop only if:

### READY

All required ready-state conditions are satisfied and validation commands pass.

### BLOCKED_BY_EXTERNAL_INPUT

You need information only the human can provide.

Examples:

- product decision ambiguity not present in specs
- contradictory product specs requiring human choice
- missing repository content not available to the agent

### BLOCKED_BY_ENVIRONMENT

You cannot run required tools due to environment limitations.

Examples:

- Bun unavailable
- filesystem read-only
- dependencies cannot install
- command execution disabled

### BLOCKED_BY_SCOPE_CONFLICT

A required fix would violate hard non-negotiables.

Examples:

- only solution would require modifying product specs
- only solution would require modifying main Atelier CLI
- only solution would require broad runtime service outside implementation-control

# EXIT CRITERIA

Before final response, answer these gates:

```txt
Can product-spec implementation proceed without broad context reads?
Can long-run implementation resume after interruption?
Can subagents work without exploring other Markdown?
Can the system implement product-grade coverage, not merely MVP?
Can the mother agent continue without human deciding what to read next?
Can packet-specific validation avoid wasting tokens?
Can completed DAG nodes be backed by evidence?
Can graph/frontier/resume be computed?
Can unresolved legacy state no longer be dispatched?
```

All must be YES for READY.

If any answer is NO and the fix is possible, continue working.

# FINAL REPORT FORMAT

Use this exact format.

````md
# implementation-control verification report

## 1. Final Status

One of:

- READY
- BLOCKED_BY_EXTERNAL_INPUT
- BLOCKED_BY_ENVIRONMENT
- BLOCKED_BY_SCOPE_CONFLICT

Do not output NOT_READY as final status if you can still perform fixes.

## 2. Why This Status

3-10 bullets.

## 3. Verification Summary

| Gate                               |            Result | Evidence |
| ---------------------------------- | ----------------: | -------- |
| Product specs unchanged            | PASS/FAIL/UNKNOWN | ...      |
| Main Atelier CLI untouched         | PASS/FAIL/UNKNOWN | ...      |
| Active root cleaned                | PASS/FAIL/UNKNOWN | ...      |
| Canonical assertions populated     | PASS/FAIL/UNKNOWN | ...      |
| Legacy unresolved not dispatchable | PASS/FAIL/UNKNOWN | ...      |
| Frontier computable                | PASS/FAIL/UNKNOWN | ...      |
| Resume computable                  | PASS/FAIL/UNKNOWN | ...      |
| Graph generated                    | PASS/FAIL/UNKNOWN | ...      |
| Packet self-sufficient             | PASS/FAIL/UNKNOWN | ...      |
| Subagent contract generated        | PASS/FAIL/UNKNOWN | ...      |
| TDD contract enforced              | PASS/FAIL/UNKNOWN | ...      |
| Packet-specific validation         | PASS/FAIL/UNKNOWN | ...      |
| Coverage validation                | PASS/FAIL/UNKNOWN | ...      |
| Human-readable views               | PASS/FAIL/UNKNOWN | ...      |
| Cleanup plan safe                  | PASS/FAIL/UNKNOWN | ...      |

## 4. Commands Run

| Command | Result | Notes |
| ------- | -----: | ----- |

## 5. Remaining Blockers

Only include blockers that could not be fixed within scope.

For each:

- blocker
- why it could not be fixed
- required human/environment action
- exact command to resume afterward

## 6. Files Changed

List changed files grouped by:

- scripts
- canonical
- state
- views
- archive / cleanup

## 7. Readiness Answers

```txt
Can product-spec implementation proceed without broad context reads? YES/NO/CONDITIONAL
Can long-run implementation resume after interruption? YES/NO/CONDITIONAL
Can subagents work without exploring other Markdown? YES/NO/CONDITIONAL
Can the system implement product-grade coverage, not merely MVP? YES/NO/CONDITIONAL
Can the mother agent continue without human deciding what to read next? YES/NO/CONDITIONAL
Can packet-specific validation avoid wasting tokens? YES/NO/CONDITIONAL
Can completed DAG nodes be backed by evidence? YES/NO/CONDITIONAL
Can graph/frontier/resume be computed? YES/NO/CONDITIONAL
Can unresolved legacy state no longer be dispatched? YES/NO/CONDITIONAL
```
````

## 8. Next Command

Provide exactly one next command for the mother agent.

If READY:

```bash
bun run frontier
```

If blocked:

```bash
<exact command to resume after blocker is resolved>
```

````

# IMPORTANT CLOSURE RULE

If you are about to finish with anything other than READY, first ask yourself:

```txt
Is there still an in-scope file edit, script improvement, validation strengthening, cleanup, view render, packet hardening, graph/resume/frontier implementation, or canonical record repair I can perform right now?
````

If yes, do it. Do not close.
