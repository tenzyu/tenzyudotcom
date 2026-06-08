/**
 * Atelier Autopoiesis — canonical record types.
 *
 * The autopoiesis control plane is the repo-side semantic control
 * layer that decides what an agent is allowed to read, write, accept,
 * verify, supersede, archive, quarantine, or invalidate. Every record
 * that participates in that decision is declared here as a TypeScript
 * type. Producers and consumers import from this file so that the
 * lifecycle, validator, and CLI all speak the same shape.
 *
 * The schema is the source-of-truth: see
 * `harness/atelier-autopoiesis/contracts/autopoiesis-records.schema.json`.
 * This file is the canonical TypeScript mirror of that schema.
 *
 * Design rules (every record must satisfy):
 *   - schema: 'atelier.<family>/v<n>'
 *   - id: stable, deterministic or random-but-prefixed
 *   - lifecycle_state: drawn from the global LifecycleState enum
 *   - provenance_kind: drawn from the AutopoiesisProvenance enum
 *   - source_anchors: at least one SourceAnchorRef that pins the
 *     record to a deterministic on-disk anchor
 *   - evidence_refs: optional list of evidence ids; required for
 *     promotion to accepted/verified
 *   - owner_or_policy: human or machine-readable ownership string
 *   - authority_scope: structured description of where the record
 *     has authority
 *   - produced_by: short machine string identifying the producer
 *   - created_at: ISO 8601 timestamp
 *   - superseded_by / invalidated_by: optional lineage pointers
 */
import type { SourceRef } from '../../../lib/src/index.ts'

/* -------------------------------------------------------------------------- */
/*                                Lifecycle                                   */
/* -------------------------------------------------------------------------- */

/**
 * The 10 global lifecycle states. Every SemanticNode carries one of these.
 *
 * The transition table is the single source of truth — see
 * `../lifecycle.ts` for the `transition()` function and the legal
 * `from → to` moves.
 */
export type LifecycleState =
  | 'observed'
  | 'inferred'
  | 'proposed'
  | 'accepted'
  | 'verified'
  | 'superseded'
  | 'rejected'
  | 'archived'
  | 'quarantined'
  | 'invalidated'

export const LIFECYCLE_STATES: ReadonlyArray<LifecycleState> = [
  'observed',
  'inferred',
  'proposed',
  'accepted',
  'verified',
  'superseded',
  'rejected',
  'archived',
  'quarantined',
  'invalidated',
] as const

/* -------------------------------------------------------------------------- */
/*                                Provenance                                  */
/* -------------------------------------------------------------------------- */

/**
 * Provenance kinds for autopoiesis records. The lifecycle policy
 * treats `llm_extracted` and `llm_derived` as never-promotable to
 * `accepted` or `verified` — see `lifecycle.ts`.
 */
export type AutopoiesisProvenance =
  | 'deterministic_fact'
  | 'llm_extracted'
  | 'llm_derived'
  | 'manual_control_record'
  | 'runtime_evidence'
  | 'derived'
  | 'generated_view'

export const AUTOPOIESIS_PROVENANCES: ReadonlyArray<AutopoiesisProvenance> = [
  'deterministic_fact',
  'llm_extracted',
  'llm_derived',
  'manual_control_record',
  'runtime_evidence',
  'derived',
  'generated_view',
] as const

export type AutopoiesisConfidence = 'fact' | 'hypothesis' | 'inferred' | 'validated'

/* -------------------------------------------------------------------------- */
/*                              Authority scope                               */
/* -------------------------------------------------------------------------- */

/**
 * Authority scope describes where a record is allowed to make
 * decisions. The validator and the query runtime both consume this
 * shape to decide whether a record applies to a given task, path,
 * kind, or global claim.
 */
