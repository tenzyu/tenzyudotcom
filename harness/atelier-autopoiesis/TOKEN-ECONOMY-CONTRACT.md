# Token Economy Contract

This contract controls long-horizon Atelier Autopoiesis runs under MiniMax M3.
It is an execution constraint, not a product requirement. It must not be used to narrow
`MISSION.md` or `GOAL-ATELIER-AUTOPOIESIS.md`.

## Model assumption

The active model is MiniMax M3. Reasoning effort is not directly configurable from the
runner. Therefore agents must shape expected reasoning cost through prompt discipline:
small bounded tasks, compact JSON reports, single verification matrices, targeted reads,
and explicit stop rules.

Do not ask for unlimited thinking. Do not output long reflective prose unless it is being
converted into an executable artifact, evaluator finding, work order, or compact decision record.

## Global budget

The budget for a complete, high-quality convergence run is:

```txt
TOTAL_BUDGET_ALL_DIRECTIONS = 100,000,000 tokens
```

Accounting categories:

```txt
input          prompt + replayed conversation + tool results fed back to the model
cached_input   provider-reported cached input; still counts against context pressure
reasoning      hidden/internal reasoning tokens if the provider reports them, otherwise estimated
output         visible model output, reports, generated prose, JSON, code emitted by the model
tool_output    raw command/read output that becomes future input unless compressed
```

Default allocation:

```txt
input:      60M target, 70M hard ceiling
reasoning:  30M target, 40M hard ceiling
output:     10M target, 15M hard ceiling
```

If telemetry does not expose reasoning tokens, estimate reasoning using `TOKEN-FORECAST-SPEC.md`.

## Cycle budgets

A control cycle is one coordinator turn that dispatches one or more subagents and receives their reports.

```txt
controlled cycle: input <= 3M, reasoning <= 1M, output <= 350k
expected cycle:   input <= 6M, reasoning <= 2.5M, output <= 750k
hard breach:      input > 12M in one cycle OR output > 1.5M in one cycle
```

A hard breach does not mean the run is discarded. It means the coordinator must compact state,
write/resume from a checkpoint, and split the next work order.

## Broad-read prohibition

Agents must not broad-read generated state or archives. They may use inventory commands, line-limited
slices, and runtime query commands.

Forbidden by default:

```txt
.atelier/v0/edges/**
.atelier/v0/anchors/**
.atelier/v0/indexes/**
.atelier/v0/objects/source.ndjson
.atelier/v0/objects/facts.ndjson
node_modules/**
dist/**
build/**
coverage/**
.git/**
*.zip
*.tar
*.tar.gz
*.log
```

If one of these is needed, the agent must first create a compact query, `wc -c`/`wc -l` inventory,
or a generated summary under an allowed work directory. Never paste raw generated state into the conversation.

## Static/dynamic context split

Static context should stay small and stable:

```txt
role contract
work-order schema
capability id list
read policy
report schema
```

Dynamic context must be compressed before it is returned:

```txt
read output
test failure
git status
diff
command result
temporary reasoning
```

Subagents must return compact JSON reports, not raw logs, raw diffs, or copied files.

## Completion rule

Before the coordinator accepts a generated file set as final for a phase, and before `[goal:complete]`,
it must obtain a token forecast following `TOKEN-FORECAST-SPEC.md`.

A phase may continue only if one is true:

```txt
1. P80 total forecast remains under the remaining budget.
2. The evaluator declares the over-budget work unavoidable and the coordinator emits a smaller next work order.
3. A true product-author decision is required.
```
