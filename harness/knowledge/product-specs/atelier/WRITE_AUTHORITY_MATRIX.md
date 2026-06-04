---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-write-authority-matrix
title: Atelier Write Authority Matrix
status: active
pattern: simple
tags:
  - product:atelier
  - subject:write-authority
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - test-source
---

# Atelier Write Authority Matrix

## 1. Scope and Authority

This document defines which actors and surfaces may write, export, accept, reject, or promote each artifact class.

It is intentionally narrow. It does not add a policy engine, GUI workflow, runtime adapter, swarm feature, or transformation feature. It only removes ambiguity from existing artifact classes.

Authority: `GRAPH_SEMANTICS.md` owns artifact classes. `EVENT_MODEL.md` owns event shapes. `RUN_PACKET_MODEL.md` owns packet and handoff durability. This document owns write authority across those classes.

## 2. Actors

```txt
human_actor
  A repository-authorized human operating through review, commit, or explicit
  Atelier command.

contract_command
  A documented Atelier surface in SURFACES.md that writes only the artifact
  class it declares.

runtime_adapter
  Adapter described by ADAPTER_CONTRACT.md. It may produce candidates and
  observations, but it may not accept durable evidence implicitly.

validator
  Check, linter, test, or policy decision producer. It may produce evidence
  records, but it may not promote its own output to accepted durable evidence.

context_planner
  Read-only attention planner. It may write derived caches only when the
  surface contract allows it. It may not write source artifacts.
```

## 3. Authority Matrix

```txt
artifact class                 may create                         may promote or accept
source_artifact                human_actor, external repository   human_actor only
accepted_durable_evidence      human_actor, contract_command      human_actor or explicit contract_command
derived_state                  contract_command, runtime_adapter, context_planner   not applicable
working_run_packet             contract_command                   not applicable
working_handoff                contract_command, runtime_adapter  not applicable
exported_packet                contract_command                   human_actor or explicit contract_command
exported_handoff               contract_command                   human_actor or explicit contract_command
accepted_handoff               human_actor, explicit contract_command   human_actor or explicit contract_command
terminal_verification_summary  explicit contract_command          human_actor or explicit contract_command
verification_record_candidate  runtime_adapter, validator         human_actor or explicit contract_command
accepted_verification_record   human_actor, explicit contract_command   human_actor or explicit contract_command
transform_candidate            contract_command                   human_actor or explicit contract_command
proposed_artifact              contract_command                   human_actor or explicit contract_command
debug_trace                    runtime_adapter, contract_command  human_actor or explicit contract_command if promoted
```

## 4. Forbidden Writes

```txt
- context_planner must not create tasks, runs, source artifacts, or accepted durable evidence.
- runtime_adapter must not rewrite source artifacts.
- runtime_adapter must not accept or promote verification records, handoffs, traces, or diffs implicitly.
- validator must not accept its own evidence.
- derived_state under .atelier/ must not be the only copy of product truth.
- working handoff under .atelier/runs/** must not be treated as accepted durable evidence.
- export must not imply acceptance.
```

## 5. Acceptance Requirements

Any promotion to accepted durable evidence requires:

1. destination outside `.atelier/`;
2. actor identity;
3. timestamp;
4. evidence refs;
5. scope;
6. correlation id linking the write and the acceptance event or command result.

If any requirement is missing, the artifact remains a candidate or derived state.

## 6. Test Hooks

The matrix is verified by `write_authority_matrix_fixture`. Until that concrete fixture exists, `CONTRACT_TEST_MATRIX.md` must not claim full write-authority enforcement.
