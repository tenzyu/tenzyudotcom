/**
 * Atelier Autopoiesis — MaterializationProposal producer + validator.
 *
 * The materialization gate is the second pillar of the autopoiesis
 * control plane. It runs after the agent claims it has finished
 * editing files; the gate decides whether the agent's claimed
 * edits are allowed to land in the repo. The gate answers:
 *
 *   1. Has the proposal been promoted to `accepted`?
 *   2. Does every `affected_requirement` live in
 *      lifecycle_state ∈ {accepted, verified} with fresh anchors?
 *   3. Does every `affected_decision` live in lifecycle_state
 *      ∉ {superseded, invalidated}?
 *   4. Does every `required_check` have a real
 *      `check_result` semantic-node, with status='passed', a
 *      non-empty `raw_output_ref`, AND a matching
 *      `PromotionDecision` with to_state='verified' (for the
 *      check_result itself)?
 *   5. Is every `diff_refs[].path` in `allowed_files` AND not in
 *      `forbidden_files`?
 *   6. Are `allowed_files` and `forbidden_files` disjoint?
 *
 * When the gate rejects, it emits a structured defect list with
 * the canonical codes:
 *
 *   E_MATERIALIZE_MISSING_PROMOTION
 *   E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED
 *   E_MATERIALIZE_DECISION_SUPERSEDED
 *   E_MATERIALIZE_CHECK_NOT_PASSED
 *   E_MATERIALIZE_DIFF_OUT_OF_SCOPE
 *   E_MATERIALIZE_SCOPE_OVERLAP
 *
 * On success the proposal is set to status='validated' and
 * lifecycle_state='accepted' (via the lifecycle transition +
 * PromotionDecision). On failure the proposal is left untouched
 * and the report is appended to
 * `.atelier/v0/autopoiesis/materialization-reports.ndjson`.
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { atelierV0Root } from '../../../lib/src/paths.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis, readNdjsonAutopoiesisTolerant } from './store.ts'
import { AUTOPOIESIS_PATHS } from './paths.ts'
import { pathsOverlap, globCovers } from './packet.ts'
import { withStalenessFilter } from './authority.ts'
import { transition } from './lifecycle.ts'
import type { AtelierIssue } from '../../../lib/src/results.ts'
import type {
  MaterializationDiffRef,
  MaterializationProposal,
  PromotionDecisionRecord,
  SemanticNode,
} from './records.ts'

/* -------------------------------------------------------------------------- */
/*                              Public types                                   */
/* -------------------------------------------------------------------------- */

export type MaterializeDefect = AtelierIssue

export type CreateProposalOptions = {
  taskId: string
  /** A reference (id) of the diff being proposed. */
  diffRef: string
  affectedRequirements?: string[]
  affectedFindings?: string[]
  affectedDecisions?: string[]
  requiredChecks?: string[]
  diffRefs?: MaterializationDiffRef[]
  allowedFiles?: string[]
  forbiddenFiles?: string[]
  ownerOrPolicy?: string
  producedBy?: string
  createdAt?: string
}

export type CreateProposalResult =
  | { ok: true; proposal: MaterializationProposal }
  | { ok: false; code: 'E_TASK_NOT_FOUND'; message: string }

export type MaterializeValidationReport = {
  schema: 'atelier.materialization-validation/v1'
  proposal_id: string
  task_id: string
  status: 'validated' | 'rejected'
  started_at: string
  finished_at: string
  duration_ms: number
  defects: MaterializeDefect[]
  warnings: string[]
  promotion_decision_id: string | null
}

export type MaterializeValidationResult = {
  report: MaterializeValidationReport
  proposal: MaterializationProposal
}

/* -------------------------------------------------------------------------- */
/*                              Index loaders                                  */
/* -------------------------------------------------------------------------- */

type AnchorRow = { id: string; status: string; path?: string }

