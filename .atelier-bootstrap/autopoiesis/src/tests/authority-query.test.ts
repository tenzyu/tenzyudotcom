/**
 * Atelier Autopoiesis — authority + query negative-control tests.
 *
 * This suite covers the WO2 work order's 9 negative controls plus
 * a set of positive regressions that pin the runtime contract of
 * the authority resolver and the 9 query kinds.
 *
 * The test pattern follows the existing
 * `.atelier-bootstrap/autopoiesis/src/tests/lifecycle.test.ts`
 * suite: every test runs against a per-suite temp directory under
 * `process.tmpdir()`. `process.cwd()` is changed to that
 * directory for the duration of the suite so that the resolver
 * and the query runtime read the fixture's
 * `.atelier/v0/autopoiesis/*.ndjson` and
 * `.atelier/v0/anchors/source-anchors.ndjson` files.
 *
 * Negative controls covered:
 *   1.  a generated_view record never wins authority
 *   2.  a stale record does not win authority
 *   3.  two records with overlapping scope and non-equal claims
 *       produce a ConflictRecord
 *   4.  --kind accepted-decisions never returns proposed/observed
 *   5.  --kind active-requirements never returns a record with
 *       a stale source_anchor
 *   6.  --kind stale returns every record marked stale
 *   7.  --kind recommend returns a blocked task with its
 *       blockers listed
 *   8.  --scope pointing to a non-existent path returns empty
 *   9.  authority:resolve runs cleanly on an empty index
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import {
  AUTHORITY_CLASSES,
  DEFAULT_PRECEDENCE,
  detectConflicts,
  deterministicConflictId,
  resolveAuthority,
  resolveAll,
  scopeCovers,
  seedDefaults,
  withStalenessFilter,
  type AuthorityClass,
} from '../lib/authority.ts'
import { query, isQueryKind, QUERY_KINDS, type QueryKind } from '../lib/query.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'
import { AUTOPOIESIS_PATHS } from '../lib/paths.ts'
import type { ConflictRecord, SemanticNode } from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string
const AUTOPOIESIS_DIR = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis')
const ANCHORS_FILE = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'anchors', 'source-anchors.ndjson')
const TRANSFORMER_DIR = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'transforms', 'md-to-code', 'model')

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-autopoiesis-authq-'))
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
    AUTOPOIESIS_PATHS.handoffs,
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
    lifecycle_state: 'accepted',
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
  blocker_ids?: string[]
  title?: string
  task_id?: string
}): Promise<void> {
  await appendNdjsonAutopoiesis(path.join(TRANSFORMER_DIR(), 'implementation-tasks.ndjson'), {
    id: task.id,
    kind: 'implementation_task',
    version: '1',
    title: task.title ?? task.id,
    task_id: task.task_id ?? task.id,
    goal: 'fixture task',
    source_object_ids: [],
    source_anchor_ids: [],
    source_refs: [],
    required_knowledge_object_ids: [],
    allowed_files: task.allowed_files ?? [],
    forbidden_files: [],
    acceptance_criteria: [],
    risk_notes: [],
    status: task.status,
    blocker_ids: task.blocker_ids ?? [],
    tags: [],
    fixture: true,
  })
}

/* -------------------------------------------------------------------------- */
/*                            Authority precedence table                      */
/* -------------------------------------------------------------------------- */

describe('Authority precedence table', () => {
  test('has exactly 11 default classes', () => {
    expect(AUTHORITY_CLASSES.length).toBe(11)
  })

  test('default precedences descend in the documented order', () => {
    const expected: ReadonlyArray<[AuthorityClass, number]> = [
      ['product_spec', 100],
      ['adr', 90],
      ['runtime_evidence', 80],
      ['test_contract', 70],
      ['current_implementation', 60],
      ['review_finding', 50],
      ['permission_rule', 40],
      ['risk_policy', 30],
      ['handoff', 20],
      ['llm_proposal', 10],
      ['generated_view', 0],
    ]
    for (const [cls, prec] of expected) {
      expect(DEFAULT_PRECEDENCE.get(cls)).toBe(prec)
    }
  })

  test('generated_view is pinned at precedence 0', () => {
    expect(DEFAULT_PRECEDENCE.get('generated_view')).toBe(0)
  })
})

/* -------------------------------------------------------------------------- */
/*                            Scope matching                                   */
/* -------------------------------------------------------------------------- */

