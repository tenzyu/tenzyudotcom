# atelier-indexer

Deterministic zero-token / low-token repository indexer for Atelier v0.

## Responsibility

```txt
file tree
  ↓
sha256 + byte size + extension histogram
  ↓
SourceUnit / SourceFact / SourceEdge NDJSON
  ↓
indexes (by-path, by-kind, by-hash, by-object, stale)
  ↓
generated views (INDEX_SUMMARY, SOURCE_UNITS, AFFECTED)
```

The indexer must not call LLMs. It does not classify meaning. It only
records what the filesystem, package manager, and git say.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run scan` | Walk the repo, build facts, write `.atelier/v0/facts/**` |
| `bun run index` | Build `SourceUnit` / `SourceFact` / `SourceEdge` NDJSON and indexes |
| `bun run affected` | Compare current snapshot to previous, mark stale, write `stale.json` |
| `bun run update` | Run `scan` then `index` then `affected` in order |
| `bun run render` | Generate `views/index/**` Markdown |
| `bun run validate` | Validate NDJSON, schema, hashes, references, and view freshness |

## Output

All output goes to `.atelier/v0/`:

```txt
.atelier/v0/facts/repo.json
.atelier/v0/facts/package.json
.atelier/v0/facts/scripts.json
.atelier/v0/facts/workspace.json
.atelier/v0/facts/git.json
.atelier/v0/facts/files.ndjson
.atelier/v0/facts/extensions.json
.atelier/v0/objects/source.ndjson
.atelier/v0/edges/edges.ndjson
.atelier/v0/indexes/by-path.json
.atelier/v0/indexes/by-kind.json
.atelier/v0/indexes/by-hash.json
.atelier/v0/indexes/by-object.json
.atelier/v0/indexes/stale.json
.atelier/v0/views/index/INDEX_SUMMARY.md
.atelier/v0/views/index/SOURCE_UNITS.md
.atelier/v0/views/index/AFFECTED.md
```

## Non-goals

- LLM calls
- semantic classification
- implementation tasks
- editing source files
- editing product specs
