# CONTRACT: atelier-indexer

## Storage

Use NDJSON for generated object, anchor, and edge records.

## SourceRef schema

```ts
type SourceRef = {
  path: string;
  start_line?: number;
  end_line?: number;
  sha256: string;
};
```

## SourceAnchor schema

```ts
type SourceAnchor = {
  id: string;
  kind:
    | "file"
    | "markdown_section"
    | "code_symbol_candidate"
    | "test_file"
    | "config_file"
    | "package_script"
    | "explicit_reference";
  path: string;
  start_line?: number;
  end_line?: number;
  heading_path?: string[];
  symbol_name?: string;
  content_hash: string;
  selector_strategy: "path" | "line_range" | "heading" | "symbol" | "text_quote";
  produced_by: "indexer";
  provenance_kind: "deterministic_fact";
  confidence: "fact" | "hypothesis" | "inferred" | "validated";
  status: "fresh" | "stale" | "conflicted" | "invalid" | "archived" | "quarantined";
};
```

## Object base schema

```ts
type AtelierObjectBase = {
  id: string;
  kind: string;
  version: string;
  title?: string;
  body_ref?: string;
  source_refs: SourceRef[];
  produced_by: "indexer" | "reader" | "transformer" | "executor" | "operation";
  provenance_kind:
    | "deterministic_fact"
    | "llm_extracted"
    | "manual_control_record"
    | "runtime_evidence"
    | "legacy_promoted";
  confidence: "fact" | "hypothesis" | "inferred" | "validated";
  status: "fresh" | "stale" | "conflicted" | "invalid" | "archived" | "quarantined";
  affordances: string[];
};
```

## Relation schema

```ts
type Relation = {
  id: string;
  from_anchor_id?: string;
  to_anchor_id?: string;
  from_object_id?: string;
  to_object_id?: string;
  kind:
    | "contains"
    | "defines"
    | "references"
    | "depends_on"
    | "supports"
    | "constrains"
    | "transforms_to"
    | "requires_context"
    | "verifies"
    | "satisfies"
    | "invalidates"
    | "explains"
    | "blocks";
  evidence_refs: string[];
  source_refs?: SourceRef[];
  produced_by: "indexer" | "reader" | "transformer" | "executor" | "operation";
  provenance_kind:
    | "deterministic_fact"
    | "llm_extracted"
    | "manual_control_record"
    | "runtime_evidence";
  confidence: "fact" | "hypothesis" | "inferred" | "validated";
  status: "fresh" | "stale" | "conflicted" | "invalid" | "rejected" | "archived";
};
```

## Exclusion contract

The indexer must exclude these from normal source anchors, attention candidates, and transform candidates unless explicitly requested:

```txt
.git/**
node_modules/**
dist/**
build/**
coverage/**
target/**
.rmeta
*.rmeta
```

## Validation must fail if

- any object, anchor, or relation id is duplicated;
- any relation has no valid endpoint pair;
- any relation references a missing anchor/object;
- any anchor points to a nonexistent file;
- any anchor line range is outside the file;
- any file anchor hash mismatches current content;
- non-quick validation samples instead of checking the full dataset;
- generated views are used as source of truth;
- relation kernel readiness is claimed with only `contains` relations.
