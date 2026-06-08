/**
 * Atelier Autopoiesis — `stale-detect` negative-control tests.
 *
 * Pins the C7 contract: "stale/supersede/invalidate detection
 * must be an active scan with persisted StalenessRecord."
 *
 * Negative control:
 *   - A semantic node whose source_anchor has status='stale' in
 *     the live anchor index causes `runStaleDetect()` to append
 *     a StalenessRecord with the correct `subject_id` to the
 *     staleness-records ledger.
 *
 * Positive regression:
 *   - A semantic node whose source_anchor is 'fresh' in the live
 *     anchor index causes `runStaleDetect()` to append NO record.
 *
 * Override regression:
 *   - `runStaleDetect({ stale_anchor_statuses })` accepts a
 *     caller-supplied trigger set; the detector uses the
 *     override INSTEAD of the production STALE_TRIGGER_STATUSES
 *     set. The override is the test/dev escape hatch used by the
 *     work order's F4 negative control (stale-detector must NOT
 *     be a no-op in production).
 *
 * The suite runs against a per-suite temp directory under
 * `process.tmpdir()`. `process.cwd()` is changed to that
 * directory for the duration of the suite so that the
 * `autopoiesisPaths()` resolver and the `atelierV0Root()` lookup
 * read the fixture's `.atelier/v0/**` files.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import {
  runStaleDetect,
  deterministicStalenessId,
  detectStalenessForNode,
} from '../lib/stale-detector.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'
import { autopoiesisPaths } from '../lib/paths.ts'
import type { SemanticNode, StalenessRecord } from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string
const AUTOPOIESIS_DIR = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis')
const ANCHORS_FILE = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'anchors', 'source-anchors.ndjson')
// Resolve the autopoiesis paths dynamically so the test fixture
// (under FIXTURE_ROOT) is the one being read and written, not the
// production `.atelier/v0/autopoiesis/` directory. The constant
// `autopoiesisPaths` in `lib/paths.ts` is captured at module-load
// time, which is before `process.chdir(FIXTURE_ROOT)`.
const FIXTURE_PATHS_HELPER = (): {
  semanticNodes: string
  stalenessRecords: string
} => {
  process.chdir(FIXTURE_ROOT)
  return autopoiesisPaths()
}

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-autopoiesis-stale-'))
  await mkdir(AUTOPOIESIS_DIR(), { recursive: true })
  await mkdir(path.dirname(ANCHORS_FILE()), { recursive: true })
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
    PATHS.stalenessRecords,
    ANCHORS_FILE(),
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
    produced_by: 'stale-detect-test',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: anchor.status,
    source_refs: [{ path: anchor.path, sha256: hash }],
    created_at: new Date().toISOString(),
  })
}

function mkNode(overrides: Partial<SemanticNode> = {}): SemanticNode {
  return {
    schema: 'atelier.semantic-node/v1',
    id: 'node:default',
    kind: 'requirement',
    lifecycle_state: 'accepted',
    authority_scope: { kind: 'global' },
    source_anchors: [{ anchor_id: 'a:default' }],
    provenance_kind: 'manual_control_record',
    evidence_refs: ['evi:default'],
    produced_by: 'stale-detect-test',
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  }
}

/* -------------------------------------------------------------------------- */
/*                              deterministicStalenessId                       */
/* -------------------------------------------------------------------------- */

describe('deterministicStalenessId()', () => {
  test('formats as staleness:<nodeId>:<anchorId>', () => {
    expect(deterministicStalenessId('node:1', 'anchor:abc')).toBe(
      'staleness:node:1:anchor:abc',
    )
  })
  test('is stable across invocations', () => {
    const a = deterministicStalenessId('node:x', 'anchor:y')
    const b = deterministicStalenessId('node:x', 'anchor:y')
    expect(a).toBe(b)
  })
  test('differs when either component differs', () => {
    const base = deterministicStalenessId('node:x', 'anchor:y')
    expect(deterministicStalenessId('node:z', 'anchor:y')).not.toBe(base)
    expect(deterministicStalenessId('node:x', 'anchor:w')).not.toBe(base)
  })
})

