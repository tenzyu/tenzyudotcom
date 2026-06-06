# CONTRACT: atelier-reader

## ProjectBrief schema

```ts
type ProjectBrief = {
  schema: "atelier.project-brief/v1";
  status: "hypothesis";
  generated_at: string;
  observed_facts: Array<{ fact: string; source_refs: SourceRef[] }>;
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
  source_refs: SourceRef[];
  source_anchor_ids: string[];
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
  source_anchor_ids: string[];
};
```

## AttentionSet schema

```ts
type AttentionSet = AtelierObjectBase & {
  kind: "attention_set";
  task: string;
  selected_object_ids: string[];
  selected_anchor_ids: string[];
  selected_source_refs: SourceRef[];
  excluded_object_ids: string[];
  excluded_anchor_ids: string[];
  reason: string;
  budget: { target_tokens: number; max_tokens: number };
  gap_status: "sufficient" | "insufficient" | "ambiguous";
};
```

## RelationProposal schema

```ts
type RelationProposal = {
  schema: "atelier.relation-proposal/v1";
  proposal_id: string;
  proposed_relation: Relation;
  rationale: string;
  source_anchor_ids: string[];
  source_refs: SourceRef[];
  confidence: "hypothesis" | "inferred";
  status: "proposed" | "accepted" | "rejected" | "stale";
};
```

## Validation must fail if

- any reader object lacks source refs and anchor refs where anchors exist;
- an AttentionSet is empty while marked sufficient;
- an LLM output bypasses schema validation;
- a relation proposal lacks endpoints;
- a relation proposal is marked fact/validated without an accept/review event;
- project brief is represented as complete understanding instead of hypothesis;
- reader selects build artifacts by default.
