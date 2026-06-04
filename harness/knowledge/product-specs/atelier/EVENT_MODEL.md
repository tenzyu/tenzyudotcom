---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-event-model
title: Atelier Event Model
status: active
pattern: simple
tags:
  - product:atelier
  - subject:event-model
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

# Atelier Event Model

## 1. Scope and Authority

This document is the normative schema for Atelier events.

It owns:

- event identity;
- event payload invariants;
- event durability and placement;
- event replay and redaction;
- the `accepts` and `rejects` event shape used to promote candidates to durable evidence.

`Ideal.md` defines why events exist. `contract.md` names the lifecycle events emitted by the Task and Run planes. `GRAPH_SEMANTICS.md` defines how events relate to graph edges. This document defines what an event **is** and how it **durably records** something.

If a future change to this document would alter a lifecycle consequence already stated in `contract.md`, the consequence in `contract.md` must be updated explicitly in the same revision.

Authority: under the four-class conflict resolution in `contract.md` §2, this document is the `schema_subcontract` owner of the event domain. Conflicts on the listed owned domains are resolved in favor of this document.

## 2. Event Identity

An event is a record that something happened. Events are the backbone of provenance, maturity transitions, task and run lifecycle, and accepted evidence.

```txt
event_id:           string   (unique within the schema; ULID or UUIDv7)
event_type:         string   (closed enum; see §3)
schema_version:     string   (semver of the event schema)
subject_id:         string   (the artifact, run, task, or graph node the event acts on)
actor_id:           string   (the agent, role, or system that emitted the event)
occurred_at:        RFC3339 timestamp (with timezone)
recorded_at:        RFC3339 timestamp (with timezone; may be later than occurred_at)
source_artifacts:   array[artifact_ref]  (artifacts the event observed or consumed)
evidence_refs:      array[event_ref | artifact_ref] (events or artifacts that justify this event)
durable_location:   string   (path outside .atelier/ when the event is durable; null otherwise)
derived_trace_ref:  string   (path under .atelier/traces/ for the corresponding trace event, when present)
parent_event_id:    string   (the event this one causally follows, when applicable)
correlation_id:     string   (shared id across events that belong to the same logical action)
redaction_state:    enum[unredacted | redacted | synthetic]  (see §7)
```

`event_id` is the canonical identity of the event. Implementations must not mint a new `event_id` for the same logical event, even on replay.

`subject_id` is the node id of the artifact, run, task, or event this event acts on. For graph-derived events, the subject is the source or target node of the corresponding edge.

`actor_id` identifies the emitter. For events emitted by a runtime adapter, `actor_id` must be `<runtime_id>.<adapter_version>`.

`correlation_id` is shared across events that belong to the same logical action. For example, a `verification_recorded` event and its corresponding `accepts` event share a `correlation_id`.

## 3. Closed Event Type Enum

The event type enum is closed. Implementations must not introduce new event types without a contract revision.

```txt
task_created
task_assigned
task_split
task_blocked
task_unblocked
task_closed
task_assignee_changed
verification_map_extended

run_created
run_resumed
handoff_appended
verification_recorded
run_blocked_waiting
run_blocked_terminal
run_unblocked
run_completed_clean
run_completed_dirty
run_forced_closed

artifact_moved
artifact_superseded
artifact_accepted
artifact_rejected
artifact_stale_detected
artifact_stale_retired

graph_hash_computed
graph_authority_conflict_resolved
graph_endpoint_compatibility_violation

policy_decision_emitted
policy_decision_revoked
```

`run_started` is legacy. Readers may tolerate historical records, but new code must not emit it. Implementations may emit a `run_created` event in place of `run_started`.

`graph_endpoint_compatibility_violation` is emitted when a node-edge pair violates the matrix in `GRAPH_SEMANTICS.md` §6.3. The event must carry the offending `source_id`, `target_id`, and `edge_kind`.

The legacy `run_blocked` event is renamed to `run_blocked_terminal`. The non-terminal form is `run_blocked_waiting`. New code must emit these two events; readers may tolerate historical `run_blocked` records for migration. A `run_unblocked` event is valid only when `prior_state: blocked_waiting`.

Throughout the v5.1 spec pack, the event type for accepting an artifact is `artifact_accepted`. The corresponding graph edge kind is `accepts` (defined in `GRAPH_SEMANTICS.md` §6.1). The two are correlated through `correlation_id` per §9. A durable file write to `durable_path` is necessary but not sufficient for promotion to durable evidence; promotion requires the matching `artifact_accepted` event. See `VERIFICATION_SCHEMA.md` §9.

## 4. Payload Invariants

Each event type declares a minimum payload. Implementations may add fields; required fields must be present.

### 4.1 Task Events

