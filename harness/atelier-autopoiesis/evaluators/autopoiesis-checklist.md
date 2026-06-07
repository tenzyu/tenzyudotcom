# Autopoiesis Evaluator Checklist

Use this as a manual/static supplement to `EVALUATION-SPEC.md`.

## Hard fail if absent

```txt
[ ] lifecycle state model
[ ] promotion policy/gate
[ ] authority precedence/scope model
[ ] conflict records or conflict report
[ ] stale/supersede/invalidate records
[ ] runtime query surface for agents
[ ] task-local control packet generator
[ ] control packet validator
[ ] materialization proposal/gate
[ ] evaluator findings schema
[ ] findings-to-work-order compiler or equivalent
[ ] negative controls for false authority/promotion/materialization/stale cases
```

## Hard fail if bypassable

```txt
[ ] LLM output direct-to-accepted
[ ] generated view as truth
[ ] handoff as authority
[ ] stale anchor satisfying active relation
[ ] packet with overlapping allowed/forbidden scope
[ ] unrelated evidence satisfying test contract
[ ] validator weakening hides a defect
[ ] missing required checks still allows completion
```

## Evidence required for pass

For each C1-C8 capability, record:

```txt
implementation paths:
validator paths:
command/API paths:
test/fixture paths:
commands run:
negative controls:
remaining warnings:
```
