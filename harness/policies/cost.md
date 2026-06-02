# Cost Policy

AI cost is controlled mainly by avoiding unnecessary context and duplicate work.

## Rules

- Load context progressively.
- Start with the task brief, repo map, and relevant role or workflow.
- Use indexes before loading whole directories.
- Do not load all task history by default.
- Do not paste large source files into durable docs.
- Record investigation results in handoff so future agents do not repeat the same scan.
- Promote only recurring, verified knowledge into stable memory.

## Model and Agent Use

- Use specialized roles for bounded work.
- Do not ask one agent to carry unrelated contexts.
- Use independent review for high-risk changes where possible.
- Use cheaper or smaller models only when the task is low-risk and well-scoped.
- Use stronger models for architecture, broad refactors, ambiguous failures, and final review of risky changes.

## Duplicate Research

Before broad investigation:

1. Check `memory/index.md`.
2. Check `memory/repo-map.md`.
3. Check relevant task handoffs.
4. Search the current tree for exact files or symbols.

If a repeated failed path is discovered, record it as a lesson only when it will
save future work.
