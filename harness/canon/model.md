# Harness Model

## Core Equation

```text
Run = Task + Selected Knowledge + Policy + Action + Observation + Handoff
```

## Knowledge

Knowledge reduces repeated human input. It contains curated, durable context that future work should consult.

Examples: repo map, ADRs, product specs, design rules, known problems, lessons, component notes, tool facts, architecture contracts.

## Action

Action controls the lifecycle. It turns vague requests into bounded work.

Standard lifecycle:

```text
intake -> investigation -> plan -> implementation -> verification -> review -> handoff -> knowledge promotion
```

## Observation

Observation reduces repeated human review. It records commands, results, failures, skipped checks, changed files, risk, review findings, and handoff.

## Promotion Rule

Observation is not automatically Knowledge. Promote only durable, recurring, verified facts that reduce future work.
