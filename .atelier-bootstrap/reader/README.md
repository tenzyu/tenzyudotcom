# atelier-reader

LLM-bounded reading layer for Atelier v0.

## Responsibility

```txt
indexer facts
  ↓
cheap semantic sampling (a handful of files)
  ↓
ProjectBrief (hypothesis-only)
  ↓
AttentionSet (task-scoped object selection)
  ↓
deep-read (only the selected objects)
  ↓
KnowledgeObject / SemanticClaim (LLM proposals accepted through schema)
```

The reader is the only place in Atelier v0 where LLM output is allowed.
The reader never writes product code, never produces runtime evidence,
and never claims full project understanding.

## LLM boundary

LLM usage is allowed for these jobs:

```txt
cheap-sample
attention
deep-read
gap-review
```

LLM output is **always** a JSONL of `ReaderProposal` records. Each line
is validated against the contract and accepted only when valid.

The bundled stub (`atelier-reader llm:jobs`) emits job envelopes; the
bundled accept command (`atelier-reader llm:accept`) validates a JSONL
file and writes accepted records to `.atelier/v0/objects/**`.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run sample` | Read a small representative set, write `briefs/project-brief.yaml` |
| `bun run brief` | Re-render the project brief view |
| `bun run attention -- --task "<task>"` | Assemble an `AttentionSet` for a task |
| `bun run deep-read -- --attention <id>` | Run deep-read proposals for an attention set |
| `bun run llm:jobs -- --kind cheap-sample|attention|deep-read|gap-review` | Emit a reader LLM job envelope |
| `bun run llm:accept -- --input <glob>` | Validate and accept a JSONL of proposals |
| `bun run render` | Generate `views/objects/**` Markdown |
| `bun run validate` | Validate reader outputs |

## Output

```txt
.atelier/v0/briefs/project-brief.yaml
.atelier/v0/briefs/hypotheses.ndjson
.atelier/v0/objects/knowledge.ndjson
.atelier/v0/objects/semantics.ndjson
.atelier/v0/objects/attention.ndjson
.atelier/v0/edges/edges.ndjson
.atelier/v0/views/objects/PROJECT_BRIEF.md
.atelier/v0/views/objects/ATTENTION_SETS.md
.atelier/v0/views/objects/KNOWLEDGE_OBJECTS.md
```

## Non-goals

- LLM direct calls to product files
- Implementation tasks
- Runtime evidence
- Full project understanding during cheap sampling