async function loadSourceAnchors(): Promise<Map<string, AnchorRow>> {
  const file = path.join(atelierV0Root(), 'anchors', 'source-anchors.ndjson')
  const rows = await readNdjson<AnchorRow>(file).catch(() => [] as AnchorRow[])
  const map = new Map<string, AnchorRow>()
  for (const r of rows) {
    if (typeof r.id === 'string') map.set(r.id, r)
  }
  return map
}

async function loadSemanticNodes(): Promise<SemanticNode[]> {
  return readNdjsonAutopoiesis<SemanticNode>(AUTOPOIESIS_PATHS.semanticNodes)
}

async function loadPromotionDecisions(): Promise<PromotionDecisionRecord[]> {
  return readNdjsonAutopoiesis<PromotionDecisionRecord>(
    AUTOPOIESIS_PATHS.promotionDecisions,
  )
}

async function loadImplementationTask(taskId: string): Promise<{
  id: string
  status?: string
  allowed_files?: string[]
  forbidden_files?: string[]
  task_id?: string
  source_anchor_ids?: string[]
} | null> {
  const file = path.join(
    atelierV0Root(),
    'transforms',
    'md-to-code',
    'model',
    'implementation-tasks.ndjson',
  )
  const rows = await readNdjson<{
    id: string
    status?: string
    allowed_files?: string[]
    forbidden_files?: string[]
    task_id?: string
    source_anchor_ids?: string[]
  }>(file).catch(() => [] as Array<{
    id: string
    status?: string
    allowed_files?: string[]
    forbidden_files?: string[]
    task_id?: string
    source_anchor_ids?: string[]
  }>)
  return rows.find((r) => r.id === taskId || r.task_id === taskId) ?? null
}

/* -------------------------------------------------------------------------- */
/*                              Defect helpers                                 */
/* -------------------------------------------------------------------------- */

function defect(
  code: string,
  message: string,
  affected_record?: string,
  recommended_next_action?: string,
): MaterializeDefect {
  const issue: MaterializeDefect = {
    severity: 'P0',
    code,
    message,
  }
  if (affected_record !== undefined) issue.affected_record = affected_record
  if (recommended_next_action !== undefined)
    issue.recommended_next_action = recommended_next_action
  return issue
}

/* -------------------------------------------------------------------------- */
/*                              createProposal                                 */
/* -------------------------------------------------------------------------- */

/**
 * Build a MaterializationProposal from a task id and a diff
 * reference. The proposal is persisted to
 * `.atelier/v0/autopoiesis/materialization-proposals.ndjson` and
 * returned to the caller. The proposal's lifecycle_state is
 * always 'observed' on creation; promotion to 'accepted' is the
 * job of `validateProposal` after all checks pass.
 */
export async function createProposal(
  taskId: string,
  opts: CreateProposalOptions,
): Promise<CreateProposalResult> {
  const task = await loadImplementationTask(taskId)
  if (!task) {
    return {
      ok: false,
      code: 'E_TASK_NOT_FOUND',
      message: `ImplementationTask '${taskId}' not found; cannot build a proposal.`,
    }
  }

  const createdAt = opts.createdAt ?? new Date().toISOString()
  const proposalId = `prop:${createHash('sha256')
    .update(`materialize|${taskId}|${opts.diffRef}|${createdAt}`)
    .digest('hex')
    .slice(0, 16)}`

  const packetSourceAnchors = (task.source_anchor_ids ?? []).map((aid) => ({
    anchor_id: aid,
  }))

  const proposal: MaterializationProposal = {
    schema: 'atelier.materialization-proposal/v1',
    id: proposalId,
    task_id: taskId,
    lifecycle_state: 'observed',
    authority_scope: { kind: 'task', task_id: taskId },
    source_anchors: packetSourceAnchors,
    evidence_anchors: [],
    owner_or_policy: opts.ownerOrPolicy ?? 'atelier-autopoiesis-implementer',
    provenance_kind: 'derived',
    produced_by: opts.producedBy ?? 'atelier-autopoiesis-implementer',
    created_at: createdAt,
    affected_requirements: opts.affectedRequirements ?? [],
    affected_findings: opts.affectedFindings ?? [],
    affected_decisions: opts.affectedDecisions ?? [],
    required_checks: opts.requiredChecks ?? [],
    diff_refs: opts.diffRefs ?? [{ path: opts.diffRef, kind: 'modify' }],
    allowed_files: opts.allowedFiles ?? task.allowed_files ?? [],
    forbidden_files: opts.forbiddenFiles ?? task.forbidden_files ?? [],
    status: 'proposed',
    defects: [],
  }

  await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, proposal)
  return { ok: true, proposal }
}

