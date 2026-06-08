/**
 * Atelier Autopoiesis — `closeTask` gate (C8) negative-control tests.
 *
 * Pins the C8 contract: `closeTask` may only emit a
 * `task_closed_ack` when the C8 close-findings gate passes. The
 * gate rejects with `E_CLOSE_FINDINGS_OPEN` when:
 *
 *   1. The evaluator-state.json is missing (no evaluator run has
 *      been performed against the current autopoiesis state);
 *   2. The state's `last_evaluated_at` is older than the latest
 *      task mutation (the proposal's `created_at`);
 *   3. Any open P0 finding exists in findings.ndjson (a critical
 *      control-plane defect is still open for the scope the agent
 *      is trying to close).
 *
 * Plus one positive regression: when the gate clears, closeTask
 * returns ok=true with a `task_closed_ack` SemanticNode.
 *
 * The suite runs against a per-suite temp directory under
 * `process.tmpdir()`. `process.cwd()` is changed to that
 * directory for the duration of the suite so that the
 * `autopoiesisPaths()` resolver reads the fixture's
 * `.atelier/v0/autopoiesis/` files, not production.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import {
  createProposal,
  validateProposal,
  closeTask,
} from '../lib/materialize.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'
import { AUTOPOIESIS_PATHS, autopoiesisPaths } from '../lib/paths.ts'
import { seedEvaluatorStateForTest } from '../lib/evaluator.ts'
import type {
  AutopoiesisFinding,
  MaterializationProposal,
  SemanticNode,
  PromotionDecisionRecord,
} from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string
const ANCHORS_FILE = () =>
  path.join(FIXTURE_ROOT, '.atelier', 'v0', 'anchors', 'source-anchors.ndjson')
const TRANSFORMER_DIR = () =>
  path.join(FIXTURE_ROOT, '.atelier', 'v0', 'transforms', 'md-to-code', 'model')

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-autopoiesis-closegate-'))
  await mkdir(path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis'), { recursive: true })
  await mkdir(path.dirname(ANCHORS_FILE()), { recursive: true })
  await mkdir(TRANSFORMER_DIR(), { recursive: true })
  process.chdir(FIXTURE_ROOT)
})

afterAll(async () => {
  process.chdir(ORIGINAL_CWD)
  await rm(FIXTURE_ROOT, { recursive: true, force: true })
})

beforeEach(async () => {
  process.chdir(FIXTURE_ROOT)
  const PATHS = autopoiesisPaths()
  for (const file of [
    PATHS.semanticNodes,
    PATHS.promotionDecisions,
    PATHS.stalenessRecords,
    PATHS.conflictRecords,
    PATHS.authorityRules,
    PATHS.controlPackets,
    PATHS.materializationProposals,
    PATHS.materializationReports,
    PATHS.handoffs,
    PATHS.findings,
    PATHS.evaluatorState,
    PATHS.evaluatorResult,
    ANCHORS_FILE(),
    path.join(TRANSFORMER_DIR(), 'implementation-tasks.ndjson'),
  ]) {
    await rm(file, { force: true })
  }
})

/* -------------------------------------------------------------------------- */
/*                               Test helpers                                 */
/* -------------------------------------------------------------------------- */

async function writeAnchor(anchor: {
  id: string
  status: string
  path: string
  content_hash?: string
}): Promise<void> {
  const hash = anchor.content_hash ?? 'a'.repeat(64)
  await appendNdjsonAutopoiesis(ANCHORS_FILE(), {
    id: anchor.id,
    kind: 'file',
    path: anchor.path,
    start_line: 1,
    end_line: 1,
    content_hash: hash,
    selector_strategy: 'path',
    produced_by: 'close-task-gate-test',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: anchor.status,
    source_refs: [{ path: anchor.path, sha256: hash }],
    created_at: new Date().toISOString(),
  })
}

