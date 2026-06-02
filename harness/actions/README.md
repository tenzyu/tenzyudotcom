# Actions

Actions define how work moves through the harness.

Start here:

- `workflows/README.md` — choose a callable workflow.
- `parts/phases/` — lifecycle phase modules used by workflows.
- `parts/roles/` — reusable perspectives used by workflows.
- `parts/artifacts/templates/` — output shapes for run records.

## Directory contract

```txt
workflows/ = directly callable workflow entrypoints
parts/     = reusable building blocks
```

Do not add one-off procedures directly under `actions/`.

If humans or agents should call it directly, place it under `workflows/`.
If workflows reuse it, place it under `parts/`.

## Role rule

A role is kept only when it is a reusable perspective.

If a role exists only to execute one phase, inline that responsibility into the phase file.

```txt
phase = step in the work lifecycle
role  = reusable perspective or ownership boundary
```
