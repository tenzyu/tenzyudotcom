---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-verification-schema
title: Atelier Verification Schema
status: active
pattern: simple
tags:
  - product:atelier
  - subject:verification-schema
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

# Atelier Verification Schema

## 1. Scope and Authority

This document is the normative schema for Atelier's verification subsystem.

It owns:

- the check registry schema;
- the verification record schema;
- the required verification map derivation rule;
- the verification status lattice;
- the controlled reason codes for `skipped` and `unavailable`;
- the `hard_block` definition;
- the completion truth table;
- the `decision_ref` validation rule for `deferred_by_accepted_decision`.

`Ideal.md` defines why verification exists. `contract.md` defines the lifecycle consequence of the gate (clean / dirty / blocked / forced-closed) in §16. This document defines what the gate **is** and how it **evaluates**.

If a future change to this document would alter a lifecycle consequence already stated in `contract.md`, the consequence in `contract.md` must be updated explicitly in the same revision.

Authority: under the four-class conflict resolution in `contract.md` §2, this document is the `schema_subcontract` owner of the verification domain. Conflicts on the listed owned domains are resolved in favor of this document.

## 2. Check Registry Schema

A `check` is a registered validator that produces verification records. Checks are graph nodes of kind `check` (per `GRAPH_SEMANTICS.md` §4.4) and are owned by the Verification Plane.

A check registry entry must conform to the following minimum schema.

```txt
check_id:           string   (stable, unique within the registry)
check_version:      string   (semver)
kind:               enum[test | linter | hook | ci_step | policy_check | manual_review]
description:        string
invocation:         object   (command, args, env, working_directory, timeout_ms)
blocking:           boolean  (whether a failed result contributes to hard_block)
required:           boolean  (whether the check is required for the task it is bound to)
unavailable_effect: enum[dirty | blocked]  (default: dirty; required for required checks)
applicable_paths:   array[path_glob]
applicable_roles:   array[role_id]
records_durable_path: string (where the verification record is written outside .atelier/)
evidence_artifacts: array[artifact_ref]   (artifacts this check produces as evidence)
tool_version:       string   (semver or commit hash of the underlying tool)
registered_by:      actor_id
registered_at:      RFC3339 timestamp
status:             enum[active | deprecated | retired]
```

`unavailable_effect` controls what happens when a required check with this id transitions to `unavailable` with a valid `unavailable_reason_code`. The default is `dirty`, which routes the run to `completed_dirty` per §8. When set to `blocked`, a required check that is unavailable due to runner, tool, or environment unavailability becomes a terminal block. This prevents every transient tool outage from becoming terminal: unavailability blocks only when the check declaration explicitly marks unavailability as blocking. For a `required=true` check, the field is **explicitly recommended** so implementers declare intent rather than rely on the default.

A check with `required=true` is part of the required verification map of any task it is bound to. A check with `required=false` is optional and contributes only to warnings.

A check with `blocking=true` whose verification record is `failed` contributes to `hard_block`. A check with `blocking=false` may fail without contributing to `hard_block`.

A check with `status != active` must not be added to a new required verification map.

## 3. Required Verification Map Derivation

The required verification map of a task is the set of checks that must resolve to `passed` for the task to be eligible for `completed_clean`. The map is derived, not invented.

```txt
required_verification_map(task) =
  task_acceptance_criteria
  union  check_registry.bindings(task.kind, task.path_scope)
  union  policy_registry.phase_c_placeholder(task.kind, task.path_scope, task.role)
      # Phase C placeholder. Contributes zero entries in v5.1. The
      # policy_registry term is a placeholder until POLICY_SCHEMA.md
      # exists. See contract.md §5.5 for the Phase C marker.
  filter applicable_paths intersects task.path_scope
  filter applicable_roles intersects task.role
  filter status == active
```

The map is a closed set at task creation time. Adding a check to the map after task creation requires a new `task_assigned` event with reason `verification_map_extended` and a new acceptance event binding the added check to the task.

A required check whose verification record is in any state other than `passed`, `skipped-with-reason`, or `unavailable-with-reason` is unresolved. An unresolved required check contributes to `hard_block`.

## 4. Verification Record Schema

A verification record is a durable artifact of class `accepted_durable_evidence` after it is recorded outside `.atelier/`. Before it is recorded, it is a `verification_record_candidate` and is derived state.