/* -------------------------------------------------------------------------- */
/*                              validateProposal                               */
/* -------------------------------------------------------------------------- */

export type ValidateProposalOptions = {
  /** Pre-loaded semantic-nodes (for tests). */
  semanticNodes?: SemanticNode[]
  /** Pre-loaded source-anchors (for tests). */
  sourceAnchors?: Map<string, AnchorRow>
  /** Pre-loaded promotion-decisions (for tests). */
  promotionDecisions?: PromotionDecisionRecord[]
  /**
   * When `true`, the validator persists the validation report to
   * `.atelier/v0/autopoiesis/materialization-reports.ndjson`.
   * Default: `true`.
   */
  persistReport?: boolean
}

/**
 * Validate a MaterializationProposal. Returns the report, the
 * updated proposal (with status='validated' on success), and a
 * list of defects (empty on success). On success, the proposal is
 * promoted to lifecycle_state='accepted' (via the lifecycle
 * transition + an appended PromotionDecision).
 */
export async function validateProposal(
  proposalId: string,
  opts: ValidateProposalOptions = {},
): Promise<MaterializeValidationResult> {
  const startedAt = new Date().toISOString()
  const proposals = await readNdjsonAutopoiesis<MaterializationProposal>(
    AUTOPOIESIS_PATHS.materializationProposals,
  )
  const proposal = proposals.find((p) => p.id === proposalId)
  if (!proposal) {
    const report: MaterializeValidationReport = {
      schema: 'atelier.materialization-validation/v1',
      proposal_id: proposalId,
      task_id: '<unknown>',
      status: 'rejected',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      duration_ms: 0,
      defects: [
        defect(
          'E_NODE_MISSING_REQUIRED',
          `MaterializationProposal '${proposalId}' not found in .atelier/v0/autopoiesis/materialization-proposals.ndjson.`,
        ),
      ],
      warnings: [],
      promotion_decision_id: null,
    }
    if (opts.persistReport !== false) {
      await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationReports, report)
    }
    return { report, proposal: proposal as unknown as MaterializationProposal }
  }

  const [semanticNodes, anchors, decisions] = await Promise.all([
    Promise.resolve(opts.semanticNodes ?? (await loadSemanticNodes())),
    Promise.resolve(opts.sourceAnchors ?? (await loadSourceAnchors())),
    Promise.resolve(opts.promotionDecisions ?? (await loadPromotionDecisions())),
  ])

  const semanticById = new Map<string, SemanticNode>()
  for (const n of semanticNodes) {
    if (typeof n.id === 'string') semanticById.set(n.id, n)
  }

  const decisionsBySubject = new Map<string, PromotionDecisionRecord[]>()
  for (const d of decisions) {
    const subject = d.subject_id
    if (typeof subject !== 'string') continue
    const list = decisionsBySubject.get(subject)
    if (list) list.push(d)
    else decisionsBySubject.set(subject, [d])
  }

  const defects: MaterializeDefect[] = []

  // 1. The proposal must be lifecycle_state='accepted' (the
  //    materialize gate runs AFTER a promotion to 'accepted'
  //    via PromotionDecision). The same check would also catch
  //    'proposed' / 'observed' proposals that bypass the
  //    promotion policy.
  if (proposal.lifecycle_state !== 'accepted') {
    defects.push(
      defect(
        'E_MATERIALIZE_MISSING_PROMOTION',
        `MaterializationProposal '${proposal.id}' has lifecycle_state='${proposal.lifecycle_state}'; ` +
          `the gate requires lifecycle_state='accepted' (must have been promoted via a PromotionDecision before validation).`,
        proposal.id,
        `Append a PromotionDecisionRecord that promotes '${proposal.id}' from 'observed' to 'accepted' before re-running the gate.`,
      ),
    )
  }

  // 2. Every affected_requirement must have
  //    lifecycle_state ∈ {accepted, verified} AND a fresh
  //    anchor.
  for (const rid of proposal.affected_requirements ?? []) {
    const node = semanticById.get(rid)
    if (!node) {
      defects.push(
        defect(
          'E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED',
          `MaterializationProposal '${proposal.id}' references affected_requirement='${rid}' which is not present in the semantic-nodes index.`,
          proposal.id,
          `Either create a SemanticNode with id='${rid}' and kind='requirement', or remove the entry.`,
        ),
      )
      continue
    }
    if (node.kind !== 'requirement') {
      defects.push(
        defect(
          'E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED',
          `MaterializationProposal '${proposal.id}' references affected_requirement='${rid}' which has kind='${node.kind}'; 'requirement' is required.`,
          proposal.id,
          `Change the SemanticNode '${rid}' to kind='requirement' or remove the entry.`,
        ),
      )
      continue
    }
    if (node.lifecycle_state !== 'accepted' && node.lifecycle_state !== 'verified') {
      defects.push(
        defect(
          'E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED',
          `MaterializationProposal '${proposal.id}' references affected_requirement='${rid}' whose lifecycle_state='${node.lifecycle_state}'; ` +
            `'accepted' or 'verified' is required.`,
          proposal.id,
          `Promote the requirement '${rid}' to lifecycle_state='accepted' before re-running the gate.`,
        ),
      )
    }
    if (withStalenessFilter(node, anchors) !== 'fresh') {
      defects.push(
        defect(
          'E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED',
          `MaterializationProposal '${proposal.id}' references affected_requirement='${rid}' whose source_anchors are not all fresh.`,
          proposal.id,
          `Refresh the source_anchors on '${rid}' or remove the entry.`,
        ),
      )
    }
  }

  // 3. Every affected_decision must have lifecycle_state
  //    NOT IN {superseded, invalidated}.
  for (const did of proposal.affected_decisions ?? []) {
    const node = semanticById.get(did)
    if (!node) {
      defects.push(
        defect(
          'E_MATERIALIZE_DECISION_SUPERSEDED',
          `MaterializationProposal '${proposal.id}' references affected_decision='${did}' which is not present in the semantic-nodes index.`,
          proposal.id,
          `Either create a SemanticNode with id='${did}' and kind='decision', or remove the entry.`,
        ),
      )
      continue
    }
    if (node.lifecycle_state === 'superseded' || node.lifecycle_state === 'invalidated') {
      defects.push(
        defect(
          'E_MATERIALIZE_DECISION_SUPERSEDED',
          `MaterializationProposal '${proposal.id}' references affected_decision='${did}' whose lifecycle_state='${node.lifecycle_state}'; ` +
            `superseded/invalidated decisions cannot be materialised.`,
          proposal.id,
          `Replace the decision with a non-superseded record, or remove the entry.`,
        ),
      )
    }
  }

  // 4. Every required_check must have a corresponding
  //    check_result semantic-node with status='passed' AND a
  //    non-empty raw_output_ref AND a corresponding
  //    PromotionDecision with to_state='verified' (the
  //    check_result itself must be verified).
  for (const cid of proposal.required_checks ?? []) {
    const node = semanticById.get(cid)
    if (!node) {
      defects.push(
        defect(
          'E_MATERIALIZE_CHECK_NOT_PASSED',
          `MaterializationProposal '${proposal.id}' references required_check='${cid}' which is not present in the semantic-nodes index.`,
          proposal.id,
          `Either create a SemanticNode with id='${cid}' and kind='check_result', or remove the entry.`,
        ),
      )
      continue
    }
    if (node.kind !== 'check_result') {
      defects.push(
        defect(
          'E_MATERIALIZE_CHECK_NOT_PASSED',
          `MaterializationProposal '${proposal.id}' references required_check='${cid}' which has kind='${node.kind}'; 'check_result' is required.`,
          proposal.id,
          `Change the SemanticNode '${cid}' to kind='check_result' or remove the entry.`,
        ),
      )
      continue
    }
    if (node['status'] !== 'passed') {
      defects.push(
        defect(
          'E_MATERIALIZE_CHECK_NOT_PASSED',
          `MaterializationProposal '${proposal.id}' references required_check='${cid}' whose status='${String(node['status'])}'; 'passed' is required.`,
          proposal.id,
          `Set the check_result '${cid}' to status='passed' before re-running the gate.`,
        ),
      )
    }
    const proof = node['evidence_proof']
    const raw =
      proof && typeof proof === 'object'
        ? (proof as Record<string, unknown>)['raw_output_ref']
        : undefined
    if (typeof raw !== 'string' || raw.trim() === '') {
      defects.push(
        defect(
          'E_MATERIALIZE_CHECK_NOT_PASSED',
          `MaterializationProposal '${proposal.id}' references required_check='${cid}' which has no non-empty evidence_proof.raw_output_ref.`,
          proposal.id,
          `Set evidence_proof.raw_output_ref on the check_result '${cid}'.`,
        ),
      )
    }
    // The check_result itself must be promoted to 'verified'
    // (per the work order's `E_MATERIALIZE_CHECK_NOT_PASSED`
    // spec). The PromotionDecision is looked up by
    // subject_id == cid AND to_state == 'verified'.
    const decisionsForCheck = decisionsBySubject.get(cid) ?? []
    const hasVerifiedDecision = decisionsForCheck.some(
      (d) => d.to_state === 'verified' && d.decision === 'accepted',
    )
    if (!hasVerifiedDecision) {
      defects.push(
        defect(
          'E_MATERIALIZE_CHECK_NOT_PASSED',
          `MaterializationProposal '${proposal.id}' references required_check='${cid}' which has no PromotionDecision with to_state='verified'.`,
          proposal.id,
          `Append a PromotionDecisionRecord for '${cid}' recording the 'verified' promotion.`,
        ),
      )
    }
  }

  // 5. Every diff_refs[].path must be in the proposal's
  //    allowed_files AND not in its forbidden_files.
  for (const dr of proposal.diff_refs ?? []) {
    const drPath = dr.path
    if (typeof drPath !== 'string' || drPath.length === 0) {
      defects.push(
        defect(
          'E_MATERIALIZE_DIFF_OUT_OF_SCOPE',
          `MaterializationProposal '${proposal.id}' has a diff_ref with empty path.`,
          proposal.id,
          'Set diff_ref.path to a non-empty file path.',
        ),
      )
      continue
    }
    const inAllowed = (proposal.allowed_files ?? []).some((f) =>
      globCovers(f, drPath),
    )
    if (!inAllowed) {
      defects.push(
        defect(
          'E_MATERIALIZE_DIFF_OUT_OF_SCOPE',
          `MaterializationProposal '${proposal.id}' has diff_ref.path='${drPath}' which is not in allowed_files=[${(
            proposal.allowed_files ?? []
          ).join(', ')}].`,
          proposal.id,
          'Move the path into allowed_files, or remove the diff_ref.',
        ),
      )
    }
    const inForbidden = (proposal.forbidden_files ?? []).some((f) =>
      globCovers(f, drPath),
    )
    if (inForbidden) {
      defects.push(
        defect(
          'E_MATERIALIZE_DIFF_OUT_OF_SCOPE',
          `MaterializationProposal '${proposal.id}' has diff_ref.path='${drPath}' which is in forbidden_files=[${(
            proposal.forbidden_files ?? []
          ).join(', ')}].`,
          proposal.id,
          'Remove the diff_ref, or remove the path from forbidden_files.',
        ),
      )
    }
  }

  // 6. allowed_files ∩ forbidden_files = ∅.
  if (pathsOverlap(proposal.allowed_files ?? [], proposal.forbidden_files ?? [])) {
    defects.push(
      defect(
        'E_MATERIALIZE_SCOPE_OVERLAP',
        `MaterializationProposal '${proposal.id}' has allowed_files ∩ forbidden_files ≠ ∅.`,
        proposal.id,
        'Make allowed_files and forbidden_files disjoint.',
      ),
    )
  }

  const finishedAt = new Date().toISOString()
  const passed = defects.length === 0

  let promotionDecisionId: string | null = null
  if (passed) {
    // Promote the proposal to lifecycle_state='accepted' via
    // the transition() helper. We do not promote to 'verified'
    // because the materialization gate is the finality check,
    // not a verification record.
    const promotion = transition(proposal.lifecycle_state, 'accepted', {
      provenance: 'derived',
      evidence_refs: proposal.evidence_anchors?.map((a) => a.anchor_id) ?? ['atelier.materialize.gate'],
      owner_or_policy: proposal.owner_or_policy ?? 'atelier-autopoiesis-implementer',
      authority_scope: proposal.authority_scope,
    })
    if (promotion.ok) {
      // Append a PromotionDecisionRecord.
      promotionDecisionId = `pd:${createHash('sha256')
        .update(`promote|${proposal.id}|accepted|${finishedAt}`)
        .digest('hex')
        .slice(0, 16)}`
      const decision: PromotionDecisionRecord = {
        schema: 'atelier.promotion-decision/v1',
        id: promotionDecisionId,
        subject_id: proposal.id,
        from_state: proposal.lifecycle_state,
        to_state: 'accepted',
        decision: 'accepted',
        required_checks: proposal.required_checks ?? [],
        evidence_refs: ['atelier.materialize.gate'],
        decided_by: 'atelier-autopoiesis-implementer',
        decided_at: finishedAt,
        created_at: finishedAt,
      }
      await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, decision)
    }
    // Persist the updated proposal with status='validated'
    // and lifecycle_state='accepted'.
    const updatedProposals = proposals.map((p) =>
      p.id === proposal.id
        ? {
            ...p,
            lifecycle_state: 'accepted' as const,
            status: 'validated' as const,
            defects: [],
          }
        : p,
    )
    await writeNdjsonArray(
      AUTOPOIESIS_PATHS.materializationProposals,
      updatedProposals,
    )
  } else {
    // Persist the rejection in-place: status='rejected',
    // defects updated.
    const updatedProposals = proposals.map((p) =>
      p.id === proposal.id
        ? {
            ...p,
            status: 'rejected' as const,
            defects: defects.map((d) => d.code),
          }
        : p,
    )
    await writeNdjsonArray(
      AUTOPOIESIS_PATHS.materializationProposals,
      updatedProposals,
    )
  }

  const report: MaterializeValidationReport = {
    schema: 'atelier.materialization-validation/v1',
    proposal_id: proposal.id,
    task_id: proposal.task_id,
    status: passed ? 'validated' : 'rejected',
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: Date.parse(finishedAt) - Date.parse(startedAt),
    defects,
    warnings: [],
    promotion_decision_id: promotionDecisionId,
  }

  if (opts.persistReport !== false) {
    await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationReports, report)
  }

  // Re-read the updated proposal so the caller sees the new
  // status / lifecycle_state.
  const refreshed = (
    await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
  ).find((p) => p.id === proposal.id) ?? proposal

  return { report, proposal: refreshed }
}

