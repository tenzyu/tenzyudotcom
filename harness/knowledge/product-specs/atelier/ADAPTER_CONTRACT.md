---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-adapter-contract
title: Atelier Adapter Contract
status: active
pattern: simple
tags:
  - product:atelier
  - subject:adapter-contract
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - check-candidate
    - test-source
---

# Atelier Adapter Contract

## 1. Adapter Boundary

A runtime adapter is a translator between the canonical Atelier packet and a runtime-shaped packet. It is not a worker and it is not a workplace.

The adapter:

- consumes a canonical packet;
- produces a runtime-shaped packet (prompt, file tree, command list, or handoff document);
- consumes a runtime-shaped result (handoff text, diff list, verification output, trace);
- produces a canonical result (run handoff diff, verification record, review record, trace event).

The adapter:

- must not own execution;
- must not modify a previously committed canonical result;
- must not store hidden state outside the documented packet and the run record;
- must not pretend execution happened when it did not.

If a feature requires the adapter to own execution, hide state, or rewrite artifact semantics, that feature is out of scope for an adapter. It belongs in a different plane.

## 2. Canonical Packet Input Schema

The adapter must consume a canonical packet with the following fields.

```txt
id:                string  (canonical packet identity)
schema_version:    string  (semver of the canonical packet schema)
task:              object  (task id, acceptance criteria, risk constraints)
role:              object  (role id, required capabilities, allowed paths)
context_plan:      object  (attention plan; see contract.md §10)
verification_map:  object  (required checks, optional checks, completion gate)
handoff:           object  (current handoff state for the run, if any)
artifacts:         array   (artifact ids the run may read or reference)
constraints:       object  (forbidden behavior, policy references, permissions)
external_inputs:   object  (documented external state the runtime may need)
```

Missing fields are an adapter error, not a silent default. The adapter must reject the packet with an explicit error per §8a.

## 3. Canonical Packet Output Schema

The adapter must produce a canonical result with the following fields.

```txt
id:                string  (matches canonical packet id)
runtime:           string  (adapter id; e.g. "codex", "opencode", "claude-code", "human")
runtime_packet:    object  (the runtime-shaped packet the adapter produced)
runtime_result:    object  (raw runtime output the adapter observed; may be null)
verification:      object  (verification records the adapter captured, by check_id)
trace:             array   (trace events the adapter observed or synthesized)
diff:              object  (canonical diff summary; handoff text plus structural change)
errors:            array   (any adapter-level errors; empty array on success)
adapter_version:   string  (semver of the adapter)
```

The `diff` field is required even if the runtime reported no changes. A "no changes" diff is itself a meaningful result.

Each field in the canonical result carries an output class per §10. The class is normative and determines whether the field is derived state or accepted durable evidence.

## 4. Runtime Capability Descriptors

A runtime adapter must declare a capability descriptor. The descriptor tells Atelier which canonical packet fields the runtime can consume and which it cannot.

```txt
adapter_id:            string
adapter_version:       string
supported_packet:      string  (minimum canonical packet schema version)
consumes_context_plan: bool
consumes_verification: bool
consumes_constraints:  bool
emits_verification:    bool
emits_trace:           bool
emits_diff:            bool
preserves_handoff:     bool   (does the runtime preserve canonical handoff ordering?)
forbidden_aliases:     array  (commands or surfaces the runtime will not emit)
notes:                 string
```

`preserves_handoff: false` is permitted only if the adapter emits an explicit reordering receipt and the test parity fixture covers the reorder.

## 5. Forbidden Behavior

The following are forbidden for any adapter.

```txt
- Modifying the canonical packet.
- Modifying a previously committed canonical result.
- Inventing verification records that did not happen in the runtime.
- Rewriting artifact semantics (e.g. demoting a check, merging two required checks).
- Adding product-truth fields not present in the canonical schema.
- Persisting adapter state outside the run record and the documented packet.
- Aliasing removed commands.
- Silently dropping required checks, handoff content, or constraints.
- Re-running the runtime without an explicit resume or handoff event.
- Hiding the runtime id from the canonical result.
- Producing an output that contradicts the runtime capability descriptor.
- Promoting a candidate verification record to durable evidence without an explicit record/accept event (see §10).
```

