# Atelier Autopoiesis Control Pack

This directory is the OpenCode control surface for implementing Atelier as a self-improving semantic control plane.

Authoritative files:

```txt
MISSION.md
GOAL-ATELIER-AUTOPOIESIS.md
CAPABILITY-CONTRACT.md
EVALUATION-SPEC.md
AUTONOMY-CONTRACT.md
WORK-ORDER-COMPILER.md
FINDING-TAXONOMY.md
EXECUTION-PROTOCOL.md
TOKEN-ECONOMY-CONTRACT.md
TOKEN-FORECAST-SPEC.md
PACK-TOKEN-FORECAST.md
SUBAGENT-EXECUTION-CONTRACT.md
AGENT-INPUT-MATRIX.md
IMPLEMENTER-EXECUTION-CONTRACT.md
REVIEWER-EXECUTION-CONTRACT.md
RESUME-CHECKPOINT-CONTRACT.md
```

The intended invocation is:

```txt
/goal @atelier-autopoiesis-coordinator Execute @harness/atelier-autopoiesis/GOAL-ATELIER-AUTOPOIESIS.md against the current repository. Do not stop at analysis. Continue by dispatching implementation and evaluator agents until the evaluator returns pass or a true product-author decision is blocked.
```

This pack is designed to force the agent loop to produce implementation artifacts, evaluator findings, work orders, patches, checks, and review results rather than asking the user for decomposition.

## v2 token-control changes

This pack preserves canonical goal/mission authority while adding role-specific input contracts, resume checkpoints, and a mandatory token-forecast phase. It is intended to resume long-running work without discarding useful repository changes, while preventing uncontrolled transcript/state synchronization.
