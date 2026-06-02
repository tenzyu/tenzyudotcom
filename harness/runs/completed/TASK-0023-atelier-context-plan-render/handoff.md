# Handoff: TASK-0023 Atelier Context Plan/Render Split

## Summary

The context command surface is now explicit:

- `atelier context plan` shows the deterministic selection plan.
- `atelier context render` prints the actual compiled `context.md` body.
- `atelier run init` persists the rendered context and manifest into a run.

The old preview command and Nx target were removed instead of kept as aliases.

## Suggested local validation

```bash
bun nx run atelier:check
bun nx run atelier:context-plan -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --mode compact
bun nx run atelier:context-render -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --mode compact
bun nx run atelier:context-render -- --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --mode linked
```

## Risk

Local Bun-based tests still need to be run by the repository owner because this sandbox cannot execute Bun.
