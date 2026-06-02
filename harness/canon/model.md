# Harness Model

## Core equation

```text
Run = Task + Assigned Roles + Selected Knowledge + Policy + Action + Observation + Handoff
```

## Knowledge

Knowledge reduces repeated human input. It contains curated, durable context that future work should consult.

Examples: repo map, ADRs, product specs, design rules, known problems, lessons, component notes, tool facts, architecture contracts.

Knowledge should not be loaded globally. It should be selected through assigned roles.

## Role

Role routes context and responsibility.

```text
Role = scope + required knowledge + optional knowledge + allowed actions + outputs + review criteria
```

A role is not a persona. It is the unit that prevents the agent from searching all knowledge.

## Action

Action controls the lifecycle. It turns vague requests into bounded work.

Standard lifecycle:

```text
workflow selection -> role assignment -> knowledge loading -> intake -> investigation -> plan -> implementation -> verification -> review -> handoff -> knowledge promotion
```

## Observation

Observation reduces repeated human review. It records commands, results, failures, skipped checks, changed files, risk, review findings, and handoff.

## Promotion rule

Observation is not automatically Knowledge. Promote only durable, recurring, verified facts that reduce future work.
