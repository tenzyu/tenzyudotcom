---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-graph-semantics
title: Atelier Graph Semantics
status: active
pattern: simple
tags:
  - product:atelier
  - subject:graph-semantics
  - domain:harness
  - layer:product
  - criticality:fatal
  - status:active
affordances:
  declared:
    - context
    - check-candidate
    - test-source
---

# Atelier Graph Semantics

## 1. Scope and Authority

This document is the canonical schema and semantics for the Atelier Artifact Graph Kernel.

It owns:

- artifact identity;
- artifact class model and class transition semantics;
- node and edge schema;
- canonical and experimental kind catalogs;
- edge kind catalog and exhaustive endpoint compatibility matrix;
- graph-level authority model and its scope;
- hash and determinism rules;
- regeneration rules;
- stale detection;
- recovery from `.atelier` deletion;
- strict graph validation rule.

`Ideal.md` defines why the graph exists. `contract.md` defines the behavioral obligations the graph must satisfy. This document defines what the graph **is**, at a precision sufficient for two engineers to implement compatible graphs.

If a future change to this document would alter a behavioral obligation already stated in `contract.md`, the obligation in `contract.md` must be updated explicitly in the same revision.

Authority scope: under the four-class conflict resolution in `contract.md` §2, this document is the `schema_subcontract` owner of the graph kernel domain. Conflicts on the listed owned domains are resolved in favor of this document. The numeric authority scale in §7 applies only to graph-internal conflict resolution. Cross-document governance is not resolved by that scale and is owned by `contract.md` §2.

## 2. Three Artifact Classes

Every artifact belongs to exactly one class. The class determines placement, ownership, deletion behavior, and acceptance.

### 2.1 Source Artifacts

Source artifacts are authored or externally meaningful repository material.

Placement: anywhere in the repository except `.atelier/`.

Examples:

```txt
harness/knowledge/**/*.md
harness/tasks/**/*.md
harness/runs/**/handoff.md
product/**
docs/**
tests
linters
hooks
policies
package configuration
source files
```

Rules:

- Source artifacts are durable product truth.
- They are useful without requiring an Atelier runtime.
- They may carry a frontmatter `id:` field. If present, that id is the canonical identity.
- They may not be moved or rewritten by Atelier implicitly. Atelier may observe, classify, relate, and index them. Atelier must not edit their body content.

### 2.2 Accepted Durable Evidence

Accepted durable evidence is the result of a verification, review, decision, or accepted transformation that the repository has chosen to keep outside `.atelier`.

Placement: anywhere in the repository except `.atelier/`, typically co-located with the work it describes.

Examples:

```txt
verification records emitted by an accepted run
review records marked accepted
accepted product decisions
accepted transformation receipts
contract revisions
roadmap revisions
```

Rules:

- Accepted durable evidence is durable product truth.
- It must carry enough identity and provenance to be discovered without `.atelier`.
- Its placement rule: it lives where humans and tools look first, not under `.atelier`.
- Deleting accepted durable evidence is a meaningful event, not a side effect of cache cleanup.

### 2.3 Derived State

Derived state is generated resolution, cache, index, trace, or debug output.

Placement: exclusively under `.atelier/`.

Allowed subtrees:

```txt
.atelier/graph/**
.atelier/indexes/**
.atelier/context/**
.atelier/runs/**
.atelier/traces/**
.atelier/cache/**
.atelier/debug/**
```

Rules:

- Derived state is regenerable from source artifacts plus accepted durable evidence plus documented external inputs.
- Deletion of derived state must not delete product truth.
- Derived state must not be the only place a verification record, decision, or transformation acceptance lives.
- Derived state may include private, prompt, working handoff, run packet, or trace material that is not intended for durable disclosure. Such material must remain under `.atelier` and must not be promoted to durable evidence without an explicit acceptance step. Packet and handoff classes are defined in `RUN_PACKET_MODEL.md`; write authority is defined in `WRITE_AUTHORITY_MATRIX.md`.

### 2.4 Class Model and Promotion Semantics

The class boundary is defined by an explicit acceptance event, not by file extension or path prefix. Promotion is a one-way transition triggered by an acceptance event, not a default side effect.