/* -------------------------------------------------------------------------- */
/*                              closeTask (gate)                               */
/* -------------------------------------------------------------------------- */

export type CloseTaskResult =
  | {
      ok: true
      task_id: string
      proposal_id: string
      ack_id: string
      created_at: string
    }
  | {
      ok: false
      code: 'E_CLOSE_NO_VALIDATED_PROPOSAL' | 'E_TASK_NOT_FOUND' | 'E_CLOSE_FINDINGS_OPEN'
      message: string
    }

/**
 * C8 — closeTask gate. Before emitting the `task_closed_ack`,
 * the function reads `.atelier/v0/autopoiesis/evaluator-state.json`
 * and rejects the call when:
 *
 *   - the state file does not exist (no evaluator run has been
 *     performed against the current autopoiesis state), OR
 *   - the state's `last_evaluated_at` is older than the latest
 *     task mutation (the evaluator has not seen the most recent
 *     change), OR
 *   - the most recent `runEvaluate()` result has any open P0
 *     finding in `findings.ndjson` whose scope covers this
 *     task's id (a critical control-plane defect is still
 *     open for the scope the agent is trying to close).
 *
 * The gate keeps `closeTask` honest: a task may only be
 * declared "closed" when the self-improvement loop is
 * quiescent for the task's scope. The work-order compiler
 * groups findings per capability, but the closeTask gate
 * considers every open P0 finding regardless of capability
 * (a C1 control-plane defect on the same scope is still a
 * blocker).
 */