```txt
record_id:           string   (unique within the registry)
check_id:            string   (must exist in check registry)
run_id:              string
task_id:             string
status:              enum[passed | failed | skipped | unavailable | not-run | unknown]
reason_code:         string   (required iff status in {skipped, unavailable})
skip_reason_code:    string   (required iff status == skipped; see §6.1)
unavailable_reason_code: string (required iff status == unavailable; see §6.2)
decision_ref:        string   (required iff skip_reason_code == deferred_by_accepted_decision; see §6.3)
evidence_artifact_refs: array[artifact_ref]
command_invocation:  object   (the exact command that produced this record)
tool_version:        string
recorded_by:         actor_id
recorded_at:         RFC3339 timestamp
durable_path:        string   (path outside .atelier/ where this record is committed)
source_hashes:       object   (hashes of inputs the check consumed)
notes:               string
```

A verification record with `status=passed` requires at least one `evidence_artifact_refs` entry. A record that asserts `passed` without an evidence reference is invalid.

A verification record becomes durable evidence only when both conditions are met:

1. The record is committed at `durable_path` outside `.atelier/`.
2. An `artifact_accepted` event is emitted for the record with the same `correlation_id`.

A file write alone is not an acceptance event. An `artifact_accepted` event alone is not durable evidence. The pair, linked by `correlation_id`, is the promotion path. See `EVENT_MODEL.md` §5 and §6.

## 5. Status Lattice

The verification status lattice is closed. Implementations must not introduce additional status values without a contract revision.

```txt
passed
  A check ran and produced a passing result with at least one evidence reference.

failed
  A check ran and produced a failing result. Whether the failure contributes to
  hard_block depends on check.blocking.

skipped
  A check was deliberately not run for a decision reason.
  Requires skip_reason_code and reason_code.
  May be acceptable for required checks only if the skip_reason_code is
  out_of_scope, not_applicable_to_path, requires_human_review, or
  deferred_by_accepted_decision with a valid decision_ref.

unavailable
  A check could not run for an execution constraint reason.
  Requires unavailable_reason_code and reason_code.
  Acceptable for required checks; routes the run to completed_dirty at most.

not-run
  A check that was supposed to run but did not. Contributes to hard_block.
  Distinct from skipped: skipped is a decision; not-run is a missing record.

unknown
  A check whose status cannot be determined from the available record.
  Contributes to hard_block. Distinct from not-run: not-run is a missing
  record; unknown is an ambiguous record.
```

A status value not in this lattice is invalid. Implementations must reject any record carrying a non-lattice status.

## 6. Reason Codes

Reason codes are controlled. Free-text reasons are not allowed.

### 6.1 Skip Reason Codes

`skipped` is a decision, not a constraint. A skip requires a `skip_reason_code` from the closed set below.

```txt
out_of_scope
  The check is not part of the task scope. Reason must include the
  acceptance criterion or path that excludes it.

not_applicable_to_path
  The check does not apply to the task's path_scope. Reason must
  reference the path glob the check is bound to.

requires_human_review
  The check has been deferred to a human review cycle. Reason must
  include the review task id.

deferred_by_accepted_decision
  A previously accepted decision explicitly defers this check.
  Requires decision_ref per §6.3.
```

A skip with any other `skip_reason_code` value is invalid and is treated as `not-run` for the purpose of the completion gate.

### 6.2 Unavailable Reason Codes

`unavailable` is an execution constraint, not a decision. An unavailable check requires an `unavailable_reason_code` from the closed set below.

```txt
tool_unavailable
  The check's tool is not installed. Reason must include the tool name
  and the expected version range.

environment_unavailable
  The check's required environment is not present. Reason must include
  the missing environment variable, binary, or service.

dependency_unavailable
  The check's dependency is missing or incompatible. Reason must
  include the dependency name and the expected version range.

permission_unavailable
  The check was denied by a permission or authorization boundary.
  Reason must include the permission boundary identifier.
```

An unavailable with any other `unavailable_reason_code` value is invalid and is treated as `failed` for the purpose of the completion gate.

### 6.3 `deferred_by_accepted_decision` Validation

A verification record whose `skip_reason_code` is `deferred_by_accepted_decision` must reference a `decision_record` node kind. The reference is invalid unless all of the following hold.

