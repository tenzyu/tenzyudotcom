# Capability Contract

This contract is what agents must implement, evaluate, and preserve. It intentionally exceeds the older Relation Kernel target.

## Product invariant

Atelier must not merely know about repository artifacts. Atelier must control how artifacts become actionable for agents.

```txt
artifact text
  -> semantic node
  -> lifecycle state
  -> authority scope
  -> typed relation
  -> queryable operational state
  -> task-local control packet
  -> materialization proposal
  -> verified/evidenced state transition
```

If any arrow is absent, the product is not yet the mission.

## Canonical record fields

Every control-plane record class must either contain or deterministically derive:

```txt
id
schema/kind/version
lifecycle_state
provenance_kind
confidence/source_kind
authority_scope
source_anchors/evidence_anchors
owner_or_policy
valid_from / invalidated_by / superseded_by when applicable
produced_by
created_at
```

## Lifecycle states

Use these exact states or a documented equivalent mapping:

```txt
observed
inferred
proposed
accepted
verified
superseded
rejected
archived
quarantined
invalidated
```

## Authority classes

At minimum:

```txt
product_spec
adr
runtime_evidence
test_contract
current_implementation
review_finding
permission_rule
risk_policy
handoff
llm_proposal
generated_view
```

Required precedence properties:

- generated view has no authority;
- handoff transports authority but does not create it;
- llm proposal has no accepted authority before promotion;
- accepted ADR/spec/test/evidence outrank stale or proposed records inside their scopes;
- current implementation can describe actual behavior but does not automatically satisfy intended behavior;
- conflict must be exposed when scopes overlap and authority cannot choose cleanly.

## Runtime query surface

The implementation must expose queryable state for agents. CLI names may differ, but evaluator must find equivalents for:

```txt
atelier query active-requirements --task/--scope
atelier query accepted-decisions --task/--scope
atelier query required-checks --task/--scope
atelier query permissions --task/--scope
atelier query open-findings --task/--scope
atelier query stale --task/--scope
atelier query conflicts --task/--scope
atelier query evidence --task/--scope
atelier task recommend
atelier packet create
atelier packet validate
atelier authority resolve
atelier materialize validate
atelier evaluate
```

## Self-improvement invariant

The repository must be able to turn evaluator defects into implementable control packets without the user translating the mission into tickets.

```txt
evaluator defect -> work order -> packet -> patch -> validation -> decision/evidence -> next evaluator result
```
