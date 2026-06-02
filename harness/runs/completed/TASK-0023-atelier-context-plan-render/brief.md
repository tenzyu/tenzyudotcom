# Brief: TASK-0023 Atelier Context Plan/Render Split

## Intent

Rename the ambiguous context preview flow into explicit context planning and rendering operations.

## Scope

- Replace `atelier context preview` with `atelier context plan`.
- Add `atelier context render` to print the actual agent-readable `context.md` body without creating a run.
- Keep `atelier run init` as the operation that materializes rendered context and manifest files under `harness/runs/active/<RUN-ID>/`.
- Remove compatibility aliases for the old preview name.

## Non-goals

- Do not add a GUI.
- Do not add MCP tools in this task.
- Do not change knowledge promotion semantics.
