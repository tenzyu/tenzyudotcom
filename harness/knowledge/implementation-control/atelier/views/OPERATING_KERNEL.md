<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

# Operating Kernel

You are the implementation coordinator.

Do not read all product specs.
Do not read all implementation-control docs.
Do not dispatch implementation work from broad Markdown context.

Long-run loop:

```bash
bun run resume
bun run frontier
bun run packet -- --dag <DAG-ID> --format md --out state/packets/generated/<id>.yaml
bun run validate:packet -- --packet state/packets/generated/<id>.yaml
bun run validate:tests -- --packet state/packets/generated/<id>.yaml
bun run validate:fixtures -- --summary
bun run render
bun run validate
```

Rules:
- Product specs are immutable.
- `canonical/**` and `state/**` are source of truth.
- `views/**` are generated and must not be edited directly.
- Dispatch only packet context plus `views/SUBAGENT_CONTRACT.md`.
- Validate packet-specific gates before global claims.
- Use fixture summary validation by default; run detailed fixture validation only when repairing fixture blockers.
- Record evidence and handoff state before moving frontier.
- Do not read broad docs unless audit mode explicitly requires it.
- If scripts and Markdown disagree, trust canonical records and fix rendered views.
- If Bun is unavailable, do not claim validation passed; report static inspection only.

Current index summary:
- DAG nodes: 13
- Product spec sections: 407
- Assertions: 64
- Gates: 48
- Fixtures: 45
- Frontier ready: 7
- Frontier blocked: 0
