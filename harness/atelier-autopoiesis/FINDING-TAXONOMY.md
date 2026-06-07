# Finding Taxonomy

Evaluator findings must be actionable. Each finding maps to capability id, severity, repair primitive, and proof.

## P0 families

```txt
AP-P0-C1-* artifact compiler absent/weak
AP-P0-C2-* lifecycle/promotion absent/bypassable
AP-P0-C3-* authority/conflict absent
AP-P0-C4-* graph/query runtime absent/weak
AP-P0-C5-* task-local control packet absent/weak
AP-P0-C6-* materialization gate absent/bypassable
AP-P0-C7-* stale/drift/supersede absent/weak
AP-P0-C8-* self-improvement loop absent/weak
```

## Repair primitives

```txt
schema_addition
validator_hardening
command_surface
query_runtime
packet_generator
authority_resolver
promotion_gate
materialization_gate
stale_detector
conflict_detector
work_order_compiler
evaluator_harness
negative_fixture
```

## Finding quality bar

A useful finding must name:

```txt
1. exact missing control primitive;
2. affected file/module or missing module;
3. why existing implementation does not satisfy the mission;
4. repair primitive;
5. proof required to close it;
6. whether user/product-author input is genuinely required.
```

Do not emit vague findings such as "needs more tests" or "improve graph". Convert them into control primitives.