```txt
task_created       { task_id, title, description, phase, scope, parent_task_id }
task_assigned      { task_id, role_id, agent_name }
task_split         { task_id, children: [task_id, ...] }
task_blocked       { task_id, reason, expected_resolution }
task_unblocked     { task_id, resolution }
task_closed        { task_id, outcome: completed|cancelled, accepted_by, evidence_refs }
task_assignee_changed { task_id, from_actor, to_actor, reason }
verification_map_extended { task_id, added_check_ids: [...], reason }
```

### 4.2 Run Events

```txt
run_created            { run_id, task_id, packet_id, runtime, adapter_id }
run_resumed            { run_id, resumed_at, resume_reason }
handoff_appended       { run_id, append_text, appender }
verification_recorded  { run_id, check_id, status, evidence_refs, recorded_at, recorded_by }
run_blocked_waiting    { run_id, reason, expected_resolution, terminal: false }
run_blocked_terminal   { run_id, reason, hard_block_source, terminal: true }
run_unblocked          { run_id, resolution, prior_state: blocked_waiting }
run_completed_clean    { run_id, completed_at, required_passed, optional_summary }
run_completed_dirty    { run_id, completed_at, dirty_reasons, evidence_refs }
run_forced_closed      { run_id, reason, forced_by, forced_at, prior_state: run_blocked_terminal }
```

### 4.3 Artifact and Graph Events

```txt
artifact_moved            { artifact_id, from_path, to_path, content_hash }
artifact_superseded       { old_artifact_id, new_artifact_id, kind }
artifact_accepted         { artifact_id, accepted_by, accepted_at, evidence_refs, scope, expires_at? }
artifact_rejected         { artifact_id, rejected_by, rejected_at, reason, evidence_refs }
artifact_stale_detected   { artifact_id, stale_reason, detected_at }
artifact_stale_retired    { artifact_id, retired_at, retired_by }

graph_hash_computed       { graph_hash, computed_at, fixture_id? }
graph_authority_conflict_resolved { winner_artifact_id, loser_artifact_id, resolution }
graph_endpoint_compatibility_violation { source_id, target_id, edge_kind, reason }
```

### 4.4 Policy Events

```txt
policy_decision_emitted   { decision_id, policy_id, subject_id, severity, reason, emitted_by, evidence_refs, active }
policy_decision_revoked   { decision_id, revoked_by, revoked_at, reason }
```

## 5. Acceptance and Rejection Events

`artifact_accepted` and `artifact_rejected` are the events that promote candidates to durable evidence or move them off the candidate path.

```txt
artifact_accepted:
  artifact_id:     string   (the artifact being accepted)
  accepted_by:     actor_id (the human, contract, validator, or accepted policy)
  accepted_at:     RFC3339 timestamp
  evidence_refs:   array[artifact_ref]
  scope:           string   (e.g. "task:<id>", "path:<glob>", "contract:<section>")
  expires_at:      RFC3339 timestamp (optional; null when no expiry)
  receipt_id:      string   (the durable receipt artifact, typically a transform_receipt)
```

`scope` is required. An `artifact_accepted` event without a `scope` is invalid. `scope` is what allows a later verification record to reference this acceptance via `decision_ref` (per `VERIFICATION_SCHEMA.md` §6.3).

`expires_at` is optional. When present, the acceptance expires at the timestamp and the `decision_ref` is no longer valid for new skips.

```txt
artifact_rejected:
  artifact_id:     string
  rejected_by:     actor_id
  rejected_at:     RFC3339 timestamp
  reason:          string
  evidence_refs:   array[artifact_ref]
```

An `artifact_accepted` event commits a durable receipt. The receipt's `durable_location` is the `artifact_id`'s durable path outside `.atelier/`. Once committed, the receipt survives `.atelier/` deletion per `GRAPH_SEMANTICS.md` §11.

A `verification_recorded` event and the `artifact_accepted` event that promotes the verification record to durable evidence share a `correlation_id`. Replay tooling may use the correlation id to reconstruct the lifecycle.

## 6. Durability and Placement

An event is durable when its `durable_location` is non-null and points outside `.atelier/`. A durable event survives `.atelier/` deletion. A non-durable event is regenerated on demand.

```txt
durable event classes:
  - task lifecycle events when emitted outside .atelier/
  - run lifecycle terminal events: run_blocked_terminal,
    run_completed_clean, run_completed_dirty, run_forced_closed
  - artifact_accepted, artifact_rejected
  - verification_recorded when the verification record is committed
    durably AND paired with the matching artifact_accepted event
  - policy_decision_emitted when the policy is registered as durable

non-durable (derived) event classes:
  - run_created, run_resumed, handoff_appended (kept in .atelier/runs/)
  - run_blocked_waiting (kept in .atelier/runs/; a run_unblocked
    may yet transition the run back to resumed)
  - run_unblocked (kept in .atelier/runs/)
  - graph_hash_computed (kept in .atelier/graph/)
  - artifact_stale_detected, artifact_stale_retired (kept in .atelier/graph/)
  - graph_endpoint_compatibility_violation (kept in .atelier/debug/)
```

