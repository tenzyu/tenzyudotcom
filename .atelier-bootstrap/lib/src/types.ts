/**
 * Shared types for the Atelier v0 object graph.
 *
 * These types are intentionally declared as TypeScript types rather than
 * class hierarchies, because Atelier v0 stores everything as JSON/NDJSON.
 *
 * The TypeScript type system gives us compile-time safety; runtime validation
 * is performed separately by the validators in each `atelier-*` component.
 */

export type AtelierProvenance =
  | 'deterministic_fact'
  | 'llm_extracted'
  | 'manual_control_record'
  | 'runtime_evidence'
  | 'legacy_promoted'

export type AtelierConfidence = 'fact' | 'hypothesis' | 'inferred' | 'validated'

/**
 * `status` is intentionally a string so subtype records (tasks, test
 * contracts, edit boundaries, packet templates, packets) can declare
 * their own lifecycle vocabulary. The contract is enforced per-kind by
 * the validator, not by the base type.
 */
export type AtelierStatus = string

export type SourceRef = {
  path: string
  start_line?: number
  end_line?: number
  sha256: string
}

export type AtelierProducer = 'indexer' | 'reader' | 'transformer' | 'executor'

/**
 * The base shape that every Atelier object conforms to.
 *
 * `body_ref` is a relative pointer into `.atelier/v0/**` (for example
 * `briefs/project-brief.yaml` or a path inside `objects/`), or to an external
 * file under the repo root. It is a logical reference, not an embedded body.
 */
export type AtelierObjectBase = {
  id: string
  kind: string
  version: string
  title?: string
  body_ref?: string
  source_refs: SourceRef[]
  produced_by: AtelierProducer
  provenance_kind: AtelierProvenance
  confidence: AtelierConfidence
  status: AtelierStatus
  affordances: string[]
  created_at: string
}

export type AtelierEdgeKind =
  | 'contains'
  | 'defines'
  | 'references'
  | 'depends_on'
  | 'supports'
  | 'constrains'
  | 'transforms_to'
  | 'verifies'
  | 'satisfies'
  | 'invalidates'

export type AtelierEdge = {
  id: string
  from: string
  to: string
  kind: AtelierEdgeKind
  provenance_kind: AtelierProvenance
  source_refs?: SourceRef[]
  confidence: AtelierConfidence
  status: AtelierStatus
  created_at: string
}

/**
 * A `SourceFact` is a zero-token observation. The indexer is the only
 * producer. Examples:
 *   - file_exists: ".atelier-bootstrap/indexer/package.json"
 *   - package_manager: "bun"
 *   - extension_histogram: { ".ts": 142, ".md": 38 }
 */
export type SourceFactType =
  | 'file_exists'
  | 'package_manager'
  | 'script_exists'
  | 'test_framework_candidate'
  | 'docs_path'
  | 'workspace_config'
  | 'git_status'
  | 'extension_histogram'
  | 'naming_pattern'
  | 'file_size'
  | 'directory_exists'

export type SourceFact = AtelierObjectBase & {
  kind: 'source_fact'
  fact_type: SourceFactType
  value: unknown
}

export type SourceUnitType =
  | 'file'
  | 'markdown_section'
  | 'symbol_candidate'
  | 'test_file'
  | 'config_file'
  | 'package_script'
  | 'docs_file'

export type SourceUnit = AtelierObjectBase & {
  kind: 'source_unit'
  unit_type: SourceUnitType
  path: string
  language?: string
  heading_path?: string[]
  start_line?: number
  end_line?: number
  sha256: string
  byte_size: number
}

/**
 * LLM-derived records must use a different `produced_by` and `provenance_kind`
 * from deterministic facts. They also must carry source refs.
 */
export type KnowledgeType =
  | 'repo_convention'
  | 'implementation_note'
  | 'framework_constraint'
  | 'testing_rule'
  | 'governance_rule'
  | 'risk_note'
  | 'usage_pattern'

