/**
 * Atelier Autopoiesis — the validator.
 *
 * `validateAutopoiesis()` reads every NDJSON file under
 * `.atelier/v0/autopoiesis/` and returns the list of defects. It is
 * the single source of truth for "is this autopoiesis state valid?".
 *
 * Defect codes (canonical, evaluator-checked). Every code is
 * exported as a constant on `DEFECT_CODES` so producers, tests,
 * and downstream evaluators can grep for them.
 *
 *   E_NODE_NO_SOURCE_ANCHOR        A SemanticNode has no source_anchors.
 *   E_NODE_FAKE_SOURCE_ANCHOR      A SemanticNode cites a
 *                                  source_anchor.anchor_id that is
 *                                  not present in the relation
 *                                  kernel's anchor index.
 *   E_NODE_DUPLICATE_ID            Two records share the same `id`.
 *   E_NODE_INVALID_KIND            A SemanticNode has an unknown `kind`.
 *   E_NODE_INVALID_LIFECYCLE       A SemanticNode has an unknown
 *                                  `lifecycle_state`.
 *   E_NODE_MISSING_REQUIRED        A SemanticNode is missing a
 *                                  required field.
 *   E_NODE_NO_PROMOTION_DECISION   A SemanticNode in
 *                                  `accepted`/`verified` has no
 *                                  matching PromotionDecision in the
 *                                  promotion-decisions ledger.
 *   E_PROMOTION_LLM_DIRECT_ACCEPT  An LLM-derived/extracted
 *                                  SemanticNode reached
 *                                  `accepted`/`verified` (the check
 *                                  is UNCONDITIONAL for LLM
 *                                  provenances), or a
 *                                  PromotionDecision tried to accept
 *                                  such a record.
 *   E_PROMOTION_MISSING_EVIDENCE   A SemanticNode in
 *                                  `accepted`/`verified` has empty
 *                                  or non-string `evidence_refs`.
 *   E_PROMOTION_MISSING_OWNER      A SemanticNode in
 *                                  `accepted`/`verified` has empty
 *                                  or missing `owner_or_policy`.
 *   E_PROMOTION_MISSING_SCOPE      A SemanticNode in
 *                                  `accepted`/`verified` has empty
 *                                  or missing `authority_scope`.
 *   E_TRANSITION_ILLEGAL           A PromotionDecision records an
 *                                  illegal `from_state → to_state`
 *                                  transition.
 *   E_STALE_PREMATURE              A StalenessRecord claims a subject
 *                                  anchor transitioned to non-fresh,
 *                                  but the anchor is still fresh.
 *   E_STALE_FAKE_SUBJECT           A StalenessRecord's `subject_id`
 *                                  does not exist in the
 *                                  semantic-nodes index.
 *   E_CONFLICT_NO_OVERLAP          A ConflictRecord's claimants do
 *                                  not actually overlap in
 *                                  authority_scope.
 *   E_CONFLICT_FAKE_CLAIMANT       A ConflictRecord's
 *                                  `claimants[].record_id` does not
 *                                  exist in the semantic-nodes
 *                                  index (even when an explicit
 *                                  `authority_scope` is provided).
 *   E_HANDOFF_NO_CHECK_RESULT      A SubagentHandoff has no
 *                                  backlinked `check_result` id.
 *   E_HANDOFF_FAKE_CHECK_RESULT    A SubagentHandoff cites a
 *                                  `check_result_id` that does not
 *                                  exist (or does not have
 *                                  `kind='check_result'`) in the
 *                                  semantic-nodes index.
 *
 * The validator is the implementation of the negative controls
 * listed in the work order. The CLI wraps this function and exits
 * 0 only when `issues.length === 0`.
 */
import { readNdjson } from '../../../lib/src/ndjson.ts'
import type { AtelierIssue } from '../../../lib/src/results.ts'
import { atelierV0Root } from '../../../lib/src/paths.ts'
import path from 'node:path'
import {
  AUTOPOIESIS_PROVENANCES,
  LIFECYCLE_STATES,
  SEMANTIC_NODE_KINDS,
  type AuthorityRule,
  type AutopoiesisProvenance,
  type AuthorityScope,
  type ConflictClaimant,
  type ConflictRecord,
  type ControlPacket,
  type LifecycleState,
  type MaterializationProposal,
  type PromotionDecisionRecord,
  type SemanticNode,
  type SemanticNodeKind,
  type StalenessRecord,
  type SubagentHandoff,
} from './records.ts'
import { TRANSITIONS, isLlmProvenance } from './lifecycle.ts'
import { AUTOPOIESIS_PATHS, autopoiesisRoot } from './paths.ts'

/* -------------------------------------------------------------------------- */
/*                                Public types                                */
/* -------------------------------------------------------------------------- */

export type AutopoiesisDefect = AtelierIssue

export type ValidationStats = {
  semantic_nodes: number
  promotion_decisions: number
  staleness_records: number
  conflict_records: number
  authority_rules: number
  control_packets: number
  materialization_proposals: number
  materialization_reports: number
  handoffs: number
  duplicates: number
}

export type ValidationResult = {
  issues: AutopoiesisDefect[]
  warnings: string[]
  stats: ValidationStats
}

/* -------------------------------------------------------------------------- */
/*                          Defect code constants                             */
/* -------------------------------------------------------------------------- */

/**
 * Canonical defect codes emitted by the autopoiesis validator.
 * Exported as a `const` object so the work-order's evaluator and
 * downstream producers can grep for them and so the test suite
 * can assert against a single source of truth.
 */