function mkSemanticNode(overrides: Partial<SemanticNode> = {}): SemanticNode {
  return {
    schema: 'atelier.semantic-node/v1',
    id: 'node:default',
    kind: 'check_result',
    lifecycle_state: 'verified',
    authority_scope: { kind: 'global' },
    source_anchors: [{ anchor_id: 'a:default', path: 'README.md' }],
    provenance_kind: 'manual_control_record',
    evidence_refs: ['evi:default'],
    produced_by: 'close-task-gate-test',
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  }
}

async function writeImplementationTask(task: {
  id: string
  status: string
  allowed_files?: string[]
  title?: string
}): Promise<void> {
  await appendNdjsonAutopoiesis(
    path.join(TRANSFORMER_DIR(), 'implementation-tasks.ndjson'),
    {
      id: task.id,
      kind: 'implementation_task',
      version: '1',
      title: task.title ?? task.id,
      task_id: task.id,
      goal: 'fixture task',
      source_object_ids: [],
      source_anchor_ids: [],
      source_refs: [],
      required_knowledge_object_ids: [],
      allowed_files: task.allowed_files ?? ['.atelier-bootstrap/**'],
      forbidden_files: [],
      required_kinds: ['code_change'],
      required_capabilities: ['C2'],
      required_promotion: { to_state: 'accepted' },
      minimum_required_artifacts: [],
      authority_resolution: { kind: 'default' },
      status: task.status,
      created_at: '2026-06-07T00:00:00.000Z',
    },
  )
}

async function writePromotionDecision(decision: {
  id: string
  subject_id: string
  from_state: string
  to_state: string
  decision: 'accepted' | 'rejected' | 'blocked'
}): Promise<void> {
  await appendNdjsonAutopoiesis<PromotionDecisionRecord>(
    AUTOPOIESIS_PATHS.promotionDecisions,
    {
      schema: 'atelier.promotion-decision/v1',
      id: decision.id,
      subject_id: decision.subject_id,
      from_state: decision.from_state as PromotionDecisionRecord['from_state'],
      to_state: decision.to_state as PromotionDecisionRecord['to_state'],
      decision: decision.decision,
      required_checks: [],
      decided_by: 'close-task-gate-test',
      decided_at: '2026-06-07T00:00:00.000Z',
      created_at: '2026-06-07T00:00:00.000Z',
    },
  )
}

/**
 * Build a fully-validated MaterializationProposal for the given
 * task id, with a passed check_result already in the ledger.
 * Returns the proposal id (or throws if createProposal rejects).
 */
async function buildValidatedProposal(taskId: string): Promise<string> {
  await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
  const check = mkSemanticNode({
    id: `node:check-${taskId}`,
    source_anchors: [{ anchor_id: 'a:fresh', path: 'README.md' }],
  })
  ;(check as unknown as { status?: string }).status = 'passed'
  ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
    command: 'bun test',
    raw_output_ref: '.atelier/v0/runs/evidence/check.json',
  }
  await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
  await writePromotionDecision({
    id: `pd:check-${taskId}`,
    subject_id: check.id,
    from_state: 'accepted',
    to_state: 'verified',
    decision: 'accepted',
  })
  await writeImplementationTask({ id: taskId, status: 'ready' })
  const cr = await createProposal(taskId, {
    taskId,
    diffRef: '.atelier-bootstrap/x.ts',
    requiredChecks: [check.id],
    diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
    allowedFiles: ['.atelier-bootstrap/**'],
  })
  if (!cr.ok) throw new Error(`createProposal failed: ${cr.code}`)
  await writePromotionDecision({
    id: `pd:proposal-${taskId}`,
    subject_id: cr.proposal.id,
    from_state: 'observed',
    to_state: 'accepted',
    decision: 'accepted',
  })
  // Mark the proposal lifecycle_state=accepted so validateProposal
  // can move it forward to validated.
  const all = await readNdjsonAutopoiesis<MaterializationProposal>(
    AUTOPOIESIS_PATHS.materializationProposals,
  )
  const updated = all.map((p) =>
    p.id === cr.proposal.id ? { ...p, lifecycle_state: 'accepted' as const } : p,
  )
  const { writeNdjsonAutopoiesis } = await import('../lib/store.ts')
  await writeNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, updated)
  const r = await validateProposal(cr.proposal.id)
  expect(r.report.status).toBe('validated')
  return cr.proposal.id
}