```txt
product truth  =  source artifacts  +  accepted durable evidence

candidate / proposal  --(acceptance event)-->  accepted durable evidence
                                          \->  source artifact (rare; only when promoted by contract)

derived state  =  f(product truth, documented external inputs)
                (regenerable; lives only under .atelier/)
```

The "Source Artifact -> Accepted Durable Evidence -> Derived State" chain is incorrect. Derived state is generated from product truth and external inputs; it is not downstream of accepted durable evidence. Accepted durable evidence does not become derived state. The arrows above replace the prior class transition diagram.

The promotion rules are normative and live in `contract.md` §8a. The `accepts` and `rejects` event shapes that drive promotion are in `EVENT_MODEL.md` §5.

## 3. Artifact Identity Scheme

Identity is decoupled from location. This is the central rule of the kernel.

### 3.1 Identity Levels

```txt
Primary:
  Explicit authored id (from frontmatter `id:` field or equivalent).
  This is the canonical identity. It survives moves and renames.

Secondary:
  kind + declared scope + slug.
  Used only when the artifact has no explicit authored id.
  The slug is not path-derived by default. The slug is a
  stable human-meaningful token chosen by the author or by
  the generator at creation time.

Location:
  Path is a mutable observation, not identity.
  Exception: path-owned source artifacts (raw source files
  without frontmatter, build outputs the repository owns by
  filename) use path as identity-of-record. Moving a
  path-owned artifact creates a moved/supersedes edge, not a
  new identity.

Ephemeral:
  Content hash (SHA-256 of canonical form) may identify
  unowned or generated artifacts.
  Content hash must not become durable identity unless the
  artifact is accepted into the durable evidence class.
```

### 3.2 Move and Rename

When an artifact moves, Atelier must:

1. detect the move through id, content hash, or provenance;
2. emit a `moved/supersedes` edge from old to new identity;
3. continue to recognize the new identity as the canonical one.

Mints of unrelated new identities for the same logical artifact are forbidden.

### 3.3 Identity Conflict Resolution

When two artifacts claim identity-compatible primary ids:

- the more recent acceptance event wins for accepted durable evidence;
- the source artifact wins for source artifacts (the other is a stale clone);
- a conflict record is emitted under `.atelier/graph/`.

When two artifacts have different primary ids but identical content hashes:

- both are kept;
- a `duplicates/of` edge is emitted.

## 4. Node Schema

Every node in the graph represents one artifact, actor, runtime entity, or graph event. The node payload conforms to the following schema.

### 4.1 Required Fields

```txt
id:         string  (primary or secondary identity per §3)
kind:       enum    (one of the canonical kinds; see §4.4)
class:      enum    (source | accepted_durable_evidence | derived)
path:       string  (repository-relative; null for purely ephemeral)
hash:       string  (content hash of canonical form)
owner:      string  (role or actor identifier)
authority:  integer (level on the scale in §7; not all kinds carry graph authority)
```

### 4.2 Optional Fields

```txt
provenance:        object  (originating event, originating artifact id, generation rule)
maturity:          integer (0..6; per transform maturity model)
relations:         array   (outgoing edges; see §5)
tags:              array   (string)
frontmatter:       object  (raw frontmatter, for source artifacts)
created_at:        string  (RFC 3339 timestamp, derived state only)
accepted_at:       string  (RFC 3339; required when class is accepted_durable_evidence)
accepted_by:       string  (actor id; required when class is accepted_durable_evidence)
stale:             boolean (computed; see §10)
stale_reason:      string  (computed; populated when stale is true)
```

### 4.3 Forbidden Fields

- `truth`: there is no field that asserts a node is product truth by itself; truth is a property of class, not a node flag.
- `run_completed`: run completion is a graph event, not a node attribute.

### 4.4 Canonical and Experimental Kind Catalogs

The graph has a two-tier kind model. The two tiers have different validation behavior under §4.5.

#### 4.4.1 Canonical Kinds (Tier 1)

Canonical kinds are stable, fixture-backed, and fully validated by strict graph validation. New canonical kinds require a contract revision.

```txt
ideal
contract
positioning
roadmap
readme
spec_md
task
run
run_handoff
verification_record
review_record
check
linter
skill
role
permission
hook
policy
prompt
trace
event
runtime
runtime_step
ci_workflow
external_input
adapter
artifact_class
source_file
configuration_file
test
product_insight
transform_receipt
decision_record
actor
```

