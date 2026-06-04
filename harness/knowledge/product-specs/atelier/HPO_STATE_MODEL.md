---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-hpo-state-model
title: Atelier HPO State Model
status: active
pattern: simple
tags:
  - product:atelier
  - subject:hpo-state-model
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - test-source
---

# Atelier HPO State Model

## 1. Scope and Authority

This document is the normative schema for the Human Product Owner (HPO) state projection.

It owns:

- HPO state labels;
- required evidence per state;
- forbidden UI claims per state;
- allowed human actions per state.

`Ideal.md` defines why the HPO surface exists. `contract.md` §5.10 names the surface and points at this document. `POSITIONING.md` §6 and `ROADMAP.md` Phase 4 reference the state set. This document defines what a state **means** in terms of evidence, what the UI **must not** claim, and what a human **may** do.

Authority: under the four-class conflict resolution in `contract.md` §2, this document is the `schema_subcontract` owner of the HPO state domain. Conflicts on the listed owned domains are resolved in favor of this document.

This document is intentionally narrow. It does not design the HPO surface's visual layout, command set, or routing. It defines only the state semantics that the surface must respect.

## 2. State Set

The HPO state set is closed. Implementations must not introduce new state labels without a contract revision.

```txt
verified
  All required checks for the displayed task resolved to passed. No
  hard-block condition is present. The run is in completed_clean or
  the displayed artifact is in accepted_durable_evidence.

unverified
  Required checks are missing, unresolved, or absent from the
  displayed evidence set. The run is not in completed_clean.

dirty
  The run is in completed_dirty. The state is honest: at least one
  required check was skipped-with-reason or unavailable-with-reason.

blocked_waiting
  A hard-block condition is present but the run is non-terminal.
  The run is awaiting resolution (for example, a human reviewer
  is unblocking the dependency, or the gate has not yet evaluated
  to terminal). The UI must distinguish this from blocked_terminal
  because blocked_waiting runs can resume via run_unblocked. The
  UI must not assert that the work is done, that verification
  passed, or that the run is ready to merge.

blocked_terminal
  A hard-block condition is present and the gate has evaluated
  to terminal. The run is terminal at this state. No
  `run_completed_*` event is emitted. The UI must surface the
  blocking reason and the option to force-close. The UI must
  not assert that the work is done, that verification passed,
  or that the run is ready to merge.

blocked
  Reserved legacy label. New code must emit either
  `blocked_waiting` or `blocked_terminal`; readers may tolerate
  historical `blocked` records for migration. A `blocked` record
  is interpreted as `blocked_terminal` for backward compatibility
  if its `terminal: true` field is set, or as `blocked_waiting`
  otherwise. New HPO displays must not use the bare `blocked`
  label.

stale
  At least one displayed artifact is stale per GRAPH_SEMANTICS.md §10.
  The stale_reason must be reported.

proposed
  At least one displayed artifact is a transform proposal (maturity
  Level 2 or Level 3) and is not yet accepted.

accepted
  At least one displayed artifact has crossed an acceptance event
  and is durable evidence. The accepting actor and acceptance_at
  must be reported.

forced_closed
  The displayed run has emitted a run_forced_closed event. The HPO
  state is not success. The UI must report the force-close reason and
  the prior blocked_terminal state.
```

A displayed entity may carry more than one state. The set above is the union of applicable states; the UI must display every applicable state, not just the most prominent.

## 3. State Evidence Table

Each state has a required evidence set. The evidence set is the minimum that must be displayable to the HPO.

