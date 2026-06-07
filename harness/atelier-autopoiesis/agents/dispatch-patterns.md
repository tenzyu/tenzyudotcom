# Dispatch Patterns

The coordinator should use these patterns to reduce ambiguity.

## Capability compiler dispatch

```txt
@atelier-mission-compiler Read @harness/atelier-autopoiesis/MISSION.md and current repository. Produce a capability map for C1-C8, implementation roots, missing primitives, false-completion risks, and initial work orders. Do not edit files.
```

## Evaluator dispatch

```txt
@atelier-autopoiesis-evaluator Evaluate the current repository against @harness/atelier-autopoiesis/EVALUATION-SPEC.md. Run available commands. Return JSON first. Include concrete next_work_orders for every P0/P1 defect. Do not pass prose-only or relation-only implementations.
```

## Implementer dispatch

```txt
@atelier-runtime-implementer Execute this work order exactly: <JSON work order>. Implement code/tests/schemas/commands. Do not edit MISSION.md, EVALUATION-SPEC.md, AUTONOMY-CONTRACT.md, env files, or generated state by hand. Return JSON first.
```

## Contract synthesizer dispatch

```txt
@atelier-contract-synthesizer Execute this work order exactly: <JSON work order>. Add or update runtime contracts/types/schemas/validators/commands/tests so the missing control primitive is enforceable, not just named. Return JSON first.
```

## Red team dispatch

```txt
@atelier-redteam-reviewer Inspect the latest patch against @harness/atelier-autopoiesis/MISSION.md and @harness/atelier-autopoiesis/EVALUATION-SPEC.md. Try to prove false completion. Return JSON first.
```