The `actor` kind covers humans, registered agents, and named runtime identities. An `actor` is a graph node so that `owned_by`, `accepts`, and `rejects` edges have a well-defined target.

The `event` kind covers graph events as nodes (separate from the event identity in `EVENT_MODEL.md`; this is the node that graph edges connect to). Events that are durable evidence may also carry `class=accepted_durable_evidence`.

The `runtime` and `runtime_step` kinds cover runtime boundaries and individual runtime steps, so that `produces_trace` and similar edges have a well-defined source.

The `ci_workflow` kind covers CI pipelines and steps, so that `enforces` and `materializes` edges have a well-defined source for CI-emitted checks.

The `external_input` kind covers documented external state (e.g. an external policy feed, a runtime capability descriptor) that influences derived state but does not live in the repository.

The `adapter` kind covers registered runtime adapters, so that adapter parity and capability descriptors have a graph presence.

The `artifact_class` kind covers the three class labels (`source`, `accepted_durable_evidence`, `derived`) as graph nodes, so that class transitions can be edge-typed.

#### 4.4.2 Experimental Kinds (Tier 2)

Experimental kinds are namespaced and ignored by strict graph validation when they are disconnected from canonical required resolution. They exist to allow early experimentation without constant contract revision.

```txt
exp.*
```

Any kind whose name starts with `exp.` is experimental. Experimental kinds may be used freely by the implementation, but they must not appear as a source or target of any canonical required edge.

#### 4.4.3 Promotion

An experimental kind may be promoted to canonical by:

1. adding it to §4.4.1 by name;
2. adding its row to the §6.3 endpoint compatibility matrix;
3. providing a fixture-backed test in `CONTRACT_TEST_MATRIX.md`.

### 4.5 Strict Graph Validation

Strict graph validation is the default mode for Attention, Verification, Completion, and required reconciliation. Its rules are normative.

```txt
strict_graph_validation:
  - validates every canonical node/edge against §4.4.1 and §6.3
  - rejects an experimental kind when it is a source or target of any canonical required edge
  - ignores experimental subgraphs only when they are disconnected from the canonical required resolution
  - canonical required resolution = identity, authority, stale-detection, completion-evidence, and acceptance-event edges
```

The "canonical required resolution" set is closed for v5:

```txt
identity edges:
  derives_from, implements, references, moved, supersedes

authority edges:
  enforces, blocks, conflicts_with

stale-detection edges:
  supersedes (when the superseder changes stale state)

completion-evidence edges:
  verifies, accepts, rejects

acceptance-event edges:
  accepts, rejects, owned_by
```

An experimental kind that appears as a source or target of any edge in the set above is rejected by strict validation. Implementations must report the violation as a `graph_endpoint_compatibility_violation` event per `EVENT_MODEL.md` §3.

## 5. Edge Schema

Edges are directional, kind-tagged, and carry a payload.

```txt
source:     string  (node id)
target:     string  (node id)
kind:       enum    (canonical edge kind; see §6.1)
payload:    object  (kind-specific; see §6.2)
created_at: string  (RFC 3339 timestamp)
```

The graph forbids undirected edges. A symmetric relation is represented by two directed edges.

## 6. Edge Kind Catalog

### 6.1 Canonical Edge Kinds

| Kind                  | Direction Notes                          | Payload (minimum)                          |
|-----------------------|------------------------------------------|--------------------------------------------|
| `derives_from`        | derived -> source or upstream            | `rule` (string)                            |
| `implements`          | concrete -> abstract                     | `coverage` (string)                        |
| `verifies`            | check -> artifact                        | `status` (verification status enum)        |
| `enforces`            | policy/hook/ci -> artifact or class      | `severity` (block | warn)                  |
| `references`          | any -> any                               | `context` (string)                         |
| `blocks`              | blocker -> blocked                       | `reason` (string)                          |
| `conflicts_with`      | any -> any                               | `resolution` (string | null)               |
| `requires_context`    | task/role -> artifact                    | `mode` (full | summary | reference)        |
| `requires_decision`   | task/role -> decision_record             | `urgency` (low | medium | high)            |
| `supersedes`          | newer -> older                           | `moved` (bool)                             |
| `owned_by`            | artifact -> actor/role                   | `since` (RFC 3339)                         |
| `materializes`        | run -> task                              | `at` (RFC 3339)                            |
| `produces_trace`      | runtime_step -> trace                    | `runtime` (string)                         |
| `summarizes`          | summary -> originals                     | `coverage` (string)                        |
| `accepts`             | actor -> artifact (event)                | `evidence` (string)                        |
| `rejects`             | actor -> artifact (event)                | `reason` (string)                          |
| `moved`               | new -> old                               | `old_path` (string)                        |

