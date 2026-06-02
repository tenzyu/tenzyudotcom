# Cost Policy

AI cost is controlled mainly by role-routed context, avoiding unnecessary knowledge loading, and preventing duplicate work.

## Rules

- Load context progressively.
- Start with the workflow registry, task brief, and assigned roles.
- Use role-required knowledge before broad search.
- Use indexes before loading whole directories.
- Do not load all run history by default.
- Do not paste large source files into durable docs.
- Record investigation results in handoff so future agents do not repeat the same scan.
- Promote only recurring, verified knowledge into stable knowledge.

## Model and agent use

- Use specialized roles for bounded work.
- Do not ask one agent to carry unrelated contexts.
- Use independent review for high-risk changes where possible.
- Use cheaper or smaller models only when the task is low-risk and well-scoped.
- Use stronger models for architecture, broad refactors, ambiguous failures, and final review of risky changes.

## Duplicate research

Before broad investigation:

1. Check assigned role files.
2. Check required knowledge listed by those roles.
3. Check `harness/knowledge/index.md`.
4. Check relevant recent handoffs only when the issue is recurring.
5. Search the current tree for exact files or symbols.

If a repeated failed path is discovered, record it as a lesson only when it will save future work.