Violations are adapter bugs and are subject to the contract test matrix.

## 6. Round-Trip Rule

A round-trip is:

```txt
canonical packet  --(adapter A)-->  runtime A packet
                                          |
                                          v
                                     runtime A runs
                                          |
                                          v
                                     runtime A result
                                          |
                                          v
                                  --(adapter A inverse)-->  canonical result
```

A second round-trip through adapter B, starting from the same canonical packet, must produce a canonical result with:

- the same task reference and acceptance criteria;
- the same verification map;
- the same artifact set;
- the same forbidden behavior;
- equivalent handoff content (semantic equivalence, not byte equivalence);
- equivalent verification status per check id.

Byte equivalence is not required. Semantic equivalence is. Semantic equivalence is tested by the parity fixture in §7.

## 7. Parity Fixture Rule and Semantic Equivalence Oracle

At least two adapters must pass the same canonical packet through a proof fixture. Stage 0 uses `adapter_packet_portability_fixture`; Stage 1 uses `adapter_runtime_parity_fixture`. Both fixtures share the same semantic equivalence oracle:

- uses a fixed canonical packet (snapshot committed to the test source);
- runs the packet through adapter A and adapter B;
- asserts semantic equivalence of the two canonical results;
- asserts the same required checks appear in both results with the same `status` semantic;
- asserts forbidden behavior is preserved by both adapters;
- asserts the `diff` field is populated by both adapters, even when empty.

### 7.1 Semantic Equivalence Normalization

Semantic equivalence is defined as field-wise canonical normalization. Two canonical results are semantically equivalent when, after normalization, every required field is identical. Normalization rules are normative.

```txt
identity equivalence:
  - same task id
  - same acceptance_criteria ids (set equality, order independent)
  - same artifact ids (set equality, order independent)
  - same required_check ids (set equality, order independent)
  - same optional_check ids (set equality, order independent)
  - same forbidden_behavior ids (set equality, order independent)

status lattice equivalence:
  - both results' per-check status map to the same value in the closed
    status lattice defined by VERIFICATION_SCHEMA.md §5
  - per-check status MUST be one of
    passed | failed | skipped | unavailable | not-run | unknown
  - per-check reason_code MUST be from the controlled lists in
    VERIFICATION_SCHEMA.md §6.1 and §6.2

handoff equivalence:
  - handoff content normalized by heading id
  - section ordering MAY differ when adapter declares handoff reorder
  - handoff text MAY differ in whitespace, formatting, or runtime-shaped
    prompt wrappers, but the set of (heading_id, body_meaning) pairs
    must be equivalent

diff summary equivalence:
  - diff_summary normalized by (file_path, change_class)
  - change_class MUST be one of
    added | modified | deleted | renamed | moved
  - the set of (file_path, change_class) pairs must be equivalent
  - per-file line counts and textual diffs MAY differ
```

A byte difference in raw output is permitted so long as the normalized result is equivalent under the rules above. The parity fixture asserts normalized equivalence, not byte equality.

Only `adapter_runtime_parity_fixture` with a pair of real runtime adapters is the canonical proof of runtime agnosticism. Stage 0 packet portability is a weaker claim and does not establish runtime agnosticism.

### 7.2 Proof Levels

Two distinct contract claims are gated on two distinct fixtures. v5.1 ships both fixtures and the claim language is normative.

```txt
packet_portability_claim:
  Proven after `adapter_packet_portability_fixture` passes for
  the human-shell + noop-reference adapter pair (Stage 0).
  A no-op reference adapter may prove schema portability;
  it does NOT prove runtime agnosticism against real
  agent runtimes. The Stage 0 fixture is the only fixture
  that ships in the MVP per ROADMAP.md Phase 1B.

runtime_agnosticism_claim:
  Proven after `adapter_runtime_parity_fixture` passes for at least
  one pair of real runtime adapters (e.g. codex + opencode,
  codex + claude-code, or equivalent). This is the only
  way the runtime-agnosticism contract claim is established.
  Stage 1 delivery per ROADMAP.md Phase 2A-2C is required.
```

