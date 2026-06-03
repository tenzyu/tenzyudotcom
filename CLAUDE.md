# CLAUDE.md

Use Atelier before manually discovering harness context.

For non-trivial work:

```bash
atelier run init --workflow workflow.isolated-run --role role.core.implementer --path . --intent "<request>"
```

Then read the generated `context.md` and follow it.

Before claiming completion:

```bash
atelier run close <RUN-ID>
```

Canonical adapter details live in `harness/adapters/root/CLAUDE.md`.
