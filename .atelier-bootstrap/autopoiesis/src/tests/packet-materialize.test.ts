/**
 * Atelier Autopoiesis — Packet + Materialize negative-control tests.
 *
 * The suite covers the WO3 work order's 10 negative controls plus
 * a set of positive regressions that pin the runtime contract of
 * the ControlPacket generator, the packet validator, the
 * MaterializationProposal producer, the materialize:validate
 * gate, and the closeTask command.
 *
 * Negative controls covered (1:1 with the work order):
 *
 *   1.  overlapping allowed_files ∩ forbidden_files ⇒
 *       E_PACKET_SCOPE_OVERLAP
 *   2.  empty required_checks ⇒ E_PACKET_MISSING_CHECKS
 *   3.  empty evidence_anchors ⇒ E_PACKET_MISSING_EVIDENCE
 *   4.  stale source_anchor ⇒ E_PACKET_STALE_ANCHOR
 *   5.  required_check with status != 'passed' ⇒
 *       E_PACKET_CHECK_NOT_PASSED
 *   6.  diff_ref outside allowed_files ⇒
 *       E_MATERIALIZE_DIFF_OUT_OF_SCOPE
 *   7.  affected_requirement in lifecycle_state='proposed' ⇒
 *       E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED
 *   8.  affected_decision in lifecycle_state='superseded' ⇒
 *       E_MATERIALIZE_DECISION_SUPERSEDED
 *   9.  required_check without a passed check_result ⇒
 *       E_MATERIALIZE_CHECK_NOT_PASSED
 *   10. closeTask with NO validated MaterializationProposal ⇒
 *       E_CLOSE_NO_VALIDATED_PROPOSAL
 *
 * Plus 10 positive regressions (generator happy path, validator
 * pass, materialize:create happy path, materialize:validate
 * happy path, closeTask happy path, etc.).
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import {
  createControlPacket,
  globCovers,
  pathsOverlap,
  opsOverlap,
} from '../lib/packet.ts'
import { validateControlPacket } from '../lib/packet-validate.ts'
import {
  createProposal,
  validateProposal,
  closeTask,
} from '../lib/materialize.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'
import { AUTOPOIESIS_PATHS } from '../lib/paths.ts'
import { seedEvaluatorStateForTest } from '../lib/evaluator.ts'
import type { MaterializationProposal, SemanticNode } from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string
const AUTOPOIESIS_DIR = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis')
const ANCHORS_FILE = () =>
  path.join(FIXTURE_ROOT, '.atelier', 'v0', 'anchors', 'source-anchors.ndjson')
const TRANSFORMER_DIR = () =>
  path.join(FIXTURE_ROOT, '.atelier', 'v0', 'transforms', 'md-to-code', 'model')

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-autopoiesis-pm-'))
  await mkdir(AUTOPOIESIS_DIR(), { recursive: true })
  await mkdir(path.dirname(ANCHORS_FILE()), { recursive: true })
  await mkdir(TRANSFORMER_DIR(), { recursive: true })
  process.chdir(FIXTURE_ROOT)
})

afterAll(async () => {
  process.chdir(ORIGINAL_CWD)
  await rm(FIXTURE_ROOT, { recursive: true, force: true })
})

beforeEach(async () => {
  for (const file of [
    AUTOPOIESIS_PATHS.semanticNodes,
    AUTOPOIESIS_PATHS.promotionDecisions,
    AUTOPOIESIS_PATHS.stalenessRecords,
    AUTOPOIESIS_PATHS.conflictRecords,
    AUTOPOIESIS_PATHS.authorityRules,
    AUTOPOIESIS_PATHS.controlPackets,
    AUTOPOIESIS_PATHS.materializationProposals,
    AUTOPOIESIS_PATHS.materializationReports,
    AUTOPOIESIS_PATHS.handoffs,
    AUTOPOIESIS_PATHS.findings,
    AUTOPOIESIS_PATHS.evaluatorState,
    AUTOPOIESIS_PATHS.evaluatorResult,
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
    produced_by: 'indexer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: anchor.status,
    source_refs: [{ path: anchor.path, sha256: hash }],
    created_at: new Date().toISOString(),
  })
}

async function appendAutopoiesis<T extends object>(file: string, record: T): Promise<void> {
  await appendNdjsonAutopoiesis(file, record)
}

function mkSemanticNode(overrides: Partial<SemanticNode> = {}): SemanticNode {
  return {
    schema: 'atelier.semantic-node/v1',
    id: 'node:default',
    kind: 'requirement',
    lifecycle_state: 'proposed',
    authority_scope: { kind: 'global' },
    source_anchors: [{ anchor_id: 'anchor:default' }],
    provenance_kind: 'manual_control_record',
    evidence_refs: ['evi:default'],
    produced_by: 'atelier-autopoiesis-implementer',
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  }
}

async function writeImplementationTask(task: {
  id: string
  status: string
  allowed_files?: string[]
  forbidden_files?: string[]
  title?: string
  task_id?: string
  source_anchor_ids?: string[]
}): Promise<void> {
  await appendNdjsonAutopoiesis(
    path.join(TRANSFORMER_DIR(), 'implementation-tasks.ndjson'),
    {
      id: task.id,
      kind: 'implementation_task',
      version: '1',
      title: task.title ?? task.id,
      task_id: task.task_id ?? task.id,
      goal: 'fixture task',
      source_object_ids: [],
      source_anchor_ids: task.source_anchor_ids ?? [],
      source_refs: [],
      required_knowledge_object_ids: [],
      allowed_files: task.allowed_files ?? [],
      forbidden_files: task.forbidden_files ?? [],
      acceptance_criteria: [],
      risk_notes: [],
      status: task.status,
      blocker_ids: [],
      tags: [],
      fixture: true,
    },
  )
}

async function writePromotionDecision(decision: {
  id: string
  subject_id: string
  from_state: string
  to_state: string
  decision: string
}): Promise<void> {
  await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, {
    schema: 'atelier.promotion-decision/v1',
    id: decision.id,
    subject_id: decision.subject_id,
    from_state: decision.from_state,
    to_state: decision.to_state,
    decision: decision.decision,
    required_checks: [],
    evidence_refs: ['evi:default'],
    decided_by: 'atelier-autopoiesis-implementer',
    decided_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  })
}

/* -------------------------------------------------------------------------- */
/*                            Glob overlap helpers                             */
/* -------------------------------------------------------------------------- */