```txt
state             required evidence (minimum)
verified          - verification records for every required check
                  - run_completed_clean event (or accepted durable receipt)
                  - graph_hash at completion time

unverified        - last verification_map snapshot
                  - missing or unresolved required check ids
                  - last run state

dirty             - run_completed_dirty event
                  - skipped-with-reason or unavailable-with-reason check ids
                  - reason_code per dirty check

blocked_waiting   - run_blocked_waiting event
                  - hard_block source (failed check id, policy_decision id,
                    missing precondition, missing evidence, adapter violation)
                  - blocking reason in human-readable form
                  - unblocking path and expected resolution

blocked_terminal  - run_blocked_terminal event
                  - hard_block source (failed check id, policy_decision id,
                    missing precondition, missing evidence, adapter violation)
                  - blocking reason in human-readable form
                  - prior_state=blocked_waiting when applicable
                  - option to force-close

stale             - stale_reason for each stale artifact
                  - last_accepted_at timestamp
                  - upstream source artifact whose hash changed

proposed          - transform_candidate or proposed_artifact reference
                  - source artifact id and source section
                  - maturity level

accepted          - artifact_accepted event
                  - accepted_by actor
                  - accepted_at timestamp
                  - scope
                  - expires_at when present
                  - durable_location of the receipt

forced_closed     - run_forced_closed event
                  - forced_by actor
                  - forced_at timestamp
                  - prior_state (must be blocked_terminal)
                  - reason
```

A state that is displayed without its required evidence is invalid. The UI may not assert a state whose evidence set is not fully present.

## 4. Forbidden UI Claims

The UI must not make claims that contradict the evidence set.

```txt
verified state UI must not claim:
  - "all checks passed" when any required check is not in passed
  - "the work is done" for a run in completed_dirty or blocked or forced_closed
  - "verification happened" when no verification record is present
  - "no drift" when GRAPH_SEMANTICS.md §10 reports stale nodes

dirty state UI must not claim:
  - "the work is done"
  - "verification passed"
  - "ready to merge" without an explicit human override

blocked state UI must not claim:
  - "verification passed"
  - "ready to merge"
  - any success language

blocked_waiting and blocked_terminal both inherit the blocked
forbidden-claim set. Additionally, blocked_waiting must not
claim that the run is closed; the run is still resumable.

stale state UI must not claim:
  - "the artifact is current"
  - "the documentation is up to date"
  - any currency claim that contradicts stale_reason

proposed state UI must not claim:
  - "the check is enforced"
  - "the policy is in effect"
  - "the artifact is part of the contract"

accepted state UI must not claim:
  - "the proposal is still a proposal"
  - "the receipt is under review" once artifact_accepted is recorded

forced_closed state UI must not claim:
  - "the work is done"
  - "verification passed"
  - "the run completed cleanly"
  - any success language; forced_closed is not a success state
```

The forbidden claims are normative. The UI must avoid them by structure, not by tone. A surface that does not assert the claim at all is preferred to a surface that asserts the claim with a disclaimer.

## 5. Allowed Human Actions

A human may take actions only when those actions are allowed by the current state. The allowed action set is the minimum that the UI must expose; the UI may add additional guardrails.

```txt
state             allowed human actions (minimum set)
verified          - close the task
                  - archive the run
                  - generate a summary report

unverified        - request a verification record
                  - re-run a check
                  - inspect the missing evidence

dirty             - review the dirty_reasons
                  - request a re-run of the skipped or unavailable check
                  - accept the dirty completion explicitly (acceptance event recorded)
                  - do not claim success

blocked_waiting   - inspect the blocking reason
                  - retry after the blocking condition is resolved
                  - mark the unresolved dependency as `blocked_terminal`
                    when the gate evaluates hard_block=true

blocked_terminal   - inspect the blocking reason
                  - force-close the run (emits run_forced_closed,
                    never run_completed_*)

stale             - re-derive the stale artifact
                  - retire the stale artifact
                  - inspect upstream changes

proposed          - accept the proposal (emits artifact_accepted)
                  - reject the proposal (emits artifact_rejected)
                  - request a revision

accepted          - revoke the acceptance (requires higher authority)
                  - supersede the artifact
                  - reference the receipt in a downstream task

forced_closed     - inspect the force-close reason
                  - request a new run from the same task
                  - mark the run as superseded
```