export type AuthorityScope = {
  /**
   * Scope kind.
   *   - 'path':     a glob/path pattern under the repo root
   *   - 'task':     a single task id
   *   - 'kind':     a node kind (e.g. 'requirement')
   *   - 'global':   the entire repo
   *   - 'custom':   vendor-specific (free-form)
   */
  kind: 'path' | 'task' | 'kind' | 'global' | 'custom' | string
  /** Glob pattern (path scopes). */
  pattern?: string
  /** Task id (task scopes). */
  task_id?: string
  /** Node kind (kind scopes). */
  node_kind?: string
  /** Free-form metadata. */
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                              Source anchor                                 */
/* -------------------------------------------------------------------------- */

/**
 * A reference to a `SourceAnchor` produced by the indexer. The
 * autopoiesis validator uses these to confirm that a record is
 * pinned to a real on-disk anchor; the validator rejects any
 * SemanticNode whose `source_anchors` array is empty.
 */
export type SourceAnchorRef = {
  anchor_id: string
  path?: string
  start_line?: number
  end_line?: number
  sha256?: string
  /** Optional anchor status mirror, used by the staleness check. */
  status?: 'fresh' | 'stale' | 'conflicted' | 'invalid' | 'archived' | 'quarantined'
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                               Node kinds                                   */
/* -------------------------------------------------------------------------- */

export type SemanticNodeKind =
  | 'requirement'
  | 'decision'
  | 'invariant'
  | 'test_contract'
  | 'review_finding'
  | 'handoff'
  | 'implementation_task'
  | 'permission_rule'
  | 'check_result'
  | 'materialization_proposal'
  | 'conflict'
  | 'staleness_record'
  | 'source_unit'
  | 'source_anchor'

export const SEMANTIC_NODE_KINDS: ReadonlyArray<SemanticNodeKind> = [
  'requirement',
  'decision',
  'invariant',
  'test_contract',
  'review_finding',
  'handoff',
  'implementation_task',
  'permission_rule',
  'check_result',
  'materialization_proposal',
  'conflict',
  'staleness_record',
  'source_unit',
  'source_anchor',
] as const

/* -------------------------------------------------------------------------- */
/*                              SemanticNode                                  */
/* -------------------------------------------------------------------------- */

export type SemanticNode = {
  schema: 'atelier.semantic-node/v1'
  id: string
  kind: SemanticNodeKind
  lifecycle_state: LifecycleState
  authority_scope: AuthorityScope
  source_anchors: SourceAnchorRef[]
  evidence_anchors?: SourceAnchorRef[]
  owner_or_policy?: string
  evidence_refs?: string[]
  provenance_kind: AutopoiesisProvenance
  confidence?: AutopoiesisConfidence
  produced_by: string
  created_at: string
  superseded_by?: string
  invalidated_by?: string
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                            PromotionDecision                               */
/* -------------------------------------------------------------------------- */

export type PromotionDecisionRecord = {
  schema: 'atelier.promotion-decision/v1'
  id: string
  subject_id: string
  from_state: LifecycleState
  to_state: LifecycleState
  /** PromotionDecision.decision is one of accepted | rejected | blocked. */
  decision: 'accepted' | 'rejected' | 'blocked'
  required_checks: string[]
  evidence_refs?: string[]
  conflict_check?: Record<string, unknown>
  decided_by?: string
  decided_at?: string
  created_at: string
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                            StalenessRecord                                 */
/* -------------------------------------------------------------------------- */

/**
 * Emitted when a record's source_anchor transitions from
 * `fresh → stale | invalid | archived` (or any non-fresh status). The
 * validator rejects a StalenessRecord whose subject anchor is still
 * `fresh`, because the staleness is then premature.
 */
export type StalenessRecord = {
  schema: 'atelier.staleness-record/v1'
  id: string
  subject_id: string
  subject_kind: SemanticNodeKind
  anchor_id: string
  previous_status:
    | 'fresh'
    | 'stale'
    | 'invalid'
    | 'archived'
    | 'conflicted'
    | 'quarantined'
  new_status:
    | 'fresh'
    | 'stale'
    | 'invalid'
    | 'archived'
    | 'conflicted'
    | 'quarantined'
  detected_at: string
  reason: string
  created_at: string
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                             ConflictRecord                                 */
/* -------------------------------------------------------------------------- */

/**
 * Emitted when two records claim overlapping authority_scope AND
 * the applicable `AuthorityRule.conflict_policy` is not `ignore`.
 * The validator rejects a ConflictRecord whose claimants do not
 * actually overlap in authority_scope, because the conflict is then
 * fabricated.
 */
export type ConflictClaimant = {
  record_id: string
  record_kind: SemanticNodeKind
  authority: number
  authority_scope?: AuthorityScope
}

export type ConflictRecord = {
  schema: 'atelier.conflict-record/v1'
  id: string
  scope: AuthorityScope
  claimants: ConflictClaimant[]
  conflict_kind: 'precedence' | 'overlap' | 'contradiction'
  resolution:
    | 'unresolved'
    | 'prefer_higher_precedence'
    | 'require_human'
    | 'reject'
    | 'ignore'
  conflict_policy?: 'expose' | 'prefer_higher_precedence' | 'require_human' | 'reject' | 'ignore'
  detected_at: string
  created_at: string
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                              AuthorityRule                                 */
/* -------------------------------------------------------------------------- */

export type AuthorityRule = {
  schema: 'atelier.authority-rule/v1'
  id: string
  applies_to: string[]
  precedence: number
  scope: AuthorityScope
  conflict_policy?: 'expose' | 'prefer_higher_precedence' | 'require_human' | 'reject'
  created_at: string
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                              ControlPacket                                 */
/* -------------------------------------------------------------------------- */

/**
 * A MaterializationRule describes how a control packet enables a
 * future materialization step. The `must_hold_check_ids` list pins
 * the check_result semantic-node ids that the materialize:validate
 * gate will require to be `passed` AND backed by a non-empty
 * `raw_output_ref` AND promoted to `verified` via a
 * PromotionDecision.
 */
export type MaterializationRule = {
  task_id: string
  required_for_change: string
  must_hold_check_ids: string[]
  source_anchor_id: string
  status: 'observed' | 'inferred' | 'proposed'
}

export type ControlPacket = {
  schema: 'atelier.control-packet/v1'
  id: string
  task: string
  /** Lifecycle is always 'observed' on creation; the validator
   *  emits defects on this view. */
  lifecycle_state: LifecycleState
  authority_scope: AuthorityScope
  source_anchors: SourceAnchorRef[]
  evidence_anchors: SourceAnchorRef[]
  owner_or_policy?: string
  provenance_kind: AutopoiesisProvenance
  produced_by: string
  created_at: string
  generated_at: string
  active_requirements: string[]
  accepted_decisions: string[]
  allowed_operations: string[]
  forbidden_operations: string[]
  required_checks: string[]
  open_findings: string[]
  stale_artifacts: string[]
  conflicts: string[]
  /** evidence_anchors_list — duplicate of evidence_anchors but as
   *  the canonical "list of evidence ids" referenced from the
   *  work order's spec (kept as a separate field for traceability). */
  evidence_anchors_list: string[]
  materialization_rules: MaterializationRule[]
  /** 'valid' or 'invalid' (e.g. when scope overlap is detected at
   *  create time the generator still writes the packet but flags
   *  the status so the validator can reject it cleanly). */
  status: 'valid' | 'invalid'
  defects: string[]
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                         MaterializationProposal                            */
/* -------------------------------------------------------------------------- */

export type MaterializationDiffRef = {
  /** Path being modified in the proposed materialization. */
  path: string
  /** The change kind, e.g. 'create' | 'modify' | 'delete'. */
  kind: 'create' | 'modify' | 'delete'
  /** Optional sha256 of the proposed blob. */
  sha256?: string
  [key: string]: unknown
}

export type MaterializationProposal = {
  schema: 'atelier.materialization-proposal/v1'
  id: string
  task_id: string
  /** Lifecycle is always 'observed' on creation; the validator
   *  may promote to 'accepted'/'verified' via a PromotionDecision. */
  lifecycle_state: LifecycleState
  authority_scope: AuthorityScope
  source_anchors: SourceAnchorRef[]
  evidence_anchors: SourceAnchorRef[]
  owner_or_policy?: string
  /** LLM-derived/extracted records cannot become accepted/verified;
   *  the materialize:validate gate only accepts non-LLM provenances
   *  for the proposal. */
  provenance_kind: AutopoiesisProvenance
  produced_by: string
  created_at: string
  affected_requirements: string[]
  affected_findings: string[]
  affected_decisions: string[]
  required_checks: string[]
  /** Each entry is a MaterializationDiffRef (path/kind). */
  diff_refs: MaterializationDiffRef[]
  allowed_files: string[]
  forbidden_files: string[]
  status: 'proposed' | 'validated' | 'rejected' | 'superseded'
  defects: string[]
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                              SubagentHandoff                               */
/* -------------------------------------------------------------------------- */

/**
 * A sub-agent handoff is the transport artifact that an executor
 * emits when it finishes a task. The autopoiesis validator REJECTS
 * any handoff that does not back-link to at least one `check_result`
 * semantic node id — the work order's `E_HANDOFF_NO_CHECK_RESULT`
 * defect. A handoff without evidence is theatre.
 */
export type SubagentHandoff = {
  schema: 'atelier.subagent-handoff/v1'
  id: string
  run_id: string
  packet_id: string
  task_id: string
  files_changed: string[]
  tests_written: string[]
  gate_results: Record<string, 'passed' | 'failed' | 'skipped' | 'blocked'>
  evidence_paths: string[]
  blockers: Array<{ blocker_id: string; severity: 'P0' | 'P1' | 'P2'; reason: string }>
  /** Backlink to one or more `check_result` SemanticNode ids. */
  check_result_ids: string[]
  summary?: string
  created_at: string
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                              AutopoiesisFinding                            */
/* -------------------------------------------------------------------------- */

/**
 * C8 — evaluator output record. The autopoiesis evaluator walks
 * `validateAutopoiesis()` + `resolveAll()` + a runtime query, and
 * emits one `AutopoiesisFinding` per defect. The finding carries:
 *
 *   - `capability_id`: which capability owns the negative
 *     control that the defect broke. The mapping is the
 *     CODE_TO_CAPABILITY table in `evaluator.ts`.
 *   - `severity`: P0 (control-plane bypass; blocks the run),
 *     P1 (semantic gap; recorded but not blocking the run when
 *     all are P1), or P2 (informational).
 *   - `code`: the canonical defect code (e.g. `E_NODE_NO_SOURCE_ANCHOR`).
 *   - `reason`: human-readable explanation copied from the
 *     underlying defect.
 *   - `required_repair`: machine-readable instruction.
 *   - `proof_required`: the runtime evidence the patch must
 *     supply (e.g. `['evaluator:open_p0=0']`).
 *   - `status`: `open` on creation, then `patched` / `verified`
 *     / `rejected` / `waived` as the work-order loop progresses.
 *
 * The `finding_id` is deterministic: `finding:<capability>:<code>:<sha256(reason)[:8]>`.
 * The work-order compiler uses the same hashing scheme so the
 * loop is idempotent: re-running the evaluator does not double-
 * count findings.
 */
export type AutopoiesisFinding = {
  schema: 'atelier.autopoiesis-finding/v1'
  finding_id: string
  severity: 'P0' | 'P1' | 'P2'
  capability_id: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8'
  code: string
  reason: string
  required_repair: string
  status: 'open' | 'patched' | 'verified' | 'rejected' | 'waived'
  proof_required: string[]
  affected_record?: string
  created_at: string
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                            AutopoiesisWorkOrder                            */
/* -------------------------------------------------------------------------- */

/**
 * C8 — work-order compiled from a group of `AutopoiesisFinding`
 * records. The compiler groups findings by `capability_id` and
 * emits one work order per group with at least one `open`
 * finding. The work order is the transport artifact that the
 * implementer agent consumes; the runtime serializes it to
 * `.atelier/v0/autopoiesis/work-orders.ndjson`.
 *
 * The shape is deliberately identical to the work-order JSON
 * the coordinator hands to the implementer (the schema's
 * `atelier.autopoiesis-work-order/v1`). The runtime only fills
 * in:
 *   - work_order_id (deterministic)
 *   - evaluator_finding_ids (the open finding_ids)
 *   - objective (a short description)
 *   - allowed_files / forbidden_files
 *   - required_commands / required_negative_controls
 *   - acceptance_evidence
 *   - created_at
 *
 * The mission and capability excerpts are derived from the
 * canonical `harness/atelier-autopoiesis/GOAL-ATELIER-AUTOPOIESIS.md`
 * and `CAPABILITY-CONTRACT.md`; the runtime injects a small
 * fixed slice here (the full docs are not loaded into the
 * runtime).
 */
export type AutopoiesisWorkOrder = {
  schema: 'atelier.autopoiesis-work-order/v1'
  work_order_id: string
  capability_ids: string[]
  evaluator_finding_ids: string[]
  objective: string
  allowed_files: string[]
  forbidden_files: string[]
  required_runtime_behavior: string[]
  required_negative_controls: string[]
  required_commands: string[]
  acceptance_evidence: string[]
  mission_excerpt: string[]
  capability_excerpt: string[]
  read_surface: {
    preferred_symbols: string[]
    required_file_slices: string[]
    full_read_allowlist: string[]
    generated_state_policy: 'query_or_summary_only'
  }
  token_budget: {
    input_soft_cap: number
    output_soft_cap: number
    test_run_cap: number
    full_file_read_cap: number
  }
  created_at: string
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*                            Discriminated union                             */
/* -------------------------------------------------------------------------- */

/**
 * Union of every autopoiesis record family. The validator uses
 * `record.schema` to dispatch per-family checks. Producers MUST
 * set `schema` to one of the `atelier.<family>/v<n>` constants.
 */
export type AutopoiesisRecord =
  | (SemanticNode & { schema: 'atelier.semantic-node/v1' })
  | (PromotionDecisionRecord & { schema: 'atelier.promotion-decision/v1' })
  | (StalenessRecord & { schema: 'atelier.staleness-record/v1' })
  | (ConflictRecord & { schema: 'atelier.conflict-record/v1' })
  | (AuthorityRule & { schema: 'atelier.authority-rule/v1' })
  | (ControlPacket & { schema: 'atelier.control-packet/v1' })
  | (MaterializationProposal & { schema: 'atelier.materialization-proposal/v1' })
  | (SubagentHandoff & { schema: 'atelier.subagent-handoff/v1' })
  | (AutopoiesisFinding & { schema: 'atelier.autopoiesis-finding/v1' })
  | (AutopoiesisWorkOrder & { schema: 'atelier.autopoiesis-work-order/v1' })

/* -------------------------------------------------------------------------- */
/*                              Re-exports                                    */
/* -------------------------------------------------------------------------- */

export type { SourceRef }