The edge kind catalog is closed. New edge kinds require a contract revision.

### 6.2 Payload Schema

Each edge kind declares a minimum payload. Implementations may add fields, but the minimum fields are mandatory when the edge is emitted.

### 6.3 Endpoint Compatibility Matrix (Exhaustive)

The endpoint compatibility table is normative and exhaustive. Any edge whose source or target kind is not listed for its kind is invalid.

```txt
derives_from:
  source_kind in {transform_receipt, verification_record, review_record, trace, product_insight, prompt, run_handoff}
  target_kind in {source_file, configuration_file, spec_md, ideal, contract, positioning, roadmap, readme, task, test, check, linter, hook, policy, prompt, skill, role, permission, review_record, transform_receipt}

implements:
  source_kind in {source_file, test, check, linter, hook, policy, prompt, skill, role, transform_receipt}
  target_kind in {spec_md, ideal, contract, positioning, roadmap, readme, task, product_insight, role, policy}

verifies:
  source_kind in {check, linter, test, ci_workflow, policy}
  target_kind in {spec_md, task, product_insight, source_file, configuration_file, contract, positioning, roadmap, readme, transform_receipt, prompt, skill, role, permission, hook, policy}

enforces:
  source_kind in {policy, hook, ci_workflow, linter}
  target_kind in any (full universe)

requires_context:
  source_kind in {task, role, run, runtime}
  target_kind in {spec_md, check, policy, product_insight, source_file, configuration_file, task, test, linter, hook, prompt, skill, role, permission, contract, positioning, roadmap, readme, review_record, transform_receipt, decision_record}

requires_decision:
  source_kind in {task, role, run}
  target_kind in {decision_record}

supersedes:
  source_kind in {spec_md, task, check, linter, hook, policy, prompt, skill, role, permission, source_file, configuration_file, review_record, transform_receipt, decision_record, product_insight}
  target_kind in (the same set as source_kind, but the old identity)

owned_by:
  source_kind in any
  target_kind in {actor, role}

materializes:
  source_kind = run
  target_kind = task

produces_trace:
  source_kind = runtime_step
  target_kind = trace

summarizes:
  source_kind in {product_insight, trace, review_record, decision_record, transform_receipt}
  target_kind in any

accepts:
  source_kind in {actor, role, ci_workflow, policy}
  target_kind in any (target is the artifact being accepted)

rejects:
  source_kind in {actor, role, ci_workflow, policy}
  target_kind in any (target is the artifact being rejected)

moved:
  source_kind in any
  target_kind in any
  (the source and target are identity-compatible; payload.old_path records the prior location)
```

The set `any` in the matrix above refers to the canonical kind universe in §4.4.1. Experimental kinds are not in the universe unless explicitly promoted.

The endpoint matrix is type-closed. Every `source_kind` and `target_kind` referenced in §6.3 must appear in the canonical kind catalog in §4.4.1. The v5.1 matrix removed `derived` from `derives_from.source_kind` because `derived` is a class label in §2, not a kind; the matrix now lists concrete canonical kinds only. The validation rule is enforced by `graph_kind_endpoint_compatibility_fixture` in `CONTRACT_TEST_MATRIX.md` §2a.1: any edge whose source_kind or target_kind is not in §4.4.1 is rejected with a `graph_endpoint_compatibility_violation` event per `EVENT_MODEL.md` §3.

The full compatibility matrix is referenced from `CONTRACT_TEST_MATRIX.md` §2 as the `graph_kind_endpoint_compatibility_fixture`.

## 7. Authority Model

### 7.1 Authority Scale

```txt
0  informative           (advisory, not normative)
1  normative             (this artifact is part of the contract)
2  enforced              (active in CI, hook, or policy)
3  irreversible          (deployed, published, or otherwise externally visible)
4  external              (owned by a system outside the repository)
```