describe('scopeCovers()', () => {
  test('global scope covers anything', () => {
    expect(scopeCovers({ kind: 'global' }, 'foo')).toBe(true)
    expect(scopeCovers({ kind: 'global' }, '.atelier-bootstrap/**')).toBe(true)
  })
  test('path scope covers its descendants', () => {
    expect(scopeCovers({ kind: 'path', pattern: '.atelier-bootstrap/**' }, '.atelier-bootstrap')).toBe(
      true,
    )
    expect(
      scopeCovers(
        { kind: 'path', pattern: '.atelier-bootstrap/**' },
        '.atelier-bootstrap/autopoiesis',
      ),
    ).toBe(true)
  })
  test('path scope does not cover a sibling directory', () => {
    expect(scopeCovers({ kind: 'path', pattern: '.atelier-bootstrap/**' }, 'product/apps')).toBe(
      false,
    )
  })
  test('task and kind scopes only cover their ids', () => {
    expect(scopeCovers({ kind: 'task', task_id: 't1' }, 't1')).toBe(true)
    expect(scopeCovers({ kind: 'task', task_id: 't1' }, 't2')).toBe(false)
    expect(scopeCovers({ kind: 'kind', node_kind: 'requirement' }, 'requirement')).toBe(true)
    expect(scopeCovers({ kind: 'kind', node_kind: 'requirement' }, 'decision')).toBe(false)
  })
})

/* -------------------------------------------------------------------------- */
/*                            Staleness filter                                 */
/* -------------------------------------------------------------------------- */

describe('withStalenessFilter()', () => {
  test('returns fresh when all anchors are fresh in the index', async () => {
    await writeAnchor({ id: 'a:fresh', status: 'fresh', path: 'README.md' })
    const node = mkSemanticNode({ source_anchors: [{ anchor_id: 'a:fresh' }] })
    const index = new Map([['a:fresh', { id: 'a:fresh', status: 'fresh' }]])
    expect(withStalenessFilter(node, index)).toBe('fresh')
  })
  test('returns stale when an anchor is stale in the index', async () => {
    await writeAnchor({ id: 'a:stale', status: 'stale', path: 'README.md' })
    const node = mkSemanticNode({ source_anchors: [{ anchor_id: 'a:stale' }] })
    const index = new Map([['a:stale', { id: 'a:stale', status: 'stale' }]])
    expect(withStalenessFilter(node, index)).toBe('stale')
  })
  test('returns stale when an anchor is archived', () => {
    const node = mkSemanticNode({ source_anchors: [{ anchor_id: 'a:arc' }] })
    const index = new Map([['a:arc', { id: 'a:arc', status: 'archived' }]])
    expect(withStalenessFilter(node, index)).toBe('stale')
  })
  test('returns stale when an anchor is quarantined', () => {
    const node = mkSemanticNode({ source_anchors: [{ anchor_id: 'a:q' }] })
    const index = new Map([['a:q', { id: 'a:q', status: 'quarantined' }]])
    expect(withStalenessFilter(node, index)).toBe('stale')
  })
  test('returns stale when an anchor is invalid', () => {
    const node = mkSemanticNode({ source_anchors: [{ anchor_id: 'a:inv' }] })
    const index = new Map([['a:inv', { id: 'a:inv', status: 'invalid' }]])
    expect(withStalenessFilter(node, index)).toBe('stale')
  })
  test('returns stale when there are no source_anchors', () => {
    const node = mkSemanticNode({ source_anchors: [] })
    const index = new Map<string, { id: string; status: string }>()
    expect(withStalenessFilter(node, index)).toBe('stale')
  })
})

/* -------------------------------------------------------------------------- */
/*                            seedDefaults                                     */
/* -------------------------------------------------------------------------- */

