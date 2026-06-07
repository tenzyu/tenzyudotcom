# Evaluation Spec: Atelier Autopoiesis Runtime

The evaluator must decide whether the repository implements the mission, not whether the implementation looks plausible. It must fail prose-only, demo-only, relation-only, RAG-only, and view-only implementations.

## Evaluation method

Use three evidence layers:

```txt
L1 static evidence: types, schemas, validators, commands, tests, fixtures, and clear code paths exist.
L2 runtime evidence: local commands generate state, reject invalid state, and produce machine-readable reports.
L3 adversarial evidence: negative controls fail when lifecycle, authority, stale, conflict, or materialization rules are violated.
```

A capability passes only when L1 exists and either L2 or a documented unavailable-tooling note plus strong static proof exists. For critical safety/control capabilities, L3 is required.

## Severity

```txt
P0: The product can falsely claim to be a semantic control plane while missing a mission-critical control primitive.
P1: The control primitive exists but is bypassable, shallow, untested, or not connected to the agent loop.
P2: Usability, coverage, or ergonomics gap that does not invalidate the core loop.
```

P0 and P1 are blocking.

## Capability rubric

### C1 Artifact compiler

Pass requires:

- typed semantic node schema or equivalent for source, requirement, decision, invariant, test contract, review finding, handoff, task, permission/check/evidence, materialization proposal, conflict, and stale/supersede records;
- stable source anchors with path/range/hash or equivalent selector;
- compiler/indexer/parser code that emits these records from repo/vault artifacts;
- validator that rejects missing source anchors, missing provenance, missing lifecycle state, and malformed records.

P0 defects:

- AP-P0-C1-001: only file/source units exist; no semantic node families for requirements/decisions/invariants/findings/handoffs.
- AP-P0-C1-002: nodes are prose summaries without anchors/provenance.
- AP-P0-C1-003: compiler output is not machine-validated.

### C2 Lifecycle and promotion policy

Pass requires:

- lifecycle state model including observed/inferred/proposed/accepted/verified/superseded/rejected/archived/quarantined or semantically equivalent states;
- transition policy code;
- promotion command or validator path;
- hard rejection of direct LLM-derived accepted/verified records;
- evidence/scope/conflict checks for promotion.

P0 defects:

- AP-P0-C2-001: no lifecycle state machine.
- AP-P0-C2-002: LLM-derived or reader-produced records can become accepted/verified directly.
- AP-P0-C2-003: accepted/verified lacks evidence, scope, owner/policy, or conflict check.

### C3 Authority model

Pass requires:

- explicit authority source classes and precedence rules;
- authority scoped by artifact type and path/domain/task;
- conflict detection when authoritative sources disagree;
- runtime query or report that explains which artifact wins and why.

P0 defects:

- AP-P0-C3-001: graph edges exist but authority is not represented.
- AP-P0-C3-002: conflicts are silently resolved or ignored.
- AP-P0-C3-003: handoff or generated view can override accepted spec/ADR/test/evidence.

### C4 Semantic graph and query runtime

Pass requires:

- typed relations connecting requirements, decisions, invariants, tests, code/source anchors, review findings, tasks, evidence, handoffs, permissions, and proposals;
- query commands/APIs for active requirements, accepted decisions, required checks, allowed/forbidden operations, open findings, stale artifacts, conflicts, blocked reasons, evidence anchors, and recommended tasks;
- graph validation for endpoint resolution, relation provenance, lifecycle compatibility, and stale endpoint rejection.

P0 defects:

- AP-P0-C4-001: only `contains` or source-reference relations exist.
- AP-P0-C4-002: no runtime query surface for agents.
- AP-P0-C4-003: queries return unfiltered context rather than authority-scoped operational state.

### C5 Task-local control packet

Pass requires:

- packet generator that queries the runtime rather than manually summarizing docs;
- packet fields for active requirements, accepted decisions, allowed operations, forbidden operations, required checks, open findings, stale artifacts, conflicts, evidence anchors, and materialization rules;
- validator that rejects packet/context drift, missing checks, overlapping allowed/forbidden scope, and unresolved anchors.

P0 defects:

- AP-P0-C5-001: packets are free-form prompts or context dumps.
- AP-P0-C5-002: packets omit authority/lifecycle/stale/conflict/check data.
- AP-P0-C5-003: packet validator allows scope overlap or missing required checks.

### C6 Materialization gate

Pass requires:

- proposal record for agent changes before acceptance/materialization;
- link from proposal to requirements, findings, tests, decisions, source anchors, and evidence;
- validator that checks scope, authority, lifecycle, conflicts, stale artifacts, required checks, and evidence;
- rejection path for unauthorized or unverifiable changes.

P0 defects:

- AP-P0-C6-001: agents can edit files and mark work complete without proposal/evidence linkage.
- AP-P0-C6-002: no materialization validator/gate exists.
- AP-P0-C6-003: forbidden scope or stale/conflicted state can be materialized.

### C7 Drift, stale, supersede, archive

Pass requires:

- stale detection for anchor drift, changed source hashes, superseded handoffs, invalidated evidence, obsolete decisions, and spec/test/code drift;
- state transitions retaining historical meaning instead of deleting records;
- report/query exposing stale/conflicted/superseded records to agents;
- negative fixture proving stale artifacts cannot satisfy current task authority.

P0 defects:

- AP-P0-C7-001: stale artifacts are ignored/deleted instead of state-transitioned.
- AP-P0-C7-002: handoffs do not expire/supersede.
- AP-P0-C7-003: changed anchors/evidence can still satisfy current requirements.

### C8 Self-improvement loop

Pass requires:

- repository-native evaluator outputting structured findings;
- compiler from findings to implementation/control packets;
- OpenCode-compatible agent contracts or CLI commands for executing patches;
- evaluator red-team that detects false completion;
- run/evidence ledger connecting defects -> packets -> patches -> checks -> decisions;
- ability to recommend the next missing capability without user sequencing.

P0 defects:

- AP-P0-C8-001: no structured evaluator or findings.
- AP-P0-C8-002: no findings-to-work mechanism.
- AP-P0-C8-003: agents require the user to manually translate mission into tickets.
- AP-P0-C8-004: loop can complete without evaluator pass.

## Cross-cutting false-completion tests

The evaluator must attempt to falsify completion with these questions:

```txt
Can a generated Markdown view become truth?
Can handoff become authority?
Can an LLM-derived proposal become accepted without policy?
Can a stale anchor satisfy a current relation?
Can an agent edit outside task scope?
Can a packet pass with missing required checks?
Can conflict be hidden by picking one side silently?
Can runtime evidence satisfy an unrelated test contract?
Can the system pass while only indexing files and relations?
Can the system pass without recommending the next missing capability?
```

Any "yes" is at least P1, and usually P0.

## Required command probes

The evaluator should run available equivalents. Do not require exact command names when implementation documents a semantic equivalent.

```bash
bun run atelier:index
bun run atelier:validate
bun run atelier:verify
bun run atelier:ready
bun run atelier:query -- --kind active-requirements --task "autopoiesis smoke"
bun run atelier:packet:create -- --task "autopoiesis smoke"
bun run atelier:packet:validate
bun run atelier:authority:resolve -- --scope .
bun run atelier:stale:detect
bun run atelier:conflicts:detect
bun run atelier:evaluate -- --goal harness/atelier-autopoiesis/MISSION.md
```

If commands do not exist, check package scripts and local CLI help for equivalents. Missing equivalent commands are defects.

## Evaluator output

Return only a JSON object plus a terse human summary. The JSON must be first.

```json
{
  "schema": "atelier.autopoiesis-evaluation/v1",
  "status": "pass|fail|blocked",
  "capability_results": [
    {
      "capability_id": "C1",
      "status": "pass|fail|partial|blocked",
      "evidence": ["path:line or command"],
      "defects": ["AP-P0-C1-001"]
    }
  ],
  "blocking_defects": [
    {
      "defect_id": "AP-P0-C2-001",
      "severity": "P0",
      "capability_id": "C2",
      "blocking": true,
      "affected_files": [],
      "reason": "specific reason",
      "required_repair": "specific repair instruction",
      "proof_required": ["tests/checks/negative controls required"]
    }
  ],
  "warnings": [],
  "commands_run": [],
  "commands_not_run": [],
  "next_work_orders": []
}
```