async function checkCloseFindingsGate(
  taskId: string,
  proposalId: string,
): Promise<{ ok: true } | { ok: false; code: 'E_CLOSE_FINDINGS_OPEN'; message: string }> {
  const stateFile = AUTOPOIESIS_PATHS.evaluatorState
  let state: { last_evaluated_at?: string; last_goal_ref?: string } | undefined
  try {
    const text = await readFile(stateFile, 'utf8')
    state = JSON.parse(text) as { last_evaluated_at?: string; last_goal_ref?: string }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  if (!state || !state.last_evaluated_at) {
    return {
      ok: false,
      code: 'E_CLOSE_FINDINGS_OPEN',
      message:
        `closeTask is gated on the evaluator; no evaluator-state.json found at ${stateFile}. ` +
        `Run 'bun run atelier:evaluate -- --goal harness/atelier-autopoiesis/MISSION.md' first.`,
    }
  }
  // The evaluator must have run AFTER the latest task mutation.
  // The proposal's `created_at` is a reliable proxy for the
  // latest task mutation; the gate fails when the evaluator
  // state is older than the proposal.
  const proposals = await readNdjsonAutopoiesis<MaterializationProposal>(
    AUTOPOIESIS_PATHS.materializationProposals,
  )
  const proposal = proposals.find((p) => p.id === proposalId)
  if (proposal) {
    const proposalAt = Date.parse(proposal.created_at)
    const evaluatedAt = Date.parse(state.last_evaluated_at)
    if (!Number.isNaN(proposalAt) && !Number.isNaN(evaluatedAt) && evaluatedAt < proposalAt) {
      return {
        ok: false,
        code: 'E_CLOSE_FINDINGS_OPEN',
        message:
          `closeTask is gated on the evaluator; the last evaluator run ` +
          `(${state.last_evaluated_at}) is older than the proposal's ` +
          `created_at (${proposal.created_at}). Re-run the evaluator.`,
      }
    }
  }
  // Walk findings.ndjson (tolerant) for any open P0 finding
  // whose capability / scope covers the task. A P0 finding is
  // a hard block. The check is conservative: we do not require
  // a per-finding scope match; any open P0 is a block.
  const { records: findings, lineErrors } = await readNdjsonAutopoiesisTolerant<{
    finding_id: string
    severity: string
    status: string
    affected_record?: string
    capability_id?: string
    code?: string
  }>(AUTOPOIESIS_PATHS.findings)
  void lineErrors
  const openP0 = findings.find(
    (f: { severity: string; status: string }) => f.severity === 'P0' && f.status === 'open',
  )
  if (openP0) {
    return {
      ok: false,
      code: 'E_CLOSE_FINDINGS_OPEN',
      message:
        `closeTask is gated on the evaluator; an open P0 finding exists ` +
        `(${openP0.code ?? 'unknown'} for ${openP0.affected_record ?? taskId}). ` +
        `Resolve the finding or run the work-order compiler before closing task '${taskId}'.`,
    }
  }
  return { ok: true }
}

/**
 * Close a task. A task is closable only when a
 * MaterializationProposal with `task_id=...`,
 * `status='validated'`, AND `lifecycle_state='accepted'` exists
 * in the materialization-proposals ledger AND the C8
 * close-findings gate passes (the most recent evaluator run
 * is fresh AND no open P0 finding is outstanding). The
 * function does NOT mutate the implementation-tasks.ndjson
 * file; it only emits a `task_closed_ack` SemanticNode so the
 * operational review can verify the closure was gated.
 */
export async function closeTask(taskId: string): Promise<CloseTaskResult> {
  const proposals = await readNdjsonAutopoiesis<MaterializationProposal>(
    AUTOPOIESIS_PATHS.materializationProposals,
  )
  const task = await loadImplementationTask(taskId)
  if (!task) {
    return {
      ok: false,
      code: 'E_TASK_NOT_FOUND',
      message: `ImplementationTask '${taskId}' not found; cannot close.`,
    }
  }
  const validated = proposals.find(
    (p) =>
      p.task_id === taskId &&
      p.status === 'validated' &&
      p.lifecycle_state === 'accepted',
  )
  if (!validated) {
    return {
      ok: false,
      code: 'E_CLOSE_NO_VALIDATED_PROPOSAL',
      message:
        `Task '${taskId}' has no MaterializationProposal with ` +
        `status='validated' AND lifecycle_state='accepted'; closeTask is gated by the materialization gate.`,
    }
  }

  // C8 close-findings gate.
  const gate = await checkCloseFindingsGate(taskId, validated.id)
  if (!gate.ok) {
    return { ok: false, code: gate.code, message: gate.message }
  }

  const createdAt = new Date().toISOString()
  const ackId = `ack:${createHash('sha256')
    .update(`close|${taskId}|${validated.id}|${createdAt}`)
    .digest('hex')
    .slice(0, 16)}`
  const ack: SemanticNode = {
    schema: 'atelier.semantic-node/v1',
    id: ackId,
    kind: 'implementation_task',
    lifecycle_state: 'accepted',
    authority_scope: { kind: 'task', task_id: taskId },
    source_anchors: validated.source_anchors ?? [],
    evidence_anchors: [],
    owner_or_policy: 'atelier-autopoiesis-implementer',
    provenance_kind: 'derived',
    confidence: 'fact',
    produced_by: 'atelier-autopoiesis-implementer',
    created_at: createdAt,
    text: `Task '${taskId}' closed by gated closeTask; proposal='${validated.id}'`,
    proposal_id: validated.id,
  }
  await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, ack)
  return { ok: true, task_id: taskId, proposal_id: validated.id, ack_id: ackId, created_at: createdAt }
}

/* -------------------------------------------------------------------------- */
/*                              Internal helper                                */
/* -------------------------------------------------------------------------- */

async function writeNdjsonArray<T>(filePath: string, rows: ReadonlyArray<T>): Promise<void> {
  const { writeNdjsonAutopoiesis } = await import('./store.ts')
  await writeNdjsonAutopoiesis(filePath, rows)
}