A `verification_recorded` event is durable only when paired with a verification record committed at `durable_path` AND the matching `artifact_accepted` event for the record. The pairing is the `correlation_id` plus a `verification_recorded.evidence_refs` entry that points at the durable path. A file write alone is not an acceptance event; an `artifact_accepted` event alone is not durable. The pair, linked by `correlation_id`, is the promotion path. See `VERIFICATION_SCHEMA.md` §9.

The `run_blocked_terminal`, `run_completed_clean`, `run_completed_dirty`, and `run_forced_closed` events are durable. A run that reaches a terminal closure state without emitting a matching durable event is invalid.

## 7. Redaction

Some events contain sensitive material: prompts, traces, and runtime payloads. Redaction is a property of the event, not the file.

```txt
redaction_state:
  unredacted    the event payload is stored as emitted
  redacted      sensitive fields have been replaced with placeholders
  synthetic     the event is a replay-derived reconstruction
```

A redacted event must list the redacted fields. Implementations must not silently drop fields; a redacted field is replaced with a placeholder of the form `[redacted:<field_name>:<reason_code>]`.

Sensitive fields include, at minimum, `prompt_body`, `tool_input`, `tool_output`, `trace_payload`, and any field whose name contains `secret`, `token`, `key`, or `password`.

A redacted event is still durable. Redaction is not deletion.

## 8. Replay

Replay reconstructs the state of a subject from its events. Replay is permitted only for non-durable events. A durable event is the record of fact; replay of a durable event is invalid.

```txt
replay is permitted when:
  - reconstructing a projection from existing event records
  - reconstructing a derived trace view from non-durable event records
  - the replay output is a projection record, not a new logical event

replay is forbidden when:
  - minting a new event_id for an existing logical event
  - replacing a durable event record
  - converting a projection record into durable event evidence
```

Replay reconstructs projections and must not mint a new `event_id` for the same logical event. Replay outputs that need identity use `projection_record_id` or `replay_projection_id`, not `event_id`. A projection record may point to the source event with `source_event_id`, but it is not itself a member of the closed event enum.

## 9. Cross-Reference With Graph Edges

A `materializes` edge from a run to a task is emitted together with the `run_created` event. The edge and the event share a `correlation_id`. The graph edge provides the structural relationship; the event provides the temporal record.

An `accepts` edge from an actor to an artifact is emitted together with the `artifact_accepted` event. The edge and the event share a `correlation_id`. The edge is the structural record; the event is the durable record.

A `moved` edge from a new artifact to an old artifact is emitted together with the `artifact_moved` event. The edge and the event share a `correlation_id`.

If a graph edge and its corresponding event disagree, the event wins for temporal facts; the edge wins for structural facts. A conflict between the two is emitted as `graph_authority_conflict_resolved`.

## v5 Revision Notes

- Introduced in v5.
- Defines the event identity, payload, durability, replay, and redaction model. Previously these were implicit across `contract.md` and `GRAPH_SEMANTICS.md` with no canonical schema.
- Owns the closed event type enum and the minimum payloads for each event type.
- Defines the `accepts` and `rejects` event shape that promotes candidates to durable evidence. Previously the promotion path was vague.
- Adds the redaction state machine. Previously redaction was undefined.
- Adds the replay rule: durable events may not be replayed.
- Adds the cross-reference rule that binds graph edges to events through `correlation_id`.

## v5.1 Revision Notes

- Renamed the legacy `run_blocked` event to `run_blocked_terminal` and added `run_blocked_waiting` in §3 and §4.2. New code must emit the two new events; readers may tolerate historical `run_blocked` records for migration. The new events carry an explicit `terminal: bool` payload field.
- `run_unblocked` now requires `prior_state: blocked_waiting` in its payload. A `run_unblocked` event without `prior_state: blocked_waiting` is invalid.
- §6 durability rules updated: `run_blocked_terminal` is durable; `run_blocked_waiting` is non-durable (the run may still resume). The four terminal events (`run_blocked_terminal`, `run_completed_clean`, `run_completed_dirty`, `run_forced_closed`) are durable.
- §3 vocabulary clarification: `artifact_accepted` is the event type; the corresponding graph edge kind is `accepts`. A durable file write to `durable_path` is necessary but not sufficient for promotion; promotion requires the matching `artifact_accepted` event with the same `correlation_id`. Cross-references `VERIFICATION_SCHEMA.md` §9 and `contract.md` §16.
- §6 pairing rule: `verification_recorded` is durable only when paired with both a `durable_path` write and a matching `artifact_accepted` event. The pair, linked by `correlation_id`, is the promotion path.