```txt
decision_ref is valid only when:
  - target.kind == decision_record
  - decision_record.status == accepted
  - decision_record.scope covers the skipped check
  - decision_record.accepted_by is present
  - decision_record.accepted_at is present
  - decision_record is not expired when expires_at is present
```

A `transform_receipt` may appear in `evidence_artifact_refs` for additional context, but the primary `decision_ref` must point at a `decision_record` node, not at a `transform_receipt`.

A `deferred_by_accepted_decision` skip with an invalid `decision_ref` is treated as `not-run` for the purpose of the completion gate. The record itself remains as evidence; only its effect on the gate is degraded.

A `deferred_by_accepted_decision` skip with a valid `decision_ref` is acceptable for a required check and routes the run to `completed_dirty` at most, never `completed_clean`.

## 7. Hard-Block Definition

`hard_block` is a boolean derived from gate state. It is the union of seven conditions.

```txt
hard_block is true iff any of:
  - any required check status == failed
  - any required check status in (not-run, unknown)
  - required_unavailable_blocking is true
  - any active policy_decision.severity == block
  - task precondition is unmet
  - required artifact or evidence is missing
  - adapter result violates ADAPTER_CONTRACT.md §5
```

`required_unavailable_blocking` is true when a required check has `status=unavailable`, has a valid `unavailable_reason_code`, and its check declaration sets `unavailable_effect=blocked`. Otherwise, `unavailable` is not, by itself, `hard_block`. A required check in `unavailable` state with a valid `unavailable_reason_code` and default `unavailable_effect=dirty` routes to `completed_dirty`, not `run_blocked_terminal`. This rule prevents runner, tool, or environment unavailability from silently blocking work unless the check declaration explicitly opted into terminal blocking.

An optional unavailable check does not contribute to `hard_block` and does not dirty the run's required verification state. It is reported as an optional warning.

`failed` is `hard_block` only if the failed check is `required=true` or `blocking=true`. An optional, non-blocking failed check does not contribute to `hard_block`; it is reported as a warning.

A `policy_decision` with `severity=block` and `active=true` is the governance contribution to `hard_block`. The minimum `policy_decision` shape is defined in `contract.md` §5.5.

## 8. Completion Truth Table

This truth table is the only authority on completion state. Lifecycle consequence (the emitted event) is defined in `contract.md` §16.1.

```txt
all_required_passed | all_required_resolved | any_required_skipped_or_unavailable | required_unavailable_blocking | hard_block | prior_state | user_force_close | consequence
true                | true                  | false                               | false                         | false      | any         | false            | completed_clean
false               | true                  | true                                | false                         | false      | any         | false            | completed_dirty
any                 | any                   | any                                 | true                          | true       | any         | false            | run_blocked_terminal
any                 | any                   | any                                 | any                           | true       | any         | false            | run_blocked_terminal
any                 | any                   | any                                 | any                           | any        | run_blocked_terminal | true      | forced_closed
```

Normative definitions for the boolean columns:

```txt
all_required_passed =
  every required check has status == passed

all_required_resolved =
  every required check has status in {passed,
                                       skipped with valid skip_reason_code,
                                       unavailable with valid unavailable_reason_code}

any_required_skipped_or_unavailable =
  any required check has status in {skipped, unavailable}
  AND the record carries the corresponding valid reason_code

hard_block = the union of seven conditions in §7

required_unavailable_blocking =
  any required check has status == unavailable
  AND carries a valid unavailable_reason_code
  AND the check declaration has unavailable_effect == blocked

prior_state = the run's lifecycle state at the moment the gate evaluates
              (resumed, blocked_waiting, run_blocked_terminal)

user_force_close = an explicit user action that targets force-close
```

The four consequences are mutually exclusive. A run may be in exactly one terminal closure state. The combination `(all_required_passed=true, any_required_skipped_or_unavailable=true)` is impossible and is rejected by the gate (the truth table has no row for it).

A run with one required check in `skipped-with-reason` state and all other required checks in `passed` state is `completed_dirty`, never `completed_clean`. A run with one required check in `unavailable-with-reason` state and default `unavailable_effect=dirty` is also `completed_dirty`. The clean/dirty boundary is exclusive; a `skipped-with-reason` or non-blocking `unavailable-with-reason` required check disqualifies the run from clean completion.

`completed_dirty` is not success. `completed_dirty` means the run is `terminal_non_success_reviewable` per `contract.md` §16.1: terminal, honest, and reviewable, but not a success state.