export type KnowledgeAffordance =
  | 'context'
  | 'lint-candidate'
  | 'test-candidate'
  | 'skill-candidate'
  | 'docs-candidate'
  | 'packet-constraint'
  | 'review-candidate'

export type KnowledgeObject = AtelierObjectBase & {
  kind: 'knowledge_object'
  knowledge_type: KnowledgeType
  title: string
  summary: string
  body_ref?: string
  source_refs: SourceRef[]
  confidence: 'hypothesis' | 'inferred' | 'validated'
  affordances: KnowledgeAffordance[]
}

export type SemanticClaimType =
  | 'assertion'
  | 'definition'
  | 'invariant'
  | 'non_goal'
  | 'risk'
  | 'ambiguity'
  | 'open_question'

export type SemanticClaim = AtelierObjectBase & {
  kind: 'semantic_claim'
  claim_type: SemanticClaimType
  text: string
  modality?: 'must' | 'must_not' | 'should' | 'definition' | 'invariant'
  source_refs: SourceRef[]
}

export type AttentionSet = AtelierObjectBase & {
  kind: 'attention_set'
  task: string
  selected_object_ids: string[]
  selected_source_refs: SourceRef[]
  excluded_object_ids: string[]
  reason: string
  budget: {
    target_tokens: number
    max_tokens: number
  }
  gap_status: 'sufficient' | 'insufficient' | 'ambiguous'
}

export type ImplementationTask = AtelierObjectBase & {
  kind: 'implementation_task'
  task_id: string
  title: string
  goal: string
  source_object_ids: string[]
  source_refs: SourceRef[]
  required_knowledge_object_ids: string[]
  allowed_files: string[]
  forbidden_files: string[]
  acceptance_criteria: string[]
  risk_notes: string[]
  status: 'draft' | 'ready' | 'blocked' | 'stale'
  /**
   * Free-form tags. The transformer uses `fixture` to mark a task that
   * is a toy example or otherwise non-operational. The operation
   * verifier excludes `fixture` tasks from operational readiness.
   */
  tags?: string[]
  /**
   * Explicit fixture flag. Equivalent to `tags: ['fixture']` but more
   * machine-readable. Set to `true` when the task exists only as a
   * smoke test (e.g. derived from a `src/main.ts` toy sample) and
   * must NOT satisfy operational pass by itself.
   */
  fixture?: boolean
}

export type TestContract = AtelierObjectBase & {
  kind: 'test_contract'
  test_contract_id: string
  task_id: string
  test_framework: 'vitest' | 'bun-test' | 'jest' | 'unknown'
  target_files: string[]
  test_files: string[]
  expected_behavior: string[]
  negative_cases: string[]
  command: string
  status: 'draft' | 'ready' | 'blocked' | 'stale'
}

export type EditBoundary = AtelierObjectBase & {
  kind: 'edit_boundary'
  task_id: string
  allowed_files: string[]
  forbidden_files: string[]
  allowed_operations: Array<'create' | 'modify' | 'delete'>
  requires_user_approval: boolean
}

export type PacketTemplate = AtelierObjectBase & {
  kind: 'packet_template'
  task_id: string
  required_source_refs: SourceRef[]
  required_object_ids: string[]
  allowed_files: string[]
  forbidden_files: string[]
  test_contract_ids: string[]
  evidence_expectations: string[]
  subagent_contract: string
}

export type TransformRecommendation = AtelierObjectBase & {
  kind: 'transform_recommendation'
  source_object_id: string
  recommendation_type:
    | 'lint-candidate'
    | 'test-candidate'
    | 'skill-candidate'
    | 'docs-candidate'
    | 'packet-constraint'
    | 'review-candidate'
  reason: string
  proposed_output_kind: string
  confidence: 'hypothesis' | 'inferred' | 'validated'
  status: 'proposed' | 'accepted' | 'rejected' | 'stale'
}

