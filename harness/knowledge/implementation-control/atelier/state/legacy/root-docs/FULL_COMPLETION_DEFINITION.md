---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-full-completion-definition
title: Atelier Full Completion Definition
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Full Completion Definition

## Principle

Atelier is finished only when the full product ideal is implemented and proven. Passing tests is necessary but insufficient if product-level flows are absent, evidence is not durable, runtime agnosticism is only a marketing claim, transformations are unsafe, HPO states mislead humans, or `.atelier` contains the only product truth.

## Completion Is Not Negotiable Through Blockers

Blocked executable invariants do not satisfy full completion.

Full completion requires:

- zero unresolved P0/P1 blockers;
- zero fatal/high pending validation gates;
- all required gates executable and passing;
- all executable invariants implemented and proven;
- all public claims backed by their required proof gates;
- waivers only when the product specs explicitly defer the claim or a human product owner grants a time-bounded waiver.

A blocked invariant may justify stopping, splitting, or escalating. It may not justify completion.

## Product-Wide Acceptance Criteria

- The repository remains the source of truth.
- `.atelier` is derived state and deletion/regeneration preserves product truth.
- Source artifacts are preserved and transformations do not erase provenance.
- Accepted durable evidence is explicit, outside `.atelier`, and linked to acceptance events.
- Artifact graph, verification, events, adapters, surfaces, run packets, write authority, transformation, HPO, and swarm tracks are implemented through the DAG.
- Every executable invariant in `CONTRACT_TO_BUILD_MATRIX.md` is implemented and proven, or product-authorized as deferred with valid owner/expiry. Unresolved executable blockers prevent `PG-F` and final completion.
- No product spec under `harness/knowledge/product-specs/atelier` was edited by implementation agents.

## Track-Level Acceptance Criteria

| Track | Acceptance Criteria |
|---|---|
| Graph kernel | Node/edge/class/identity/kind/authority/hash/stale/regeneration invariants pass golden, endpoint, strict validation, and deletion-regeneration fixtures |
| Evidence model | Accepted durable evidence requires durable path plus matching `artifact_accepted` event and survives `.atelier` deletion |
| Event model | Closed event enum, payload invariants, durable terminal events, correlation with graph edges, redaction/replay boundaries pass |
| Verification engine | Check registry, required map, record schema, status lattice, reason codes, hard-block, truth table, decision_ref validation pass |
| Run lifecycle | Task/run boundary, run states, blocked_waiting vs run_blocked_terminal, completion, dirty honesty, force-close rules pass |
| Attention planner | Context plan is read-only, snake_case, budgeted, decision-recorded, freshness-aware, and co-emits required verification map |
| Run packet model | Working/exported/accepted packet classes and LLM reading order are enforced |
| Surfaces | Active CLI/MCP/GUI/prompt/adapter/README surfaces agree; removed commands are absent; JSON schemas are exact |
| Adapter plane | Stage 0 packet portability passes; Stage 1 real-runtime parity passes before runtime agnosticism claim; adapters do not own execution or product truth |
| Transformation | Maturity levels, allowed transitions, forbidden jumps, acceptance events, deterministic/enforced promotion rules pass across pilots |
| Governance/write authority | Unauthorized writes/promotions are rejected; policy block stub contributes to hard_block; full-policy gaps are explicit |
| HPO state/UI | HPO states carry required evidence, forbidden claims are impossible by structure, allowed actions are state-gated, uncertainty is visible |
| Trace/review records | Traces and reviews are classified correctly, can become durable evidence only through acceptance, and feed transformation/reconciliation safely |
| Runtime resolution | Runtime capability descriptors are graph-managed; runtime-specific config does not become hidden product truth |
| Swarm coordination | Subagent packets, parallel work, conflicts, review handoffs, and merge readiness preserve runtime agnosticism and do not canonize subagent output by default |
| End-to-end flows | MVP wedge, adapter portability, real runtime parity, transformation pilots, HPO flows, and swarm flows pass through public surfaces |

## Invariant Coverage Criteria

