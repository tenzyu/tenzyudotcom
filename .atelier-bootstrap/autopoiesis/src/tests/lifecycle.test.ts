/**
 * Atelier Autopoiesis — negative-control test suite.
 *
 * The test suite pins the work order's nine negative controls and
 * the broader lifecycle / validator contract. Each test runs
 * against a per-suite temp directory under `process.tmpdir()`; the
 * `process.cwd()` is changed to that directory for the duration of
 * the suite so the validator reads the fixture's
 * `.atelier/v0/autopoiesis/*.ndjson` files.
 *
 * Fixture lifecycle:
 *   - `beforeAll` creates the temp dir and switches cwd.
 *   - `beforeEach` clears every NDJSON file under
 *     `.atelier/v0/autopoiesis/` AND the relation-kernel
 *     `.atelier/v0/anchors/source-anchors.ndjson`. Each test starts
 *     from a clean slate.
 *   - `afterAll` restores cwd and removes the temp dir.
 *
 * Helpers:
 *   - `appendAutopoiesis(file, record)` writes one JSONL line.
 *   - `writeAnchor(anchor)` writes one SourceAnchor line to
 *     `.atelier/v0/anchors/source-anchors.ndjson`.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { readNdjson } from '../../../lib/src/ndjson.ts'

import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'

import {
  transition,
  TRANSITIONS,
  isTransitionAllowed,
  isLlmProvenance,
  isPromotionToProhibited,
} from '../lib/lifecycle.ts'
import {
  LIFECYCLE_STATES,
  SEMANTIC_NODE_KINDS,
  type ConflictRecord,
  type LifecycleState,
  type PromotionDecisionRecord,
  type SemanticNode,
  type StalenessRecord,
  type SubagentHandoff,
} from '../lib/records.ts'
import { validateAutopoiesis } from '../lib/validate.ts'
import { AUTOPOIESIS_PATHS } from '../lib/paths.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string
const AUTOPOIESIS_DIR = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis')
const ANCHORS_FILE = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'anchors', 'source-anchors.ndjson')

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-autopoiesis-'))
  await mkdir(AUTOPOIESIS_DIR(), { recursive: true })
  await mkdir(path.dirname(ANCHORS_FILE()), { recursive: true })
  process.chdir(FIXTURE_ROOT)
})

afterAll(async () => {
  process.chdir(ORIGINAL_CWD)
  await rm(FIXTURE_ROOT, { recursive: true, force: true })
})

beforeEach(async () => {
  // Clear all NDJSON files so each test starts from a clean state.
  for (const file of [
    AUTOPOIESIS_PATHS.semanticNodes,
    AUTOPOIESIS_PATHS.promotionDecisions,
    AUTOPOIESIS_PATHS.stalenessRecords,
    AUTOPOIESIS_PATHS.conflictRecords,
    AUTOPOIESIS_PATHS.authorityRules,
    AUTOPOIESIS_PATHS.controlPackets,
    AUTOPOIESIS_PATHS.materializationProposals,
    AUTOPOIESIS_PATHS.handoffs,
    ANCHORS_FILE(),
  ]) {
    await rm(file, { force: true })
  }
})

/* -------------------------------------------------------------------------- */
/*                               Test helpers                                 */
/* -------------------------------------------------------------------------- */

async function appendAutopoiesis<T extends object>(file: string, record: T): Promise<void> {
  await appendNdjsonAutopoiesis(file, record)
}

