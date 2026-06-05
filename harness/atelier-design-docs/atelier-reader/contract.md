# CONTRACT: atelier-reader

## ProjectBrief schema

```ts
type ProjectBrief = {
  schema: "atelier.project-brief/v1";
  status: "hypothesis";
  generated_at: string;
  observed_facts: Array<{
    fact: string;
    source_refs: SourceRef[];
  }>;
  hypotheses: Array<{
    id: string;
    statement: string;
    confidence: "low" | "medium" | "high";
    evidence: string[];
  }>;
  unresolved_questions: string[];
};
```

## KnowledgeObject schema

A `KnowledgeObject` is the semantic chunk. It is the human/agent context-switch unit.

```ts
type KnowledgeObject = AtelierObjectBase & {
  kind: "knowledge_object";
  knowledge_type:
    | "repo_convention"
    | "implementation_note"
    | "framework_constraint"
    | "testing_rule"
    | "governance_rule"
    | "risk_note"
    | "usage_pattern";
  title: string;
  summary: string;
  body_ref?: string;
  source_refs: SourceRef[];
  confidence: "hypothesis" | "inferred" | "validated";
  affordances: Array<
    | "context"
    | "lint-candidate"
    | "test-candidate"
    | "skill-candidate"
    | "docs-candidate"
    | "packet-constraint"
    | "review-candidate"
  >;
};
```

## SemanticClaim schema

```ts
type SemanticClaim = AtelierObjectBase & {
  kind: "semantic_claim";
  claim_type:
    | "assertion"
    | "definition"
    | "invariant"
    | "non_goal"
    | "risk"
    | "ambiguity"
    | "open_question";
  text: string;
  modality?: "must" | "must_not" | "should" | "definition" | "invariant";
  source_refs: SourceRef[];
};
```

## AttentionSet schema

```ts
type AttentionSet = AtelierObjectBase & {
  kind: "attention_set";
  task: string;
  selected_object_ids: string[];
  selected_source_refs: SourceRef[];
  excluded_object_ids: string[];
  reason: string;
  budget: {
    target_tokens: number;
    max_tokens: number;
  };
  gap_status: "sufficient" | "insufficient" | "ambiguous";
};
```

## LLM job kinds

```txt
cheap-sample
attention
deep-read
gap-review
```

## LLM job envelope

```ts
type ReaderLlmJob = {
  schema: "atelier.reader-llm-job/v1";
  job_id: string;
  kind: "cheap-sample" | "attention" | "deep-read" | "gap-review";
  input_object_ids: string[];
  input_source_refs: SourceRef[];
  output_contract: string;
  instructions: string;
};
```

## LLM output contract

LLM outputs must be JSONL. Each line must be one proposal:

```ts
type ReaderProposal =
  | { proposal_kind: "project_hypothesis"; statement: string; confidence: "low" | "medium" | "high"; evidence: string[] }
  | { proposal_kind: "knowledge_object"; title: string; summary: string; knowledge_type: string; source_refs: SourceRef[]; affordances: string[]; confidence: string }
  | { proposal_kind: "semantic_claim"; claim_type: string; text: string; modality?: string; source_refs: SourceRef[]; confidence: string }
  | { proposal_kind: "attention_item"; object_id?: string; source_ref?: SourceRef; reason: string; priority: "P0" | "P1" | "P2" }
  | { proposal_kind: "gap"; text: string; blocking: boolean; source_refs?: SourceRef[] };
```

## Validation

`bun run validate` must fail if:

- project brief claims full understanding;
- any LLM-derived object lacks provenance;
- any LLM-derived object lacks source refs;
- any attention set references missing objects;
- deep-read jobs include all source units by default;
- output is prose-only instead of JSONL proposals;
- generated object views are stale.