- `contract_coverage_test` passes.
- Every normative `must` from the specified normative product specs maps to a test, fixture-only check, or valid waiver.
- Every implementation module traces to invariant IDs.
- Every invariant status is recorded in `IMPLEMENTATION_LEDGER.md`.
- Expired waivers are treated as coverage gaps.
- No unresolved executable P0/P1 blocker remains open.
- No `pending_command_implementation`, `not_run`, `unavailable`, or `oracle_gap` status satisfies a required phase gate.
- Final completion requires actual validation records and proof artifact paths, not templates, proposed packet entries, unexecuted registry rows, or conversation-only claims.

## Runtime-Agnosticism Proof Criteria

- `adapter_packet_portability_fixture` passes for `human-shell` plus `noop-reference`; only `packet_portability_claim` is enabled.
- `adapter_runtime_parity_fixture` passes for at least one pair of real runtime adapters; only then may `runtime_agnosticism_claim` be stated as a contract claim.
- Additional adapters pass runtime parity in at least one real-runtime pair.
- No adapter persists hidden state outside canonical packet, canonical result, and run record.
- No adapter invents verification records or promotes candidate evidence implicitly.
- Runtime-specific configuration is represented as an artifact with provenance when it influences product truth.

## Artifact Graph Correctness Criteria

- Graph kind set equals the canonical set from `GRAPH_SEMANTICS.md`.
- Strict graph validation rejects invalid endpoint pairs and experimental kinds in canonical required resolution.
- Move/rename emits `moved/supersedes` relations.
- Graph hash is byte-identical for unchanged inputs.
- Stale artifacts remain visible with `stale_reason` and are excluded from default traversal.
- Graph can regenerate from source artifacts, accepted durable evidence, and documented external inputs.

## Attention-Management Correctness Criteria

- `atelier context plan` is read-only and does not create tasks/runs or mutate source files.
- Context output is snake_case and exactly matches the specified JSON fields.
- Resolution decisions include `resolver_identity`, `resolution_type`, rejected candidates, and `budget_delta`.
- Budget hard/soft/advisory behavior is enforced and reported.
- Required verification map is derived, not invented.

## Transformation Safety Criteria

- No transformation skips maturity levels.
- Candidates/proposals remain non-durable until accepted.
- Level 3 to 4 requires an accepted actor, evidence, receipt, and `artifact_accepted` event.
- Level 4 to 5 requires deterministic output schema and stable content hash.
- Level 5 to 6 requires enforcement mechanism and severity.
- Source artifacts remain identifiable after transformation.

## Governance And Verification Criteria

- Write authority matrix blocks unauthorized create/promote/accept operations.
- Context planner, runtime adapters, and validators cannot promote product truth beyond their authority.
- Verification statuses and reason codes are closed.
- `passed` requires evidence.
- `completed_clean` is the only terminal success state.
- `completed_dirty`, `run_blocked_terminal`, and `forced_closed` are presented as non-success variants.
- Policy decisions with `severity=block` and `active=true` contribute to `hard_block`.

## HPO Value Criteria

- The HPO can identify product truth, verification state, drift, risk, transform candidates, unresolved decisions, roadmap state, and run handoff state without inspecting every diff.
- Every displayed state has its required evidence.
- Forbidden claims are absent by structure, not merely disclaimed.
- Human actions are available only in states that permit them.
- Partial, redacted, synthetic, or missing evidence is shown as uncertainty.

## Repository Ownership Criteria

- Product specs, tasks, source artifacts, accepted durable evidence, verification records, review records, decisions, and accepted transformation receipts survive `.atelier` deletion.
- Derived caches, traces, debug manifests, context hashes, and working packets may be regenerated or lost without losing product truth.
- Durable evidence paths are discoverable without `.atelier`.

## Non-Lock-In Criteria

- Users can use human, shell, Codex, opencode, Claude Code, ChatGPT, Gemini, local tools, CI, or organization adapters through canonical packets/results.
- No feature requires all work to pass through one runtime.
- Public surfaces do not advertise runtime-specific behavior as canonical product truth.

## Regression Criteria

- Negative tests reject removed commands, invalid enum values, invalid endpoint pairs, invalid transitions, missing evidence, dirty-as-success claims, direct blocked_waiting force-close, and implicit evidence promotion.
- A regression fixer can map every failure to invariant IDs and DAG nodes.
- No test is weakened without a recorded contract-backed reason and mother-agent approval.