The authority scale applies only to graph-internal conflict resolution between two graph nodes. It does not resolve cross-document governance conflicts; those are resolved by `contract.md` §2.

### 7.2 Graph-Internal Conflict Resolution

When two graph nodes make conflicting claims within the graph:

- the node with higher authority wins;
- ties are broken by class: `accepted_durable_evidence` > `source` > `derived`;
- further ties are broken by recency of acceptance;
- the loser emits a `conflicts_with` edge back to the winner with `resolution` set;
- the resolution is recorded as a `graph_authority_conflict_resolved` event per `EVENT_MODEL.md` §3.

### 7.3 Authority Precedence by Kind

```txt
contract          -> 1
spec_md           -> 1 (when explicitly accepted)
check             -> 2 (when registered)
linter            -> 2 (when registered)
hook              -> 2
policy            -> 2
ci_workflow       -> 2 (when registered)
verification_record -> 2 (when status is passed)
review_record     -> 1 (when status is accepted)
task              -> 1 (when status is active)
roadmap           -> 1
positioning       -> 0
ideal             -> 0
trace             -> 0
prompt            -> 0
test              -> 2 (when registered)
source_file       -> 0
configuration_file -> 0
```

`decision_record` is a special case. Its authority depends on acceptance state, not on kind alone:

```txt
decision_record:
  draft | proposed | unaccepted         -> 0 (advisory)
  accepted_by present + accepted_at present + status == accepted -> 1 (normative)
```

A `decision_record` without acceptance is advisory. An accepted `decision_record` is normative. Authority is computed from state at traversal time, not asserted at creation time.

The default precedence is overridable by a contract revision. The override is recorded as a `supersedes` edge with `payload.authority` change.

## 8. Hash and Determinism Rules

### 8.1 Content Hash

- Algorithm: SHA-256.
- Canonical form: UTF-8, LF line endings, no trailing whitespace, no BOM, sorted frontmatter keys, stable JSON serialization for object fields.
- A node's `hash` is the content hash of its canonical form.

### 8.2 Graph Hash

- Stable node ordering: by `(kind, id)` ascending.
- Stable edge ordering: by `(source, kind, target)` ascending.
- No timestamps in the graph hash payload.
- The graph hash is the SHA-256 of the canonical JSON serialization of the deterministic node and edge set.

### 8.3 Determinism Guarantee

For unchanged input, the graph hash is identical. Any non-determinism in graph construction is a bug.

## 9. Regeneration Contract

### 9.1 Inputs

The graph can be regenerated from:

- all source artifacts in the repository;
- all accepted durable evidence in the repository;
- documented external inputs (runtime capability descriptors, external policy feeds).

### 9.2 Process

```txt
1. Discover all source artifacts and accepted durable evidence.
2. For each, extract identity, kind, and required fields per §4.
3. For each, compute relations:
   - explicit (from frontmatter requires/implements/verifies fields);
   - derived (from path, content hash, and content);
   - acceptance-derived (from `accepts` and `rejects` events).
4. Apply authority and conflict rules from §7.
5. Compute stale flags per §10.
6. Serialize per §8.
```

### 9.3 Guarantee

Given identical inputs, regeneration produces byte-identical graph output. If it does not, the implementation has a determinism violation.

## 9a. Transformation Transitions

The class transition rules for transformations are normative and live in `contract.md` §8a. The maturity model (Levels 0..6), the allowed and forbidden transitions, the required evidence per transition, and the accepted-actor rules are owned by `contract.md`, not by this document.

Graph events that record a transformation transition (`artifact_accepted`, `artifact_rejected`, `moved`, `supersedes`) are defined in `EVENT_MODEL.md` §3 and §5.

## 10. Stale Detection

A node or edge is stale when any of the following holds:

```txt
- upstream source artifact's hash changed and the node has not been re-derived;
- upstream source artifact was removed and the node has not been retired;
- a `supersedes` edge arrived making the node obsolete;
- the artifact's authority dropped below its consumers' minimum;
- the artifact's path is path-owned and the path no longer exists;
- the artifact's `accepted_at` is older than a contract-defined staleness threshold for its kind.
```

Per-kind staleness thresholds are deferred to a later revision. Until they exist, age-based stale detection is disabled by default and the other five rules govern.

Stale nodes and edges are kept in the graph with `stale: true` and `stale_reason` populated. They are excluded from default traversal but are visible to drift and reconciliation tooling.

