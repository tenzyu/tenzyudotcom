/**
 * Atelier Autopoiesis — evaluator tests (C8 self-improvement loop).
 *
 * Pins the evaluator's required negative controls and the
 * positive regression:
 *
 *   1. Empty findings → status=pass.
 *   2. Injected `E_NODE_NO_SOURCE_ANCHOR` → C1 P0 finding.
 *   3. `llm_extracted` + `lifecycle=accepted` → C2 P0 finding
 *      (`E_PROMOTION_LLM_DIRECT_ACCEPT`).
 *   4. Stale anchor → C7 P0 finding (`E_STALE_PREMATURE` or
 *      `E_STALE_FAKE_SUBJECT`, whichever the validator emits).
 *   5. Positive regression: re-running the evaluator is
 *      idempotent (no duplicate `finding_id`s on disk).
 *
 * The suite uses a per-suite tmpdir under `process.tmpdir()`
 * and switches `process.cwd()` so the runtime reads fixture
 * files only.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'
import { runEvaluate, reconcileFindings, defectKey, type AutopoiesisCapabilityId } from '../lib/evaluator.ts'
import { validateAutopoiesis } from '../lib/validate.ts'
import { autopoiesisPaths } from '../lib/paths.ts'
import type {
  AutopoiesisFinding,
  ConflictRecord,
  PromotionDecisionRecord,
  SemanticNode,
  StalenessRecord,
  SubagentHandoff,
  AuthorityRule,
} from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string
const ANCHORS_FILE = () =>
  path.join(FIXTURE_ROOT, '.atelier', 'v0', 'anchors', 'source-anchors.ndjson')

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-evaluator-'))
  await mkdir(path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis'), { recursive: true })
  await mkdir(path.dirname(ANCHORS_FILE()), { recursive: true })
  process.chdir(FIXTURE_ROOT)
})

afterAll(async () => {
  process.chdir(ORIGINAL_CWD)
  await rm(FIXTURE_ROOT, { recursive: true, force: true })
})

beforeEach(async () => {
  // Use the function form (not the module-load-time const) so
  // the rm targets the fixture dir under the current cwd, not
  // the real `.atelier/v0/autopoiesis/` tree.
  const p = autopoiesisPaths()
  for (const file of [
    p.semanticNodes,
    p.promotionDecisions,
    p.stalenessRecords,
    p.conflictRecords,
    p.authorityRules,
    p.controlPackets,
    p.materializationProposals,
    p.handoffs,
    p.findings,
    p.workOrders,
    p.evaluatorState,
    p.evaluatorResult,
    ANCHORS_FILE(),
  ]) {
    await rm(file, { force: true })
  }
})

/* -------------------------------------------------------------------------- */
/*                            Test helpers                                    */
/* -------------------------------------------------------------------------- */

const NOW = '2026-06-07T00:00:00.000Z'

function baseNode(overrides: Partial<SemanticNode>): SemanticNode {
  return {
    schema: 'atelier.semantic-node/v1',
    id: 'node:test',
    kind: 'requirement',
    lifecycle_state: 'observed',
    authority_scope: { kind: 'global' },
    source_anchors: [{ anchor_id: 'a:default' }],
    evidence_anchors: [],
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    produced_by: 'evaluator-test',
    created_at: NOW,
    ...overrides,
  }
}

async function appendNode(n: SemanticNode): Promise<void> {
  // Use the function form so the write targets the fixture cwd,
  // not the real `.atelier/v0/autopoiesis/` tree.
  await appendNdjsonAutopoiesis(autopoiesisPaths().semanticNodes, n)
}