/* -------------------------------------------------------------------------- */
/*                          E_CLOSE_FINDINGS_OPEN — NEGATIVE                    */
/* -------------------------------------------------------------------------- */

describe('closeTask() — E_CLOSE_FINDINGS_OPEN — negative controls', () => {
  test('rejects with E_CLOSE_FINDINGS_OPEN when evaluator-state.json is missing', async () => {
    const taskId = 'task:close-gate-missing'
    await buildValidatedProposal(taskId)
    // Note: beforeEach already removed any leftover evaluator-state.json.
    const r = await closeTask(taskId)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('E_CLOSE_FINDINGS_OPEN')
    // The message must mention the missing state file.
    expect(r.message).toMatch(/evaluator-state\.json/)
  })

  test('rejects with E_CLOSE_FINDINGS_OPEN when evaluator state is stale', async () => {
    const taskId = 'task:close-gate-stale'
    const proposalId = await buildValidatedProposal(taskId)
    // Read the proposal's created_at so we can synthesize a
    // `last_evaluated_at` that is strictly OLDER than the
    // proposal (this is what "stale" means for the gate).
    const all = await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
    const proposal = all.find((p) => p.id === proposalId)
    expect(proposal).toBeDefined()
    const proposalAtMs = Date.parse(proposal!.created_at)
    const staleAtMs = proposalAtMs - 60_000 // 1 min before
    const staleAt = new Date(staleAtMs).toISOString()
    await seedEvaluatorStateForTest({ last_evaluated_at: staleAt })
    const r = await closeTask(taskId)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('E_CLOSE_FINDINGS_OPEN')
    expect(r.message).toMatch(/older than the proposal/)
  })

  test('rejects with E_CLOSE_FINDINGS_OPEN when an open P0 finding exists for the task scope', async () => {
    const taskId = 'task:close-gate-p0'
    await buildValidatedProposal(taskId)
    // Fresh evaluator state, but an open P0 finding in
    // findings.ndjson. The C8 gate walks findings.ndjson
    // conservatively: ANY open P0 blocks the close.
    const openP0: AutopoiesisFinding = {
      schema: 'atelier.autopoiesis-finding/v1',
      finding_id: 'finding:test:E_TEST_OPEN_P0:freshblocker',
      severity: 'P0',
      capability_id: 'C8',
      code: 'E_TEST_OPEN_P0',
      reason: 'synthetic open P0 finding for the close-gate test',
      required_repair: 'resolve the finding before closing',
      status: 'open',
      proof_required: ['evaluator:next_run:no_p0'],
      created_at: new Date().toISOString(),
    }
    await seedEvaluatorStateForTest({ findings: [openP0] })
    const r = await closeTask(taskId)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('E_CLOSE_FINDINGS_OPEN')
    expect(r.message).toMatch(/open P0 finding/)
  })
})

/* -------------------------------------------------------------------------- */
/*                           E_CLOSE_FINDINGS_OPEN — POSITIVE                   */
/* -------------------------------------------------------------------------- */

describe('closeTask() — gate clears — positive regression', () => {
  test('accepts when evaluator state is fresh and no open P0 finding exists', async () => {
    const taskId = 'task:close-gate-pass'
    const proposalId = await buildValidatedProposal(taskId)
    // Fresh evaluator state, no findings.
    await seedEvaluatorStateForTest({})
    const r = await closeTask(taskId)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.task_id).toBe(taskId)
    expect(r.proposal_id).toBe(proposalId)
    expect(r.ack_id).toMatch(/^ack:/)
  })
})