export const DEFECT_CODES = {
  E_NODE_NO_SOURCE_ANCHOR: 'E_NODE_NO_SOURCE_ANCHOR',
  E_NODE_FAKE_SOURCE_ANCHOR: 'E_NODE_FAKE_SOURCE_ANCHOR',
  E_NODE_DUPLICATE_ID: 'E_NODE_DUPLICATE_ID',
  E_NODE_INVALID_KIND: 'E_NODE_INVALID_KIND',
  E_NODE_INVALID_LIFECYCLE: 'E_NODE_INVALID_LIFECYCLE',
  E_NODE_MISSING_REQUIRED: 'E_NODE_MISSING_REQUIRED',
  E_NODE_NO_PROMOTION_DECISION: 'E_NODE_NO_PROMOTION_DECISION',
  // WO2.1 — a SemanticNode MUST NOT carry a per-record `precedence`
  // override. The precedence table is authoritative. Records that try
  // to set a precedence field are rejected unconditionally.
  E_NODE_PRECEDENCE_OVERRIDE: 'E_NODE_PRECEDENCE_OVERRIDE',
  // WO2.1 — a kind='handoff' SemanticNode MUST back-link to at
  // least one `check_result` semantic-node id (via
  // `evidence_anchors`). A handoff node with no check_result is
  // fabricated evidence.
  E_HANDOFF_NODE_NO_CHECK_RESULT: 'E_HANDOFF_NODE_NO_CHECK_RESULT',
  E_PROMOTION_LLM_DIRECT_ACCEPT: 'E_PROMOTION_LLM_DIRECT_ACCEPT',
  E_PROMOTION_MISSING_EVIDENCE: 'E_PROMOTION_MISSING_EVIDENCE',
  E_PROMOTION_MISSING_OWNER: 'E_PROMOTION_MISSING_OWNER',
  E_PROMOTION_MISSING_SCOPE: 'E_PROMOTION_MISSING_SCOPE',
  E_TRANSITION_ILLEGAL: 'E_TRANSITION_ILLEGAL',
  E_STALE_PREMATURE: 'E_STALE_PREMATURE',
  E_STALE_FAKE_SUBJECT: 'E_STALE_FAKE_SUBJECT',
  E_CONFLICT_NO_OVERLAP: 'E_CONFLICT_NO_OVERLAP',
  E_CONFLICT_FAKE_CLAIMANT: 'E_CONFLICT_FAKE_CLAIMANT',
  E_HANDOFF_NO_CHECK_RESULT: 'E_HANDOFF_NO_CHECK_RESULT',
  E_HANDOFF_FAKE_CHECK_RESULT: 'E_HANDOFF_FAKE_CHECK_RESULT',
  // WO3 packet / materialize defect codes:
  E_PACKET_SCOPE_OVERLAP: 'E_PACKET_SCOPE_OVERLAP',
  E_PACKET_OP_OVERLAP: 'E_PACKET_OP_OVERLAP',
  E_PACKET_MISSING_CHECKS: 'E_PACKET_MISSING_CHECKS',
  E_PACKET_MISSING_EVIDENCE: 'E_PACKET_MISSING_EVIDENCE',
  E_PACKET_STALE_ANCHOR: 'E_PACKET_STALE_ANCHOR',
  E_PACKET_CHECK_NOT_PASSED: 'E_PACKET_CHECK_NOT_PASSED',
  E_PACKET_MATERIALIZATION_FAKE_ANCHOR: 'E_PACKET_MATERIALIZATION_FAKE_ANCHOR',
  E_PACKET_MATERIALIZATION_FAKE_CHECK: 'E_PACKET_MATERIALIZATION_FAKE_CHECK',
  E_MATERIALIZE_MISSING_PROMOTION: 'E_MATERIALIZE_MISSING_PROMOTION',
  E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED: 'E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED',
  E_MATERIALIZE_DECISION_SUPERSEDED: 'E_MATERIALIZE_DECISION_SUPERSEDED',
  E_MATERIALIZE_CHECK_NOT_PASSED: 'E_MATERIALIZE_CHECK_NOT_PASSED',
  E_MATERIALIZE_DIFF_OUT_OF_SCOPE: 'E_MATERIALIZE_DIFF_OUT_OF_SCOPE',
  E_MATERIALIZE_SCOPE_OVERLAP: 'E_MATERIALIZE_SCOPE_OVERLAP',
  E_CLOSE_NO_VALIDATED_PROPOSAL: 'E_CLOSE_NO_VALIDATED_PROPOSAL',
  E_PACKET_TASK_NOT_READY: 'E_PACKET_TASK_NOT_READY',
  E_TASK_NOT_FOUND: 'E_TASK_NOT_FOUND',
  // C8 — closeTask gate. A closeTask call MUST be rejected when
  // the latest evaluator run has an open P0 finding for the
  // task's scope (or when no evaluator run has been performed
  // since the latest task mutation). The gate is part of the
  // self-improvement loop: a task cannot be marked "closed"
  // while the evaluator is still flagging open P0 defects.
  E_CLOSE_FINDINGS_OPEN: 'E_CLOSE_FINDINGS_OPEN',
} as const

export type DefectCode = (typeof DEFECT_CODES)[keyof typeof DEFECT_CODES]

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

