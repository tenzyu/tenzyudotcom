# CLAUDE.md

Use Atelier context planning before broad manual harness discovery.

For non-trivial work:

```bash
atelier context plan --workflow workflow.isolated-run --role role.core.implementer --path . --intent "<request>"
```

Use the plan to choose relevant context, risks, and validation commands. External
LLM runners own task execution and edit the repository directly.

Before claiming completion:

```bash
bun nx run <project>:check
```

Canonical adapter details live in `harness/adapters/root/CLAUDE.md`.