Each claim is gated independently. Passing `adapter_packet_portability_fixture` establishes only `packet_portability_claim`. It does not establish `runtime_agnosticism_claim`. Runtime agnosticism becomes a contract claim only after `adapter_runtime_parity_fixture` passes for at least one pair of real runtime adapters.

## 8. Adapter Inventory Stages

Adapters are introduced in stages. Each stage has a measurable done criterion.

### 8.0 Stage 0: Generic Export (required for MVP)

```txt
Scope:
  - Generic human/shell adapter.
  - Emits a markdown handoff and a shell command list.
  - No runtime-specific packet.

Done when:
  - The generic adapter passes `adapter_packet_portability_fixture`
    against a no-op reference adapter.
  - The generic adapter is the first adapter shipped.
  - The no-op reference adapter is itself a registered adapter with its own
    capability descriptor and version.
  - The `packet_portability_claim` may be made as a contract claim.

Notes:
  - The no-op reference adapter is a schema fixture, not a second runtime.
  - Stage 0 does NOT establish runtime agnosticism against real agent runtimes.
  - For runtime agnosticism, see §7.2 and Stage 1 (Phase 2A-2C in ROADMAP.md).
```

### 8.1 Stage 1: Agent Runtime Adapters

```txt
Scope:
  - First real runtime adapter.
  - Second real runtime adapter.
  - Pairwise parity between those real runtime adapters.
  - Additional named adapters after the first real-runtime pair is proven.

Done when:
  - At least one pair of real runtime adapters passes `adapter_runtime_parity_fixture`.
  - Adapter capability descriptors are published.
  - Adapter output surfaces are listed in SURFACES.md.
```

### 8.2 Stage 2: Additional Adapters

```txt
Scope:
  - Gemini, additional local runtimes, custom organization adapters.

Done when:
  - Each new adapter passes `adapter_runtime_parity_fixture` in at least one real-runtime pair.
  - Each new adapter is listed in SURFACES.md.
```

Adapters must not be added to Stage 1 or Stage 2 before `adapter_runtime_parity_fixture` exists. The fixture is the gate for runtime agnosticism.

## 8a. Adapter Error Schema

An adapter error is reported in the `errors` field of the canonical result. The error shape is normative.

```txt
error_code:     string   (stable enum, see §8a.1)
message:        string   (human-readable)
missing_field:  string   (set when error_code indicates a schema gap; null otherwise)
runtime_id:     string   (the runtime that produced or observed the error)
recoverable:    boolean  (whether retry with the same packet may succeed)
correlation_id: string   (matches the canonical packet id)
recorded_at:    RFC3339 timestamp
```

A canonical result with non-empty `errors` is not a successful run. The completion gate evaluation per `VERIFICATION_SCHEMA.md` §8 treats a result with non-empty `errors` as `hard_block=true` for any check the error is associated with.

### 8a.1 Error Code Enum

```txt
ATELIER-PACKET-MISSING-FIELD    A canonical packet field required by the adapter is missing.
ATELIER-PACKET-INVALID-VERSION  The packet schema_version is not supported.
ATELIER-RUNTIME-UNREACHABLE     The runtime could not be reached.
ATELIER-RUNTIME-TIMEOUT         The runtime did not respond within the timeout.
ATELIER-RUNTIME-ERROR           The runtime returned a non-recoverable error.
ATELIER-INVARIANT-VIOLATION     The adapter detected a contract violation.
ATELIER-INTERNAL-ERROR          The adapter itself failed.
```

The enum is closed for v5. New error codes require a contract revision.

## 9. Linkage

