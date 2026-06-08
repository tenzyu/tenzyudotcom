/**
 * Atelier Autopoiesis — `conflicts-detect` negative-control tests.
 *
 * Pins the C3 contract: "detectConflicts must be reachable via
 * CLI; ConflictRecord is a typed node family."
 *
 * Negative control:
 *   - Two records with overlapping `authority_scope` and
 *     non-equal `text` claims produce exactly one
 *     ConflictRecord with a deterministic id.
 *
 * Positive regression:
 *   - Two records with non-overlapping `authority_scope` produce
 *     no ConflictRecord, even when their `text` claims differ.
 *
 * The suite runs against a per-suite temp directory under
 * `process.tmpdir()`. `process.cwd()` is changed to that
 * directory for the duration of the suite so that
 * `autopoiesisPaths().conflictRecords` resolves into the
 * fixture's `.atelier/v0/autopoiesis/conflicts.ndjson` file.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { runConflictsDetect } from '../commands/conflicts-detect.ts'
import { deterministicConflictId } from '../lib/authority.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'
import { autopoiesisPaths } from '../lib/paths.ts'
import type { ConflictRecord, SemanticNode } from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string
const AUTOPOIESIS_DIR = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis')

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-autopoiesis-conflicts-'))
  await mkdir(AUTOPOIESIS_DIR(), { recursive: true })
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
    PATHS.conflictRecords,
  ]) {
    await rm(file, { force: true })
  }
})

/* -------------------------------------------------------------------------- */
/*                               Test helpers                                 */
/* -------------------------------------------------------------------------- */

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
    produced_by: 'conflicts-detect-test',
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  }
}

/* -------------------------------------------------------------------------- */
/*                              runConflictsDetect — NEGATIVE                  */
/* -------------------------------------------------------------------------- */

describe('runConflictsDetect() — negative control', () => {
  test('two records with overlapping scope and non-equal claims produce exactly one ConflictRecord with deterministic id', async () => {
    // Arrange: two requirement records with the same global
    // scope and DIFFERENT text claims. They share the same
    // authority class (requirement), their scopes overlap
    // (global covers anything), and their claims differ.
    const a = mkNode({
      id: 'req:neg-a',
      text: 'Use module-resolution strategy A',
    })
    const b = mkNode({
      id: 'req:neg-b',
      text: 'Use module-resolution strategy B',
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, a)
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, b)

    // Act
    const result = await runConflictsDetect()

    // Assert: result envelope
    expect(result.schema).toBe('atelier.conflicts-detect-result/v1')
    expect(result.detected).toBe(1)
    expect(result.records.length).toBe(1)
    const expectedId = deterministicConflictId(['req:neg-a', 'req:neg-b'])
    expect(result.records[0]?.id).toBe(expectedId)

    // Assert: persisted to disk
    const persisted = await readNdjsonAutopoiesis<ConflictRecord>(
      autopoiesisPaths().conflictRecords,
    )
    expect(persisted.length).toBe(1)
    expect(persisted[0]?.id).toBe(expectedId)
    expect(persisted[0]?.schema).toBe('atelier.conflict-record/v1')
    expect(persisted[0]?.conflict_kind).toBe('overlap')
    expect(persisted[0]?.resolution).toBe('unresolved')
    expect(persisted[0]?.claimants.length).toBe(2)
    const claimantIds = persisted[0]?.claimants
      ?.map((c) => c.record_id)
      .sort()
    expect(claimantIds).toEqual(['req:neg-a', 'req:neg-b'])
  })
})

/* -------------------------------------------------------------------------- */
/*                              runConflictsDetect — POSITIVE                  */
/* -------------------------------------------------------------------------- */

describe('runConflictsDetect() — positive regression', () => {
  test('two non-overlapping records produce no ConflictRecord', async () => {
    // Arrange: two records with DIFFERENT path scopes (no
    // overlap) and different text claims. No conflict should be
    // emitted.
    const a = mkNode({
      id: 'req:pos-a',
      authority_scope: { kind: 'path', pattern: 'apps/web/**' },
      text: 'web uses strategy A',
    })
    const b = mkNode({
      id: 'req:pos-b',
      authority_scope: { kind: 'path', pattern: 'apps/api/**' },
      text: 'api uses strategy B',
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, a)
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, b)

    // Act
    const result = await runConflictsDetect()

    // Assert
    expect(result.detected).toBe(0)
    expect(result.records.length).toBe(0)
    const persisted = await readNdjsonAutopoiesis<ConflictRecord>(
      autopoiesisPaths().conflictRecords,
    )
    expect(persisted.length).toBe(0)
  })

  test('two records with overlapping scope but EQUAL claims produce no ConflictRecord', async () => {
    // The detector only emits a conflict when the claims differ;
    // two records that assert the SAME thing are not in conflict.
    const shared = 'Use the canonical module-resolution strategy'
    const a = mkNode({
      id: 'req:pos-eq-a',
      authority_scope: { kind: 'global' },
      text: shared,
    })
    const b = mkNode({
      id: 'req:pos-eq-b',
      authority_scope: { kind: 'global' },
      text: shared,
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, a)
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, b)
    const result = await runConflictsDetect()
    expect(result.detected).toBe(0)
  })

  test('idempotent: running detect twice does not duplicate conflicts', async () => {
    const a = mkNode({
      id: 'req:idem-a',
      text: 'plan A',
    })
    const b = mkNode({
      id: 'req:idem-b',
      text: 'plan B',
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, a)
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, b)
    const first = await runConflictsDetect()
    expect(first.detected).toBe(1)
    const second = await runConflictsDetect()
    expect(second.detected).toBe(0)
    const persisted = await readNdjsonAutopoiesis<ConflictRecord>(
      autopoiesisPaths().conflictRecords,
    )
    expect(persisted.length).toBe(1)
  })
})

/* -------------------------------------------------------------------------- */
/*                Stale-fixture reclassification (C3 negative control)        */
/* -------------------------------------------------------------------------- */

describe('stale-fixture reclassification', () => {
  test('source_anchor-kind fixture does NOT produce a conflict with a requirement-kind record', async () => {
    // The production seed's stale-fixture is registered as
    // kind='source_anchor' (which maps to the
    // 'current_implementation' authority class). It must NOT
    // overlap with a canonical 'requirement' record
    // ('product_spec' class) just because both have a global
    // scope. The detector groups by class first; different
    // classes never conflict.
    const fixture = mkNode({
      id: 'req:stale-fixture-1',
      kind: 'source_anchor',
      text: 'stale anchor fixture (C7 detector driver)',
    })
    const requirement = mkNode({
      id: 'req:smoke-1',
      kind: 'requirement',
      text: 'canonical smoke requirement',
    })
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, fixture)
    await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, requirement)

    const result = await runConflictsDetect()
    expect(result.detected).toBe(0)
    expect(result.records.length).toBe(0)
  })
})
