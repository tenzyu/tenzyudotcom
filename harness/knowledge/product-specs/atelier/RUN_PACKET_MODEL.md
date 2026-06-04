---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-run-packet-model
title: Atelier Run Packet Model
status: active
pattern: simple
tags:
  - product:atelier
  - subject:run-packet-model
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - test-source
---

# Atelier Run Packet Model

## 1. Scope and Authority

This document defines run packet and handoff durability. It owns the distinction between working packet state, exported packet state, source candidates, and accepted durable evidence.

It does not define new runtime adapters, orchestration behavior, GUI behavior, swarm behavior, or transformation features.

Authority: `contract.md` owns high-level behavior. `GRAPH_SEMANTICS.md` owns artifact classes. This document is the schema subcontract for run packet storage and promotion.

## 2. Packet Classes

```txt
working_run_packet
  Location: .atelier/runs/**
  Class: derived state
  Meaning: active run state, debug manifests, packet drafts, working handoff,
  resume prompt, and adapter-shaped packet drafts.
  Durability: regenerable; not product truth by itself.

working_handoff
  Location: .atelier/runs/**/handoff.md or equivalent run-local path
  Class: derived state
  Meaning: current handoff text used by an active or resumable run.
  Durability: may be lost with .atelier/ unless exported or accepted.

exported_packet
  Location: explicit --out path chosen by atelier run export
  Class: source candidate
  Meaning: a runtime-portable packet written for review or external transfer.
  Durability: repository-visible only if written outside .atelier/; not accepted
  durable evidence until accepted.

exported_handoff
  Location: explicit --out path outside .atelier/
  Class: source candidate
  Meaning: a handoff snapshot exported from the working run packet.
  Durability: reviewable source candidate; not accepted evidence by itself.

accepted_handoff
  Location: durable repository path outside .atelier/
  Class: accepted durable evidence
  Meaning: a handoff snapshot explicitly accepted by an actor or contract
  command and linked to the run/task it summarizes.
  Durability: survives .atelier/ deletion.

terminal_verification_summary
  Location: durable repository path outside .atelier/
  Class: accepted durable evidence
  Meaning: terminal summary of required verification records, lifecycle
  consequence, graph hash, and evidence refs for a closed run.
  Durability: survives .atelier/ deletion.

debug_trace
  Location: .atelier/traces/** or .atelier/runs/**/debug/**
  Class: derived state
  Meaning: detailed runtime, prompt, or adapter trace.
  Durability: not product truth unless explicitly promoted as accepted evidence.
```

## 3. Promotion Rules

Working packet material under `.atelier/runs/**` is derived. It must not be cited as the only durable proof that a run completed, blocked, or was force-closed.

Export writes a source candidate. Export does not imply acceptance.

Acceptance requires both:

1. a durable path outside `.atelier/`; and
2. an `artifact_accepted` event or equivalent contract command that records actor, time, scope, evidence refs, and correlation id.

After acceptance, the handoff or terminal summary is accepted durable evidence and is represented in the artifact graph as such.

## 4. Handoff Promotion Invariant

```txt
working handoff under .atelier/runs/** = derived
exported handoff outside .atelier/ = source candidate
accepted handoff outside .atelier/ = accepted durable evidence
terminal verification summary outside .atelier/ = accepted durable evidence
```

Adapters may produce handoff candidates. Adapters must not promote handoffs to accepted durable evidence implicitly.

## 5. Deletion Semantics

Deleting `.atelier/` may delete working packets, working handoffs, debug traces, adapter-shaped packet drafts, and transient resume prompts.

Deleting `.atelier/` must not delete exported handoffs outside `.atelier/`, accepted handoffs, terminal verification summaries, verification records, or acceptance receipts.

## 6. Test Hooks

The contract test matrix maps this document to:

- `run_packet_reading_order_fixture`;
- `atelier_deletion_regeneration_fixture`;
- `durable_acceptance_fixture`;
- `write_authority_matrix_fixture` once write-authority fixtures are implemented.
