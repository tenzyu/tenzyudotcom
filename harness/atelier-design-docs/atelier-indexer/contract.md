# CONTRACT: atelier-indexer

## Storage

Use NDJSON for object and edge records.

## SourceRef schema

```ts
type SourceRef = {
  path: string;
  start_line?: number;
  end_line?: number;
  sha256: string;
};
```

## AtelierObject base schema

All object records produced by the indexer must conform to the base shape below.

```ts
type AtelierObjectBase = {
  id: string;
  kind: string;
  version: string;
  title?: string;
  body_ref?: string;
  source_refs: SourceRef[];
  produced_by: "indexer" | "reader" | "transformer" | "executor";
  provenance_kind:
    | "deterministic_fact"
    | "llm_extracted"
    | "manual_control_record"
    | "runtime_evidence"
    | "legacy_promoted";
  confidence: "fact" | "hypothesis" | "inferred" | "validated";
  status: "fresh" | "stale" | "invalid" | "archived";
  affordances: string[];
};
```

## SourceFact object

```ts
type SourceFact = AtelierObjectBase & {
  kind: "source_fact";
  fact_type:
    | "file_exists"
    | "package_manager"
    | "script_exists"
    | "test_framework_candidate"
    | "docs_path"
    | "workspace_config"
    | "git_status"
    | "extension_histogram"
    | "naming_pattern";
  value: unknown;
};
```

## SourceUnit object

A `SourceUnit` is the mechanical chunk. It is not semantic knowledge.

```ts
type SourceUnit = AtelierObjectBase & {
  kind: "source_unit";
  unit_type:
    | "file"
    | "markdown_section"
    | "symbol_candidate"
    | "test_file"
    | "config_file"
    | "package_script"
    | "docs_file";
  path: string;
  language?: string;
  heading_path?: string[];
  start_line?: number;
  end_line?: number;
  sha256: string;
  byte_size: number;
};
```

## Edge schema

Edges are stored separately from objects.

```ts
type AtelierEdge = {
  id: string;
  from: string;
  to: string;
  kind:
    | "contains"
    | "defines"
    | "references"
    | "depends_on"
    | "supports"
    | "constrains"
    | "transforms_to"
    | "verifies"
    | "satisfies"
    | "invalidates";
  provenance_kind:
    | "deterministic_fact"
    | "llm_extracted"
    | "manual_control_record"
    | "runtime_evidence"
    | "legacy_promoted";
  source_refs?: SourceRef[];
  confidence: "fact" | "hypothesis" | "inferred" | "validated";
  status: "fresh" | "stale" | "invalid" | "archived";
};
```

## Affected contract

`bun run affected` must:

1. compare current file hashes to the previous snapshot;
2. list changed, added, deleted, and moved source units;
3. mark directly affected `SourceUnit` records stale;
4. traverse `edges.ndjson` to mark dependent objects stale;
5. write `.atelier/v0/indexes/stale.json`;
6. render `.atelier/v0/views/index/AFFECTED.md`.

## Validation

`bun run validate` must fail if:

- any object id is duplicated;
- any edge references missing objects;
- any SourceUnit points to a nonexistent file;
- any SourceRef hash mismatches the file content;
- generated index views are stale;
- `.atelier/v0/facts/**` or `.atelier/v0/objects/source.ndjson` is invalid JSON/NDJSON.

## Invariants

- Indexer output is deterministic for the same repo state.
- Indexer must not call LLMs.
- Indexer must not edit source files.
- Indexer must not create semantic claims.
