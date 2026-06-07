# Agent Input Matrix

This file assigns reading responsibility by agent role. The purpose is to stop every agent from rereading every
canonical document and repository surface.

`GOAL-ATELIER-AUTOPOIESIS.md` is canonical. Do not edit it. Do not make local copies with modified semantics.

## Coordinator

Reads:

```txt
MISSION.md
GOAL-ATELIER-AUTOPOIESIS.md
CAPABILITY-CONTRACT.md
EVALUATION-SPEC.md
AUTONOMY-CONTRACT.md
WORK-ORDER-COMPILER.md
TOKEN-ECONOMY-CONTRACT.md
TOKEN-FORECAST-SPEC.md
RESUME-CHECKPOINT-CONTRACT.md
AGENT-INPUT-MATRIX.md
```

Does not implement. Does not read broad generated state. Delegates state inspection to evaluator/compiler with compact reports.

## Mission compiler

Reads:

```txt
MISSION.md
CAPABILITY-CONTRACT.md
EVALUATION-SPEC.md
TOKEN-ECONOMY-CONTRACT.md
AGENT-INPUT-MATRIX.md
```

Inspects current repository using inventory and symbol slices. It must output a capability map and candidate work orders.
It must not load all `.atelier/v0/**`.

## Runtime implementer

Default reads:

```txt
IMPLEMENTER-EXECUTION-CONTRACT.md
SUBAGENT-EXECUTION-CONTRACT.md
TOKEN-ECONOMY-CONTRACT.md
<coordinator-provided work order>
```

The implementer does not reread `MISSION.md` or `GOAL-ATELIER-AUTOPOIESIS.md` by default. The coordinator must embed
mission/capability excerpts into the work order. If the work order is insufficient, the implementer returns `partial`
with `needs_context`, rather than broad-reading canonical documents.

## Contract synthesizer

Reads:

```txt
IMPLEMENTER-EXECUTION-CONTRACT.md
CAPABILITY-CONTRACT.md
SUBAGENT-EXECUTION-CONTRACT.md
TOKEN-ECONOMY-CONTRACT.md
<work order>
```

Used when the missing primitive is a schema, validator, command contract, lifecycle transition, or record format.

## Evaluator

Reads:

```txt
EVALUATION-SPEC.md
CAPABILITY-CONTRACT.md
TOKEN-ECONOMY-CONTRACT.md
TOKEN-FORECAST-SPEC.md
SUBAGENT-EXECUTION-CONTRACT.md
<implementation reports>
```

May read `MISSION.md` when judging mission drift. Must avoid broad state reads and return compact findings/work orders.

## Redteam reviewer

Reads:

```txt
REVIEWER-EXECUTION-CONTRACT.md
EVALUATION-SPEC.md
TOKEN-ECONOMY-CONTRACT.md
<patch summary or file slices>
```

Redteam should attack a claim or patch, not rediscover the entire mission.

## Token forecaster

Reads:

```txt
TOKEN-FORECAST-SPEC.md
TOKEN-ECONOMY-CONTRACT.md
SUBAGENT-EXECUTION-CONTRACT.md
current compact run checkpoint
file inventory / size table
```

It does not inspect source semantics except where needed to classify read surfaces.