async function writeAnchor(anchor: {
  id: string
  status: string
  path: string
  content_hash: string
}): Promise<void> {
  await writeFile(
    ANCHORS_FILE(),
    JSON.stringify({
      id: anchor.id,
      kind: 'file',
      path: anchor.path,
      start_line: 1,
      end_line: 1,
      content_hash: anchor.content_hash,
      selector_strategy: 'path',
      produced_by: 'indexer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: anchor.status,
      source_refs: [{ path: anchor.path, sha256: anchor.content_hash }],
      created_at: new Date().toISOString(),
    }) + '\n',
    'utf8',
  )
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

/* -------------------------------------------------------------------------- */
/*                          LIFECYCLE_STATES contract                         */
/* -------------------------------------------------------------------------- */

describe('LIFECYCLE_STATES', () => {
  test('has exactly 10 values, matching the work order', () => {
    expect(LIFECYCLE_STATES.length).toBe(10)
    const expected: ReadonlyArray<LifecycleState> = [
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
    ]
    for (const s of expected) expect(LIFECYCLE_STATES).toContain(s)
  })

  test('SEMANTIC_NODE_KINDS covers every kind in the work order', () => {
    const expected: ReadonlyArray<SemanticNode['kind']> = [
      'requirement',
      'decision',
      'invariant',
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
    ]
    for (const k of expected) {
      expect(SEMANTIC_NODE_KINDS).toContain(k)
    }
  })
})

/* -------------------------------------------------------------------------- */
/*                              Transition table                              */
/* -------------------------------------------------------------------------- */

describe('transition table', () => {
  test('observed → {inferred, rejected}', () => {
    expect(isTransitionAllowed('observed', 'inferred')).toBe(true)
    expect(isTransitionAllowed('observed', 'rejected')).toBe(true)
    expect(isTransitionAllowed('observed', 'proposed')).toBe(false)
    expect(isTransitionAllowed('observed', 'accepted')).toBe(false)
    expect(isTransitionAllowed('observed', 'verified')).toBe(false)
  })
  test('inferred → {proposed, rejected, archived}', () => {
    expect(isTransitionAllowed('inferred', 'proposed')).toBe(true)
    expect(isTransitionAllowed('inferred', 'rejected')).toBe(true)
    expect(isTransitionAllowed('inferred', 'archived')).toBe(true)
    expect(isTransitionAllowed('inferred', 'accepted')).toBe(false)
    expect(isTransitionAllowed('inferred', 'verified')).toBe(false)
  })
  test('proposed → {accepted, rejected, archived, quarantined}', () => {
    expect(isTransitionAllowed('proposed', 'accepted')).toBe(true)
    expect(isTransitionAllowed('proposed', 'rejected')).toBe(true)
    expect(isTransitionAllowed('proposed', 'archived')).toBe(true)
    expect(isTransitionAllowed('proposed', 'quarantined')).toBe(true)
    expect(isTransitionAllowed('proposed', 'verified')).toBe(false)
    expect(isTransitionAllowed('proposed', 'observed')).toBe(false)
  })
  test('accepted → {verified, superseded, invalidated, archived}', () => {
    expect(isTransitionAllowed('accepted', 'verified')).toBe(true)
    expect(isTransitionAllowed('accepted', 'superseded')).toBe(true)
    expect(isTransitionAllowed('accepted', 'invalidated')).toBe(true)
    expect(isTransitionAllowed('accepted', 'archived')).toBe(true)
    expect(isTransitionAllowed('accepted', 'proposed')).toBe(false)
    expect(isTransitionAllowed('accepted', 'rejected')).toBe(false)
  })
  test('verified → {superseded, invalidated, archived}', () => {
    expect(isTransitionAllowed('verified', 'superseded')).toBe(true)
    expect(isTransitionAllowed('verified', 'invalidated')).toBe(true)
    expect(isTransitionAllowed('verified', 'archived')).toBe(true)
    expect(isTransitionAllowed('verified', 'accepted')).toBe(false)
    expect(isTransitionAllowed('verified', 'proposed')).toBe(false)
  })
  test('superseded → {archived}', () => {
    expect(isTransitionAllowed('superseded', 'archived')).toBe(true)
    expect(TRANSITIONS.superseded.size).toBe(1)
  })
  test('rejected → {archived}', () => {
    expect(isTransitionAllowed('rejected', 'archived')).toBe(true)
    expect(TRANSITIONS.rejected.size).toBe(1)
  })
  test('quarantined → {rejected, archived, observed}', () => {
    expect(isTransitionAllowed('quarantined', 'rejected')).toBe(true)
    expect(isTransitionAllowed('quarantined', 'archived')).toBe(true)
    expect(isTransitionAllowed('quarantined', 'observed')).toBe(true)
    expect(isTransitionAllowed('quarantined', 'accepted')).toBe(false)
    expect(TRANSITIONS.quarantined.size).toBe(3)
  })
  test('invalidated → {archived}', () => {
    expect(isTransitionAllowed('invalidated', 'archived')).toBe(true)
    expect(TRANSITIONS.invalidated.size).toBe(1)
  })
  test('archived → {} (terminal)', () => {
    expect(TRANSITIONS.archived.size).toBe(0)
  })
})

/* -------------------------------------------------------------------------- */
/*                          transition() positive                             */
/* -------------------------------------------------------------------------- */

describe('transition() function: positive controls', () => {
  test('observed → inferred is allowed', () => {
    const r = transition('observed', 'inferred', { provenance: 'deterministic_fact' })
    expect(r.ok).toBe(true)
  })
  test('inferred → proposed is allowed for LLM-extracted', () => {
    const r = transition('inferred', 'proposed', { provenance: 'llm_extracted' })
    expect(r.ok).toBe(true)
  })
  test('proposed → accepted is allowed with manual evidence', () => {
    const r = transition('proposed', 'accepted', {
      provenance: 'manual_control_record',
      evidence_refs: ['evi:abc'],
      owner_or_policy: 'human:reviewer',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(true)
  })
  test('accepted → verified is allowed with runtime evidence', () => {
    const r = transition('accepted', 'verified', {
      provenance: 'runtime_evidence',
      evidence_refs: ['evi:xyz'],
      owner_or_policy: 'test:contract:1',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(true)
  })
})

/* -------------------------------------------------------------------------- */
/*                          transition() negative                             */
/* -------------------------------------------------------------------------- */

describe('transition() function: negative controls', () => {
  test('accepted → proposed is rejected (illegal) with E_TRANSITION_ILLEGAL', () => {
    const r = transition('accepted', 'proposed', {
      provenance: 'manual_control_record',
      evidence_refs: ['evi:abc'],
      owner_or_policy: 'human:reviewer',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('E_TRANSITION_ILLEGAL')
  })
  test('proposed → verified is rejected (must go through accepted) with E_TRANSITION_ILLEGAL', () => {
    const r = transition('proposed', 'verified', {
      provenance: 'manual_control_record',
      evidence_refs: ['evi:abc'],
      owner_or_policy: 'human:reviewer',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('E_TRANSITION_ILLEGAL')
  })
  test('observed → accepted is rejected (illegal) with E_TRANSITION_ILLEGAL', () => {
    const r = transition('observed', 'accepted', {
      provenance: 'manual_control_record',
      evidence_refs: ['evi:abc'],
      owner_or_policy: 'human:reviewer',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('E_TRANSITION_ILLEGAL')
  })
  test('LLM-extracted record cannot transition to accepted with E_PROMOTION_LLM_DIRECT_ACCEPT', () => {
    const r = transition('proposed', 'accepted', {
      provenance: 'llm_extracted',
      evidence_refs: ['evi:abc'],
      owner_or_policy: 'human:reviewer',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('E_PROMOTION_LLM_DIRECT_ACCEPT')
  })
  test('LLM-derived record cannot transition to accepted with E_PROMOTION_LLM_DIRECT_ACCEPT', () => {
    const r = transition('proposed', 'accepted', {
      provenance: 'llm_derived',
      evidence_refs: ['evi:abc'],
      owner_or_policy: 'human:reviewer',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('E_PROMOTION_LLM_DIRECT_ACCEPT')
  })
  test('LLM-extracted record cannot transition to verified with E_PROMOTION_LLM_DIRECT_ACCEPT', () => {
    const r = transition('accepted', 'verified', {
      provenance: 'llm_extracted',
      evidence_refs: ['evi:abc'],
      owner_or_policy: 'human:reviewer',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('E_PROMOTION_LLM_DIRECT_ACCEPT')
  })
  test('Promotion to accepted with empty evidence_refs is rejected with E_PROMOTION_MISSING_EVIDENCE', () => {
    const r = transition('proposed', 'accepted', {
      provenance: 'manual_control_record',
      evidence_refs: [],
      owner_or_policy: 'human:reviewer',
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('E_PROMOTION_MISSING_EVIDENCE')
  })
  test('Promotion to accepted with no owner_or_policy is rejected with E_PROMOTION_MISSING_OWNER', () => {
    const r = transition('proposed', 'accepted', {
      provenance: 'manual_control_record',
      evidence_refs: ['evi:abc'],
      authority_scope: { kind: 'global' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('E_PROMOTION_MISSING_OWNER')
  })
  test('isLlmProvenance flags llm_extracted and llm_derived only', () => {
    expect(isLlmProvenance('llm_extracted')).toBe(true)
    expect(isLlmProvenance('llm_derived')).toBe(true)
    expect(isLlmProvenance('deterministic_fact')).toBe(false)
    expect(isLlmProvenance('manual_control_record')).toBe(false)
    expect(isLlmProvenance('runtime_evidence')).toBe(false)
  })
  test('isPromotionToProhibited only fires for LLM provenance to accepted/verified', () => {
    expect(isPromotionToProhibited('llm_extracted', 'accepted')).toBe(true)
    expect(isPromotionToProhibited('llm_derived', 'verified')).toBe(true)
    expect(isPromotionToProhibited('deterministic_fact', 'accepted')).toBe(false)
    expect(isPromotionToProhibited('llm_extracted', 'proposed')).toBe(false)
    expect(isPromotionToProhibited('llm_derived', 'rejected')).toBe(false)
  })
})

/* -------------------------------------------------------------------------- */
/*                       validateAutopoiesis: empty state                     */
/* -------------------------------------------------------------------------- */

describe('validateAutopoiesis: empty NDJSON files', () => {
  test('returns zero issues when every NDJSON file is absent', async () => {
    const r = await validateAutopoiesis()
    expect(r.issues.length).toBe(0)
    expect(r.warnings.length).toBe(0)
    expect(r.stats.semantic_nodes).toBe(0)
    expect(r.stats.promotion_decisions).toBe(0)
    expect(r.stats.handoffs).toBe(0)
  })

  test('readNdjson returns [] for a missing file', async () => {
    const rows = await readNdjson<unknown>(AUTOPOIESIS_PATHS.semanticNodes)
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBe(0)
  })
})

/* -------------------------------------------------------------------------- */
/*                  validateAutopoiesis: work-order negative controls        */
/* -------------------------------------------------------------------------- */

describe('validateAutopoiesis: work-order negative controls', () => {
  test('a record with empty source_anchors is rejected with E_NODE_NO_SOURCE_ANCHOR', async () => {
    const node = mkSemanticNode({
      id: 'node:no-source-anchor',
      source_anchors: [], // <-- empty
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter((i) => i.code === 'E_NODE_NO_SOURCE_ANCHOR')
    expect(hits.length).toBe(1)
    expect(hits[0]?.affected_record).toBe('node:no-source-anchor')
  })

  test('a record with lifecycle_state=accepted and provenance_kind=llm_extracted and no evidence_refs is rejected with E_PROMOTION_LLM_DIRECT_ACCEPT', async () => {
    const node = mkSemanticNode({
      id: 'node:llm-direct-accept',
      lifecycle_state: 'accepted',
      provenance_kind: 'llm_extracted',
      evidence_refs: [], // <-- empty
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter((i) => i.code === 'E_PROMOTION_LLM_DIRECT_ACCEPT')
    expect(hits.length).toBeGreaterThanOrEqual(1)
    const ours = hits.find((h) => h.affected_record === 'node:llm-direct-accept')
    expect(ours).toBeDefined()
  })

  test('a transition accepted→proposed is rejected (illegal) with E_TRANSITION_ILLEGAL', async () => {
    const subject = mkSemanticNode({
      id: 'node:illegal-1',
      lifecycle_state: 'proposed',
      evidence_refs: ['evi:1'],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:illegal-1',
      subject_id: 'node:illegal-1',
      from_state: 'accepted',
      to_state: 'proposed',
      decision: 'rejected',
      required_checks: [],
      evidence_refs: ['evi:1'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, subject)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_TRANSITION_ILLEGAL' && i.affected_record === 'promotion:illegal-1',
    )
    expect(hits.length).toBe(1)
  })

  test('a transition proposed→verified is rejected (must go through accepted) with E_TRANSITION_ILLEGAL', async () => {
    const subject = mkSemanticNode({
      id: 'node:illegal-2',
      lifecycle_state: 'proposed',
      evidence_refs: ['evi:1'],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:illegal-2',
      subject_id: 'node:illegal-2',
      from_state: 'proposed',
      to_state: 'verified',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:1'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, subject)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_TRANSITION_ILLEGAL' && i.affected_record === 'promotion:illegal-2',
    )
    expect(hits.length).toBe(1)
  })

  test('a PromotionDecision for an llm_extracted record reaching accepted is rejected with E_PROMOTION_LLM_DIRECT_ACCEPT', async () => {
    const subject = mkSemanticNode({
      id: 'node:llm-promotion',
      lifecycle_state: 'proposed',
      provenance_kind: 'llm_extracted',
      evidence_refs: ['evi:1'],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:llm-1',
      subject_id: 'node:llm-promotion',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:1'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, subject)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_PROMOTION_LLM_DIRECT_ACCEPT' && i.affected_record === 'promotion:llm-1',
    )
    expect(hits.length).toBe(1)
  })

  test('a StalenessRecord for a record whose source_anchor is still fresh is rejected with E_STALE_PREMATURE', async () => {
    await writeAnchor({
      id: 'anchor:fresh-1',
      status: 'fresh',
      path: 'README.md',
      content_hash: 'a'.repeat(64),
    })
    const subject = mkSemanticNode({
      id: 'node:stale-test',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      source_anchors: [{ anchor_id: 'anchor:fresh-1' }],
      evidence_refs: ['evi:1'],
    })
    const sr: StalenessRecord = {
      schema: 'atelier.staleness-record/v1',
      id: 'stale:1',
      subject_id: 'node:stale-test',
      subject_kind: 'requirement',
      anchor_id: 'anchor:fresh-1',
      previous_status: 'fresh',
      new_status: 'stale',
      detected_at: new Date().toISOString(),
      reason: 'simulated premature staleness',
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, subject)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.stalenessRecords, sr)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_STALE_PREMATURE' && i.affected_record === 'stale:1',
    )
    expect(hits.length).toBe(1)
  })

  test('a StalenessRecord for a record whose anchor has actually gone stale is accepted (no E_STALE_PREMATURE)', async () => {
    await writeAnchor({
      id: 'anchor:stale-1',
      status: 'stale',
      path: 'README.md',
      content_hash: 'b'.repeat(64),
    })
    const subject = mkSemanticNode({
      id: 'node:stale-good',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      source_anchors: [{ anchor_id: 'anchor:stale-1' }],
    })
    const sr: StalenessRecord = {
      schema: 'atelier.staleness-record/v1',
      id: 'stale:good-1',
      subject_id: 'node:stale-good',
      subject_kind: 'requirement',
      anchor_id: 'anchor:stale-1',
      previous_status: 'fresh',
      new_status: 'stale',
      detected_at: new Date().toISOString(),
      reason: 'real staleness',
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, subject)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.stalenessRecords, sr)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_STALE_PREMATURE' && i.affected_record === 'stale:good-1',
    )
    expect(hits.length).toBe(0)
  })

  test('a ConflictRecord whose claimants do not actually overlap in authority_scope is rejected with E_CONFLICT_NO_OVERLAP', async () => {
    const a = mkSemanticNode({
      id: 'node:conflict-A',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/indexer/**' },
      source_anchors: [{ anchor_id: 'anchor:A' }],
      evidence_refs: ['evi:A'],
    })
    const b = mkSemanticNode({
      id: 'node:conflict-B',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      authority_scope: { kind: 'path', pattern: 'product/apps/foo/**' },
      source_anchors: [{ anchor_id: 'anchor:B' }],
      evidence_refs: ['evi:B'],
    })
    const cr: ConflictRecord = {
      schema: 'atelier.conflict-record/v1',
      id: 'conflict:1',
      scope: { kind: 'path', pattern: 'nowhere' },
      claimants: [
        { record_id: 'node:conflict-A', record_kind: 'requirement', authority: 1 },
        { record_id: 'node:conflict-B', record_kind: 'requirement', authority: 1 },
      ],
      conflict_kind: 'overlap',
      resolution: 'unresolved',
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, a)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, b)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.conflictRecords, cr)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_CONFLICT_NO_OVERLAP' && i.affected_record === 'conflict:1',
    )
    expect(hits.length).toBe(1)
  })

  test('a ConflictRecord whose claimants DO overlap in authority_scope is accepted', async () => {
    const a = mkSemanticNode({
      id: 'node:overlap-A',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/**' },
      source_anchors: [{ anchor_id: 'anchor:overlapA' }],
      evidence_refs: ['evi:A'],
    })
    const b = mkSemanticNode({
      id: 'node:overlap-B',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/autopoiesis/**' },
      source_anchors: [{ anchor_id: 'anchor:overlapB' }],
      evidence_refs: ['evi:B'],
    })
    const cr: ConflictRecord = {
      schema: 'atelier.conflict-record/v1',
      id: 'conflict:overlap-1',
      scope: { kind: 'path', pattern: '.atelier-bootstrap/autopoiesis/**' },
      claimants: [
        { record_id: 'node:overlap-A', record_kind: 'requirement', authority: 1 },
        { record_id: 'node:overlap-B', record_kind: 'requirement', authority: 1 },
      ],
      conflict_kind: 'overlap',
      resolution: 'unresolved',
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, a)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, b)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.conflictRecords, cr)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_CONFLICT_NO_OVERLAP' && i.affected_record === 'conflict:overlap-1',
    )
    expect(hits.length).toBe(0)
  })

  test('a SubagentHandoff with no backlinked check_result is rejected with E_HANDOFF_NO_CHECK_RESULT', async () => {
    const ho: SubagentHandoff = {
      schema: 'atelier.subagent-handoff/v1',
      id: 'handoff:1',
      run_id: 'run:1',
      packet_id: 'packet:1',
      task_id: 'task:1',
      files_changed: [],
      tests_written: [],
      gate_results: {},
      evidence_paths: [],
      blockers: [],
      check_result_ids: [], // <-- empty
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.handoffs, ho)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_HANDOFF_NO_CHECK_RESULT' && i.affected_record === 'handoff:1',
    )
    expect(hits.length).toBe(1)
  })

  test('a SubagentHandoff with a real check_result node is fully accepted (no defect)', async () => {
    // E_HANDOFF_FAKE_CHECK_RESULT (WO1-RT-6) requires a real
    // kind='check_result' SemanticNode for the back-linked id. The
    // back-linked id alone is no longer enough.
    await writeAnchor({
      id: 'anchor:good-check-result-1',
      status: 'fresh',
      path: 'README.md',
      content_hash: '0'.repeat(64),
    })
    const realCheckResult = mkSemanticNode({
      id: 'node:check-result-1',
      kind: 'check_result',
      source_anchors: [{ anchor_id: 'anchor:good-check-result-1' }],
    })
    const ho: SubagentHandoff = {
      schema: 'atelier.subagent-handoff/v1',
      id: 'handoff:good-1',
      run_id: 'run:1',
      packet_id: 'packet:1',
      task_id: 'task:1',
      files_changed: [],
      tests_written: [],
      gate_results: { 'test:1': 'passed' },
      evidence_paths: [],
      blockers: [],
      check_result_ids: ['node:check-result-1'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, realCheckResult)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.handoffs, ho)
    const r = await validateAutopoiesis()
    const handoffHits = r.issues.filter(
      (i) => i.affected_record === 'handoff:good-1',
    )
    expect(handoffHits.length).toBe(0)
  })

  test('the validator, when run on the empty NDJSON files, exits 0 (no defects)', async () => {
    // The beforeEach cleared every NDJSON file. Re-run the validator
    // to confirm the empty-state contract from the work order.
    const r = await validateAutopoiesis()
    expect(r.issues.length).toBe(0)
  })
})

/* -------------------------------------------------------------------------- */
/*                  validateAutopoiesis: structural defects                   */
/* -------------------------------------------------------------------------- */

describe('validateAutopoiesis: structural defects', () => {
  test('two records sharing the same id emit E_NODE_DUPLICATE_ID', async () => {
    const a = mkSemanticNode({ id: 'node:dup' })
    const b = mkSemanticNode({ id: 'node:dup' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, a)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, b)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter((i) => i.code === 'E_NODE_DUPLICATE_ID')
    expect(hits.length).toBeGreaterThanOrEqual(1)
  })

  test('a SemanticNode with an unknown kind emits E_NODE_INVALID_KIND', async () => {
    const node = mkSemanticNode({
      id: 'node:bad-kind',
      // Cast to bypass TS — we want the runtime validator to catch this.
      kind: 'totally-not-a-kind' as SemanticNode['kind'],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_NODE_INVALID_KIND' && i.affected_record === 'node:bad-kind',
    )
    expect(hits.length).toBe(1)
  })

  test('a SemanticNode with an unknown lifecycle_state emits E_NODE_INVALID_LIFECYCLE', async () => {
    const node = mkSemanticNode({
      id: 'node:bad-lifecycle',
      // Cast to bypass TS — we want the runtime validator to catch this.
      lifecycle_state: 'zombie' as SemanticNode['lifecycle_state'],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_NODE_INVALID_LIFECYCLE' && i.affected_record === 'node:bad-lifecycle',
    )
    expect(hits.length).toBe(1)
  })

  test('a SemanticNode missing required fields emits E_NODE_MISSING_REQUIRED', async () => {
    // Write a record that is missing `id`, `created_at`, `produced_by`, and `authority_scope`.
    const bad = {
      schema: 'atelier.semantic-node/v1',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      source_anchors: [{ anchor_id: 'anchor:1' }],
      provenance_kind: 'manual_control_record',
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, bad)
    const r = await validateAutopoiesis()
    const missing = r.issues.filter((i) => i.code === 'E_NODE_MISSING_REQUIRED')
    expect(missing.length).toBeGreaterThanOrEqual(1)
  })
})

/* -------------------------------------------------------------------------- */
/*                              Store smoke                                   */
/* -------------------------------------------------------------------------- */

describe('autopoiesis store helpers', () => {
  test('appendNdjsonAutopoiesis appends one line per call and survives a missing file', async () => {
    const { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } = await import('../lib/store.ts')
    const target = path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis', 'semantic-nodes.ndjson')
    await rm(target, { force: true })
    await appendNdjsonAutopoiesis(target, { id: 'a', kind: 'requirement' })
    await appendNdjsonAutopoiesis(target, { id: 'b', kind: 'decision' })
    const rows = await readNdjsonAutopoiesis<{ id: string; kind: string }>(target)
    expect(rows.length).toBe(2)
    expect(rows[0]?.id).toBe('a')
    expect(rows[1]?.id).toBe('b')
  })
})

/* -------------------------------------------------------------------------- */
/*                  WO1.1 repair: validator hardening                         */
/* -------------------------------------------------------------------------- */

describe('WO1.1 repair: validator hardening', () => {
  test('WO1-RT-1: llm_extracted + accepted + non-empty evidence_refs is REJECTED with E_PROMOTION_LLM_DIRECT_ACCEPT (unconditional)', async () => {
    await writeAnchor({
      id: 'anchor:rt1-llm',
      status: 'fresh',
      path: 'README.md',
      content_hash: '1'.repeat(64),
    })
    const node = mkSemanticNode({
      id: 'node:rt1-llm',
      lifecycle_state: 'accepted',
      provenance_kind: 'llm_extracted',
      evidence_refs: ['evi:rt1-llm'], // non-empty by design
      owner_or_policy: 'human:reviewer',
      source_anchors: [{ anchor_id: 'anchor:rt1-llm' }],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:rt1-llm',
      subject_id: 'node:rt1-llm',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:rt1-llm'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) =>
        i.code === 'E_PROMOTION_LLM_DIRECT_ACCEPT' && i.affected_record === 'node:rt1-llm',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-1: llm_derived + verified + non-empty evidence_refs is REJECTED with E_PROMOTION_LLM_DIRECT_ACCEPT (unconditional)', async () => {
    await writeAnchor({
      id: 'anchor:rt1-llm-deriv',
      status: 'fresh',
      path: 'README.md',
      content_hash: '2'.repeat(64),
    })
    const node = mkSemanticNode({
      id: 'node:rt1-llm-deriv',
      lifecycle_state: 'verified',
      provenance_kind: 'llm_derived',
      evidence_refs: ['evi:rt1-llm-deriv'],
      owner_or_policy: 'human:reviewer',
      source_anchors: [{ anchor_id: 'anchor:rt1-llm-deriv' }],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:rt1-llm-deriv',
      subject_id: 'node:rt1-llm-deriv',
      from_state: 'accepted',
      to_state: 'verified',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:rt1-llm-deriv'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) =>
        i.code === 'E_PROMOTION_LLM_DIRECT_ACCEPT' && i.affected_record === 'node:rt1-llm-deriv',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-2 (evidence): deterministic_fact + accepted + empty evidence_refs is REJECTED with E_PROMOTION_MISSING_EVIDENCE', async () => {
    await writeAnchor({
      id: 'anchor:rt2-evi',
      status: 'fresh',
      path: 'README.md',
      content_hash: '3'.repeat(64),
    })
    const node = mkSemanticNode({
      id: 'node:rt2-evi',
      lifecycle_state: 'accepted',
      provenance_kind: 'deterministic_fact',
      evidence_refs: [], // empty by design
      owner_or_policy: 'human:reviewer',
      source_anchors: [{ anchor_id: 'anchor:rt2-evi' }],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:rt2-evi',
      subject_id: 'node:rt2-evi',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:rt2-evi'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_PROMOTION_MISSING_EVIDENCE' && i.affected_record === 'node:rt2-evi',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-2 (evidence): accepted + evidence_refs with non-string entry is REJECTED with E_PROMOTION_MISSING_EVIDENCE', async () => {
    await writeAnchor({
      id: 'anchor:rt2-evi-bad',
      status: 'fresh',
      path: 'README.md',
      content_hash: '4'.repeat(64),
    })
    const node = {
      ...mkSemanticNode({
        id: 'node:rt2-evi-bad',
        lifecycle_state: 'accepted',
        provenance_kind: 'deterministic_fact',
        evidence_refs: ['evi:ok', null] as unknown as string[],
        owner_or_policy: 'human:reviewer',
        source_anchors: [{ anchor_id: 'anchor:rt2-evi-bad' }],
      }),
    }
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:rt2-evi-bad',
      subject_id: 'node:rt2-evi-bad',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:rt2-evi-bad'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) =>
        i.code === 'E_PROMOTION_MISSING_EVIDENCE' && i.affected_record === 'node:rt2-evi-bad',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-2 (owner): deterministic_fact + accepted + no owner_or_policy is REJECTED with E_PROMOTION_MISSING_OWNER', async () => {
    await writeAnchor({
      id: 'anchor:rt2-owner',
      status: 'fresh',
      path: 'README.md',
      content_hash: '5'.repeat(64),
    })
    const node = mkSemanticNode({
      id: 'node:rt2-owner',
      lifecycle_state: 'accepted',
      provenance_kind: 'deterministic_fact',
      // owner_or_policy intentionally omitted
      source_anchors: [{ anchor_id: 'anchor:rt2-owner' }],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:rt2-owner',
      subject_id: 'node:rt2-owner',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:rt2-owner'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_PROMOTION_MISSING_OWNER' && i.affected_record === 'node:rt2-owner',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-2 (scope): deterministic_fact + accepted + no authority_scope is REJECTED with E_PROMOTION_MISSING_SCOPE', async () => {
    await writeAnchor({
      id: 'anchor:rt2-scope',
      status: 'fresh',
      path: 'README.md',
      content_hash: '6'.repeat(64),
    })
    const node = {
      schema: 'atelier.semantic-node/v1' as const,
      id: 'node:rt2-scope',
      kind: 'requirement' as const,
      lifecycle_state: 'accepted' as const,
      // authority_scope intentionally missing
      source_anchors: [{ anchor_id: 'anchor:rt2-scope' }],
      provenance_kind: 'deterministic_fact' as const,
      evidence_refs: ['evi:rt2-scope'],
      owner_or_policy: 'human:reviewer',
      produced_by: 'atelier-autopoiesis-implementer',
      created_at: '2026-06-07T00:00:00.000Z',
    }
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:rt2-scope',
      subject_id: 'node:rt2-scope',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:rt2-scope'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_PROMOTION_MISSING_SCOPE' && i.affected_record === 'node:rt2-scope',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-3: source_anchors=[{anchor_id:non-existent}] is REJECTED with E_NODE_FAKE_SOURCE_ANCHOR', async () => {
    // Anchor index is empty in this test (beforeEach cleared
    // ANCHORS_FILE). Any source_anchors[] entry is therefore "fake".
    const node = mkSemanticNode({
      id: 'node:rt3-fake-anchor',
      source_anchors: [{ anchor_id: 'this-id-does-not-exist-in-the-index' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_NODE_FAKE_SOURCE_ANCHOR' && i.affected_record === 'node:rt3-fake-anchor',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-3 (positive): a source_anchor present in the anchor index is accepted', async () => {
    await writeAnchor({
      id: 'anchor:rt3-real',
      status: 'fresh',
      path: 'README.md',
      content_hash: '7'.repeat(64),
    })
    const node = mkSemanticNode({
      id: 'node:rt3-real-anchor',
      source_anchors: [{ anchor_id: 'anchor:rt3-real' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_NODE_FAKE_SOURCE_ANCHOR' && i.affected_record === 'node:rt3-real-anchor',
    )
    expect(hits.length).toBe(0)
  })

  test('WO1-RT-4: accepted with NO matching PromotionDecision is REJECTED with E_NODE_NO_PROMOTION_DECISION', async () => {
    await writeAnchor({
      id: 'anchor:rt4',
      status: 'fresh',
      path: 'README.md',
      content_hash: '8'.repeat(64),
    })
    const node = mkSemanticNode({
      id: 'node:rt4-no-decision',
      lifecycle_state: 'accepted',
      provenance_kind: 'deterministic_fact',
      owner_or_policy: 'human:reviewer',
      source_anchors: [{ anchor_id: 'anchor:rt4' }],
    })
    // Note: NO corresponding PromotionDecision is appended.
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) =>
        i.code === 'E_NODE_NO_PROMOTION_DECISION' && i.affected_record === 'node:rt4-no-decision',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-4 (positive): accepted WITH matching PromotionDecision is accepted (no defect)', async () => {
    await writeAnchor({
      id: 'anchor:rt4-real',
      status: 'fresh',
      path: 'README.md',
      content_hash: '9'.repeat(64),
    })
    const node = mkSemanticNode({
      id: 'node:rt4-real-decision',
      lifecycle_state: 'accepted',
      provenance_kind: 'deterministic_fact',
      owner_or_policy: 'human:reviewer',
      source_anchors: [{ anchor_id: 'anchor:rt4-real' }],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:rt4-real',
      subject_id: 'node:rt4-real-decision',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:rt4-real'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) =>
        i.code === 'E_NODE_NO_PROMOTION_DECISION' &&
        i.affected_record === 'node:rt4-real-decision',
    )
    expect(hits.length).toBe(0)
  })

  test('WO1-RT-6: a SubagentHandoff with check_result_ids=[fake-id] is REJECTED with E_HANDOFF_FAKE_CHECK_RESULT', async () => {
    // Even when a real check_result node exists, citing a *fake*
    // id alongside it (or in place of it) must be rejected.
    await writeAnchor({
      id: 'anchor:rt6-real',
      status: 'fresh',
      path: 'README.md',
      content_hash: 'a'.repeat(64),
    })
    const realCheckResult = mkSemanticNode({
      id: 'node:rt6-real-check-result',
      kind: 'check_result',
      source_anchors: [{ anchor_id: 'anchor:rt6-real' }],
    })
    const ho: SubagentHandoff = {
      schema: 'atelier.subagent-handoff/v1',
      id: 'handoff:rt6-fake',
      run_id: 'run:rt6',
      packet_id: 'packet:rt6',
      task_id: 'task:rt6',
      files_changed: [],
      tests_written: [],
      gate_results: {},
      evidence_paths: [],
      blockers: [],
      check_result_ids: ['fake-check-result-id'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, realCheckResult)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.handoffs, ho)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_HANDOFF_FAKE_CHECK_RESULT' && i.affected_record === 'handoff:rt6-fake',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-7: a StalenessRecord with subject_id=fake-subject (and a real stale anchor) is REJECTED with E_STALE_FAKE_SUBJECT', async () => {
    await writeAnchor({
      id: 'anchor:rt7-stale',
      status: 'stale', // not fresh, so E_STALE_PREMATURE won't fire
      path: 'README.md',
      content_hash: 'b'.repeat(64),
    })
    // No semantic node with id 'node:rt7-fake-subject' is created.
    const sr: StalenessRecord = {
      schema: 'atelier.staleness-record/v1',
      id: 'stale:rt7-fake-subject',
      subject_id: 'node:rt7-fake-subject',
      subject_kind: 'requirement',
      anchor_id: 'anchor:rt7-stale',
      previous_status: 'fresh',
      new_status: 'stale',
      detected_at: new Date().toISOString(),
      reason: 'fake subject test',
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.stalenessRecords, sr)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_STALE_FAKE_SUBJECT' && i.affected_record === 'stale:rt7-fake-subject',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-8: a ConflictRecord with claimants=[fake-A, fake-B] (overlapping scopes) is REJECTED with E_CONFLICT_FAKE_CLAIMANT', async () => {
    // The claimants have explicit overlapping scopes, so the
    // E_CONFLICT_NO_OVERLAP check would not fire — the
    // E_CONFLICT_FAKE_CLAIMANT check must still reject it because
    // the claimants do not exist as real SemanticNodes.
    const cr: ConflictRecord = {
      schema: 'atelier.conflict-record/v1',
      id: 'conflict:rt8-fake-claimants',
      scope: { kind: 'path', pattern: '.atelier-bootstrap/**' },
      claimants: [
        {
          record_id: 'node:fake-A',
          record_kind: 'requirement',
          authority: 1,
          authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/**' },
        },
        {
          record_id: 'node:fake-B',
          record_kind: 'requirement',
          authority: 1,
          authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/autopoiesis/**' },
        },
      ],
      conflict_kind: 'overlap',
      resolution: 'unresolved',
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.conflictRecords, cr)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) =>
        i.code === 'E_CONFLICT_FAKE_CLAIMANT' && i.affected_record === 'conflict:rt8-fake-claimants',
    )
    expect(hits.length).toBe(1)
  })

  test('WO1-RT-5: the in-process mutex for appendNdjsonAutopoiesis serializes concurrent appends within the same process', async () => {
    const { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } = await import('../lib/store.ts')
    const target = path.join(
      FIXTURE_ROOT,
      '.atelier',
      'v0',
      'autopoiesis',
      'mutex-test.ndjson',
    )
    await rm(target, { force: true })
    const N = 20
    const promises: Array<Promise<void>> = []
    for (let i = 0; i < N; i++) {
      promises.push(appendNdjsonAutopoiesis(target, { id: `rec-${i}`, n: i }))
    }
    await Promise.all(promises)
    const rows = await readNdjsonAutopoiesis<{ id: string; n: number }>(target)
    expect(rows.length).toBe(N)
    // Sanity-check the content: every n in [0..N) is present.
    const seen = new Set(rows.map((r) => r.n))
    expect(seen.size).toBe(N)
  })

  test('WO1-RT-5 (positive): store docstring does not mention 2-step lock or safe append under concurrent writers', async () => {
    // Read the store.ts file and assert the misleading docstring
    // claims are gone. The module-level comment is the source of
    // truth for the new "in-process mutex" contract.
    const fs = await import('node:fs/promises')
    const storePath = path.resolve(import.meta.dir, '..', 'lib', 'store.ts')
    const source = await fs.readFile(storePath, 'utf8')
    const lower = source.toLowerCase()
    expect(lower).not.toContain('2-step lock')
    expect(lower).not.toContain('safe append under concurrent writers')
    // The new contract must be present.
    expect(source).toMatch(/in-process/i)
    expect(source).toMatch(/atomic/i)
  })

  test('positive: a fully-valid accepted node (evidence/owner/scope/anchor/promotion) emits no defects', async () => {
    await writeAnchor({
      id: 'anchor:positive-1',
      status: 'fresh',
      path: 'README.md',
      content_hash: 'c'.repeat(64),
    })
    const node = mkSemanticNode({
      id: 'node:positive-1',
      lifecycle_state: 'accepted',
      provenance_kind: 'deterministic_fact',
      evidence_refs: ['evi:positive-1'],
      owner_or_policy: 'human:reviewer',
      source_anchors: [{ anchor_id: 'anchor:positive-1' }],
    })
    const dec: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: 'promotion:positive-1',
      subject_id: 'node:positive-1',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['evi:positive-1'],
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, dec)
    const r = await validateAutopoiesis()
    const ourIssues = r.issues.filter((i) => i.affected_record === 'node:positive-1')
    expect(ourIssues.length).toBe(0)
  })

  test('positive: a StalenessRecord with a real subject and a real stale anchor emits no E_STALE_FAKE_SUBJECT', async () => {
    await writeAnchor({
      id: 'anchor:positive-stale',
      status: 'stale',
      path: 'README.md',
      content_hash: 'd'.repeat(64),
    })
    const realSubject = mkSemanticNode({
      id: 'node:positive-stale-subject',
      source_anchors: [{ anchor_id: 'anchor:positive-stale' }],
    })
    const sr: StalenessRecord = {
      schema: 'atelier.staleness-record/v1',
      id: 'stale:positive',
      subject_id: 'node:positive-stale-subject',
      subject_kind: 'requirement',
      anchor_id: 'anchor:positive-stale',
      previous_status: 'fresh',
      new_status: 'stale',
      detected_at: new Date().toISOString(),
      reason: 'real subject test',
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, realSubject)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.stalenessRecords, sr)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_STALE_FAKE_SUBJECT' && i.affected_record === 'stale:positive',
    )
    expect(hits.length).toBe(0)
  })

  test('positive: a ConflictRecord with real claimants and overlapping scopes emits no E_CONFLICT_FAKE_CLAIMANT', async () => {
    const a = mkSemanticNode({
      id: 'node:positive-conflict-A',
      kind: 'requirement',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/**' },
      source_anchors: [{ anchor_id: 'anchor:positive-A' }],
      evidence_refs: ['evi:positive-A'],
    })
    const b = mkSemanticNode({
      id: 'node:positive-conflict-B',
      kind: 'requirement',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/autopoiesis/**' },
      source_anchors: [{ anchor_id: 'anchor:positive-B' }],
      evidence_refs: ['evi:positive-B'],
    })
    const cr: ConflictRecord = {
      schema: 'atelier.conflict-record/v1',
      id: 'conflict:positive',
      scope: { kind: 'path', pattern: '.atelier-bootstrap/autopoiesis/**' },
      claimants: [
        { record_id: 'node:positive-conflict-A', record_kind: 'requirement', authority: 1 },
        { record_id: 'node:positive-conflict-B', record_kind: 'requirement', authority: 1 },
      ],
      conflict_kind: 'overlap',
      resolution: 'unresolved',
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, a)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, b)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.conflictRecords, cr)
    const r = await validateAutopoiesis()
    const hits = r.issues.filter(
      (i) => i.code === 'E_CONFLICT_FAKE_CLAIMANT' && i.affected_record === 'conflict:positive',
    )
    expect(hits.length).toBe(0)
  })

  test('positive: the DEFECT_CODES export contains every expected code', async () => {
    const { DEFECT_CODES } = await import('../lib/validate.ts')
    expect(DEFECT_CODES.E_NODE_NO_SOURCE_ANCHOR).toBe('E_NODE_NO_SOURCE_ANCHOR')
    expect(DEFECT_CODES.E_NODE_FAKE_SOURCE_ANCHOR).toBe('E_NODE_FAKE_SOURCE_ANCHOR')
    expect(DEFECT_CODES.E_NODE_DUPLICATE_ID).toBe('E_NODE_DUPLICATE_ID')
    expect(DEFECT_CODES.E_NODE_INVALID_KIND).toBe('E_NODE_INVALID_KIND')
    expect(DEFECT_CODES.E_NODE_INVALID_LIFECYCLE).toBe('E_NODE_INVALID_LIFECYCLE')
    expect(DEFECT_CODES.E_NODE_MISSING_REQUIRED).toBe('E_NODE_MISSING_REQUIRED')
    expect(DEFECT_CODES.E_NODE_NO_PROMOTION_DECISION).toBe('E_NODE_NO_PROMOTION_DECISION')
    expect(DEFECT_CODES.E_PROMOTION_LLM_DIRECT_ACCEPT).toBe('E_PROMOTION_LLM_DIRECT_ACCEPT')
    expect(DEFECT_CODES.E_PROMOTION_MISSING_EVIDENCE).toBe('E_PROMOTION_MISSING_EVIDENCE')
    expect(DEFECT_CODES.E_PROMOTION_MISSING_OWNER).toBe('E_PROMOTION_MISSING_OWNER')
    expect(DEFECT_CODES.E_PROMOTION_MISSING_SCOPE).toBe('E_PROMOTION_MISSING_SCOPE')
    expect(DEFECT_CODES.E_TRANSITION_ILLEGAL).toBe('E_TRANSITION_ILLEGAL')
    expect(DEFECT_CODES.E_STALE_PREMATURE).toBe('E_STALE_PREMATURE')
    expect(DEFECT_CODES.E_STALE_FAKE_SUBJECT).toBe('E_STALE_FAKE_SUBJECT')
    expect(DEFECT_CODES.E_CONFLICT_NO_OVERLAP).toBe('E_CONFLICT_NO_OVERLAP')
    expect(DEFECT_CODES.E_CONFLICT_FAKE_CLAIMANT).toBe('E_CONFLICT_FAKE_CLAIMANT')
    expect(DEFECT_CODES.E_HANDOFF_NO_CHECK_RESULT).toBe('E_HANDOFF_NO_CHECK_RESULT')
    expect(DEFECT_CODES.E_HANDOFF_FAKE_CHECK_RESULT).toBe('E_HANDOFF_FAKE_CHECK_RESULT')
  })
})
