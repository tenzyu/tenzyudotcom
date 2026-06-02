# Decision Policy

This policy separates human decisions from agent decisions.

## Human-Owned Decisions

Escalate to the human owner for:

- product direction, priority, or scope tradeoffs
- accepting or rejecting visible product behavior
- changing constraints or non-goals
- deleting features or data
- introducing major new dependencies
- changing public package APIs without an existing task approval
- choosing between materially different architecture options

## Agent-Owned Decisions

Agents may decide:

- which files to inspect first
- how to decompose a vague request into a proposed task
- narrow implementation details inside approved scope
- which relevant validation commands to run
- what durable memory updates to propose
- when a task is blocked by missing information

## Decision Records

Use an ADR or task plan when a decision affects architecture, package
boundaries, validation strategy, public APIs, or repeated future work.

Use a task `worklog.md` entry for local discoveries that matter only to the
current task.

Use memory files only for knowledge that is likely to recur.

## Escalation

When uncertain, agents should state:

- the decision needed
- the known facts
- the options
- the tradeoff
- the recommended option, if one is justified