/* -------------------------------------------------------------------------- */
/*                              runStaleDetect — NEGATIVE                      */
/* -------------------------------------------------------------------------- */

describe('runStaleDetect() — negative control', () => {
  test('a stale anchor causes a StalenessRecord with the correct subject_id', async () => {
    // Arrange: write a node whose only source_anchor is marked
    // 'stale' in the live anchor index. No prior StalenessRecord
    // exists, so the detector must append exactly one new record
    // whose subject_id matches the node id.
    await writeAnchor({ id: 'a:neg-stale', status: 'stale', path: 'README.md' })
    const nodeId = 'node:negative-stale-1'
    const node = mkNode({
      id: nodeId,
      source_anchors: [{ anchor_id: 'a:neg-stale', path: 'README.md' }],
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, node)

    // Act
    const result = await runStaleDetect()

    // Assert: result envelope
    expect(result.schema).toBe('atelier.stale-detect-result/v1')
    expect(result.detected).toBe(1)
    expect(result.records.length).toBe(1)

    // Assert: the appended record on disk
    const persisted = await readNdjsonAutopoiesis<StalenessRecord>(
      autopoiesisPaths().stalenessRecords,
    )
    expect(persisted.length).toBe(1)
    expect(persisted[0]?.id).toBe(deterministicStalenessId(nodeId, 'a:neg-stale'))
    expect(persisted[0]?.subject_id).toBe(nodeId)
    expect(persisted[0]?.subject_kind).toBe('requirement')
    expect(persisted[0]?.anchor_id).toBe('a:neg-stale')
    expect(persisted[0]?.new_status).toBe('stale')
    expect(persisted[0]?.reason).toBe('anchor_status=stale')
    expect(persisted[0]?.schema).toBe('atelier.staleness-record/v1')
  })

  test('an invalid anchor also triggers the detector', async () => {
    await writeAnchor({ id: 'a:neg-inv', status: 'invalid', path: 'README.md' })
    const nodeId = 'node:negative-invalid-1'
    const node = mkNode({
      id: nodeId,
      source_anchors: [{ anchor_id: 'a:neg-inv', path: 'README.md' }],
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, node)
    const result = await runStaleDetect()
    expect(result.detected).toBe(1)
    expect(result.records[0]?.new_status).toBe('invalid')
    expect(result.records[0]?.subject_id).toBe(nodeId)
  })
})

/* -------------------------------------------------------------------------- */
/*                              runStaleDetect — POSITIVE                      */
/* -------------------------------------------------------------------------- */

describe('runStaleDetect() — positive regression', () => {
  test('a fresh anchor causes no StalenessRecord', async () => {
    // Arrange: a node whose only source_anchor is fresh in the
    // live anchor index. The detector must NOT append a record.
    await writeAnchor({ id: 'a:pos-fresh', status: 'fresh', path: 'README.md' })
    const node = mkNode({
      id: 'node:positive-fresh-1',
      source_anchors: [{ anchor_id: 'a:pos-fresh', path: 'README.md' }],
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, node)

    // Act
    const result = await runStaleDetect()

    // Assert: no detection, no records, no persisted file
    expect(result.detected).toBe(0)
    expect(result.records.length).toBe(0)
    const persisted = await readNdjsonAutopoiesis<StalenessRecord>(
      autopoiesisPaths().stalenessRecords,
    )
    expect(persisted.length).toBe(0)
  })

  test('a conflicted anchor (which is NOT in STALE_TRIGGER_STATUSES) is not detected', async () => {
    // 'conflicted' is in the SourceAnchorRef.status enum but is
    // NOT in the STALE_TRIGGER_STATUSES set; conflicts are owned
    // by the C3 detector, not C7. This pins the boundary between
    // the two detectors.
    await writeAnchor({ id: 'a:pos-conf', status: 'conflicted', path: 'README.md' })
    const node = mkNode({
      id: 'node:positive-conflicted-1',
      source_anchors: [{ anchor_id: 'a:pos-conf', path: 'README.md' }],
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, node)
    const result = await runStaleDetect()
    expect(result.detected).toBe(0)
  })

  test('idempotent: running detect twice does not duplicate records', async () => {
    await writeAnchor({ id: 'a:idem', status: 'stale', path: 'README.md' })
    const node = mkNode({
      id: 'node:idempotent-1',
      source_anchors: [{ anchor_id: 'a:idem', path: 'README.md' }],
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, node)
    const first = await runStaleDetect()
    expect(first.detected).toBe(1)
    const second = await runStaleDetect()
    expect(second.detected).toBe(0)
    const persisted = await readNdjsonAutopoiesis<StalenessRecord>(
      autopoiesisPaths().stalenessRecords,
    )
    expect(persisted.length).toBe(1)
  })
})

/* -------------------------------------------------------------------------- */
/*                          runStaleDetect — OVERRIDE                           */
/* -------------------------------------------------------------------------- */

describe('runStaleDetect() — override escape hatch (work-order F4 fix)', () => {
  test('a non-production status triggers when the override set includes it', async () => {
    // A "stale-test" anchor is NOT in the production
    // STALE_TRIGGER_STATUSES set, so the detector would
    // otherwise ignore it. With the override, the detector
    // treats it as stale and emits a record. This pins the
    // contract that the override REPLACES the default set
    // (not extends it).
    await writeAnchor({ id: 'a:override-st', status: 'stale-test', path: 'README.md' })
    const nodeId = 'node:override-st-1'
    const node = mkNode({
      id: nodeId,
      source_anchors: [{ anchor_id: 'a:override-st', path: 'README.md' }],
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, node)
    const result = await runStaleDetect({
      stale_anchor_statuses: new Set(['stale-test']),
    })
    expect(result.detected).toBe(1)
    expect(result.records[0]?.reason).toBe('anchor_status=stale-test')
    expect(result.records[0]?.subject_id).toBe(nodeId)
    // The `new_status` field is typed against the canonical
    // StalenessRecord union. The detector casts through the
    // runtime value; we just confirm the round-trip id.
    expect(result.records[0]?.id).toBe(
      deterministicStalenessId(nodeId, 'a:override-st'),
    )
  })

  test('default behavior is unchanged when no override is supplied', async () => {
    // A 'stale-test' anchor is NOT detected by the production
    // STALE_TRIGGER_STATUSES set. Without the override, the
    // detector returns detected=0.
    await writeAnchor({ id: 'a:default-st', status: 'stale-test', path: 'README.md' })
    const node = mkNode({
      id: 'node:default-st-1',
      source_anchors: [{ anchor_id: 'a:default-st', path: 'README.md' }],
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, node)
    const result = await runStaleDetect()
    expect(result.detected).toBe(0)
  })

  test('detectStalenessForNode() — pure helper — accepts the triggerStatuses override', () => {
    // Pin the pure-helper contract: a node whose anchor is
    // 'stale-test' in the live index produces a record ONLY
    // when the override set includes 'stale-test'. Default
    // behavior is no record.
    const anchorIndex = new Map([
      ['a:helper-ovr', { id: 'a:helper-ovr', status: 'stale-test' }],
    ])
    const node: SemanticNode = {
      schema: 'atelier.semantic-node/v1',
      id: 'node:helper-ovr',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      authority_scope: { kind: 'global' },
      source_anchors: [{ anchor_id: 'a:helper-ovr' }],
      provenance_kind: 'manual_control_record',
      produced_by: 'stale-detect-test',
      created_at: '2026-06-07T00:00:00.000Z',
    }
    const defaultOut = detectStalenessForNode(node, anchorIndex)
    expect(defaultOut.length).toBe(0)
    const overrideOut = detectStalenessForNode(
      node,
      anchorIndex,
      undefined,
      new Set(['stale-test']),
    )
    expect(overrideOut.length).toBe(1)
    expect(overrideOut[0]?.id).toBe(
      deterministicStalenessId('node:helper-ovr', 'a:helper-ovr'),
    )
  })
})