`completed_clean` is the only `terminal_success` state. The other three closure states (`completed_dirty`, `run_blocked_terminal`, `forced_closed`) are non-success variants and must be presented to the HPO as such per `HPO_STATE_MODEL.md` §2 and §4.

A run that emits `run_completed_clean` while any required check is in `skipped-with-reason` or `unavailable-with-reason` state is invalid.

A run that emits `run_completed_dirty` while no required check is in `skipped-with-reason` or `unavailable-with-reason` state and while no hard-block is present is invalid; the correct consequence is `completed_clean`.

A run that emits any `run_completed_*` event while in `run_blocked_terminal` or `blocked_waiting` state is invalid.

A run that emits `run_forced_closed` while not in `run_blocked_terminal` state is invalid. A `blocked_waiting` run may not be force-closed; it must first transition to `run_blocked_terminal` via gate evaluation, and force-close is then permitted from that state.

## 9. Acceptance and Promotion

A verification record becomes durable evidence only when both conditions are met:

1. The record is committed at `durable_path` outside `.atelier/`.
2. An `artifact_accepted` event is emitted for the record with the same `correlation_id`.

Before both conditions hold, the record is `verification_record_candidate` and is derived state under `.atelier/`. The first condition emits a `verification_recorded` event per `contract.md` §12.2. The second condition emits the `artifact_accepted` event per `EVENT_MODEL.md` §5 with `correlation_id` matching the commit. The pair, linked by `correlation_id`, is the promotion path.

A file write alone is not an acceptance event. An `artifact_accepted` event without a matching `durable_path` write is not durable evidence. Either alone leaves the record as derived state.

After both conditions hold, the record is part of product truth and survives `.atelier/` deletion per `GRAPH_SEMANTICS.md` §11.

## v5 Revision Notes

- Introduced in v5.
- Defines the verification subsystem schema in detail. Previously these rules were scattered across `contract.md` §16 without full schemas or controlled reason codes.
- Owns the status lattice, reason codes, hard-block definition, and completion truth table. Lifecycle consequence remains in `contract.md` §16.1.
- Adds the `decision_ref` validation rule for `deferred_by_accepted_decision`.
- Adds the explicit `completed_dirty` guardrail: "completed_dirty is not success."
- Splits reason codes into `skip_reason_code` (decision) and `unavailable_reason_code` (execution constraint). Previously the pack conflated them.
- Adds the required verification map derivation rule. Previously the source of required checks was undefined.
- Adds the verification record schema as a normative contract. Previously it appeared only in ad hoc YAML in `EXAMPLES.md`.

## v5.1 Revision Notes

- §8 truth table rewritten with explicit boolean columns: `all_required_passed`, `all_required_resolved`, `any_required_skipped_or_unavailable`, `hard_block`, `prior_state`, `user_force_close`. The previous "all passed + any required skipped|unavail" rows that combined inconsistent columns are removed. The combination `(all_required_passed=true, any_required_skipped_or_unavailable=true)` is now explicitly impossible and rejected by the gate. The truth table now emits `run_blocked_terminal` (not the legacy `blocked`) for the hard-block case, and `forced_closed` requires `prior_state: run_blocked_terminal`.
- §2 check registry schema adds the optional `unavailable_effect: enum[dirty | blocked]` field. Default is `dirty`. For `required=true` checks, the field is explicitly recommended: implementers should declare intent rather than rely on the default, because a default of `dirty` may hide a real tool failure from a critical required check.
- §3 derivation formula marks the policy registry term as a Phase C placeholder. The v5.1 derivation ships with `task_acceptance_criteria` and `check_registry.bindings` only; the policy registry term contributes zero entries in v5.1. The marker matches the Phase C marker added in `contract.md` §5.5.
- §4 record durability rule rewritten: durable evidence requires BOTH the `durable_path` commit AND the matching `artifact_accepted` event with the same `correlation_id`. A file write alone is not an acceptance event. The `accepts` graph edge (defined in `GRAPH_SEMANTICS.md` §6.1) is the structural record; the `artifact_accepted` event is the durable record.
- §9 acceptance and promotion section rewritten to match the two-condition rule above.
- Cross-references updated: `EVENT_MODEL.md` §5, §6 for the matching event/enum rules; `contract.md` §12.1, §16.1 for the matching lifecycle states; `HPO_STATE_MODEL.md` §2, §4 for the matching state set.