function asObject(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function isLifecycleState(value: unknown): value is LifecycleState {
  return typeof value === 'string' && (LIFECYCLE_STATES as ReadonlyArray<string>).includes(value)
}

function isNodeKind(value: unknown): value is SemanticNodeKind {
  return typeof value === 'string' && (SEMANTIC_NODE_KINDS as ReadonlyArray<string>).includes(value)
}

function isProvenanceKind(value: unknown): value is AutopoiesisProvenance {
  return (
    typeof value === 'string' &&
    (AUTOPOIESIS_PROVENANCES as ReadonlyArray<string>).includes(value)
  )
}

function severityForCode(code: string): 'P0' | 'P1' | 'P2' {
  // The P0/P1 split is stable across the validator: every defect
  // listed in the work order's negative controls is a P0 because
  // each one is a control-plane bypass. P1 is reserved for soft
  // warnings that the validator surfaces via the warnings array.
  void code
  return 'P0'
}

function defect(
  code: string,
  message: string,
  affected_record?: string,
  recommended_next_action?: string,
): AutopoiesisDefect {
  const issue: AutopoiesisDefect = {
    severity: severityForCode(code),
    code,
    message,
  }
  if (affected_record !== undefined) issue.affected_record = affected_record
  if (recommended_next_action !== undefined)
    issue.recommended_next_action = recommended_next_action
  return issue
}

/* -------------------------------------------------------------------------- */
/*                          Source-anchor helper                              */
/* -------------------------------------------------------------------------- */

/**
 * Read the relation-kernel `source-anchors.ndjson` once and return
 * a map from `anchor_id` to the live `SourceAnchor` record. The
 * autopoiesis validator uses this to confirm that anchors
 * referenced from a StalenessRecord or ConflictRecord are still
 * `fresh` on disk.
 *
 * The autopoiesis component is read-only on this file (and on the
 * rest of `.atelier/v0/**`); it never mutates it.
 */
type AnchorIndexEntry = {
  id: string
  status: string
  [k: string]: unknown
}

async function readAnchorIndex(): Promise<Map<string, AnchorIndexEntry>> {
  const anchorsFile = path.join(atelierV0Root(), 'anchors', 'source-anchors.ndjson')
  const rows = await readNdjson<AnchorIndexEntry>(anchorsFile).catch(() => [] as AnchorIndexEntry[])
  const map = new Map<string, AnchorIndexEntry>()
  for (const a of rows) {
    if (typeof a.id === 'string') map.set(a.id, a)
  }
  return map
}

/* -------------------------------------------------------------------------- */
/*                              Scopes overlap                                */
/* -------------------------------------------------------------------------- */

/**
 * Decide whether two authority scopes overlap. The function is
 * intentionally simple:
 *
 *   - A `global` scope overlaps with anything.
 *   - Two `path` scopes overlap when one pattern is a prefix of
 *     the other after stripping the trailing `/**` glob. The
 *     pattern `.atelier-bootstrap/**` therefore overlaps with
 *     `.atelier-bootstrap/autopoiesis/**` (a directory subtree).
 *   - Two `task` scopes overlap when their `task_id` matches.
 *   - Two `kind` scopes overlap when their `node_kind` matches.
 *   - Mixed kinds (e.g. `path` vs `task`) DO NOT overlap unless one
 *     of the records is `global`.
 */
function stripGlobSuffix(pattern: string): string {
  if (pattern.endsWith('/**')) return pattern.slice(0, -3)
  if (pattern.endsWith('/*')) return pattern.slice(0, -2)
  return pattern
}

function scopesOverlap(a: AuthorityScope | undefined, b: AuthorityScope | undefined): boolean {
  if (!a || !b) return false
  if (a.kind === 'global' || b.kind === 'global') return true
  if (a.kind === b.kind) {
    if (a.kind === 'path' && a.pattern && b.pattern) {
      if (a.pattern === b.pattern) return true
      const aStripped = stripGlobSuffix(a.pattern)
      const bStripped = stripGlobSuffix(b.pattern)
      if (aStripped === bStripped) return true
      const shorter = aStripped.length <= bStripped.length ? aStripped : bStripped
      const longer = aStripped.length <= bStripped.length ? bStripped : aStripped
      if (longer.startsWith(shorter + '/') || shorter.startsWith(longer + '/')) {
        return true
      }
      return false
    }
    if (a.kind === 'task' && a.task_id && b.task_id) {
      return a.task_id === b.task_id
    }
    if (a.kind === 'kind' && a.node_kind && b.node_kind) {
      return a.node_kind === b.node_kind
    }
  }
  return false
}

/* -------------------------------------------------------------------------- */
/*                                Validator                                   */
/* -------------------------------------------------------------------------- */

/**
 * Validate every autopoiesis NDJSON file. Returns a list of defects
 * (empty on success). The CLI exits 0 only when `issues.length === 0`.
 */
export async function validateAutopoiesis(): Promise<ValidationResult> {
  const issues: AutopoiesisDefect[] = []
  const warnings: string[] = []

  const semanticNodes = await readNdjson<SemanticNode>(AUTOPOIESIS_PATHS.semanticNodes)
  const promotionDecisions = await readNdjson<PromotionDecisionRecord>(
    AUTOPOIESIS_PATHS.promotionDecisions,
  )
  const stalenessRecords = await readNdjson<StalenessRecord>(AUTOPOIESIS_PATHS.stalenessRecords)
  const conflictRecords = await readNdjson<ConflictRecord>(AUTOPOIESIS_PATHS.conflictRecords)
  const authorityRules = await readNdjson<AuthorityRule>(AUTOPOIESIS_PATHS.authorityRules)
  const controlPackets = await readNdjson<ControlPacket>(AUTOPOIESIS_PATHS.controlPackets)
  const materializationProposals = await readNdjson<MaterializationProposal>(
    AUTOPOIESIS_PATHS.materializationProposals,
  )
  const handoffs = await readNdjson<SubagentHandoff>(AUTOPOIESIS_PATHS.handoffs)

  const anchorIndex = await readAnchorIndex()

  /* ---------------------------------------------------------------------- */
  /*  1. Duplicate id detection                                            */
  /* ---------------------------------------------------------------------- */

  const seenIds = new Map<string, string>() // id -> origin file
  const fileBundles: ReadonlyArray<readonly [string, ReadonlyArray<{ id?: unknown }>]> = [
    ['semantic-nodes', semanticNodes],
    ['promotion-decisions', promotionDecisions],
    ['staleness-records', stalenessRecords],
    ['conflicts', conflictRecords],
    ['authority-rules', authorityRules],
    ['control-packets', controlPackets],
    ['materialization-proposals', materializationProposals],
    ['handoffs', handoffs],
  ]
  for (const [file, records] of fileBundles) {
    for (const r of records) {
      const id = r.id
      if (typeof id === 'string') {
        if (seenIds.has(id)) {
          issues.push(
            defect(
              'E_NODE_DUPLICATE_ID',
              `Duplicate id '${id}' in ${file}.ndjson (already present in ${seenIds.get(id)}.ndjson)`,
              id,
              `Remove or rename the duplicate '${id}' record.`,
            ),
          )
        } else {
          seenIds.set(id, file)
        }
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  2. SemanticNode validation                                            */
  /* ---------------------------------------------------------------------- */

  // Build the decisions-by-subject index once. The validator uses
  // it to enforce E_NODE_NO_PROMOTION_DECISION: every SemanticNode
  // in `accepted`/`verified` must have a matching PromotionDecision
  // with the same `subject_id` and `to_state`.
  const decisionsBySubject = new Map<string, PromotionDecisionRecord[]>()
  for (const dec of promotionDecisions) {
    const dr = asObject(dec)
    if (!dr) continue
    const subjectId = asString(dr['subject_id'])
    if (!subjectId) continue
    const list = decisionsBySubject.get(subjectId)
    if (list) {
      list.push(dr as unknown as PromotionDecisionRecord)
    } else {
      decisionsBySubject.set(subjectId, [dr as unknown as PromotionDecisionRecord])
    }
  }

  const semanticById = new Map<string, Record<string, unknown>>()
  for (const node of semanticNodes) {
    const rec = asObject(node)
    if (!rec) {
      issues.push(defect('E_NODE_MISSING_REQUIRED', 'SemanticNode is not an object'))
      continue
    }
    const id = asString(rec['id'])
    if (id) semanticById.set(id, rec)

    if (rec['schema'] !== 'atelier.semantic-node/v1') {
      issues.push(
        defect(
          'E_NODE_MISSING_REQUIRED',
          `SemanticNode missing or invalid schema (expected 'atelier.semantic-node/v1', got ${JSON.stringify(
            rec['schema'],
          )})`,
          id,
        ),
      )
    }
    if (typeof rec['id'] !== 'string') {
      issues.push(defect('E_NODE_MISSING_REQUIRED', 'SemanticNode missing id', id))
    }
    if (!isNodeKind(rec['kind'])) {
      issues.push(
        defect(
          'E_NODE_INVALID_KIND',
          `SemanticNode has invalid kind: ${JSON.stringify(rec['kind'])}`,
          id,
        ),
      )
    }
    if (!isLifecycleState(rec['lifecycle_state'])) {
      issues.push(
        defect(
          'E_NODE_INVALID_LIFECYCLE',
          `SemanticNode has invalid lifecycle_state: ${JSON.stringify(rec['lifecycle_state'])}`,
          id,
        ),
      )
    }
    if (!isProvenanceKind(rec['provenance_kind'])) {
      issues.push(
        defect(
          'E_NODE_MISSING_REQUIRED',
          `SemanticNode has invalid provenance_kind: ${JSON.stringify(rec['provenance_kind'])}`,
          id,
        ),
      )
    }
    if (!asObject(rec['authority_scope'])) {
      issues.push(
        defect('E_NODE_MISSING_REQUIRED', 'SemanticNode missing or invalid authority_scope', id),
      )
    }
    if (typeof rec['created_at'] !== 'string') {
      issues.push(
        defect('E_NODE_MISSING_REQUIRED', 'SemanticNode missing created_at', id),
      )
    }
    if (typeof rec['produced_by'] !== 'string') {
      issues.push(
        defect('E_NODE_MISSING_REQUIRED', 'SemanticNode missing produced_by', id),
      )
    }

    // E_NODE_PRECEDENCE_OVERRIDE (WO2.1-RT-1) — a SemanticNode MUST
    // NOT carry a per-record `precedence` override. The class
    // precedence is authoritative and comes from
    // `DEFAULT_PRECEDENCE` or the on-disk `AuthorityRule`. Records
    // that try to slip a precedence field in via the
    // `[key: string]: unknown` index signature are rejected
    // unconditionally. The resolver's winner-pick loop NEVER reads
    // `node.precedence`; the validator enforces that the field
    // cannot exist at all.
    if ('precedence' in rec && rec['precedence'] !== undefined) {
      issues.push(
        defect(
          'E_NODE_PRECEDENCE_OVERRIDE',
          `SemanticNode '${id ?? '<no-id>'}' carries a 'precedence' field; per-record precedence overrides are forbidden. ` +
            `The precedence for the class comes from DEFAULT_PRECEDENCE or the on-disk AuthorityRule, never from the node itself.`,
          id,
          `Remove the 'precedence' field from the record; set the precedence on the corresponding AuthorityRule (.atelier/v0/autopoiesis/authority-rules.ndjson) instead.`,
        ),
      )
    }

    // E_HANDOFF_NODE_NO_CHECK_RESULT (WO2.1-RT-4) — a
    // kind='handoff' SemanticNode MUST back-link to at least one
    // `check_result` semantic-node id via `evidence_anchors`. The
    // list MUST be non-empty. The cross-reference check (every
    // entry resolves to a real kind='check_result' node) is
    // deferred to a second pass below, so that handoff nodes may
    // cite check_result nodes that appear later in the same file.
    if (rec['kind'] === 'handoff') {
      const evidenceAnchors = rec['evidence_anchors']
      if (!Array.isArray(evidenceAnchors) || evidenceAnchors.length === 0) {
        issues.push(
          defect(
            'E_HANDOFF_NODE_NO_CHECK_RESULT',
            `SemanticNode '${id ?? '<no-id>'}' has kind='handoff' but evidence_anchors is empty or missing; ` +
              `a handoff node MUST back-link to at least one kind='check_result' semantic-node id.`,
            id,
            'Add at least one entry to evidence_anchors whose anchor_id (or check_result_id) is the id of a kind=check_result SemanticNode.',
          ),
        )
      }
    }

    // E_NODE_NO_SOURCE_ANCHOR — the work order's first negative
    // control. The validator rejects every SemanticNode that is not
    // pinned to at least one SourceAnchorRef.
    const anchors = rec['source_anchors']
    if (!Array.isArray(anchors) || anchors.length === 0) {
      issues.push(
        defect(
          'E_NODE_NO_SOURCE_ANCHOR',
          `SemanticNode '${id ?? '<no-id>'}' has empty source_anchors (≥1 required)`,
          id,
          'Add at least one SourceAnchorRef to source_anchors.',
        ),
      )
    } else {
      // E_NODE_FAKE_SOURCE_ANCHOR (WO1-RT-3) — every cited anchor
      // must be present in the relation-kernel anchor index built
      // at the top of this function. We surface the first missing
      // id per node to keep the defect list compact; subsequent
      // missing ids for the same node are skipped.
      let fakeAnchorReported = false
      for (const a of anchors) {
        const ao = asObject(a)
        const anchorId = asString(ao?.['anchor_id'])
        if (anchorId && !anchorIndex.has(anchorId)) {
          if (!fakeAnchorReported) {
            issues.push(
              defect(
                'E_NODE_FAKE_SOURCE_ANCHOR',
                `SemanticNode '${id ?? '<no-id>'}' cites source_anchor.anchor_id='${anchorId}' which is ` +
                  `not present in the relation-kernel anchor index (${path.join(
                    atelierV0Root(),
                    'anchors',
                    'source-anchors.ndjson',
                  )}).`,
                id,
                `Either create a matching SourceAnchor in the index, or change the source_anchor to one that already exists.`,
              ),
            )
            fakeAnchorReported = true
          }
        }
      }
    }

    const lifecycle = rec['lifecycle_state']
    const provenance = rec['provenance_kind']
    const evidenceRefs = rec['evidence_refs']
    const inAcceptedOrVerified =
      isLifecycleState(lifecycle) && (lifecycle === 'accepted' || lifecycle === 'verified')

    // E_PROMOTION_LLM_DIRECT_ACCEPT — the work order's second
    // negative control. The check is UNCONDITIONAL for LLM-derived
    // records: any SemanticNode with
    //   lifecycle_state ∈ {accepted, verified}
    //   AND provenance_kind ∈ {llm_extracted, llm_derived}
    // is rejected, REGARDLESS of `evidence_refs` or any other
    // escape hatch. LLM output cannot be promoted to
    // `accepted`/`verified` no matter how much evidence is attached
    // (the work order's WO1-RT-1 fix).
    if (
      inAcceptedOrVerified &&
      isProvenanceKind(provenance) &&
      isLlmProvenance(provenance)
    ) {
      issues.push(
        defect(
          'E_PROMOTION_LLM_DIRECT_ACCEPT',
          `SemanticNode '${id ?? '<no-id>'}' has provenance_kind='${provenance}' and lifecycle_state='${lifecycle}'; ` +
            `LLM-derived records cannot reach accepted/verified state, regardless of evidence_refs.`,
          id,
          'Re-source the record with deterministic, manual, or runtime provenance, or move it to a non-accepted state.',
        ),
      )
    }

    // E_PROMOTION_MISSING_EVIDENCE / E_PROMOTION_MISSING_OWNER /
    // E_PROMOTION_MISSING_SCOPE — the work order's WO1-RT-2 fix.
    // Every SemanticNode in `accepted`/`verified` must carry:
    //   - non-empty `evidence_refs` (every entry a non-empty string)
    //   - non-empty `owner_or_policy`
    //   - a non-empty `authority_scope` object
    // This applies to ALL records (LLM or not). The check is
    // independent from E_PROMOTION_LLM_DIRECT_ACCEPT so LLM
    // records get a clear code for the actual root cause.
    if (inAcceptedOrVerified) {
      if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
        issues.push(
          defect(
            'E_PROMOTION_MISSING_EVIDENCE',
            `SemanticNode '${id ?? '<no-id>'}' has lifecycle_state='${lifecycle}' but evidence_refs is ` +
              `empty or missing (≥1 non-empty string required for accepted/verified).`,
            id,
            'Add at least one non-empty evidence_ref string (e.g. a runtime evidence id).',
          ),
        )
      } else {
        let badEvidence = false
        for (const ref of evidenceRefs) {
          if (typeof ref !== 'string' || ref.trim() === '') {
            badEvidence = true
            break
          }
        }
        if (badEvidence) {
          issues.push(
            defect(
              'E_PROMOTION_MISSING_EVIDENCE',
              `SemanticNode '${id ?? '<no-id>'}' has lifecycle_state='${lifecycle}' but evidence_refs ` +
                `contains at least one entry that is not a non-empty string.`,
              id,
              'Replace non-string / empty entries in evidence_refs with non-empty string ids.',
            ),
          )
        }
      }

      const owner = rec['owner_or_policy']
      if (typeof owner !== 'string' || owner.trim() === '') {
        issues.push(
          defect(
            'E_PROMOTION_MISSING_OWNER',
            `SemanticNode '${id ?? '<no-id>'}' has lifecycle_state='${lifecycle}' but owner_or_policy ` +
              `is missing or empty.`,
            id,
            'Set owner_or_policy to a human or machine-readable owner (e.g. "human:reviewer").',
          ),
        )
      }

      const authScope = asObject(rec['authority_scope'])
      if (!authScope) {
        issues.push(
          defect(
            'E_PROMOTION_MISSING_SCOPE',
            `SemanticNode '${id ?? '<no-id>'}' has lifecycle_state='${lifecycle}' but authority_scope ` +
              `is missing or not an object.`,
            id,
            'Set authority_scope to a structured AuthorityScope object describing where the record applies.',
          ),
        )
      }
    }

    // E_NODE_NO_PROMOTION_DECISION — the work order's WO1-RT-4 fix.
    // Every SemanticNode in `accepted`/`verified` must have at
    // least one matching PromotionDecisionRecord in
    // `.atelier/v0/autopoiesis/promotion-decisions.ndjson` with
    //   subject_id == node.id
    //   to_state   == node.lifecycle_state
    //   decision   == 'accepted'
    // Without that record the lifecycle move was never approved.
    if (inAcceptedOrVerified && id) {
      const decisions = decisionsBySubject.get(id) ?? []
      const matching = decisions.find(
        (d) => (d as unknown as Record<string, unknown>)['to_state'] === lifecycle,
      )
      const decisionKind = matching
        ? asString((matching as unknown as Record<string, unknown>)['decision'])
        : undefined
      if (!matching || decisionKind !== 'accepted') {
        issues.push(
          defect(
            'E_NODE_NO_PROMOTION_DECISION',
            `SemanticNode '${id}' has lifecycle_state='${lifecycle}' but no matching PromotionDecision ` +
              `(subject_id='${id}', to_state='${lifecycle}', decision='accepted') is present in ` +
              `${path.join(autopoiesisRoot(), 'promotion-decisions.ndjson')}.`,
            id,
            `Append a PromotionDecisionRecord for '${id}' recording the '${lifecycle}' promotion.`,
          ),
        )
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  2b. SemanticNode handoff cross-reference (second pass)                 */
  /* ---------------------------------------------------------------------- */

  // The main loop above rejects every kind='handoff' SemanticNode
  // whose `evidence_anchors` is empty. This second pass enforces
  // the cross-reference: every entry in `evidence_anchors` MUST
  // resolve to a real kind='check_result' SemanticNode in the
  // index. The pass runs after the index is fully built so that
  // handoff nodes may cite check_result nodes that appear later
  // in the same NDJSON file.
  for (const [, rec] of semanticById) {
    if (rec['kind'] !== 'handoff') continue
    const id = asString(rec['id'])
    const evidenceAnchors = rec['evidence_anchors']
    if (!Array.isArray(evidenceAnchors) || evidenceAnchors.length === 0) {
      // The empty-anchors case was already reported in the first
      // pass. Skip here to avoid double-counting.
      continue
    }
    let handoffBad: { reason: string } | null = null
    for (const ea of evidenceAnchors) {
      const eo = asObject(ea)
      if (!eo) {
        handoffBad = { reason: 'evidence_anchors entry is not an object' }
        break
      }
      // evidence_anchors entries MAY carry either an `anchor_id`
      // (the SourceAnchorRef shape) or a `check_result_id`
      // (the explicit handoff backlink shape). We accept both
      // forms: an `anchor_id` is treated as a candidate id
      // (looked up in the semantic-nodes index), and a
      // `check_result_id` is also looked up. The cited node
      // MUST exist AND have kind='check_result'.
      const candidate = asString(eo['anchor_id']) ?? asString(eo['check_result_id'])
      if (!candidate) {
        handoffBad = { reason: 'evidence_anchors entry has no anchor_id or check_result_id' }
        break
      }
      const subject = semanticById.get(candidate)
      if (!subject) {
        handoffBad = { reason: `cited id '${candidate}' is not in the semantic-nodes index` }
        break
      }
      if (subject['kind'] !== 'check_result') {
        handoffBad = {
          reason: `cited id '${candidate}' has kind='${String(subject['kind'])}', expected kind='check_result'`,
        }
        break
      }
    }
    if (handoffBad) {
      // Suppress duplicate if the empty-list defect was already
      // raised in the first pass (the first pass covers only the
      // empty case; this pass covers the cross-reference case).
      const alreadyReported = issues.some(
        (i) =>
          i.code === 'E_HANDOFF_NODE_NO_CHECK_RESULT' && i.affected_record === id,
      )
      if (!alreadyReported) {
        issues.push(
          defect(
            'E_HANDOFF_NODE_NO_CHECK_RESULT',
            `SemanticNode '${id ?? '<no-id>'}' has kind='handoff' but at least one evidence_anchors entry ` +
              `does not resolve to a real kind='check_result' SemanticNode in the index (${handoffBad.reason}).`,
            id,
            'Set every evidence_anchors[*].anchor_id (or .check_result_id) to the id of an existing kind=check_result SemanticNode.',
          ),
        )
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  3. PromotionDecision validation                                       */
  /* ---------------------------------------------------------------------- */

  for (const dec of promotionDecisions) {
    const rec = asObject(dec)
    if (!rec) continue
    const id = asString(rec['id'])
    if (rec['schema'] !== 'atelier.promotion-decision/v1') {
      issues.push(
        defect(
          'E_NODE_MISSING_REQUIRED',
          `PromotionDecision missing schema='atelier.promotion-decision/v1' (got ${JSON.stringify(
            rec['schema'],
          )})`,
          id,
        ),
      )
    }
    const from = rec['from_state']
    const to = rec['to_state']
    if (!isLifecycleState(from) || !isLifecycleState(to)) {
      issues.push(
        defect(
          'E_NODE_INVALID_LIFECYCLE',
          `PromotionDecision has invalid from_state/to_state: ${JSON.stringify(
            from,
          )} -> ${JSON.stringify(to)}`,
          id,
        ),
      )
      continue
    }
    // E_TRANSITION_ILLEGAL — the work order's third and fourth
    // negative controls. Every recorded transition must be in the
    // table; illegal moves such as `accepted → proposed` and
    // `proposed → verified` are rejected.
    if (!TRANSITIONS[from].has(to)) {
      const legal = Array.from(TRANSITIONS[from])
      issues.push(
        defect(
          'E_TRANSITION_ILLEGAL',
          `Illegal lifecycle transition in PromotionDecision: ${from} -> ${to} (legal next states from '${from}': ${
            legal.length > 0 ? legal.join(', ') : '(none)'
          })`,
          id,
          `Use a legal transition; the table forbids '${from}' to '${to}'.`,
        ),
      )
    }
    // E_PROMOTION_LLM_DIRECT_ACCEPT — the work order's fifth
    // negative control. A PromotionDecision cannot accept a record
    // whose provenance is LLM-derived/extracted.
    const subjectId = asString(rec['subject_id'])
    const decision = asString(rec['decision'])
    if (subjectId && decision === 'accepted') {
      const subject = semanticById.get(subjectId)
      if (subject) {
        const subjectProvenance = subject['provenance_kind']
        if (
          isProvenanceKind(subjectProvenance) &&
          isLlmProvenance(subjectProvenance)
        ) {
          issues.push(
            defect(
              'E_PROMOTION_LLM_DIRECT_ACCEPT',
              `PromotionDecision '${id ?? '<no-id>'}' accepts '${subjectId}' with provenance_kind='${subjectProvenance}'; ` +
                `LLM-derived records cannot be accepted directly.`,
              id,
              'Re-source the subject record with deterministic, manual, or runtime evidence before promoting.',
            ),
          )
        }
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  4. StalenessRecord validation                                         */
  /* ---------------------------------------------------------------------- */

  for (const sr of stalenessRecords) {
    const rec = asObject(sr)
    if (!rec) continue
    const id = asString(rec['id'])
    if (rec['schema'] !== 'atelier.staleness-record/v1') {
      issues.push(
        defect(
          'E_NODE_MISSING_REQUIRED',
          `StalenessRecord missing schema='atelier.staleness-record/v1' (got ${JSON.stringify(
            rec['schema'],
          )})`,
          id,
        ),
      )
    }
    const anchorId = asString(rec['anchor_id'])
    if (!anchorId) {
      issues.push(
        defect('E_NODE_MISSING_REQUIRED', `StalenessRecord '${id ?? '<no-id>'}' missing anchor_id`, id),
      )
      continue
    }
    // E_STALE_FAKE_SUBJECT (WO1-RT-7) — the work order's
    // staleness back-link check. A StalenessRecord's `subject_id`
    // MUST exist in the semantic-nodes index built earlier. A
    // staleness record that pretends to describe a non-existent
    // subject is fabricated.
    const subjectId = asString(rec['subject_id'])
    if (subjectId && !semanticById.has(subjectId)) {
      issues.push(
        defect(
          'E_STALE_FAKE_SUBJECT',
          `StalenessRecord '${id ?? '<no-id>'}' has subject_id='${subjectId}' which is not present in ` +
            `the semantic-nodes index.`,
          id,
          `Either create a SemanticNode with id='${subjectId}', or change the subject_id to one that already exists.`,
        ),
      )
      continue
    }
    // E_STALE_PREMATURE — the work order's sixth negative control.
    // The validator cross-references the relation-kernel's
    // `source-anchors.ndjson` to confirm the anchor is no longer
    // fresh. If the anchor is still `fresh` (or unknown, which the
    // autopoiesis component treats as "fresh by default"), the
    // staleness record is rejected as premature.
    const anchor = anchorIndex.get(anchorId)
    if (anchor && anchor.status === 'fresh') {
      issues.push(
        defect(
          'E_STALE_PREMATURE',
          `StalenessRecord '${id ?? '<no-id>'}' claims anchor '${anchorId}' is no longer fresh, ` +
            `but the relation-kernel still reports status='fresh' for that anchor.`,
          id,
          'Either update the anchor status in `.atelier/v0/anchors/source-anchors.ndjson`, or remove the staleness record.',
        ),
      )
    } else if (!anchor) {
      // The anchor is unknown to the relation kernel. The
      // autopoiesis component cannot verify the staleness claim,
      // so it conservatively treats the record as premature.
      issues.push(
        defect(
          'E_STALE_PREMATURE',
          `StalenessRecord '${id ?? '<no-id>'}' references anchor '${anchorId}' which is not present in ` +
            `'.atelier/v0/anchors/source-anchors.ndjson'; the autopoiesis component cannot verify a non-fresh transition.`,
          id,
          'Make sure the anchor exists in the relation kernel before claiming it is stale.',
        ),
      )
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  5. ConflictRecord validation                                          */
  /* ---------------------------------------------------------------------- */

  for (const cr of conflictRecords) {
    const rec = asObject(cr)
    if (!rec) continue
    const id = asString(rec['id'])
    if (rec['schema'] !== 'atelier.conflict-record/v1') {
      issues.push(
        defect(
          'E_NODE_MISSING_REQUIRED',
          `ConflictRecord missing schema='atelier.conflict-record/v1' (got ${JSON.stringify(
            rec['schema'],
          )})`,
          id,
        ),
      )
    }
    const claimants = rec['claimants']
    if (!Array.isArray(claimants) || claimants.length < 2) {
      issues.push(
        defect(
          'E_NODE_MISSING_REQUIRED',
          `ConflictRecord '${id ?? '<no-id>'}' requires ≥2 claimants`,
          id,
        ),
      )
      continue
    }
    // E_CONFLICT_FAKE_CLAIMANT (WO1-RT-8) — every claimant's
    // `record_id` MUST exist in the semantic-nodes index. The
    // explicit `authority_scope` on a claimant is a HINT for the
    // overlap check below, but the claimants themselves must be
    // real records. A conflict that cites fake records is
    // fabricated regardless of overlap.
    let fakeClaimantReported = false
    for (const c of claimants) {
      const co = asObject(c) as ConflictClaimant | undefined
      if (!co) continue
      const recordId = asString(co['record_id'])
      if (recordId && !semanticById.has(recordId)) {
        if (!fakeClaimantReported) {
          issues.push(
            defect(
              'E_CONFLICT_FAKE_CLAIMANT',
              `ConflictRecord '${id ?? '<no-id>'}' cites claimants[].record_id='${recordId}' which is ` +
                `not present in the semantic-nodes index.`,
              id,
              `Either create a SemanticNode with id='${recordId}', or change the claimant to one that already exists.`,
            ),
          )
          fakeClaimantReported = true
        }
      }
    }
    // E_CONFLICT_NO_OVERLAP — the work order's seventh negative
    // control. The claimants must actually overlap in
    // authority_scope; otherwise the conflict is fabricated.
    const scopes: Array<AuthorityScope | undefined> = []
    for (const c of claimants) {
      const co = asObject(c) as ConflictClaimant | undefined
      if (!co) continue
      const explicitScope = asObject(co['authority_scope']) as AuthorityScope | undefined
      if (explicitScope) {
        scopes.push(explicitScope)
        continue
      }
      const recordId = asString(co['record_id'])
      const subject = recordId ? semanticById.get(recordId) : undefined
      scopes.push(asObject(subject?.['authority_scope']) as AuthorityScope | undefined)
    }
    let anyOverlap = false
    for (let i = 0; i < scopes.length; i++) {
      for (let j = i + 1; j < scopes.length; j++) {
        if (scopesOverlap(scopes[i], scopes[j])) {
          anyOverlap = true
          break
        }
      }
      if (anyOverlap) break
    }
    if (!anyOverlap) {
      issues.push(
        defect(
          'E_CONFLICT_NO_OVERLAP',
          `ConflictRecord '${id ?? '<no-id>'}' has claimants with no overlapping authority_scope`,
          id,
          'Either widen the claimants to records that actually overlap, or delete the fabricated conflict record.',
        ),
      )
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  6. SubagentHandoff validation                                         */
  /* ---------------------------------------------------------------------- */

  for (const ho of handoffs) {
    const rec = asObject(ho)
    if (!rec) continue
    const id = asString(rec['id'])
    if (rec['schema'] !== 'atelier.subagent-handoff/v1') {
      issues.push(
        defect(
          'E_NODE_MISSING_REQUIRED',
          `SubagentHandoff missing schema='atelier.subagent-handoff/v1' (got ${JSON.stringify(
            rec['schema'],
          )})`,
          id,
        ),
      )
    }
    // E_HANDOFF_NO_CHECK_RESULT — the work order's eighth negative
    // control. Every handoff MUST back-link to at least one
    // `check_result` SemanticNode id. A handoff with no
    // check_result ids is theatre.
    const checkResultIds = rec['check_result_ids']
    if (!Array.isArray(checkResultIds) || checkResultIds.length === 0) {
      issues.push(
        defect(
          'E_HANDOFF_NO_CHECK_RESULT',
          `SubagentHandoff '${id ?? '<no-id>'}' has no backlinked check_result (check_result_ids is empty)`,
          id,
          'Add at least one SemanticNode id with kind=check_result to check_result_ids.',
        ),
      )
    } else {
      // E_HANDOFF_FAKE_CHECK_RESULT (WO1-RT-6) — every cited
      // check_result_id MUST exist in the semantic-nodes index AND
      // resolve to a node with `kind='check_result'`. A handoff
      // that cites a fake or wrong-kind id is fabricated evidence.
      // We report the first offending id per handoff to keep the
      // defect list compact.
      let fakeReported = false
      for (const crid of checkResultIds) {
        if (typeof crid !== 'string') continue
        const node = semanticById.get(crid)
        if (!node || node['kind'] !== 'check_result') {
          if (!fakeReported) {
            issues.push(
              defect(
                'E_HANDOFF_FAKE_CHECK_RESULT',
                `SubagentHandoff '${id ?? '<no-id>'}' cites check_result_ids[]='${crid}' which is ` +
                  `not present in the semantic-nodes index as a kind='check_result' node.`,
                id,
                `Either create a SemanticNode with id='${crid}' and kind='check_result', or change the id to one that already exists.`,
              ),
            )
            fakeReported = true
          }
        }
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  7. Aggregate                                                          */
  /* ---------------------------------------------------------------------- */

  const duplicates = issues.filter((i) => i.code === 'E_NODE_DUPLICATE_ID').length
  // Count materialization-reports.ndjson lines; the file is
  // append-only, the validator counts it but does not check its
  // shape (each entry is a `atelier.materialization-validation/v1`
  // envelope emitted by the materialize:validate gate).
  const materializationReports = await readNdjson<Record<string, unknown>>(
    AUTOPOIESIS_PATHS.materializationReports,
  ).catch(() => [] as Record<string, unknown>[])
  return {
    issues,
    warnings,
    stats: {
      semantic_nodes: semanticNodes.length,
      promotion_decisions: promotionDecisions.length,
      staleness_records: stalenessRecords.length,
      conflict_records: conflictRecords.length,
      authority_rules: authorityRules.length,
      control_packets: controlPackets.length,
      materialization_proposals: materializationProposals.length,
      materialization_reports: materializationReports.length,
      handoffs: handoffs.length,
      duplicates,
    },
  }
}