async function appendAnchor(anchor: { id: string; status: string; path: string }): Promise<void> {
  const line = JSON.stringify({
    schema: 'atelier.source-anchor/v1',
    ...anchor,
    created_at: NOW,
  }) + '\n'
  let existing = ''
  try {
    existing = await (await import('node:fs/promises')).readFile(ANCHORS_FILE(), 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  await writeFile(ANCHORS_FILE(), existing + line, 'utf8')
}

async function appendAuthorityRule(rule: AuthorityRule): Promise<void> {
  await appendNdjsonAutopoiesis(autopoiesisPaths().authorityRules, rule)
}

async function appendPromotion(p: PromotionDecisionRecord): Promise<void> {
  await appendNdjsonAutopoiesis(autopoiesisPaths().promotionDecisions, p)
}

async function appendConflict(c: ConflictRecord): Promise<void> {
  await appendNdjsonAutopoiesis(autopoiesisPaths().conflictRecords, c)
}

async function appendStaleness(s: StalenessRecord): Promise<void> {
  await appendNdjsonAutopoiesis(autopoiesisPaths().stalenessRecords, s)
}

async function appendHandoff(h: SubagentHandoff): Promise<void> {
  await appendNdjsonAutopoiesis(autopoiesisPaths().handoffs, h)
}

/* -------------------------------------------------------------------------- */
/*                            Tests                                            */
/* -------------------------------------------------------------------------- */

describe('runEvaluate', () => {
  test('empty state → status=pass with no findings', async () => {
    const r = await runEvaluate({ goalRef: 'harness/atelier-autopoiesis/MISSION.md' })
    expect(r.status).toBe('pass')
    expect(r.findings).toEqual([])
    expect(r.stats.open_p0).toBe(0)
    expect(r.stats.open_p1).toBe(0)
  })

  test('injected E_NODE_NO_SOURCE_ANCHOR → C1 P0 finding', async () => {
    await appendNode(
      baseNode({
        id: 'node:no-anchor',
        kind: 'requirement',
        lifecycle_state: 'observed',
        source_anchors: [],
      }),
    )
    const r = await runEvaluate({ goalRef: 'harness/atelier-autopoiesis/MISSION.md' })
    expect(r.status).toBe('fail')
    const c1 = r.findings.find(
      (f) => f.capability_id === 'C1' && f.code === 'E_NODE_NO_SOURCE_ANCHOR',
    )
    expect(c1).toBeDefined()
    expect(c1?.severity).toBe('P0')
    expect(c1?.affected_record).toBe('node:no-anchor')
  })

  test('llm_extracted + lifecycle=accepted → C2 P0 (E_PROMOTION_LLM_DIRECT_ACCEPT)', async () => {
    await appendAnchor({ id: 'a:llm', path: '/llm.txt', status: 'fresh' })
    await appendNode(
      baseNode({
        id: 'node:llm-accept',
        kind: 'requirement',
        lifecycle_state: 'accepted',
        provenance_kind: 'llm_extracted',
        evidence_refs: ['ev:fake'],
        owner_or_policy: 'machine:agent',
        authority_scope: { kind: 'global' },
        source_anchors: [{ anchor_id: 'a:llm' }],
      }),
    )
    // Need a matching PromotionDecision for the
    // E_NODE_NO_PROMOTION_DECISION check, otherwise we'd see a
    // C1 finding instead of C2.
    await appendPromotion({
      schema: 'atelier.promotion-decision/v1',
      id: 'pd:node:llm-accept',
      subject_id: 'node:llm-accept',
      from_state: 'proposed',
      to_state: 'accepted',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['ev:fake'],
      decided_by: 'test',
      decided_at: NOW,
      created_at: NOW,
    })
    const r = await runEvaluate({ goalRef: 'harness/atelier-autopoiesis/MISSION.md' })
    expect(r.status).toBe('fail')
    const c2 = r.findings.find(
      (f) =>
        f.capability_id === 'C2' &&
        f.code === 'E_PROMOTION_LLM_DIRECT_ACCEPT' &&
        f.affected_record === 'node:llm-accept',
    )
    expect(c2).toBeDefined()
    expect(c2?.severity).toBe('P0')
  })

  test('stale anchor → C7 P0 finding', async () => {
    // Anchor status is fresh but the StalenessRecord claims
    // the anchor transitioned to stale. The validator's
    // E_STALE_PREMATURE check fires for this case; the
    // evaluator maps it to C7.
    await appendAnchor({ id: 'a:still-fresh', path: '/x.txt', status: 'fresh' })
    await appendNode(
      baseNode({
        id: 'node:target',
        kind: 'requirement',
        source_anchors: [{ anchor_id: 'a:still-fresh' }],
      }),
    )
    await appendStaleness({
      schema: 'atelier.staleness-record/v1',
      id: 'stale:1',
      subject_id: 'node:target',
      subject_kind: 'requirement',
      anchor_id: 'a:still-fresh',
      previous_status: 'fresh',
      new_status: 'stale',
      detected_at: NOW,
      reason: 'premature test',
      created_at: NOW,
    })
    const r = await runEvaluate({ goalRef: 'harness/atelier-autopoiesis/MISSION.md' })
    expect(r.status).toBe('fail')
    const c7 = r.findings.find(
      (f) => f.capability_id === 'C7' && f.code.startsWith('E_STALE_'),
    )
    expect(c7).toBeDefined()
    expect(c7?.severity).toBe('P0')
  })

  test('re-running the evaluator is idempotent (no duplicate finding_id)', async () => {
    await appendNode(
      baseNode({
        id: 'node:idem-1',
        kind: 'requirement',
        source_anchors: [],
      }),
    )
    const r1 = await runEvaluate({ goalRef: 'harness/atelier-autopoiesis/MISSION.md' })
    const r2 = await runEvaluate({ goalRef: 'harness/atelier-autopoiesis/MISSION.md' })
    expect(r1.status).toBe('fail')
    expect(r2.status).toBe('fail')
    // Persisted file must have one entry per unique finding_id.
    const onDisk = await readNdjsonAutopoiesis<{ finding_id: string }>(
      autopoiesisPaths().findings,
    )
    const ids = onDisk.map((r) => r.finding_id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('capability filter returns only that capability', async () => {
    await appendNode(
      baseNode({ id: 'node:f-1', kind: 'requirement', source_anchors: [] }),
    )
    await appendNode(
      baseNode({
        id: 'node:f-2',
        kind: 'decision',
        source_anchors: [],
      }),
    )
    const r = await runEvaluate({
      goalRef: 'harness/atelier-autopoiesis/MISSION.md',
      capabilityFilter: 'C1',
    })
    // All returned findings MUST be C1.
    for (const f of r.findings) {
      expect(f.capability_id as AutopoiesisCapabilityId).toBe('C1')
    }
  })

  test('capabilityForCode prefix fallback returns the right bucket', async () => {
    // Import dynamically so we can also exercise the code map.
    const { capabilityForCode } = await import('../lib/evaluator.ts')
    expect(capabilityForCode('E_NODE_FAKE_SOURCE_ANCHOR')).toBe('C1')
    expect(capabilityForCode('E_PROMOTION_LLM_DIRECT_ACCEPT')).toBe('C2')
    expect(capabilityForCode('E_CONFLICT_NO_OVERLAP')).toBe('C3')
    expect(capabilityForCode('E_PACKET_SCOPE_OVERLAP')).toBe('C5')
    expect(capabilityForCode('E_MATERIALIZE_CHECK_NOT_PASSED')).toBe('C6')
    expect(capabilityForCode('E_STALE_PREMATURE')).toBe('C7')
    expect(capabilityForCode('E_BRAND_NEW_CODE')).toBe('C8')
  })
})

describe('validateAutopoiesis regression', () => {
  test('hand-off without check_result anchor emits E_HANDOFF_NO_CHECK_RESULT (C1)', async () => {
    // Sanity check: the validator itself still emits the
    // original defects; the evaluator must not weaken the
    // validator.
    await appendHandoff({
      schema: 'atelier.subagent-handoff/v1',
      id: 'handoff:1',
      run_id: 'run:1',
      packet_id: 'pkt:1',
      task_id: 'task:1',
      files_changed: [],
      tests_written: [],
      gate_results: {},
      evidence_paths: [],
      blockers: [],
      check_result_ids: [],
      summary: 'no check result',
      created_at: NOW,
    })
    const r = await validateAutopoiesis()
    const codes = r.issues.map((i) => i.code)
    expect(codes).toContain('E_HANDOFF_NO_CHECK_RESULT')
  })

  test('appendAuthorityRule and appendConflict round-trip', async () => {
    await appendAuthorityRule({
      schema: 'atelier.authority-rule/v1',
      id: 'rule:test',
      applies_to: ['product_spec'],
      precedence: 100,
      scope: { kind: 'global' },
      conflict_policy: 'expose',
      created_at: NOW,
    })
    await appendConflict({
      schema: 'atelier.conflict-record/v1',
      id: 'conflict:1',
      scope: { kind: 'global' },
      claimants: [
        { record_id: 'a', record_kind: 'requirement', authority: 100 },
        { record_id: 'b', record_kind: 'requirement', authority: 100 },
      ],
      conflict_kind: 'overlap',
      resolution: 'unresolved',
      detected_at: NOW,
      created_at: NOW,
    })
    const rules = await readNdjsonAutopoiesis<AuthorityRule>(autopoiesisPaths().authorityRules)
    expect(rules.length).toBe(1)
    const conflicts = await readNdjsonAutopoiesis<ConflictRecord>(autopoiesisPaths().conflictRecords)
    expect(conflicts.length).toBe(1)
  })
})

/* -------------------------------------------------------------------------- */
/*                  Findings reconciliation (C8 self-healing)                 */
/* -------------------------------------------------------------------------- */

describe('reconcileFindings', () => {
  test('closes an open finding whose code is no longer in current defects', async () => {
    // Arrange: write a single open finding whose defect key
    // is E_NODE_FAKE_SOURCE_ANCHOR / check:smoke-1.
    const openFinding: AutopoiesisFinding = {
      schema: 'atelier.autopoiesis-finding/v1',
      finding_id: 'finding:C1:E_NODE_FAKE_SOURCE_ANCHOR:deadbeef',
      severity: 'P0',
      capability_id: 'C1',
      code: 'E_NODE_FAKE_SOURCE_ANCHOR',
      reason: 'stale defect (test seed)',
      required_repair: 'repaired',
      status: 'open',
      proof_required: [],
      created_at: NOW,
      affected_record: 'check:smoke-1',
    }
    await appendNdjsonAutopoiesis(autopoiesisPaths().findings, openFinding)

    // Act: call reconcile with an empty defect set.
    const r = await reconcileFindings([], [])

    // Assert: the finding was closed and a new line was appended
    // with status='verified' and the :closed:<ts> id suffix.
    expect(r.closed.length).toBe(1)
    expect(r.closed[0]?.status).toBe('verified')
    expect(r.closed[0]?.finding_id).toMatch(/:closed:\d+$/)
    expect(r.reOpened.length).toBe(0)

    const onDisk = await readNdjsonAutopoiesis<AutopoiesisFinding>(autopoiesisPaths().findings)
    expect(onDisk.length).toBe(2)
    expect(onDisk[1]?.status).toBe('verified')
  })

  test('re-opens a finding whose code re-appears in current defects after closure', async () => {
    // Arrange: write a closed finding whose defect is back in
    // the current defect set.
    const closedFinding: AutopoiesisFinding = {
      schema: 'atelier.autopoiesis-finding/v1',
      finding_id: 'finding:C1:E_NODE_FAKE_SOURCE_ANCHOR:beefdead',
      severity: 'P0',
      capability_id: 'C1',
      code: 'E_NODE_FAKE_SOURCE_ANCHOR',
      reason: 'previously closed',
      required_repair: 'still pending',
      status: 'verified',
      proof_required: [],
      created_at: NOW,
      affected_record: 'check:smoke-1',
    }
    await appendNdjsonAutopoiesis(autopoiesisPaths().findings, closedFinding)

    // Act: call reconcile with the same defect key in the
    // current set.
    const r = await reconcileFindings(
      [
        {
          code: 'E_NODE_FAKE_SOURCE_ANCHOR',
          severity: 'P0',
          message: 're-detected',
          affected_record: 'check:smoke-1',
        },
      ],
      [],
    )

    // Assert: the finding was re-opened.
    expect(r.reOpened.length).toBe(1)
    expect(r.reOpened[0]?.status).toBe('open')
    expect(r.reOpened[0]?.finding_id).toMatch(/:reopened:\d+$/)
    expect(r.closed.length).toBe(0)
  })

  test('runEvaluate with empty issues + empty conflicts returns status=pass and open_p0=0', async () => {
    // The clean post-repair state: nothing on disk, the
    // evaluator must report pass and zero open findings.
    const r = await runEvaluate({ goalRef: 'harness/atelier-autopoiesis/MISSION.md' })
    expect(r.status).toBe('pass')
    expect(r.stats.open_p0).toBe(0)
    expect(r.stats.open_p1).toBe(0)
    expect(r.findings.length).toBe(0)
  })

  test('runEvaluate closes pre-existing open findings whose defects no longer exist (one-shot migration)', async () => {
    // Simulate the post-repair migration: drop a stale
    // open finding on disk, run the evaluator with no
    // matching defect, and expect the finding to be
    // transitioned to verified and open_p0 to drop to 0.
    const staleFinding: AutopoiesisFinding = {
      schema: 'atelier.autopoiesis-finding/v1',
      finding_id: 'finding:C1:E_NODE_FAKE_SOURCE_ANCHOR:cafe0001',
      severity: 'P0',
      capability_id: 'C1',
      code: 'E_NODE_FAKE_SOURCE_ANCHOR',
      reason: 'stale',
      required_repair: 'repaired',
      status: 'open',
      proof_required: [],
      created_at: NOW,
      affected_record: 'check:stale-test',
    }
    await appendNdjsonAutopoiesis(autopoiesisPaths().findings, staleFinding)

    const r = await runEvaluate({ goalRef: 'harness/atelier-autopoiesis/MISSION.md' })
    // The reconciled finding now has status=verified, so the
    // latest-by-key view reports open_p0=0 and status=pass.
    expect(r.stats.open_p0).toBe(0)
    expect(r.status).toBe('pass')
    expect((r as { reconciliation?: { closed: number } }).reconciliation?.closed).toBeGreaterThanOrEqual(
      1,
    )
  })
})