A human action not in the allowed set for the current state is invalid. The UI must surface the action only when the state permits it, or it must surface the state required to permit the action.

## 6. State Transitions

State transitions are derived from event payloads and verification record updates, not from UI clicks. The UI does not transition state; it reflects the state derived from durable events and durable evidence.

```txt
unverified  -> verified    when verification record for every required check
                            is committed durably with status=passed and no
                            hard-block is present

unverified  -> dirty       when at least one required check is committed
                            with status=skipped-with-reason or
                            unavailable-with-reason and no hard-block

unverified  -> blocked_waiting  when a non-terminal hard-block condition is
                                 observed (the run is still resumable)

unverified/blocked_waiting -> blocked_terminal  when the gate evaluates
                                 hard_block=true on a non-resumable run

blocked_waiting -> unverified  when run_unblocked is emitted with a
                                 valid resolution (the run resumes)

verified    -> stale       when a displayed artifact becomes stale per
                            GRAPH_SEMANTICS.md §10

verified    -> unverified  when a required verification record is revoked
                            or when a previously passing check is found
                            to be missing evidence

any         -> proposed    when a new transform_candidate or proposed_artifact
                            becomes visible to the HPO

proposed    -> accepted    when an artifact_accepted event is recorded

any         -> forced_closed when a run_forced_closed event is recorded
                            for the displayed run
```

The UI must not transition a state directly. State transitions are observed facts, not commands.

## 7. Uncertainty Display

When evidence is partial or redacted, the UI must display the uncertainty, not hide it.

```txt
redacted field present   display: "field <name> is redacted; reason: <reason_code>"
synthetic replay event   display: "this view is reconstructed; not a live record"
durable event missing    display: "durable event expected but not found at <path>"
verification missing     display: "no verification record committed for this check"
```

Hiding uncertainty is forbidden. The UI must prefer explicit uncertainty to false certainty.

## v5 Revision Notes

- Introduced in v5.
- Defines the HPO state set, evidence table, forbidden claims, allowed actions, state transitions, and uncertainty display rules. Previously these were scattered across `Ideal.md`, `contract.md` §5.10, and `POSITIONING.md` §6 with no canonical schema.
- Adds the explicit "forced_closed is not a success state" rule.
- Adds the state evidence table that makes each state testable against its evidence set.
- Adds the forbidden UI claim list. Previously the rule "UI must not imply verification that does not exist" was vague.
- Adds the state transition rule: state is derived from events, not commanded by the UI.

## v5.1 Revision Notes

- §2 State Set split `blocked` into `blocked_waiting` (non-terminal; the run is still resumable via `run_unblocked`) and `blocked_terminal` (terminal; the run is closed at this state). The bare `blocked` label is reserved for legacy migration; new HPO displays must use one of the two new labels.
- §3 State Evidence Table: split the legacy `blocked` evidence row into `blocked_waiting` and `blocked_terminal`. Event names remain evidence; HPO examples must use HPO state labels.
- §4 Forbidden UI Claims: the `blocked` claim set is inherited by both `blocked_waiting` and `blocked_terminal`. `blocked_waiting` additionally must not claim that the run is closed; the run is still resumable.
- §5 Allowed Human Actions: split the `blocked` allowed-action row into two. `blocked_waiting` allows inspect, retry, and "mark unresolved as `blocked_terminal`" — but does NOT allow direct force-close. `blocked_terminal` allows inspect and force-close. The split matches `contract.md` §12.1: a `blocked_waiting` run cannot transition to `forced_closed` directly.
- §6 State Transitions: added the `unverified -> blocked_waiting` and `blocked_waiting -> blocked_terminal` transitions. Added the `blocked_waiting -> unverified` transition (when `run_unblocked` is emitted with a valid resolution).
- Cross-references updated: `contract.md` §12.1, §12.2, §16.1 for the matching lifecycle; `EVENT_MODEL.md` §3, §4.2 for the matching closed event enum; `VERIFICATION_SCHEMA.md` §8 for the matching truth table.