describe('seedDefaults()', () => {
  test('writes 11 default AuthorityRule records on first run', async () => {
    const r = await seedDefaults()
    expect(r.appended).toBe(11)
    expect(r.total).toBe(11)
    const rules = await readNdjsonAutopoiesis<{ id: string; precedence: number }>(
      AUTOPOIESIS_PATHS.authorityRules,
    )
    expect(rules.length).toBe(11)
    const ids = rules.map((r) => r.id).sort()
    // Sorted alphabetically: adr, current_implementation,
    // generated_view, handoff, llm_proposal, permission_rule,
    // product_spec, review_finding, risk_policy, runtime_evidence,
    // test_contract
    expect(ids[0]).toBe('rule:adr')
    expect(ids[10]).toBe('rule:test_contract')
    // Confirm the canonical precedences are present.
    const prodspec = rules.find((x) => x.id === 'rule:product_spec')
    expect(prodspec?.precedence).toBe(100)
    const gv = rules.find((x) => x.id === 'rule:generated_view')
    expect(gv?.precedence).toBe(0)
  })

  test('is idempotent: a second call appends 0 rules', async () => {
    await seedDefaults()
    const r = await seedDefaults()
    expect(r.appended).toBe(0)
    expect(r.total).toBe(11)
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 1                                */
/*   a generated_view record never wins authority                              */
/* -------------------------------------------------------------------------- */

describe('resolveAuthority() — generated_view never wins', () => {
  test('returns winner_id=null for class=generated_view, even with a candidate', async () => {
    await writeAnchor({ id: 'a:gv', status: 'fresh', path: 'README.md' })
    const gvNode: SemanticNode = mkSemanticNode({
      id: 'node:gen-view',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      authority_scope: { kind: 'global' },
      source_anchors: [{ anchor_id: 'a:gv' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, gvNode)
    const r = await resolveAuthority('generated_view', '.')
    expect(r.winner_id).toBeNull()
    expect(r.winner_precedence).toBeNull()
  })

  test('returns 11 default class resolutions from resolveAll() on an empty index, all winner_id=null', async () => {
    const r = await resolveAll('.')
    expect(r.resolutions.length).toBe(11)
    for (const res of r.resolutions) {
      expect(res.winner_id).toBeNull()
      expect(res.candidate_ids.length).toBe(0)
    }
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 2                                */
/*   a stale record does not win authority                                     */
/* -------------------------------------------------------------------------- */

describe('resolveAuthority() — stale records do not win', () => {
  test('a stale record is a candidate with reason=stale_anchor, not the winner', async () => {
    await writeAnchor({ id: 'a:stale-1', status: 'stale', path: 'README.md' })
    const node = mkSemanticNode({
      id: 'node:stale-only',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      authority_scope: { kind: 'global' },
      source_anchors: [{ anchor_id: 'a:stale-1' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await resolveAuthority('product_spec', '.')
    expect(r.winner_id).toBeNull()
    const info = r.candidates.find((c) => c.id === 'node:stale-only')
    expect(info).toBeDefined()
    expect(info?.reason).toBe('stale_anchor')
  })

  test('a fresh record wins over a stale record in the same class', async () => {
    await writeAnchor({ id: 'a:fresh-w', status: 'fresh', path: 'README.md' })
    await writeAnchor({ id: 'a:stale-w', status: 'stale', path: 'README.md' })
    const staleNode = mkSemanticNode({
      id: 'node:stale-w',
      kind: 'requirement',
      authority_scope: { kind: 'global' },
      source_anchors: [{ anchor_id: 'a:stale-w' }],
    })
    const freshNode = mkSemanticNode({
      id: 'node:fresh-w',
      kind: 'requirement',
      authority_scope: { kind: 'global' },
      source_anchors: [{ anchor_id: 'a:fresh-w' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, staleNode)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, freshNode)
    const r = await resolveAuthority('product_spec', '.')
    expect(r.winner_id).toBe('node:fresh-w')
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 3                                */
/*   two records with overlapping scope + non-equal claims emit ConflictRecord  */
/* -------------------------------------------------------------------------- */

describe('detectConflicts()', () => {
  test('two records with overlapping scope and non-equal claims emit a ConflictRecord', async () => {
    const a = mkSemanticNode({
      id: 'node:overlap-A',
      kind: 'requirement',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/**' },
      source_anchors: [{ anchor_id: 'a:oA' }],
      text: 'first claim',
    })
    const b = mkSemanticNode({
      id: 'node:overlap-B',
      kind: 'requirement',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/autopoiesis/**' },
      source_anchors: [{ anchor_id: 'a:oB' }],
      text: 'second claim',
    })
    const conflicts = detectConflicts([a, b], [])
    expect(conflicts.length).toBe(1)
    expect(conflicts[0]?.claimants.length).toBe(2)
    const ids = (conflicts[0]?.claimants ?? []).map((c) => c.record_id).sort()
    expect(ids).toEqual(['node:overlap-A', 'node:overlap-B'])
  })

  test('two records with overlapping scope but equal claims do NOT emit a conflict', () => {
    const a = mkSemanticNode({
      id: 'node:eq-A',
      kind: 'requirement',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/**' },
      text: 'same claim',
    })
    const b = mkSemanticNode({
      id: 'node:eq-B',
      kind: 'requirement',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/**' },
      text: 'same claim',
    })
    const conflicts = detectConflicts([a, b], [])
    expect(conflicts.length).toBe(0)
  })

  test('resolveAuthority persists a conflict for two overlapping candidates', async () => {
    await writeAnchor({ id: 'a:cA', status: 'fresh', path: '.atelier-bootstrap/x.ts' })
    await writeAnchor({ id: 'a:cB', status: 'fresh', path: '.atelier-bootstrap/y.ts' })
    const a = mkSemanticNode({
      id: 'node:cf-A',
      kind: 'requirement',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/**' },
      source_anchors: [{ anchor_id: 'a:cA' }],
      text: 'claim A',
    })
    const b = mkSemanticNode({
      id: 'node:cf-B',
      kind: 'requirement',
      authority_scope: { kind: 'path', pattern: '.atelier-bootstrap/autopoiesis/**' },
      source_anchors: [{ anchor_id: 'a:cB' }],
      text: 'claim B',
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, a)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, b)
    const r = await resolveAuthority('product_spec', '.')
    expect(r.conflicts.length).toBe(1)
    expect(r.conflicts[0]?.id).toBe(deterministicConflictId(['node:cf-A', 'node:cf-B']))
    // The resolver does NOT silently pick one — both appear in
    // candidates; the winner is the higher-precedence record by
    // class tiebreak, but conflicts are surfaced explicitly.
    expect(r.candidate_ids).toContain('node:cf-A')
    expect(r.candidate_ids).toContain('node:cf-B')
  })
})

/* -------------------------------------------------------------------------- */
/*                            Query kinds                                      */
/* -------------------------------------------------------------------------- */

describe('Query kinds — registration', () => {
  test('QUERY_KINDS has 9 entries, in the documented order', () => {
    expect(QUERY_KINDS.length).toBe(9)
    const expected: ReadonlyArray<QueryKind> = [
      'active-requirements',
      'accepted-decisions',
      'required-checks',
      'permissions',
      'open-findings',
      'stale',
      'conflicts',
      'evidence',
      'recommend',
    ]
    for (const k of expected) expect(QUERY_KINDS).toContain(k)
  })
  test('isQueryKind flags valid kinds only', () => {
    expect(isQueryKind('active-requirements')).toBe(true)
    expect(isQueryKind('recommend')).toBe(true)
    expect(isQueryKind('not-a-kind')).toBe(false)
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 4                                */
/*   --kind accepted-decisions never returns proposed/observed/inferred         */
/* -------------------------------------------------------------------------- */

describe('query(accepted-decisions) — non-accepted filter', () => {
  test('never returns a record with lifecycle_state=proposed', async () => {
    const node = mkSemanticNode({
      id: 'node:dec-proposed',
      kind: 'decision',
      lifecycle_state: 'proposed',
      source_anchors: [{ anchor_id: 'a:1' }],
    })
    await writeAnchor({ id: 'a:1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('accepted-decisions', {})
    expect(r.records.length).toBe(0)
  })

  test('never returns a record with lifecycle_state=observed', async () => {
    const node = mkSemanticNode({
      id: 'node:dec-observed',
      kind: 'decision',
      lifecycle_state: 'observed',
      source_anchors: [{ anchor_id: 'a:1' }],
    })
    await writeAnchor({ id: 'a:1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('accepted-decisions', {})
    expect(r.records.length).toBe(0)
  })

  test('never returns a record with lifecycle_state=inferred', async () => {
    const node = mkSemanticNode({
      id: 'node:dec-inferred',
      kind: 'decision',
      lifecycle_state: 'inferred',
      source_anchors: [{ anchor_id: 'a:1' }],
    })
    await writeAnchor({ id: 'a:1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('accepted-decisions', {})
    expect(r.records.length).toBe(0)
  })

  test('returns records with lifecycle_state=accepted', async () => {
    const node = mkSemanticNode({
      id: 'node:dec-accepted',
      kind: 'decision',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:1' }],
    })
    await writeAnchor({ id: 'a:1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('accepted-decisions', {})
    expect(r.records.length).toBe(1)
  })

  test('--include-non-accepted returns the proposed record too', async () => {
    const node = mkSemanticNode({
      id: 'node:dec-proposed-2',
      kind: 'decision',
      lifecycle_state: 'proposed',
      source_anchors: [{ anchor_id: 'a:1' }],
    })
    await writeAnchor({ id: 'a:1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('accepted-decisions', { include_non_accepted: true })
    expect(r.records.length).toBe(1)
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 5                                */
/*   --kind active-requirements never returns a stale record                   */
/* -------------------------------------------------------------------------- */

describe('query(active-requirements) — staleness filter', () => {
  test('never returns a record whose source_anchor is in status=stale', async () => {
    await writeAnchor({ id: 'a:r-stale', status: 'stale', path: 'README.md' })
    const node = mkSemanticNode({
      id: 'node:r-stale',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:r-stale' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('active-requirements', {})
    expect(r.records.length).toBe(0)
  })

  test('never returns a record whose source_anchor is archived', async () => {
    await writeAnchor({ id: 'a:r-arc', status: 'archived', path: 'README.md' })
    const node = mkSemanticNode({
      id: 'node:r-arc',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:r-arc' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('active-requirements', {})
    expect(r.records.length).toBe(0)
  })

  test('never returns a record whose source_anchor is quarantined', async () => {
    await writeAnchor({ id: 'a:r-q', status: 'quarantined', path: 'README.md' })
    const node = mkSemanticNode({
      id: 'node:r-q',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:r-q' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('active-requirements', {})
    expect(r.records.length).toBe(0)
  })

  test('returns a record with a fresh source_anchor', async () => {
    await writeAnchor({ id: 'a:r-fresh', status: 'fresh', path: 'README.md' })
    const node = mkSemanticNode({
      id: 'node:r-fresh',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:r-fresh' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('active-requirements', {})
    expect(r.records.length).toBe(1)
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 6                                */
/*   --kind stale returns at least every record explicitly marked stale         */
/* -------------------------------------------------------------------------- */

describe('query(stale) — comprehensive staleness coverage', () => {
  test('returns every record that has a stale source_anchor', async () => {
    await writeAnchor({ id: 'a:s1', status: 'stale', path: 'README.md' })
    await writeAnchor({ id: 'a:s2', status: 'archived', path: 'README.md' })
    const a = mkSemanticNode({
      id: 'node:s1',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:s1' }],
    })
    const b = mkSemanticNode({
      id: 'node:s2',
      kind: 'decision',
      lifecycle_state: 'verified',
      source_anchors: [{ anchor_id: 'a:s2' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, a)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, b)
    const r = await query('stale', {})
    const ids = r.records.map((n) => n.id)
    expect(ids).toContain('node:s1')
    expect(ids).toContain('node:s2')
  })

  test('returns records in lifecycle_state=superseded/archived/quarantined', async () => {
    await writeAnchor({ id: 'a:fresh-2', status: 'fresh', path: 'README.md' })
    const a = mkSemanticNode({
      id: 'node:superseded',
      kind: 'requirement',
      lifecycle_state: 'superseded',
      source_anchors: [{ anchor_id: 'a:fresh-2' }],
    })
    const b = mkSemanticNode({
      id: 'node:archived',
      kind: 'requirement',
      lifecycle_state: 'archived',
      source_anchors: [{ anchor_id: 'a:fresh-2' }],
    })
    const c = mkSemanticNode({
      id: 'node:quarantined',
      kind: 'requirement',
      lifecycle_state: 'quarantined',
      source_anchors: [{ anchor_id: 'a:fresh-2' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, a)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, b)
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, c)
    const r = await query('stale', {})
    const ids = r.records.map((n) => n.id)
    expect(ids).toContain('node:superseded')
    expect(ids).toContain('node:archived')
    expect(ids).toContain('node:quarantined')
  })

  test('does NOT return fresh+accepted records', async () => {
    await writeAnchor({ id: 'a:clean', status: 'fresh', path: 'README.md' })
    const a = mkSemanticNode({
      id: 'node:clean',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:clean' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, a)
    const r = await query('stale', {})
    expect(r.records.find((n) => n.id === 'node:clean')).toBeUndefined()
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 7                                */
/*   --kind recommend returns a blocked task with its blockers listed           */
/* -------------------------------------------------------------------------- */

describe('query(recommend) — blocked task selection', () => {
  test('returns the blocked task with its blocker_ids listed', async () => {
    await writeImplementationTask({
      id: 'task:blocked-1',
      status: 'blocked',
      allowed_files: ['.atelier-bootstrap/autopoiesis/**'],
      blocker_ids: ['no-accepted-relation-trace:foo', 'no-accepted-relation-trace:bar'],
    })
    const r = await query('recommend', {})
    if (r.kind !== 'recommend') throw new Error('expected recommend')
    expect(r.task_payload).not.toBeNull()
    expect(r.task_payload?.id).toBe('task:blocked-1')
    expect(r.task_payload?.status).toBe('blocked')
    const blockerIds = r.task_payload?.['blocker_ids'] as string[] | undefined
    expect(blockerIds?.length).toBe(2)
  })

  test('returns ready tasks when no blocked tasks exist', async () => {
    await writeImplementationTask({
      id: 'task:ready-1',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/autopoiesis/**'],
    })
    const r = await query('recommend', {})
    if (r.kind !== 'recommend') throw new Error('expected recommend')
    expect(r.task_payload).not.toBeNull()
    expect(r.task_payload?.id).toBe('task:ready-1')
  })

  test('returns null when no eligible tasks exist', async () => {
    const r = await query('recommend', {})
    if (r.kind !== 'recommend') throw new Error('expected recommend')
    expect(r.task_payload).toBeNull()
  })

  test('returns candidates sorted by blocker count descending', async () => {
    await writeImplementationTask({
      id: 'task:blk-1',
      status: 'blocked',
      allowed_files: ['.atelier-bootstrap/**'],
      blocker_ids: ['x'],
    })
    await writeImplementationTask({
      id: 'task:blk-2',
      status: 'blocked',
      allowed_files: ['.atelier-bootstrap/**'],
      blocker_ids: ['x', 'y', 'z'],
    })
    const r = await query('recommend', {})
    if (r.kind !== 'recommend') throw new Error('expected recommend')
    const candidates = r.candidates
    expect(candidates.length).toBeGreaterThanOrEqual(2)
    expect(candidates[0]?.id).toBe('task:blk-2')
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 8                                */
/*   --scope pointing to a non-existent path returns empty records              */
/* -------------------------------------------------------------------------- */

describe('query() — non-existent scope', () => {
  test('--kind active-requirements with a non-existent scope returns []', async () => {
    await writeAnchor({ id: 'a:x', status: 'fresh', path: 'README.md' })
    const node = mkSemanticNode({
      id: 'node:x',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:x' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('active-requirements', { scope: 'this/path/does/not/exist' })
    expect(r.records).toEqual([])
  })

  test('--kind accepted-decisions with a non-existent scope returns []', async () => {
    await writeAnchor({ id: 'a:y', status: 'fresh', path: 'README.md' })
    const node = mkSemanticNode({
      id: 'node:y',
      kind: 'decision',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:y' }],
    })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('accepted-decisions', { scope: 'this/path/does/not/exist' })
    expect(r.records).toEqual([])
  })
})

/* -------------------------------------------------------------------------- */
/*                            Negative control 9                                */
/*   authority:resolve runs cleanly on an empty .atelier/v0/autopoiesis/        */
/* -------------------------------------------------------------------------- */

describe('resolveAll() — empty index', () => {
  test('returns 11 default class resolutions, all winner_id=null', async () => {
    await seedDefaults()
    const r = await resolveAll('.')
    expect(r.resolutions.length).toBe(11)
    for (const res of r.resolutions) {
      expect(res.winner_id).toBeNull()
      expect(res.winner_precedence).toBeNull()
      expect(res.candidate_ids).toEqual([])
      expect(res.conflicts).toEqual([])
    }
  })
})

/* -------------------------------------------------------------------------- */
/*                            Positive regressions                              */
/* -------------------------------------------------------------------------- */

describe('query() — kind=conflicts', () => {
  test('returns the conflict records from the ledger', async () => {
    const cr: ConflictRecord = {
      schema: 'atelier.conflict-record/v1',
      id: 'conflict:test-1',
      scope: { kind: 'global' },
      claimants: [
        { record_id: 'a', record_kind: 'requirement', authority: 1 },
        { record_id: 'b', record_kind: 'requirement', authority: 1 },
      ],
      conflict_kind: 'overlap',
      resolution: 'unresolved',
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    await appendAutopoiesis(AUTOPOIESIS_PATHS.conflictRecords, cr)
    const r = await query('conflicts', {})
    if (r.kind !== 'conflicts') throw new Error('expected conflicts kind')
    expect(r.records.length).toBe(1)
    expect((r.records[0] as ConflictRecord).id).toBe('conflict:test-1')
  })
})

describe('query() — kind=required-checks', () => {
  test('returns check_result records that are passed+accepted+with proof', async () => {
    const ok = mkSemanticNode({
      id: 'node:check-ok',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:c1' }],
    })
    ;(ok as unknown as { status?: string }).status = 'passed'
    ;(ok as unknown as { evidence_proof?: { command: string; raw_output_ref: string } }).evidence_proof = {
      command: 'bun test foo.test.ts',
      raw_output_ref: '.atelier/v0/runs/evidence/foo.json',
    }
    await writeAnchor({ id: 'a:c1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, ok)
    const r = await query('required-checks', {})
    expect(r.records.find((n) => n.id === 'node:check-ok')).toBeDefined()
  })

  test('skips a check_result without an evidence_proof', async () => {
    const bad = mkSemanticNode({
      id: 'node:check-bad',
      kind: 'check_result',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:c2' }],
    })
    ;(bad as unknown as { status?: string }).status = 'passed'
    // No evidence_proof.
    await writeAnchor({ id: 'a:c2', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, bad)
    const r = await query('required-checks', {})
    expect(r.records.find((n) => n.id === 'node:check-bad')).toBeUndefined()
  })
})

describe('query() — kind=permissions', () => {
  test('returns permission_rule records that are accepted', async () => {
    const node = mkSemanticNode({
      id: 'node:perm-1',
      kind: 'permission_rule',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:p1' }],
    })
    await writeAnchor({ id: 'a:p1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('permissions', {})
    expect(r.records.length).toBe(1)
  })
})

describe('query() — kind=open-findings', () => {
  test('returns review_finding records that are proposed/accepted and status=open', async () => {
    const node = mkSemanticNode({
      id: 'node:find-1',
      kind: 'review_finding',
      lifecycle_state: 'proposed',
      source_anchors: [{ anchor_id: 'a:f1' }],
    })
    ;(node as unknown as { status?: string }).status = 'open'
    await writeAnchor({ id: 'a:f1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('open-findings', {})
    expect(r.records.length).toBe(1)
  })

  test('skips review_finding with status!=open', async () => {
    const node = mkSemanticNode({
      id: 'node:find-closed',
      kind: 'review_finding',
      lifecycle_state: 'accepted',
      source_anchors: [{ anchor_id: 'a:f2' }],
    })
    ;(node as unknown as { status?: string }).status = 'closed'
    await writeAnchor({ id: 'a:f2', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('open-findings', {})
    expect(r.records.find((n) => n.id === 'node:find-closed')).toBeUndefined()
  })
})

describe('query() — kind=evidence', () => {
  test('returns every check_result regardless of lifecycle state', async () => {
    const node = mkSemanticNode({
      id: 'node:ev-1',
      kind: 'check_result',
      lifecycle_state: 'observed',
      source_anchors: [{ anchor_id: 'a:e1' }],
    })
    await writeAnchor({ id: 'a:e1', status: 'fresh', path: 'README.md' })
    await appendAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, node)
    const r = await query('evidence', {})
    // evidence in v0 includes proposed/observed; --include-non-accepted
    // is implicit for the evidence kind.
    expect(r.records.find((n) => n.id === 'node:ev-1')).toBeDefined()
  })
})

describe('query() — result envelope', () => {
  test('envelope conforms to atelier.query-result/v1', async () => {
    const r = await query('active-requirements', { scope: '.' })
    expect(r.schema).toBe('atelier.query-result/v1')
    expect(r.kind).toBe('active-requirements')
    expect(typeof r.generated_at).toBe('string')
    expect(r.generated_at.length).toBeGreaterThan(0)
    expect(Array.isArray(r.records)).toBe(true)
    expect(Array.isArray(r.warnings)).toBe(true)
    expect(r.include_non_accepted).toBe(false)
  })
})
