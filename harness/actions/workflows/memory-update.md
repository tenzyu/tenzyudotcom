# Workflow: Memory Update

Memory updates preserve durable knowledge after a task.

## Output

Update files under `harness/ai-org/memory/` only when the knowledge is durable.

## Promote Knowledge When It Is

- likely to recur
- useful across future tasks
- not obvious from source code
- verified or tied to a concrete task
- relevant to boundaries, workflows, pitfalls, or decisions

## Do Not Store

- raw command noise
- every intermediate thought
- duplicate snippets
- stale implementation details
- one-off preferences without future utility

## Common Destinations

- `memory/index.md` routes agents to the right file.
- `memory/repo-map.md` stores stable repository ownership and structure.
- `memory/known-problems.md` stores recurring environment or workflow problems.
- `memory/decisions/` stores durable design decisions.
- `memory/lessons/` stores repeated mistakes or failed approaches worth avoiding.
- `memory/component-notes/` stores stable component-specific notes.