## Documentation Criteria

- Implementation-control docs remain current enough for a fresh mother agent to resume.
- Product specs remain unmodified.
- Public README/usage surfaces use only active commands.
- Any spec gaps are recorded outside product specs.
- Release notes distinguish proof levels: design intent, normative contract, implemented behavior, fixture-proven behavior, integration-proven behavior, release-proven behavior.

## Final Release Criteria

- `bun nx run <atelier-project>:check` passes for the discovered Atelier project.
- All fatal and high validation gates required for executable invariants are executable and passing.
- No unresolved P0/P1 blocker remains open.
- No high/fatal gate is pending, unavailable, not-run, or represented only by `command.txt`.
- Waivers are allowed only when product specs explicitly mark the claim deferred or future-scoped, and the ledger records owner, expiry, scope, and public-claim restrictions.
- `IMPLEMENTATION_LEDGER.md` has final invariant, packet, validation, blocker, assumption, and integration status.
- `FULL_COMPLETION_DEFINITION.md` checklist is satisfied.
- No product-spec diff, staged change, status entry, or hash drift exists relative to the recorded `HEAD` launch baseline.
- The final release evidence is accepted durable evidence outside `.atelier`.

## Completion-Cannot-Be-Declared-Through-Waivers Rule

A waiver is the only mechanism that can authorize a `pending_command_implementation` to satisfy a phase gate, and even then only for the explicit claim recorded in `allowed_public_claim`. A waiver:

- does not satisfy a P0 launch blocker;
- does not satisfy product-spec immutability;
- does not satisfy an invariant that is not explicitly deferred by product specs;
- does not satisfy public claim for which the waiver does not record `allowed_public_claim`;
- cannot have an open `expiry` for `PG-F` claims;
- cannot be granted by the mother agent; only a product owner or human can grant a waiver.

Waiver records are stored in `state/waivers/**` and referenced from the ledger. A waiver without an owner, expiry, scope, and allowed public claim is invalid and treated as `blocked_by_product_gap` (per `SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md`).

## Blocker Stop Condition

Blocked state may justify pausing, splitting, or continuing independent DAG tracks. It does not satisfy full completion. If an executable invariant is blocked, `PG-F` is blocked unless a product-authorized governance process changes the product spec baseline or records an explicit deferred waiver with owner and expiry.

## Final Proof Matrix

| Track | Required invariant IDs | Required gate IDs | Required evidence artifact | Public claim enabled |
|---|---|---|---|---|
| Product-spec immutability | AT-INV-068 | VG-001, VG-036 | HEAD hash ledger plus clean status/diff logs | Implementation launched against immutable specs |
| Immutable control baseline | infrastructure_support | VG-037 | Control-doc baseline audit | Subagent governance was not self-mutated |
| Test integrity | all executable invariants | VG-038 | Test/fixture diff audit | Tests prove behavior without weakening |
| Graph/evidence/events | AT-INV-002 to AT-INV-013, AT-INV-029 to AT-INV-033 | VG-005 to VG-007, VG-011, VG-013, VG-014, VG-033, VG-040, VG-041, VG-044 | Fixture logs and accepted evidence records | Repository-native graph/evidence correctness |
| Verification/run lifecycle | AT-INV-014 to AT-INV-028 | VG-008 to VG-012, VG-019, VG-024, VG-042, VG-043 | Verification fixture logs and run lifecycle logs | Clean/dirty/blocked completion truth |
| Surfaces/adapters/runtime | AT-INV-034 to AT-INV-049 | VG-018, VG-021 to VG-023, VG-032, VG-039 | Surface inventory and adapter parity logs | Packet portability or runtime agnosticism, according to proof level |
| Write authority/governance | AT-INV-050 to AT-INV-052, AT-INV-076 | VG-026A, VG-026B, VG-043 | Write authority and policy hard-block logs | Mutating surfaces respect authority |
| HPO/transformation/swarm | AT-INV-060 to AT-INV-081 | VG-025, VG-028, VG-031, VG-034, VG-038 | HPO, transform, and swarm E2E evidence | Full-product completion only after all pass |