## 11. Recovery from `.atelier` Deletion

Deleting `.atelier` must not delete product truth. Specifically, the following survive:

- all source artifacts;
- all accepted durable evidence;
- all contracts, roadmaps, and positioning documents;
- all tasks, run handoffs, verification records, and review records that were placed in durable locations.

The following are lost and must be regenerated:

- graph snapshots;
- context hashes;
- resolution traces;
- debug manifests;
- runtime capability caches;
- generated indexes;
- transform proposal indexes.

Regeneration from source artifacts plus accepted durable evidence plus documented external inputs is required to be possible without manual intervention. If it is not, the implementation has a recovery violation.

## 12. Privacy and Sensitive Material

Derived state under `.atelier` may contain prompts, traces, and run records that include sensitive material. Such material:

- must remain under `.atelier` by default;
- must not be promoted to durable evidence without an explicit acceptance event;
- must be excluded from any output surface that leaves the local environment by default.

The redaction state machine is defined in `EVENT_MODEL.md` §7. Sensitive fields include, at minimum, `prompt_body`, `tool_input`, `tool_output`, `trace_payload`, and any field whose name contains `secret`, `token`, `key`, or `password`.

Full privacy classification labels and redaction policies are deferred to a later revision. This document owns only the boundary; the labels are owned by a future `PRIVACY_MODEL.md`.

## 13. Golden Fixture Pointer

This document references the artifact graph golden fixture. The fixture is described abstractly in `CONTRACT_TEST_MATRIX.md` under the test "Artifact graph golden fixture". The fixture must include:

- a small set of source artifacts of distinct kinds;
- a small set of accepted durable evidence;
- a small set of derived state under `.atelier/`;
- a stale node with a populated `stale_reason`;
- an orphan control (a control with no source artifact);
- a `moved/supersedes` edge;
- a conflict resolved by authority precedence;
- at least one experimental kind node, disconnected from canonical required resolution;
- a hash-stable regeneration output.

The fixture's expected graph hash is the canonical reference for the kernel.

## v5 Revision Notes

- Replaced the closed "canonical kinds" catalog with a two-tier model: canonical kinds (§4.4.1) and experimental kinds (`exp.*`, §4.4.2).
- Added the missing canonical kinds that the prior pack referenced in edges but omitted from the catalog: `run`, `actor`, `runtime`, `runtime_step`, `ci_workflow`, `event`, `external_input`, `adapter`, `artifact_class`.
- Replaced the "representative subset" of `§6.3` with the exhaustive endpoint compatibility matrix. Every edge kind now lists every allowed source_kind and target_kind.
- Added §4.5 strict graph validation rule. Experimental kinds are rejected when they participate in canonical required resolution.
- Replaced the §2.4 class transition arrow with the corrected class model: product truth is source + accepted durable evidence; derived state is generated from product truth plus external inputs; candidate/proposal promotes to accepted evidence via an acceptance event.
- Replaced §7.2 conflict resolution with a graph-internal rule. Cross-document governance is explicitly deferred to `contract.md` §2.
- Added the `decision_record` authority rule: advisory when unaccepted, normative when accepted. Authority is computed from state.
- Renamed the prior §9 cross-reference: §9 keeps "Regeneration Contract" content. §9a "Transformation Transitions" points at `contract.md` §8a. §2.4 now references §9a (i.e. `contract.md` §8a), not §9.
- Updated §13 golden fixture requirements to include experimental kinds and the strict validation test.
- Replaced §12 privacy paragraph with a pointer to `EVENT_MODEL.md` §7 for the redaction state machine. Full privacy classification labels are explicitly deferred.

## v5.1 Revision Notes

- §6.3 endpoint matrix type-closure: removed `derived` from `derives_from.source_kind` because `derived` is a class label in §2, not a kind. The new source set is `{transform_receipt, verification_record, review_record, trace, product_insight, prompt, run_handoff}` — concrete canonical kinds only. Added an explicit type-closure rule: every `source_kind` and `target_kind` referenced in §6.3 must appear in the canonical kind catalog in §4.4.1.
- §4.5 strict graph validation: fixed the stale-detection edge kind from `superseded` (not a canonical edge) to `supersedes` (the canonical edge kind defined in §6.1). The strict validation set now matches the edge catalog.
