# atelier-transformer

`md-to-code` transform layer for Atelier v0.

## Responsibility

```txt
Atelier Object Graph
  ↓
md-to-code transform
  ↓
ImplementationTask / TestContract / EditBoundary / PacketTemplate
  ↓
TransformRecommendation
```

The transformer does **not** write product code, does not run tests, and
does not create evidence. It only derives transform records from the
object graph and writes them to `.atelier/v0/transforms/md-to-code/**`.

The transformer is where `implementation-control` becomes a transform
output, not the root concept. The output is consumed by the executor.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run transform -- --target md-to-code` | Run the md-to-code transform |
| `bun run task:derive -- --attention <id>` | Derive a single `ImplementationTask` |
| `bun run test-contract:derive -- --task <id>` | Derive a `TestContract` from a task |
| `bun run packet:template -- --task <id>` | Build a `PacketTemplate` from a task |
| `bun run recommend` | Emit `TransformRecommendation` records |
| `bun run render` | Render transform views |
| `bun run validate` | Validate transform outputs |

## Output

```txt
.atelier/v0/transforms/md-to-code/model/implementation-tasks.ndjson
.atelier/v0/transforms/md-to-code/model/test-contracts.ndjson
.atelier/v0/transforms/md-to-code/model/edit-boundaries.ndjson
.atelier/v0/transforms/md-to-code/model/packet-templates.ndjson
.atelier/v0/transforms/md-to-code/model/recommendations.ndjson
.atelier/v0/transforms/md-to-code/packets/
.atelier/v0/transforms/md-to-code/views/IMPLEMENTATION_TASKS.md
.atelier/v0/transforms/md-to-code/views/TEST_CONTRACTS.md
.atelier/v0/transforms/md-to-code/views/TRANSFORM_RECOMMENDATIONS.md
```

## Non-goals

- Writing product code
- Creating evidence
- Treating transform views as truth
- Editing source/knowledge objects except through accepted transform records