- Adapter output surfaces are listed in `SURFACES.md`.
- Adapter proof fixtures are listed in `CONTRACT_TEST_MATRIX.md`.
- The canonical packet schema is referenced by `contract.md` §13a.
- Adapter capability descriptors are derived from the runtime inventory maintained in `POSITIONING.md` §3.
- The semantic equivalence oracle is in §7.1.

## 10. Adapter Output Class Split

Adapter output is not a single class. Each output field has a class that determines whether it is derived state or accepted durable evidence. The class split is normative and replaces the prior "Adapter output is itself a kind of derived state" wording.

```txt
runtime_observation:
  Default class. The adapter's observed runtime output, including
  runtime_packet, runtime_result, and adapter_version.
  Lives under .atelier/ as derived state. Regenerable.
  MUST NOT be promoted to durable evidence.

verification_record_candidate:
  The verification records the adapter captured (the `verification` field).
  Default class. Lives under .atelier/ as derived state.
  Becomes accepted_verification_record only after a verification record
  is committed at durable_path per VERIFICATION_SCHEMA.md §4 and §9.
  Promoting a candidate to a durable record requires an explicit
  record/accept event per EVENT_MODEL.md §5; the adapter MUST NOT
  perform the promotion implicitly.

accepted_verification_record:
  A verification record that has been committed at durable_path
  outside .atelier/ as accepted durable evidence per
  GRAPH_SEMANTICS.md §2.2. Survives .atelier/ deletion.
  Promotion is a one-way event; an adapter cannot revert it.

trace:
  The `trace` field. Default class is derived state under .atelier/traces/.
  Becomes durable evidence only when explicitly promoted by an acceptance
  event. The promotion path is the same as verification records.

diff_summary:
  The `diff` field. Default class is derived state.
  Becomes accepted durable evidence only when explicitly accepted as
  review evidence by an `artifact_accepted` event per EVENT_MODEL.md §5.
  A diff_summary that has not been accepted is regenerable.
```

The class boundaries above are the source of truth for the adapter output class split. The `contract.md` §4.7 reference to "derived state" remains valid for the default class; the split above is the per-field refinement.

Adapters must not echo secrets, credentials, or sensitive runtime context into canonical results. The redaction rules in `GRAPH_SEMANTICS.md` §12 and `EVENT_MODEL.md` §7 apply. Redaction is performed by the adapter before the canonical result is committed.

## v5 Revision Notes

- Replaced the "must not mutate canonical result" wording with "must not modify a previously committed canonical result" in §1 and §5. The new wording is precise: an adapter may produce a canonical result; it may not retroactively change one.
- Replaced the prior §10 "Adapter output is itself a kind of derived state" with a per-field class split: `runtime_observation`, `verification_record_candidate`, `accepted_verification_record`, `trace`, `diff_summary`. The split is the source of truth for the adapter output boundary.
- Added the semantic equivalence normalization oracle in §7.1. Previously the parity fixture asserted "semantic equivalence" without defining equivalence.
- Added the adapter error schema in §8a with a closed error code enum. Previously adapter errors had no shape.
- Reorganized the adapter inventory stages: Stage 0 is generic export (required for MVP), Stage 1 is agent runtime adapters, Stage 2 is additional adapters. Stage 0 is no longer optional.
- Forbidden behavior updated to include "Promoting a candidate verification record to durable evidence without an explicit record/accept event".

## v5.1 Revision Notes

- §7.2 Proof Levels added. Two distinct contract claims: `packet_portability_claim` (gated on `adapter_packet_portability_fixture` for the human-shell + noop-reference pair) and `runtime_agnosticism_claim` (gated on `adapter_runtime_parity_fixture` for at least one real runtime pair). Each claim is gated independently.
- §8.0 Stage 0 references `adapter_packet_portability_fixture`. Added a clarifying note that the no-op reference adapter is a schema fixture, not a second runtime, and that Stage 0 does not establish runtime agnosticism against real agent runtimes.
- §7.1 normalization oracle unchanged. The two-fixture split is at the proof-claim level, not the normalization level.