describe('globCovers()', () => {
  test('exact match returns true', () => {
    expect(globCovers('foo/bar', 'foo/bar')).toBe(true)
  })
  test('parent directory covers descendant', () => {
    expect(globCovers('.atelier-bootstrap/**', '.atelier-bootstrap/x.ts')).toBe(true)
    expect(globCovers('.atelier-bootstrap/**', '.atelier-bootstrap/autopoiesis/src/lib/packet.ts')).toBe(true)
  })
  test('sibling directory is not covered', () => {
    expect(globCovers('.atelier-bootstrap/**', 'product/apps/foo')).toBe(false)
  })
  test('parent without ** is not a glob and matches only itself', () => {
    expect(globCovers('.atelier-bootstrap', '.atelier-bootstrap/x.ts')).toBe(false)
  })
  test('two unrelated paths do not cover each other', () => {
    expect(globCovers('foo/**', 'bar/baz')).toBe(false)
  })
})

describe('pathsOverlap()', () => {
  test('two disjoint sets do not overlap', () => {
    expect(pathsOverlap(['foo/**'], ['bar/**'])).toBe(false)
  })
  test('parent glob covers child glob', () => {
    expect(pathsOverlap(['.atelier-bootstrap/**'], ['.atelier-bootstrap/autopoiesis/**'])).toBe(true)
  })
  test('identical globs overlap', () => {
    expect(pathsOverlap(['foo/**'], ['foo/**'])).toBe(true)
  })
})

describe('opsOverlap()', () => {
  test('disjoint sets do not overlap', () => {
    expect(opsOverlap(['create'], ['modify'])).toBe(false)
  })
  test('overlapping sets are detected', () => {
    expect(opsOverlap(['create', 'modify'], ['modify', 'delete'])).toBe(true)
  })
})

/* -------------------------------------------------------------------------- */
/*                          ControlPacket generator                            */
/* -------------------------------------------------------------------------- */

