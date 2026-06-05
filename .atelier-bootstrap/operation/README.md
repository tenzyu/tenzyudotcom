# atelier-operation

End-to-end operational verification for Atelier v0.

The operation tool does not introduce new object kinds. It runs the
`validate` commands of every component and aggregates their results
into a single `atelier.operational-review/v1` report.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run ready` | Run every component's `validate` and aggregate |
| `bun run verify` | End-to-end verification: scan -> index -> reader -> transformer -> executor |
| `bun run render` | Re-render every view |

## Output

The `ready` command writes:

```txt
.atelier/v0/operation/ready.json
```

with the `atelier.operational-review/v1` shape. The contract is described
in `harness/atelier-design-docs/atelier-operation/contract.md`.