/**
 * Record of a `(source_object_id, recommendation_type)` pair that was
 * emitted more than once by the transformer. The transformer dedupes
 * recommendations at emit time and writes the deduped list to
 * `recommendations.ndjson`. The duplicate count and the representative
 * emitted record are recorded in `duplicates.ndjson` so the operation
 * verifier can flag stale or over-eager recommenders.
 */
export type DuplicateRecommendation = {
  schema: 'atelier.duplicate-recommendation/v1'
  source_object_id: string
  recommendation_type: TransformRecommendation['recommendation_type']
  count: number
  representative_recommendation_id: string
  detected_at: string
}

export type ExecutionPacket = AtelierObjectBase & {
  kind: 'execution_packet'
  packet_id: string
  task_id: string
  status: 'draft' | 'active' | 'completed' | 'rejected' | 'blocked' | 'stale'
  required_source_refs: SourceRef[]
  required_object_ids: string[]
  allowed_files: string[]
  forbidden_files: string[]
  test_contract_ids: string[]
  evidence_expectations: string[]
  handoff_schema: 'atelier.subagent-handoff/v1'
}

export type EvidenceRecord = AtelierObjectBase & {
  kind: 'evidence_record'
  evidence_id: string
  packet_id: string
  gate_id?: string
  command?: string
  status: 'passed' | 'failed' | 'skipped' | 'blocked' | 'unknown'
  raw_output_ref?: string
  diff_ref?: string
  file_hashes?: Record<string, string>
  created_at: string
}

export type Blocker = AtelierObjectBase & {
  kind: 'blocker'
  blocker_id: string
  packet_id: string
  task_id: string
  severity: 'P0' | 'P1' | 'P2'
  reason: string
  source_refs?: SourceRef[]
  recommended_next_action: string
  status: 'open' | 'resolved' | 'wontfix'
}

export type SubagentHandoff = {
  schema: 'atelier.subagent-handoff/v1'
  run_id: string
  packet_id: string
  task_id: string
  files_changed: string[]
  tests_written: string[]
  gate_results: Record<string, 'passed' | 'failed' | 'skipped' | 'blocked'>
  evidence_paths: string[]
  blockers: Array<{
    blocker_id: string
    severity: 'P0' | 'P1' | 'P2'
    reason: string
  }>
  summary?: string
}

export type ReaderLlmJob = {
  schema: 'atelier.reader-llm-job/v1'
  job_id: string
  kind: 'cheap-sample' | 'attention' | 'deep-read' | 'gap-review'
  input_object_ids: string[]
  input_source_refs: SourceRef[]
  output_contract: string
  instructions: string
}

/**
 * The discriminated union of all LLM proposals a reader may emit.
 * Each line of an LLM JSONL response must match one of these.
 */
export type ReaderProposal =
  | {
      proposal_kind: 'project_hypothesis'
      statement: string
      confidence: 'low' | 'medium' | 'high'
      evidence: string[]
    }
  | {
      proposal_kind: 'knowledge_object'
      title: string
      summary: string
      knowledge_type: KnowledgeType
      source_refs: SourceRef[]
      affordances: KnowledgeAffordance[]
      confidence: 'hypothesis' | 'inferred' | 'validated'
    }
  | {
      proposal_kind: 'semantic_claim'
      claim_type: SemanticClaimType
      text: string
      modality?: 'must' | 'must_not' | 'should' | 'definition' | 'invariant'
      source_refs: SourceRef[]
      confidence: 'hypothesis' | 'inferred' | 'validated'
    }
  | {
      proposal_kind: 'attention_item'
      object_id?: string
      source_ref?: SourceRef
      reason: string
      priority: 'P0' | 'P1' | 'P2'
    }
  | {
      proposal_kind: 'gap'
      text: string
      blocking: boolean
      source_refs?: SourceRef[]
    }