describe('createControlPacket()', () => {
  test('happy path: emits a packet with all required fields', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:ready-1',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:ready-1')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const p = r.packet
    expect(p.schema).toBe('atelier.control-packet/v1')
    expect(p.id).toMatch(/^pkt:/)
    expect(p.task).toBe('task:ready-1')
    expect(p.lifecycle_state).toBe('observed')
    expect(p.generated_at).toBeDefined()
    expect(p.authority_scope).toEqual({ kind: 'task', task_id: 'task:ready-1' })
    expect(p.source_anchors.length).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(p.active_requirements)).toBe(true)
    expect(Array.isArray(p.accepted_decisions)).toBe(true)
    expect(p.allowed_operations).toContain('create')
    expect(p.allowed_operations).toContain('modify')
    expect(p.allowed_operations).toContain('delete')
    expect(p.allowed_operations).toContain('.atelier-bootstrap/**')
    expect(Array.isArray(p.forbidden_operations)).toBe(true)
    expect(Array.isArray(p.required_checks)).toBe(true)
    expect(Array.isArray(p.open_findings)).toBe(true)
    expect(Array.isArray(p.stale_artifacts)).toBe(true)
    expect(Array.isArray(p.conflicts)).toBe(true)
    expect(Array.isArray(p.evidence_anchors_list)).toBe(true)
    expect(Array.isArray(p.materialization_rules)).toBe(true)
  })

  test('E_TASK_NOT_FOUND when the task is not in the implementation-tasks ledger', async () => {
    const r = await createControlPacket('task:does-not-exist')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('E_TASK_NOT_FOUND')
  })

  test('E_PACKET_TASK_NOT_READY when task status is not "ready"', async () => {
    await writeImplementationTask({
      id: 'task:blocked-1',
      status: 'blocked',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const r = await createControlPacket('task:blocked-1')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('E_PACKET_TASK_NOT_READY')
  })

  test('emits E_PACKET_MISSING_CHECKS when no check_results are present', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:ready-2',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:ready-2')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.packet.defects).toContain('E_PACKET_MISSING_CHECKS')
    expect(r.packet.status).toBe('invalid')
  })

  test('emits E_PACKET_MISSING_EVIDENCE when no check_result has raw_output_ref', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    // A check_result with status='passed' but no evidence_proof.raw_output_ref.
    const check = mkSemanticNode({
      id: 'node:check-no-evi',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    // No evidence_proof.
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:ready-3',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:ready-3')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.packet.evidence_anchors_list).toEqual([])
    expect(r.packet.defects).toContain('E_PACKET_MISSING_EVIDENCE')
  })

  test('emits E_PACKET_SCOPE_OVERLAP when allowed_files ∩ forbidden_files ≠ ∅', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:overlap',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      forbidden_files: ['.atelier-bootstrap/autopoiesis/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:overlap')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.packet.defects).toContain('E_PACKET_SCOPE_OVERLAP')
  })

  test('populates materialization_rules from required_checks', async () => {
    await writeAnchor({
      id: 'a:fresh',
      status: 'fresh',
      path: '.atelier-bootstrap/autopoiesis/src/lib/packet.ts',
    })
    const check = mkSemanticNode({
      id: 'node:check-mz',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-mz.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:ready-4',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:ready-4')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.packet.required_checks).toContain('node:check-mz')
    expect(r.packet.materialization_rules.length).toBe(1)
    expect(r.packet.materialization_rules[0]?.task_id).toBe('task:ready-4')
    expect(r.packet.materialization_rules[0]?.must_hold_check_ids).toEqual(['node:check-mz'])
    expect(r.packet.materialization_rules[0]?.status).toBe('observed')
  })

  test('persists the packet to control-packets.ndjson', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:ready-5',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:ready-5')
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    const all = await readNdjsonAutopoiesis<{ id: string }>(
      AUTOPOIESIS_PATHS.controlPackets,
    )
    expect(all.some((p) => p.id === r.packet.id)).toBe(true)
  })
})

/* -------------------------------------------------------------------------- */
/*                       validateControlPacket (positive)                      */
/* -------------------------------------------------------------------------- */

describe('validateControlPacket()', () => {
  test('a packet with a well-formed check_result + fresh anchor passes', async () => {
    await writeAnchor({
      id: 'a:fresh',
      status: 'fresh',
      path: '.atelier-bootstrap/autopoiesis/src/lib/packet.ts',
    })
    const check = mkSemanticNode({
      id: 'node:check-ok',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-ok.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:ok',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:ok')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const v = await validateControlPacket(r.packet.id)
    if (!v.ok) {
      console.error('defects:', JSON.stringify(v.defects, null, 2))
    }
    expect(v.ok).toBe(true)
  })
})

/* -------------------------------------------------------------------------- */
/*                       E_PACKET_OP_OVERLAP                                    */
/* -------------------------------------------------------------------------- */

describe('validateControlPacket() — E_PACKET_OP_OVERLAP', () => {
  test('rejects a packet with hand-injected overlapping operations', async () => {
    await writeAnchor({
      id: 'a:fresh',
      status: 'fresh',
      path: '.atelier-bootstrap/autopoiesis/src/lib/packet.ts',
    })
    const check = mkSemanticNode({
      id: 'node:check-op-overlap',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-op-overlap.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:op-overlap',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:op-overlap')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // Hand-inject an overlap by adding the same path to BOTH
    // allowed_operations and forbidden_operations.
    r.packet.forbidden_operations = [
      'create',
      'modify',
      'delete',
      '.atelier-bootstrap/**',
    ]
    const v = await validateControlPacket(r.packet.id, { packet: r.packet })
    expect(v.ok).toBe(false)
    expect(v.defects.find((d) => d.code === 'E_PACKET_OP_OVERLAP')).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 1                                    */
/*   overlapping allowed_files ∩ forbidden_files ⇒ E_PACKET_SCOPE_OVERLAP     */
/* -------------------------------------------------------------------------- */

describe('validateControlPacket() — E_PACKET_SCOPE_OVERLAP', () => {
  test('rejects a packet whose in-band defects include E_PACKET_SCOPE_OVERLAP', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const check = mkSemanticNode({
      id: 'node:check-scope',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-scope.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:overlap',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      forbidden_files: ['.atelier-bootstrap/autopoiesis/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:overlap')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const v = await validateControlPacket(r.packet.id)
    expect(v.ok).toBe(false)
    expect(v.defects.find((d) => d.code === 'E_PACKET_SCOPE_OVERLAP')).toBeDefined()
    // Since the same path appears in both allowed and
    // forbidden (the inner autopoiesis/** is a descendant of
    // .atelier-bootstrap/**), the operation lists also
    // overlap.
    expect(v.defects.find((d) => d.code === 'E_PACKET_OP_OVERLAP')).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 2                                    */
/*   empty required_checks ⇒ E_PACKET_MISSING_CHECKS                          */
/* -------------------------------------------------------------------------- */

describe('validateControlPacket() — E_PACKET_MISSING_CHECKS', () => {
  test('rejects a packet with empty required_checks', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:no-checks',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:no-checks')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.packet.required_checks).toEqual([])
    const v = await validateControlPacket(r.packet.id)
    expect(v.ok).toBe(false)
    expect(v.defects.find((d) => d.code === 'E_PACKET_MISSING_CHECKS')).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 3                                    */
/*   empty evidence_anchors ⇒ E_PACKET_MISSING_EVIDENCE                       */
/* -------------------------------------------------------------------------- */

describe('validateControlPacket() — E_PACKET_MISSING_EVIDENCE', () => {
  test('rejects a packet with no check_result carrying raw_output_ref', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    // A check_result without raw_output_ref.
    const check = mkSemanticNode({
      id: 'node:check-no-raw',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    // No evidence_proof.
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:no-evi',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:no-evi')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.packet.evidence_anchors_list).toEqual([])
    const v = await validateControlPacket(r.packet.id)
    expect(v.ok).toBe(false)
    expect(v.defects.find((d) => d.code === 'E_PACKET_MISSING_EVIDENCE')).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 4                                    */
/*   stale source_anchor ⇒ E_PACKET_STALE_ANCHOR                              */
/* -------------------------------------------------------------------------- */

describe('validateControlPacket() — E_PACKET_STALE_ANCHOR', () => {
  test('rejects a packet whose source_anchor is stale', async () => {
    // Write a stale anchor that the implementation-tasks ledger
    // will reference.
    await writeAnchor({ id: 'a:stale', status: 'stale', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:stale-anchor',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:stale'],
    })
    const r = await createControlPacket('task:stale-anchor')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const v = await validateControlPacket(r.packet.id)
    expect(v.ok).toBe(false)
    expect(v.defects.find((d) => d.code === 'E_PACKET_STALE_ANCHOR')).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 5                                    */
/*   required_check with status != 'passed' ⇒ E_PACKET_CHECK_NOT_PASSED        */
/* -------------------------------------------------------------------------- */

describe('validateControlPacket() — E_PACKET_CHECK_NOT_PASSED', () => {
  test('rejects a packet whose check_result is failed', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const check = mkSemanticNode({
      id: 'node:check-failed',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'failed'
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:failed-check',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:failed-check')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // The generator filters by status='passed', so
    // required_checks is empty here; we manually add the
    // check id to required_checks to test the validator's
    // status check.
    r.packet.required_checks = ['node:check-failed']
    r.packet.evidence_anchors_list = ['node:check-failed']
    const v = await validateControlPacket(r.packet.id, { packet: r.packet })
    expect(v.ok).toBe(false)
    expect(v.defects.find((d) => d.code === 'E_PACKET_CHECK_NOT_PASSED')).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       MaterializeProposal producer                           */
/* -------------------------------------------------------------------------- */

describe('createProposal()', () => {
  test('emits a proposal with atelier.materialization-proposal/v1 schema', async () => {
    await writeImplementationTask({
      id: 'task:prop',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      forbidden_files: ['product/**'],
    })
    const r = await createProposal('task:prop', {
      taskId: 'task:prop',
      diffRef: '.atelier-bootstrap/autopoiesis/src/lib/packet.ts',
      affectedRequirements: ['node:req-1'],
      affectedFindings: [],
      affectedDecisions: ['node:dec-1'],
      requiredChecks: ['node:check-1'],
      diffRefs: [{ path: '.atelier-bootstrap/autopoiesis/src/lib/packet.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
      forbiddenFiles: ['product/**'],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const p = r.proposal
    expect(p.schema).toBe('atelier.materialization-proposal/v1')
    expect(p.id).toMatch(/^prop:/)
    expect(p.task_id).toBe('task:prop')
    expect(p.lifecycle_state).toBe('observed')
    expect(p.affected_requirements).toEqual(['node:req-1'])
    expect(p.affected_decisions).toEqual(['node:dec-1'])
    expect(p.required_checks).toEqual(['node:check-1'])
    expect(p.diff_refs[0]?.path).toBe('.atelier-bootstrap/autopoiesis/src/lib/packet.ts')
    expect(p.allowed_files).toEqual(['.atelier-bootstrap/**'])
    expect(p.forbidden_files).toEqual(['product/**'])
    expect(p.status).toBe('proposed')
  })

  test('persists the proposal to materialization-proposals.ndjson', async () => {
    await writeImplementationTask({
      id: 'task:prop-2',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const r = await createProposal('task:prop-2', {
      taskId: 'task:prop-2',
      diffRef: '.atelier-bootstrap/x.ts',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    const all = await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
    expect(all.some((p) => p.id === r.proposal.id)).toBe(true)
  })

  test('E_TASK_NOT_FOUND when the task is not in the implementation-tasks ledger', async () => {
    const r = await createProposal('task:missing', {
      taskId: 'task:missing',
      diffRef: '.atelier-bootstrap/x.ts',
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('E_TASK_NOT_FOUND')
  })
})

/* -------------------------------------------------------------------------- */
/*                       validateProposal (positive)                            */
/* -------------------------------------------------------------------------- */

describe('validateProposal() — happy path', () => {
  test('promotes a fully-formed proposal to status=validated, lifecycle_state=accepted', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    // required_check with status='passed' + raw_output_ref.
    const check = mkSemanticNode({
      id: 'node:check-validate',
      kind: 'check_result',
      lifecycle_state: 'verified',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-validate.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    // The check_result itself must be promoted to 'verified' via a PromotionDecision.
    await writePromotionDecision({
      id: 'pd:check-validate',
      subject_id: 'node:check-validate',
      from_state: 'accepted',
      to_state: 'verified',
      decision: 'accepted',
    })
    // A proposal in lifecycle_state='accepted' (must be
    // pre-promoted).
    await writeImplementationTask({
      id: 'task:validate',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:validate', {
      taskId: 'task:validate',
      diffRef: '.atelier-bootstrap/x.ts',
      requiredChecks: ['node:check-validate'],
      diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
    })
    expect(cr.ok).toBe(true)
    if (!cr.ok) return
    // Pre-promote the proposal to lifecycle_state='accepted'
    // by writing a PromotionDecision for it.
    await writePromotionDecision({
      id: 'pd:proposal',
      subject_id: cr.proposal.id,
      from_state: 'observed',
      to_state: 'accepted',
      decision: 'accepted',
    })
    const all = await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
    const updated = all.map((p) =>
      p.id === cr.proposal.id ? { ...p, lifecycle_state: 'accepted' as const } : p,
    )
    const { writeNdjsonAutopoiesis } = await import('../lib/store.ts')
    await writeNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, updated)
    // Run the gate.
    const r = await validateProposal(cr.proposal.id)
    expect(r.report.status).toBe('validated')
    expect(r.proposal.status).toBe('validated')
    expect(r.proposal.lifecycle_state).toBe('accepted')
  })

  test('writes a materialization-reports.ndjson line on success', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const check = mkSemanticNode({
      id: 'node:check-r2',
      kind: 'check_result',
      lifecycle_state: 'verified',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-r2.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writePromotionDecision({
      id: 'pd:check-r2',
      subject_id: 'node:check-r2',
      from_state: 'accepted',
      to_state: 'verified',
      decision: 'accepted',
    })
    await writeImplementationTask({
      id: 'task:reports',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:reports', {
      taskId: 'task:reports',
      diffRef: '.atelier-bootstrap/x.ts',
      requiredChecks: ['node:check-r2'],
      diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
    })
    if (!cr.ok) throw new Error('proposal failed')
    await writePromotionDecision({
      id: 'pd:proposal-r2',
      subject_id: cr.proposal.id,
      from_state: 'observed',
      to_state: 'accepted',
      decision: 'accepted',
    })
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
    const reports = await readNdjsonAutopoiesis<{ proposal_id: string; status: string }>(
      AUTOPOIESIS_PATHS.materializationReports,
    )
    expect(reports.length).toBe(1)
    expect(reports[0]?.proposal_id).toBe(cr.proposal.id)
    expect(reports[0]?.status).toBe('validated')
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 6                                    */
/*   diff_ref outside allowed_files ⇒ E_MATERIALIZE_DIFF_OUT_OF_SCOPE         */
/* -------------------------------------------------------------------------- */

describe('validateProposal() — E_MATERIALIZE_DIFF_OUT_OF_SCOPE', () => {
  test('rejects a proposal whose diff_refs include a file outside allowed_files', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:out-of-scope',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:out-of-scope', {
      taskId: 'task:out-of-scope',
      diffRef: 'product/apps/foo.ts', // NOT in allowed_files
      diffRefs: [{ path: 'product/apps/foo.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
    })
    if (!cr.ok) throw new Error('proposal failed')
    await writePromotionDecision({
      id: 'pd:proposal-oos',
      subject_id: cr.proposal.id,
      from_state: 'observed',
      to_state: 'accepted',
      decision: 'accepted',
    })
    const all = await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
    const updated = all.map((p) =>
      p.id === cr.proposal.id ? { ...p, lifecycle_state: 'accepted' as const } : p,
    )
    const { writeNdjsonAutopoiesis } = await import('../lib/store.ts')
    await writeNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, updated)
    const r = await validateProposal(cr.proposal.id)
    expect(r.report.status).toBe('rejected')
    expect(r.report.defects.find((d) => d.code === 'E_MATERIALIZE_DIFF_OUT_OF_SCOPE')).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 7                                    */
/*   affected_requirement in lifecycle_state='proposed' ⇒                     */
/*   E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED                                    */
/* -------------------------------------------------------------------------- */

describe('validateProposal() — E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED', () => {
  test('rejects a proposal whose affected_requirement is in lifecycle_state=proposed', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const req = mkSemanticNode({
      id: 'node:req-proposed',
      kind: 'requirement',
      lifecycle_state: 'proposed', // not accepted
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, req)
    await writeImplementationTask({
      id: 'task:req-proposed',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:req-proposed', {
      taskId: 'task:req-proposed',
      diffRef: '.atelier-bootstrap/x.ts',
      affectedRequirements: ['node:req-proposed'],
      diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
    })
    if (!cr.ok) throw new Error('proposal failed')
    await writePromotionDecision({
      id: 'pd:proposal-req-proposed',
      subject_id: cr.proposal.id,
      from_state: 'observed',
      to_state: 'accepted',
      decision: 'accepted',
    })
    const all = await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
    const updated = all.map((p) =>
      p.id === cr.proposal.id ? { ...p, lifecycle_state: 'accepted' as const } : p,
    )
    const { writeNdjsonAutopoiesis } = await import('../lib/store.ts')
    await writeNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, updated)
    const r = await validateProposal(cr.proposal.id)
    expect(r.report.status).toBe('rejected')
    expect(
      r.report.defects.find((d) => d.code === 'E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED'),
    ).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 8                                    */
/*   affected_decision in lifecycle_state='superseded' ⇒                       */
/*   E_MATERIALIZE_DECISION_SUPERSEDED                                         */
/* -------------------------------------------------------------------------- */

describe('validateProposal() — E_MATERIALIZE_DECISION_SUPERSEDED', () => {
  test('rejects a proposal whose affected_decision is in lifecycle_state=superseded', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const dec = mkSemanticNode({
      id: 'node:dec-superseded',
      kind: 'decision',
      lifecycle_state: 'superseded', // forbidden
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, dec)
    await writeImplementationTask({
      id: 'task:dec-superseded',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:dec-superseded', {
      taskId: 'task:dec-superseded',
      diffRef: '.atelier-bootstrap/x.ts',
      affectedDecisions: ['node:dec-superseded'],
      diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
    })
    if (!cr.ok) throw new Error('proposal failed')
    await writePromotionDecision({
      id: 'pd:proposal-dec-sup',
      subject_id: cr.proposal.id,
      from_state: 'observed',
      to_state: 'accepted',
      decision: 'accepted',
    })
    const all = await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
    const updated = all.map((p) =>
      p.id === cr.proposal.id ? { ...p, lifecycle_state: 'accepted' as const } : p,
    )
    const { writeNdjsonAutopoiesis } = await import('../lib/store.ts')
    await writeNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, updated)
    const r = await validateProposal(cr.proposal.id)
    expect(r.report.status).toBe('rejected')
    expect(
      r.report.defects.find((d) => d.code === 'E_MATERIALIZE_DECISION_SUPERSEDED'),
    ).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 9                                    */
/*   required_check without a passed check_result ⇒                           */
/*   E_MATERIALIZE_CHECK_NOT_PASSED                                            */
/* -------------------------------------------------------------------------- */

describe('validateProposal() — E_MATERIALIZE_CHECK_NOT_PASSED', () => {
  test('rejects a proposal whose required_check lacks a passed check_result', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    // The required_check points to a NON-EXISTENT
    // check_result — the gate's required_check → check_result
    // join must fail.
    await writeImplementationTask({
      id: 'task:check-fail',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:check-fail', {
      taskId: 'task:check-fail',
      diffRef: '.atelier-bootstrap/x.ts',
      requiredChecks: ['node:check-missing'],
      diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
    })
    if (!cr.ok) throw new Error('proposal failed')
    await writePromotionDecision({
      id: 'pd:proposal-check-fail',
      subject_id: cr.proposal.id,
      from_state: 'observed',
      to_state: 'accepted',
      decision: 'accepted',
    })
    const all = await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
    const updated = all.map((p) =>
      p.id === cr.proposal.id ? { ...p, lifecycle_state: 'accepted' as const } : p,
    )
    const { writeNdjsonAutopoiesis } = await import('../lib/store.ts')
    await writeNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, updated)
    const r = await validateProposal(cr.proposal.id)
    expect(r.report.status).toBe('rejected')
    expect(
      r.report.defects.find((d) => d.code === 'E_MATERIALIZE_CHECK_NOT_PASSED'),
    ).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       Negative control 10                                   */
/*   closeTask with NO validated MaterializationProposal ⇒                     */
/*   E_CLOSE_NO_VALIDATED_PROPOSAL                                            */
/* -------------------------------------------------------------------------- */

describe('closeTask() — E_CLOSE_NO_VALIDATED_PROPOSAL', () => {
  test('rejects closeTask on a task with no validated proposal', async () => {
    await writeImplementationTask({
      id: 'task:no-validated',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const r = await closeTask('task:no-validated')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('E_CLOSE_NO_VALIDATED_PROPOSAL')
  })

  test('rejects closeTask on a task with a proposal in status=proposed', async () => {
    await writeImplementationTask({
      id: 'task:proposed-only',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    // Build a proposal but do NOT validate it.
    const cr = await createProposal('task:proposed-only', {
      taskId: 'task:proposed-only',
      diffRef: '.atelier-bootstrap/x.ts',
    })
    if (!cr.ok) throw new Error('proposal failed')
    const r = await closeTask('task:proposed-only')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('E_CLOSE_NO_VALIDATED_PROPOSAL')
  })

  test('accepts closeTask on a task with a validated proposal', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const check = mkSemanticNode({
      id: 'node:check-close',
      kind: 'check_result',
      lifecycle_state: 'verified',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-close.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writePromotionDecision({
      id: 'pd:check-close',
      subject_id: 'node:check-close',
      from_state: 'accepted',
      to_state: 'verified',
      decision: 'accepted',
    })
    await writeImplementationTask({
      id: 'task:close-ok',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:close-ok', {
      taskId: 'task:close-ok',
      diffRef: '.atelier-bootstrap/x.ts',
      requiredChecks: ['node:check-close'],
      diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
    })
    if (!cr.ok) throw new Error('proposal failed')
    await writePromotionDecision({
      id: 'pd:proposal-close-ok',
      subject_id: cr.proposal.id,
      from_state: 'observed',
      to_state: 'accepted',
      decision: 'accepted',
    })
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
    // The C8 close-findings gate requires a fresh
    // evaluator-state.json. Seed one BEFORE calling closeTask
    // so the gate clears. Use `last_evaluated_at` strictly newer
    // than the proposal's `created_at`.
    await seedEvaluatorStateForTest({})
    const closeR = await closeTask('task:close-ok')
    expect(closeR.ok).toBe(true)
    if (!closeR.ok) return
    expect(closeR.task_id).toBe('task:close-ok')
    expect(closeR.proposal_id).toBe(cr.proposal.id)
    expect(closeR.ack_id).toMatch(/^ack:/)
  })
})

/* -------------------------------------------------------------------------- */
/*                       E_MATERIALIZE_SCOPE_OVERLAP                            */
/* -------------------------------------------------------------------------- */

describe('validateProposal() — E_MATERIALIZE_SCOPE_OVERLAP', () => {
  test('rejects a proposal whose allowed_files ∩ forbidden_files ≠ ∅', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:scope-overlap',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:scope-overlap', {
      taskId: 'task:scope-overlap',
      diffRef: '.atelier-bootstrap/x.ts',
      diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
      forbiddenFiles: ['.atelier-bootstrap/autopoiesis/**'], // overlaps with allowed
    })
    if (!cr.ok) throw new Error('proposal failed')
    await writePromotionDecision({
      id: 'pd:proposal-scope',
      subject_id: cr.proposal.id,
      from_state: 'observed',
      to_state: 'accepted',
      decision: 'accepted',
    })
    const all = await readNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
    )
    const updated = all.map((p) =>
      p.id === cr.proposal.id ? { ...p, lifecycle_state: 'accepted' as const } : p,
    )
    const { writeNdjsonAutopoiesis } = await import('../lib/store.ts')
    await writeNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, updated)
    const r = await validateProposal(cr.proposal.id)
    expect(r.report.status).toBe('rejected')
    expect(r.report.defects.find((d) => d.code === 'E_MATERIALIZE_SCOPE_OVERLAP')).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       E_MATERIALIZE_MISSING_PROMOTION                        */
/* -------------------------------------------------------------------------- */

describe('validateProposal() — E_MATERIALIZE_MISSING_PROMOTION', () => {
  test('rejects a proposal whose lifecycle_state is not accepted', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    await writeImplementationTask({
      id: 'task:no-promote',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
    })
    const cr = await createProposal('task:no-promote', {
      taskId: 'task:no-promote',
      diffRef: '.atelier-bootstrap/x.ts',
      diffRefs: [{ path: '.atelier-bootstrap/x.ts', kind: 'modify' }],
      allowedFiles: ['.atelier-bootstrap/**'],
    })
    if (!cr.ok) throw new Error('proposal failed')
    // Do NOT pre-promote the proposal to lifecycle_state='accepted'.
    const r = await validateProposal(cr.proposal.id)
    expect(r.report.status).toBe('rejected')
    expect(
      r.report.defects.find((d) => d.code === 'E_MATERIALIZE_MISSING_PROMOTION'),
    ).toBeDefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                       E_PACKET_MATERIALIZATION_FAKE_ANCHOR / FAKE_CHECK      */
/* -------------------------------------------------------------------------- */

describe('validateControlPacket() — E_PACKET_MATERIALIZATION_FAKE_ANCHOR', () => {
  test('rejects a packet whose materialization_rule.source_anchor_id is fake', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const check = mkSemanticNode({
      id: 'node:check-fake-anchor',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-fake-anchor.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:fake-anchor',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:fake-anchor')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // Manually inject a fake source_anchor_id.
    r.packet.materialization_rules[0] = {
      ...r.packet.materialization_rules[0]!,
      source_anchor_id: 'anchor:does-not-exist',
    }
    const v = await validateControlPacket(r.packet.id, { packet: r.packet })
    expect(v.ok).toBe(false)
    expect(
      v.defects.find((d) => d.code === 'E_PACKET_MATERIALIZATION_FAKE_ANCHOR'),
    ).toBeDefined()
  })
})

describe('validateControlPacket() — E_PACKET_MATERIALIZATION_FAKE_CHECK', () => {
  test('rejects a packet whose materialization_rule.must_hold_check_ids is fake', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const check = mkSemanticNode({
      id: 'node:check-fake-check',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:fresh' }],
    })
    ;(check as unknown as { status?: string }).status = 'passed'
    ;(check as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test',
      raw_output_ref: '.atelier/v0/runs/evidence/check-fake-check.json',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, check)
    await writeImplementationTask({
      id: 'task:fake-check',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/**'],
      source_anchor_ids: ['a:fresh'],
    })
    const r = await createControlPacket('task:fake-check')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // Manually inject a fake check id into must_hold_check_ids.
    r.packet.materialization_rules[0] = {
      ...r.packet.materialization_rules[0]!,
      must_hold_check_ids: ['node:does-not-exist'],
    }
    const v = await validateControlPacket(r.packet.id, { packet: r.packet })
    expect(v.ok).toBe(false)
    expect(
      v.defects.find((d) => d.code === 'E_PACKET_MATERIALIZATION_FAKE_CHECK'),
    ).toBeDefined()
  })
})
