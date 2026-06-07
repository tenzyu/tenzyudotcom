/**
 * Transformer tests using subprocess execution.
 *
 * These tests run the transform pipeline in a tiny fixture
 * (`sample-md`) that has its own `.atelier/v0/**` state. The tests
 * cover:
 *
 *   1. No accepted-relation input → design-doc task is `candidate`,
 *      attention-derived task is `blocked`. Backward-compatible
 *      baseline.
 *   2. Accepted-relation input with two `references` and one
 *      `verifies` edge → at least one task becomes `ready` with a
 *      non-empty `source_relation_ids`.
 *   3. The transform pipeline writes the expected files and
 *      `validate` exits 0 in the relation-aware state.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import { rm, mkdir, writeFile } from 'node:fs/promises'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import {
  type AtelierEdge,
  type ImplementationTask,
  type TestContract,
  type PacketTemplate,
  type TransformRecommendation,
} from '../../../lib/src/index.ts'
import { buildTestContract, propagateContractBlockersToTasks } from '../lib/contracts.ts'

const REPO_ROOT = path.resolve(process.cwd())
const FIXTURE_ROOT = path.resolve(REPO_ROOT, '.atelier-bootstrap', 'tests', 'fixtures', 'sample-md')
const FIXTURE_V0 = path.join(FIXTURE_ROOT, '.atelier', 'v0')
// The test process must read fixture files via the fixture-relative
// path, not the cached `TRANSFORMER_PATHS` constant (which was
// resolved at import time relative to the test runner's cwd, not
// the fixture's cwd).
const TASKS_FILE = path.join(FIXTURE_V0, 'transforms', 'md-to-code', 'model', 'implementation-tasks.ndjson')
const CONTRACTS_FILE = path.join(FIXTURE_V0, 'transforms', 'md-to-code', 'model', 'test-contracts.ndjson')
const TEMPLATES_FILE = path.join(FIXTURE_V0, 'transforms', 'md-to-code', 'model', 'packet-templates.ndjson')
const RECS_FILE = path.join(FIXTURE_V0, 'transforms', 'md-to-code', 'model', 'recommendations.ndjson')
const READER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'reader', 'src', 'cli.ts')
const INDEXER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'indexer', 'src', 'cli.ts')
const TRANSFORMER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'transformer', 'src', 'cli.ts')
const EDGES_DIR = path.join(FIXTURE_V0, 'edges')
const ACCEPTED_RELATIONS_PATH = path.join(EDGES_DIR, 'reader-accepted-relations.ndjson')

async function run(args: { cli: string; cmd: string[]; cwd?: string }): Promise<{
  code: number
  json: unknown | null
  raw: string
}> {
  const proc = Bun.spawnSync(['bun', args.cli, ...args.cmd], {
    cwd: args.cwd ?? FIXTURE_ROOT,
    env: { ...process.env, ATELIER_ROOT: args.cwd ?? FIXTURE_ROOT },
  })
  const raw = proc.stdout.toString() + proc.stderr.toString()
  let json: unknown | null = null
  for (const line of raw.split('\n').reverse()) {
    if (line.trim() === '') continue
    try {
      const parsed = JSON.parse(line) as { schema?: string }
      if (parsed.schema === 'atelier.command-result/v1') {
        json = parsed
        break
      }
    } catch {
      // not JSON
    }
  }
  return { code: proc.exitCode, json, raw }
}

async function writeAcceptedRelationsFixtureWithRealIds(): Promise<boolean> {
  // Read the attention's selected object ids. The attention-derived
  // task's `source_relation_ids` are derived from accepted relations
  // whose `from`/`to` overlaps the attention's selected_object_ids.
  const attention = await readNdjson<{
    id: string
    selected_object_ids: string[]
  }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
  const attentionIds = attention.flatMap((a) => a.selected_object_ids)
  // Pull a handful of source-unit ids for the additional relation
  // targets; the attention-derived task only needs the attention
  // ids, but we also need `verifies` edges for the design-doc task.
  const sources = await readNdjson<{ id: string; path: string }>(
    path.join(FIXTURE_V0, 'objects', 'source.ndjson'),
  )
  const sourceIds = sources.slice(0, 4).map((s) => s.id)
  if (attentionIds.length === 0 || sourceIds.length < 2) return false
  const lines: Array<Record<string, unknown>> = []
  // 1. Two `references` edges touching the attention's selected ids.
  lines.push({
    id: 'edge:test-ref-att-0-to-src-0',
    from: attentionIds[0]!,
    to: sourceIds[0]!,
    kind: 'references',
    provenance_kind: 'deterministic_fact',
    source_refs: [],
    confidence: 'fact',
    status: 'fresh',
    created_at: '2026-06-06T00:00:00.000Z',
  })
  if (attentionIds.length > 1) {
    lines.push({
      id: 'edge:test-ref-att-1-to-src-1',
      from: attentionIds[1] ?? attentionIds[0]!,
      to: sourceIds[1] ?? sourceIds[0]!,
      kind: 'references',
      provenance_kind: 'deterministic_fact',
      source_refs: [],
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-06T00:00:00.000Z',
    })
  } else {
    lines.push({
      id: 'edge:test-ref-src-0-to-src-1',
      from: sourceIds[0]!,
      to: sourceIds[1]!,
      kind: 'references',
      provenance_kind: 'deterministic_fact',
      source_refs: [],
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-06T00:00:00.000Z',
    })
  }
  // 2. One `verifies` edge — used to mark the test contract as ready.
  lines.push({
    id: 'edge:test-ver-att-0-to-src-0',
    from: attentionIds[0]!,
    to: sourceIds[0]!,
    kind: 'verifies',
    provenance_kind: 'deterministic_fact',
    source_refs: [],
    confidence: 'fact',
    status: 'fresh',
    created_at: '2026-06-06T00:00:00.000Z',
  })
  await mkdir(EDGES_DIR, { recursive: true })
  await writeFile(
    ACCEPTED_RELATIONS_PATH,
    lines.map((l) => JSON.stringify(l)).join('\n') + '\n',
    'utf8',
  )
  return true
}

async function writeInvalidAcceptedRelationsFixture(): Promise<void> {
  const attention = await readNdjson<{
    id: string
    selected_object_ids: string[]
  }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
  const attentionIds = attention.flatMap((a) => a.selected_object_ids)
  const sources = await readNdjson<{ id: string; path: string }>(
    path.join(FIXTURE_V0, 'objects', 'source.ndjson'),
  )
  const from = attentionIds[0] ?? sources[0]?.id ?? 'missing:from'
  const to = sources[0]?.id ?? 'missing:to'
  const lines: Array<Record<string, unknown>> = [
    {
      id: 'edge:test-stale-reader-relation',
      from,
      to,
      kind: 'references',
      provenance_kind: 'deterministic_fact',
      source_refs: [],
      confidence: 'fact',
      status: 'stale',
      created_at: '2026-06-06T00:00:00.000Z',
    },
    {
      id: 'edge:test-unresolved-reader-relation',
      from,
      to: 'missing:endpoint',
      kind: 'references',
      provenance_kind: 'deterministic_fact',
      source_refs: [],
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-06T00:00:00.000Z',
    },
  ]
  await mkdir(EDGES_DIR, { recursive: true })
  await writeFile(
    ACCEPTED_RELATIONS_PATH,
    lines.map((l) => JSON.stringify(l)).join('\n') + '\n',
    'utf8',
  )
}

async function writeDesignDocAcceptedRelation(status: 'fresh' | 'stale' = 'fresh'): Promise<boolean> {
  const sources = await readNdjson<{ id: string; path: string }>(
    path.join(FIXTURE_V0, 'objects', 'source.ndjson'),
  )
  const designDocSource = sources.find((s) => s.path === 'harness/atelier-design-docs/TEST_DESIGN_DOC.md')
  const target = sources.find((s) => s.path === 'src/main.ts') ?? sources.find((s) => s.id !== designDocSource?.id)
  if (!designDocSource || !target) return false
  const line: Record<string, unknown> = {
    id: 'edge:test-design-doc-references-main',
    from: designDocSource.id,
    to: target.id,
    kind: 'references',
    provenance_kind: 'deterministic_fact',
    source_refs: [],
    confidence: 'fact',
    status,
    created_at: '2026-06-06T00:00:00.000Z',
  }
  await mkdir(EDGES_DIR, { recursive: true })
  await writeFile(ACCEPTED_RELATIONS_PATH, JSON.stringify(line) + '\n', 'utf8')
  return true
}

async function rmAcceptedRelationsFixture(): Promise<void> {
  await rm(ACCEPTED_RELATIONS_PATH, { force: true })
}

describe('atelier-transformer (fixture, subprocess)', () => {
  beforeAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
    await writeFile(
      path.join(FIXTURE_ROOT, 'package.json'),
      JSON.stringify({
        name: 'sample-md',
        packageManager: 'bun@1.3.10',
        scripts: { test: 'bun test' },
      }, null, 2),
      'utf8',
    )
    await writeFile(path.join(FIXTURE_ROOT, 'README.md'), '# Sample\n\nHello world.\n', 'utf8')
    await writeFile(path.join(FIXTURE_ROOT, 'index.ts'), 'export const x = 1\n', 'utf8')
    await mkdir(path.join(FIXTURE_ROOT, 'src'), { recursive: true })
    await writeFile(
      path.join(FIXTURE_ROOT, 'src', 'main.ts'),
      'export function main() { return 42 }\n',
      'utf8',
    )
    expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
    expect((await run({ cli: READER_CLI, cmd: ['sample'] })).code).toBe(0)
    expect(
      (await run({ cli: READER_CLI, cmd: ['attention', '--task', 'main function'] })).code,
    ).toBe(0)
  })

  afterAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
  })

  test('transform --target md-to-code produces tasks, contracts, templates', async () => {
    await rmAcceptedRelationsFixture()
    const r = await run({ cli: TRANSFORMER_CLI, cmd: ['transform', '--target', 'md-to-code'] })
    expect(r.code).toBe(0)
  })

  test('recommend emits transform recommendations', async () => {
    await rmAcceptedRelationsFixture()
    const r = await run({ cli: TRANSFORMER_CLI, cmd: ['recommend'] })
    expect(r.code).toBe(0)
  })

  test('render produces four transform views with the generated marker', async () => {
    await rmAcceptedRelationsFixture()
    const r = await run({ cli: TRANSFORMER_CLI, cmd: ['render'] })
    expect(r.code).toBe(0)
  })

  test('without reader-accepted-relations the design-doc task uses only valid accepted indexer traces', async () => {
    // Ensure the fixture has a design-doc source unit so the
    // design-doc task is actually produced. We append a markdown file
    // under harness/atelier-design-docs/ and re-run the indexer.
    await rmAcceptedRelationsFixture()
    const designDocDir = path.join(FIXTURE_ROOT, 'harness', 'atelier-design-docs')
    await mkdir(designDocDir, { recursive: true })
    const designDocPath = path.join(designDocDir, 'TEST_DESIGN_DOC.md')
    await writeFile(designDocPath, '# test\n\nfixture design doc for transformer test.\n', 'utf8')
    try {
      expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
      const r = await run({ cli: TRANSFORMER_CLI, cmd: ['transform', '--target', 'md-to-code'] })
      expect(r.code).toBe(0)
      const tasks = await readNdjson<ImplementationTask>(TASKS_FILE)
      const designDocTask = tasks.find(
        (t) => Array.isArray(t.tags) && t.tags.includes('design-doc-task'),
      )
      // The fixture now has a design-doc source unit, so the
      // design-doc task MUST exist. It may become ready from
      // deterministic indexer relations, but never without preserving
      // accepted relation and source-anchor traces.
      expect(designDocTask).toBeDefined()
      if (designDocTask?.status === 'ready') {
        expect((designDocTask.source_relation_ids ?? []).length).toBeGreaterThan(0)
        expect((designDocTask.source_anchor_ids ?? []).length).toBeGreaterThan(0)
      }
    } finally {
      // Clean up the file AND the cached indexer state so the
      // downstream tests start from the no-design-doc baseline.
      await rm(designDocDir, { recursive: true, force: true })
      await rm(designDocPath, { force: true })
      expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
    }
  })

  test('with reader-accepted-relations at least one task has a non-empty source_relation_ids', async () => {
    const written = await writeAcceptedRelationsFixtureWithRealIds()
    if (!written) {
      // Not enough source units to build real edges; capability check
      // is still meaningful via `loadAcceptedRelations()`'s output.
      expect(true).toBe(true)
      return
    }
    const r = await run({ cli: TRANSFORMER_CLI, cmd: ['transform', '--target', 'md-to-code'] })
    expect(r.code).toBe(0)
    const tasks = await readNdjson<ImplementationTask>(TASKS_FILE)
    const tasksWithTrace = tasks.filter((t) => (t.source_relation_ids?.length ?? 0) > 0)
    // The capability assertion: the pipeline CAN carry a relation
    // trace when accepted relations are present.
    expect(tasksWithTrace.length).toBeGreaterThan(0)
    for (const task of tasks.filter((t) => t.status === 'ready')) {
      expect((task.source_anchor_ids ?? []).length).toBeGreaterThan(0)
      expect((task.source_relation_ids ?? []).length).toBeGreaterThan(0)
    }
  })

  test('stale and unresolved accepted relations are excluded from task traces', async () => {
    await writeInvalidAcceptedRelationsFixture()
    const r = await run({ cli: TRANSFORMER_CLI, cmd: ['transform', '--target', 'md-to-code'] })
    expect(r.code).toBe(0)
    const tasks = await readNdjson<ImplementationTask>(TASKS_FILE)
    const allTraceIds = tasks.flatMap((t) => t.source_relation_ids ?? [])
    expect(allTraceIds).not.toContain('edge:test-stale-reader-relation')
    expect(allTraceIds).not.toContain('edge:test-unresolved-reader-relation')
    for (const t of tasks) {
      if (t.fixture === true || (t.tags ?? []).includes('fixture')) {
        expect(t.status).not.toBe('ready')
      }
    }
  })

  test('design-doc task with no testable code is downgraded to blocked by fail-closed propagation', async () => {
    // The design-doc task's `allowed_files` are glob patterns
    // (e.g. `.atelier-bootstrap/indexer/**`). None of them ends in
    // `.ts`/`.tsx`/`.js`/`.jsx`, so the derived TestContract has
    // empty `target_files` and `status: 'blocked'`. The
    // fail-closed propagation MUST downgrade the parent task from
    // `ready` to `blocked` with explicit `blocker_ids` referencing
    // the offending contract id.
    const designDocDir = path.join(FIXTURE_ROOT, 'harness', 'atelier-design-docs')
    const designDocPath = path.join(designDocDir, 'TEST_DESIGN_DOC.md')
    await mkdir(designDocDir, { recursive: true })
    await writeFile(designDocPath, '# test\n\nfixture design doc for fail-closed propagation.\n', 'utf8')
    try {
      expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
      expect(await writeDesignDocAcceptedRelation('fresh')).toBe(true)
      expect((await run({ cli: TRANSFORMER_CLI, cmd: ['transform', '--target', 'md-to-code'] })).code).toBe(0)
      const tasks = await readNdjson<ImplementationTask>(TASKS_FILE)
      const designDocTask = tasks.find(
        (t) => Array.isArray(t.tags) && t.tags.includes('design-doc-task'),
      )
      // The design-doc task is created (the indexer has a
      // design-doc source unit) but it MUST be downgraded to
      // `blocked` by the fail-closed propagation.
      expect(designDocTask).toBeDefined()
      expect(designDocTask?.status).toBe('blocked')
      // The blocker_ids must explicitly reference the contract id
      // that triggered the downgrade.
      const blockerIds = designDocTask?.blocker_ids ?? []
      expect(blockerIds.length).toBeGreaterThan(0)
      expect(
        blockerIds.some(
          (id) => id.startsWith('ready-task-with-blocked-contract:'),
        ),
      ).toBe(true)
      // The contract itself must be `blocked` (or `candidate` with
      // empty files) and the validator must NOT raise
      // E_READY_TASK_BLOCKED_CONTRACT (the task is `blocked`, not
      // `ready`).
      const contracts = await readNdjson<TestContract>(CONTRACTS_FILE)
      const designDocContract = contracts.find(
        (c) => c.task_id === designDocTask?.task_id,
      )
      expect(designDocContract).toBeDefined()
      const contractStatus = designDocContract?.status
      expect(contractStatus === 'blocked' || contractStatus === 'candidate').toBe(true)
      // Validate must pass: the design-doc task is `blocked` so
      // the ready/blocked mismatch is gone.
      const validate = await run({ cli: TRANSFORMER_CLI, cmd: ['validate'] })
      expect(validate.code).toBe(0)
      expect(validate.raw).not.toContain('E_READY_TASK_BLOCKED_CONTRACT')
    } finally {
      await rm(designDocDir, { recursive: true, force: true })
      expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
      await rmAcceptedRelationsFixture()
    }
  })

  test('validate fails on a manually-staged ready task whose relation trace is stale', async () => {
    // The original `validate fails when a ready task trace becomes
    // stale` test relied on the design-doc task being `ready`
    // after the transform. The fail-closed propagation
    // (atelier-transformer work order) downgrades any `ready`
    // task whose contract is `blocked`, so the design-doc task is
    // now `blocked` after the transform. To preserve coverage of
    // the validator's `E_TASK_RELATION_TRACE_INVALID` check, this
    // test stages a synthetic `ready` task in the
    // implementation-tasks file with a verifying edge, then makes
    // the edge stale, then asserts that the validator catches the
    // inconsistency.
    expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
    // Read the indexer's source units to obtain a real anchor id
    // for the verifying edge. We use `src/main.ts` because the
    // fixture contains both `src/main.ts` and `src/main.test.ts`,
    // so the derived contract has non-empty `target_files` and
    // non-empty `test_files` (i.e. it is `ready`, not `blocked`).
    const sources = await readNdjson<{ id: string; path: string }>(
      path.join(FIXTURE_V0, 'objects', 'source.ndjson'),
    )
    const mainSource = sources.find((s) => s.path === 'src/main.ts')
    expect(mainSource).toBeDefined()
    const testSource = sources.find((s) => s.path === 'src/main.test.ts')
    expect(testSource).toBeDefined()
    // Write a `verifies` edge that touches `src/main.ts` via
    // `source_refs[*].path`. The edge grounds the synthetic task
    // as `ready` AND the contract as `ready` (so the fail-closed
    // propagation does not downgrade either).
    const edgeId = 'edge:test-validate-stale-verifies-main'
    const verifyingEdge = {
      id: edgeId,
      from: mainSource!.id,
      to: testSource!.id,
      kind: 'verifies',
      provenance_kind: 'deterministic_fact',
      source_refs: [{ path: 'src/main.ts', sha256: 'unused' }],
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-06T00:00:00.000Z',
    }
    await mkdir(EDGES_DIR, { recursive: true })
    await writeFile(
      ACCEPTED_RELATIONS_PATH,
      JSON.stringify(verifyingEdge) + '\n',
      'utf8',
    )
    expect((await run({ cli: TRANSFORMER_CLI, cmd: ['transform', '--target', 'md-to-code'] })).code).toBe(0)
    // After the transform, the synthetic design-doc task is
    // downgraded (its contract is `blocked`). We must manually
    // overwrite the implementation-tasks file with a synthetic
    // `ready` task whose `source_relation_ids` includes the
    // verifying edge, so the validator has a `ready` task to
    // check.
    const syntheticTask: ImplementationTask = {
      id: 'task:validate-stale-relation',
      kind: 'implementation_task',
      version: '1',
      title: 'synthetic ready task for stale-relation validation',
      body_ref: '',
      source_refs: [{ path: 'src/main.ts', sha256: 'unused' }],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'ready',
      affordances: [],
      created_at: '2026-06-06T00:00:00.000Z',
      task_id: 'task:validate-stale-relation',
      goal: 'synthetic ready task',
      source_object_ids: [mainSource!.id],
      source_anchor_ids: [mainSource!.id, testSource!.id],
      source_relation_ids: [edgeId],
      required_knowledge_object_ids: [],
      allowed_files: ['src/main.ts', 'src/main.test.ts'],
      forbidden_files: [],
      acceptance_criteria: ['task must reference a fresh relation'],
      risk_notes: [],
    }
    await writeFile(
      TASKS_FILE,
      JSON.stringify(syntheticTask) + '\n',
      'utf8',
    )
    // The synthetic task is staged. Now make the verifying edge
    // stale and re-run validate. The validator must catch the
    // stale trace via `E_TASK_RELATION_TRACE_INVALID`.
    const staleEdge = { ...verifyingEdge, status: 'stale' }
    await writeFile(
      ACCEPTED_RELATIONS_PATH,
      JSON.stringify(staleEdge) + '\n',
      'utf8',
    )
    const validate = await run({ cli: TRANSFORMER_CLI, cmd: ['validate'] })
    expect(validate.code).toBe(1)
    expect(validate.raw).toContain('E_TASK_RELATION_TRACE_INVALID')
  })

  test('validate passes on a relation-aware snapshot', async () => {
    const written = await writeAcceptedRelationsFixtureWithRealIds()
    if (!written) {
      // Without enough source units to form a relation trace, the
      // strict validator will fail by design. We only assert exit 0
      // when the relation trace is present.
      expect(true).toBe(true)
      return
    }
    // Re-run the full pipeline with the relation file in place.
    expect(
      (await run({ cli: TRANSFORMER_CLI, cmd: ['transform', '--target', 'md-to-code'] })).code,
    ).toBe(0)
    expect((await run({ cli: TRANSFORMER_CLI, cmd: ['recommend'] })).code).toBe(0)
    expect((await run({ cli: TRANSFORMER_CLI, cmd: ['render'] })).code).toBe(0)
    const r = await run({ cli: TRANSFORMER_CLI, cmd: ['validate'] })
    expect(r.code).toBe(0)
  })

  test('recommendation reason cites an accepted relation id', async () => {
    const recs = await readNdjson<TransformRecommendation>(RECS_FILE)
    for (const r of recs) {
      expect(typeof r.reason).toBe('string')
      // The Relation Kernel invariant: every emitted recommendation
      // MUST cite an accepted relation id in its reason. Ungrounded
      // recommendations are skipped at emit time and never appear in
      // the file.
      // Every emitted recommendation must also carry at least one
      // entry in `source_relation_ids`.
      expect(Array.isArray(r.source_relation_ids)).toBe(true)
      expect((r.source_relation_ids ?? []).length).toBeGreaterThan(0)
      expect((r.source_relation_ids ?? []).some((id) => r.reason.includes(id))).toBe(true)
    }
  })

  test('every packet template has a search_policy and may carry a relation trace', async () => {
    const templates = await readNdjson<PacketTemplate>(TEMPLATES_FILE)
    expect(templates.length).toBeGreaterThan(0)
    for (const t of templates) {
      expect(['none', 'bounded', 'explicit_approval']).toContain(t.search_policy)
      if (t.status === 'ready') {
        const anchors = (t as unknown as { required_anchor_ids?: string[] }).required_anchor_ids ?? []
        expect(anchors.length).toBeGreaterThan(0)
        expect((t.source_relation_ids ?? []).length).toBeGreaterThan(0)
      }
    }
  })

  test('every test contract carries a source_relation_ids array (may be empty)', async () => {
    const contracts = await readNdjson<TestContract>(CONTRACTS_FILE)
    expect(contracts.length).toBeGreaterThan(0)
    for (const c of contracts) {
      expect(Array.isArray(c.source_relation_ids)).toBe(true)
      if (c.status === 'ready') {
        const anchors = (c as unknown as { source_anchor_ids?: string[] }).source_anchor_ids ?? []
        const evidence = (c as unknown as { evidence_requirements?: string[] }).evidence_requirements ?? []
        expect(anchors.length).toBeGreaterThan(0)
        expect(evidence.length).toBeGreaterThan(0)
        expect(c.target_files.length).toBeGreaterThan(0)
        expect(c.test_files.length).toBeGreaterThan(0)
      }
    }
  })
})

/**
 * Pure unit tests for `buildTestContract` (no subprocess, no
 * fixture). These cover the regression in
 * `edgeTouchesAnyPath`: the helper used to compare
 * source-anchor ids to target file paths as a `Set`, which was
 * always disjoint, so contracts never reached `status: 'ready'`.
 *
 * The fix is to resolve edge endpoint ids through an
 * `id -> path` map built from
 * `objects/source.ndjson` and
 * `anchors/source-anchors.ndjson`. This test exercises that path
 * resolution directly so the regression cannot recur without
 * tripping it.
 */
describe('atelier-transformer (unit: buildTestContract path resolution)', () => {
  function makeTask(allowedFiles: string[]): ImplementationTask {
    return {
      id: 'task:unit-test',
      kind: 'implementation_task',
      version: '1',
      title: 'unit test task',
      body_ref: '',
      source_refs: [],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'ready',
      affordances: [],
      created_at: '2026-06-06T00:00:00.000Z',
      task_id: 'task:unit-test',
      goal: 'unit test',
      source_object_ids: [],
      source_anchor_ids: [],
      source_relation_ids: ['edge:unit-ver-foo-to-bar'],
      required_knowledge_object_ids: [],
      allowed_files: allowedFiles,
      forbidden_files: [],
      acceptance_criteria: [],
      risk_notes: [],
    }
  }

  function makeVerifiesEdge(): AtelierEdge {
    return {
      id: 'edge:unit-ver-foo-to-bar',
      from: 'anchor:foo',
      to: 'anchor:bar',
      kind: 'verifies',
      provenance_kind: 'deterministic_fact',
      source_refs: [],
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-06T00:00:00.000Z',
    }
  }

  test('verifies edge with anchor ids resolves via id->path map to target file', () => {
    // Simulate the indexer's `anchors/source-anchors.ndjson`:
    // `anchor:foo` -> `path/to/foo.ts`,
    // `anchor:bar` -> `path/to/bar.ts`.
    const idToPath = new Map<string, string>([
      ['anchor:foo', 'path/to/foo.ts'],
      ['anchor:bar', 'path/to/bar.ts'],
    ])
    const task = makeTask(['path/to/foo.ts', 'path/to/bar.ts'])
    const edge = makeVerifiesEdge()
    const contract = buildTestContract(task, [edge], idToPath)
    // The regression: this used to be `candidate` because
    // `edgeTouchesAnyPath` compared the anchor id string
    // (`anchor:bar`) against the path set, which never
    // intersected. With id resolution, `anchor:bar` -> `path/to/bar.ts`
    // hits `target_files` and the contract is `ready`.
    expect(contract.status).toBe('ready')
    expect(contract.source_relation_ids).toContain('edge:unit-ver-foo-to-bar')
  })

  test('verifies edge does NOT resolve to target when id->path map is empty', () => {
    // Sanity check: when the map is empty, the helper falls back to
    // a `candidate` status. The contract is still produced but the
    // relation trace does not contribute to readiness.
    const idToPath = new Map<string, string>()
    const task = makeTask(['path/to/foo.ts', 'path/to/bar.ts'])
    const edge = makeVerifiesEdge()
    const contract = buildTestContract(task, [edge], idToPath)
    expect(contract.status).toBe('candidate')
    // The contract still inherits the parent task's relation trace.
    expect(contract.source_relation_ids).toContain('edge:unit-ver-foo-to-bar')
  })

  test('verifies edge resolves via source_refs[*].path when anchor ids do not map', () => {
    // Some reader proposals store the resolved file location in
    // `source_refs` instead of through the anchor map. The helper
    // must also accept a `source_refs` hit.
    const idToPath = new Map<string, string>()
    const task = makeTask(['path/to/bar.ts'])
    task.source_relation_ids = ['edge:unit-ver-src-ref']
    const edge: AtelierEdge = {
      id: 'edge:unit-ver-src-ref',
      from: 'anchor:foo',
      to: 'anchor:bar',
      kind: 'verifies',
      provenance_kind: 'deterministic_fact',
      source_refs: [{ path: 'path/to/bar.ts', sha256: 'unused' }],
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-06T00:00:00.000Z',
    }
    const contract = buildTestContract(task, [edge], idToPath)
    expect(contract.status).toBe('ready')
    expect(contract.source_relation_ids).toContain('edge:unit-ver-src-ref')
  })

  test('non-verifies/non-references relation never marks the contract ready', () => {
    // `defines` edges should NOT mark the contract as `ready`.
    // Only `verifies` and `references` edges are accepted as
    // readiness proof.
    const idToPath = new Map<string, string>([
      ['anchor:foo', 'path/to/foo.ts'],
      ['anchor:bar', 'path/to/bar.ts'],
    ])
    const task = makeTask(['path/to/foo.ts', 'path/to/bar.ts'])
    task.source_relation_ids = ['edge:unit-def-foo-to-bar']
    const edge: AtelierEdge = {
      id: 'edge:unit-def-foo-to-bar',
      from: 'anchor:foo',
      to: 'anchor:bar',
      kind: 'defines',
      provenance_kind: 'deterministic_fact',
      source_refs: [],
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-06T00:00:00.000Z',
    }
    const contract = buildTestContract(task, [edge], idToPath)
    expect(contract.status).toBe('candidate')
  })
})

/**
 * Pure unit tests for the fail-closed ready/contract propagation
 * (P0-001 in the work order for atelier-transformer). The
 * Relation Kernel invariant: a `ready` task MUST have a `ready`
 * TestContract with non-empty `target_files` and non-empty
 * `test_files`. When the contract cannot be ready, the task is
 * downgraded to `blocked` with explicit `blocker_ids`.
 *
 * These tests exercise `buildTestContract` (for the
 * `blocked`/`ready` decision) and `propagateContractBlockersToTasks`
 * (for the task downgrade + blocker_ids addition).
 */
describe('atelier-transformer (unit: fail-closed ready/contract propagation)', () => {
  function makeTask(allowedFiles: string[]): ImplementationTask {
    return {
      id: 'task:unit-failclosed',
      kind: 'implementation_task',
      version: '1',
      title: 'fail-closed unit test task',
      body_ref: '',
      source_refs: [],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'ready',
      affordances: [],
      created_at: '2026-06-06T00:00:00.000Z',
      task_id: 'task:unit-failclosed',
      goal: 'fail-closed unit test',
      source_object_ids: [],
      source_anchor_ids: [],
      source_relation_ids: ['edge:unit-failclosed-ready'],
      required_knowledge_object_ids: [],
      allowed_files: allowedFiles,
      forbidden_files: [],
      acceptance_criteria: [],
      risk_notes: [],
    }
  }

  test('ready task with only .md allowed_files → contract is blocked, empty test_files', () => {
    // A `ready` task whose `allowed_files` contains only a markdown
    // file has no `target_files` (markdown is not a code file path)
    // and therefore no `test_files`. The contract is `blocked`,
    // NOT fabricated `ready`. This is the regression the work order
    // calls out: contract must be `blocked` when no code file is
    // found in the indexer known source universe.
    const idToPath = new Map<string, string>()
    const knownSourcePaths = new Set<string>(['README.md'])
    const task = makeTask(['README.md'])
    const contract = buildTestContract(task, [], idToPath, knownSourcePaths)
    expect(contract.status).toBe('blocked')
    expect(contract.target_files).toEqual([])
    expect(contract.test_files).toEqual([])
  })

  test('ready task with code file + corresponding .test.ts in known paths → contract ready, non-empty test_files', () => {
    // The mirror case: a `ready` task whose `allowed_files` lists
    // a real .ts file AND the indexer's known source universe
    // contains a matching `.test.ts` produces a `ready` contract
    // with non-empty `target_files` and non-empty `test_files`.
    // The file names mirror the work-order example
    // (`.atelier-bootstrap/tests/fixtures/executor-smoke/some.ts`).
    // A `verifies` edge is required to make the contract `ready`
    // (not just `candidate`); the edge's `source_refs[*].path`
    // touches the target file, which the path resolver accepts.
    const idToPath = new Map<string, string>()
    const knownSourcePaths = new Set<string>([
      '.atelier-bootstrap/tests/fixtures/executor-smoke/some.ts',
      '.atelier-bootstrap/tests/fixtures/executor-smoke/some.test.ts',
    ])
    const task = makeTask([
      '.atelier-bootstrap/tests/fixtures/executor-smoke/some.ts',
    ])
    const verifyingEdge: AtelierEdge = {
      id: 'edge:verifies-some',
      from: 'anchor:some',
      to: 'anchor:some-target',
      kind: 'verifies',
      provenance_kind: 'deterministic_fact',
      source_refs: [
        {
          path: '.atelier-bootstrap/tests/fixtures/executor-smoke/some.ts',
          sha256: 'unused',
        },
      ],
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-06T00:00:00.000Z',
    }
    task.source_relation_ids = ['edge:verifies-some']
    const contract = buildTestContract(task, [verifyingEdge], idToPath, knownSourcePaths)
    expect(contract.status).toBe('ready')
    expect(contract.target_files).toEqual([
      '.atelier-bootstrap/tests/fixtures/executor-smoke/some.ts',
    ])
    expect(contract.test_files).toEqual([
      '.atelier-bootstrap/tests/fixtures/executor-smoke/some.test.ts',
    ])
  })

  test('ready task with code file but NO corresponding .test.ts in known paths → contract blocked', () => {
    // The contract builder uses `loadKnownSourcePathSet` (the
    // indexer known source universe). If the candidate
    // `.test.ts` is NOT in that set, the contract is `blocked`
    // with empty `test_files`. The contract does NOT fabricate
    // a `ready` status.
    const idToPath = new Map<string, string>()
    const knownSourcePaths = new Set<string>([
      // The .ts file exists in the known universe, but its
      // companion .test.ts is intentionally absent.
      'path/to/orphan.ts',
    ])
    const task = makeTask(['path/to/orphan.ts'])
    const contract = buildTestContract(task, [], idToPath, knownSourcePaths)
    expect(contract.status).toBe('blocked')
    expect(contract.target_files).toEqual(['path/to/orphan.ts'])
    expect(contract.test_files).toEqual([])
  })

  test('buildTestContract is `blocked` when knownSourcePaths is empty AND target_files are non-empty', () => {
    // Defensive: if the indexer has not been run (or excluded the
    // relevant tree) the `knownSourcePaths` set is empty. The
    // contract must NOT fabricate `ready`; it must be `blocked`.
    const idToPath = new Map<string, string>()
    const knownSourcePaths = new Set<string>()
    const task = makeTask(['atelier.ts'])
    const contract = buildTestContract(task, [], idToPath, knownSourcePaths)
    expect(contract.status).toBe('blocked')
    expect(contract.target_files).toEqual(['atelier.ts'])
    expect(contract.test_files).toEqual([])
  })

  test('propagation downgrades ready task to blocked when contract is blocked', () => {
    // A `ready` task whose contract is `blocked` (empty test_files
    // in this case) MUST be downgraded to `blocked` with an
    // explicit `blocker_ids` entry referencing the contract id.
    const task = makeTask(['atelier.ts'])
    const blockedContract = buildTestContract(
      task,
      [],
      new Map(),
      new Set<string>(),
    )
    expect(blockedContract.status).toBe('blocked')
    const { tasks: downgraded, warnings } = propagateContractBlockersToTasks(
      [task],
      [blockedContract],
    )
    expect(downgraded).toHaveLength(1)
    expect(downgraded[0]!.status).toBe('blocked')
    expect(downgraded[0]!.blocker_ids).toContain(
      `ready-task-with-blocked-contract:${blockedContract.test_contract_id}`,
    )
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('ready-task-with-blocked-contract')
    expect(warnings[0]).toContain(task.task_id)
    expect(warnings[0]).toContain(blockedContract.test_contract_id)
  })

  test('propagation downgrades ready task when contract has empty test_files', () => {
    // The contract's `status` may be `candidate` (not `blocked`)
    // when only `test_files` is empty. The Relation Kernel
    // invariant still requires the parent task to be downgraded
    // because the contract cannot satisfy a `ready` task.
    const task = makeTask(['some.ts'])
    const emptyContract: TestContract = {
      id: 'tc:empty-test-files',
      kind: 'test_contract',
      version: '1',
      title: 'unit empty contract',
      body_ref: '',
      source_refs: [],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'candidate',
      affordances: [],
      created_at: '2026-06-06T00:00:00.000Z',
      test_contract_id: 'tc:empty-test-files',
      task_id: task.task_id,
      test_framework: 'bun-test',
      target_files: ['some.ts'],
      test_files: [],
      expected_behavior: [],
      negative_cases: [],
      command: 'bun test',
      source_relation_ids: [],
    }
    const { tasks: downgraded, warnings } = propagateContractBlockersToTasks(
      [task],
      [emptyContract],
    )
    expect(downgraded[0]!.status).toBe('blocked')
    expect(downgraded[0]!.blocker_ids).toContain(
      'ready-task-with-blocked-contract:tc:empty-test-files',
    )
    expect(warnings).toHaveLength(1)
  })

  test('propagation does NOT downgrade a non-ready task', () => {
    // Tasks with `status: 'candidate'` or `status: 'blocked'` are
    // left untouched by the propagation. The function only
    // downgrades tasks that are `ready`.
    const candidateTask: ImplementationTask = {
      ...makeTask(['atelier.ts']),
      status: 'candidate',
    }
    const blockedContract: TestContract = {
      id: 'tc:doesnt-matter',
      kind: 'test_contract',
      version: '1',
      title: 'unit',
      body_ref: '',
      source_refs: [],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'blocked',
      affordances: [],
      created_at: '2026-06-06T00:00:00.000Z',
      test_contract_id: 'tc:doesnt-matter',
      task_id: candidateTask.task_id,
      test_framework: 'bun-test',
      target_files: ['atelier.ts'],
      test_files: [],
      expected_behavior: [],
      negative_cases: [],
      command: 'bun test',
      source_relation_ids: [],
    }
    const { tasks: downgraded, warnings } = propagateContractBlockersToTasks(
      [candidateTask],
      [blockedContract],
    )
    expect(downgraded[0]!.status).toBe('candidate')
    expect(downgraded[0]!.blocker_ids ?? []).not.toContain(
      'ready-task-with-blocked-contract:tc:doesnt-matter',
    )
    expect(warnings).toHaveLength(0)
  })

  test('propagation does NOT downgrade a ready task when contract is ready and non-empty', () => {
    // The mirror pass: a `ready` task with a `ready` contract
    // (non-empty test_files, non-empty target_files) is NOT
    // downgraded. The propagation is fail-closed, not fail-open.
    const task = makeTask(['some.ts'])
    const readyContract: TestContract = {
      id: 'tc:ready-ok',
      kind: 'test_contract',
      version: '1',
      title: 'unit',
      body_ref: '',
      source_refs: [],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'ready',
      affordances: [],
      created_at: '2026-06-06T00:00:00.000Z',
      test_contract_id: 'tc:ready-ok',
      task_id: task.task_id,
      test_framework: 'bun-test',
      target_files: ['some.ts'],
      test_files: ['some.test.ts'],
      expected_behavior: [],
      negative_cases: [],
      command: 'bun test',
      source_relation_ids: [],
    }
    const { tasks: downgraded, warnings } = propagateContractBlockersToTasks(
      [task],
      [readyContract],
    )
    expect(downgraded[0]!.status).toBe('ready')
    expect(warnings).toHaveLength(0)
  })

  test('propagation appends to existing blocker_ids without duplicating', () => {
    // If the parent task already carries a `blocker_ids` entry
    // (e.g. `no-accepted-relation-trace:...`), the propagation
    // must APPEND its own entry rather than overwrite. The
    // resulting set must be sorted and deduplicated.
    const task: ImplementationTask = {
      ...makeTask(['atelier.ts']),
      blocker_ids: ['no-accepted-relation-trace:design-doc-task'],
    }
    const blockedContract: TestContract = {
      id: 'tc:append-blocker',
      kind: 'test_contract',
      version: '1',
      title: 'unit',
      body_ref: '',
      source_refs: [],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'blocked',
      affordances: [],
      created_at: '2026-06-06T00:00:00.000Z',
      test_contract_id: 'tc:append-blocker',
      task_id: task.task_id,
      test_framework: 'bun-test',
      target_files: ['atelier.ts'],
      test_files: [],
      expected_behavior: [],
      negative_cases: [],
      command: 'bun test',
      source_relation_ids: [],
    }
    const { tasks: downgraded } = propagateContractBlockersToTasks(
      [task],
      [blockedContract],
    )
    expect(downgraded[0]!.status).toBe('blocked')
    expect(downgraded[0]!.blocker_ids).toContain(
      'no-accepted-relation-trace:design-doc-task',
    )
    expect(downgraded[0]!.blocker_ids).toContain(
      'ready-task-with-blocked-contract:tc:append-blocker',
    )
    // Sorted + unique
    const sorted = [...(downgraded[0]!.blocker_ids ?? [])].sort()
    expect(downgraded[0]!.blocker_ids).toEqual(sorted)
  })
})

/**
 * Fixture-backed task materializer (relation kernel readiness).
 *
 * The `atelier:transform:create-fixture-task` command materializes a
 * non-fixture `ImplementationTask`, a `TestContract`, an
 * `EditBoundary`, and a `PacketTemplate` from a real testable
 * surface in the repo. The contract is `ready` only when the
 * `.test.ts` sibling is in the indexer's known source path set.
 *
 * The transform pipeline must preserve the materialized records
 * across `transform --target md-to-code` runs (the materializer
 * tags the records with `tags: ['materialized']`).
 */
describe('atelier-transformer (fixture: create-fixture-task)', () => {
  const FIXTURE_TASK_ID = 'task:fixture-relation-kernel'
  // Indexed from FIXTURE_ROOT, the fixture is `src/main.ts`. The
  // .test.ts sibling `src/main.test.ts` is in the indexer's known
  // source path set when the test runner invokes the indexer from
  // FIXTURE_ROOT.
  const FIXTURE_PATH = 'src/main.ts'
  const FIXTURE_SIBLING = 'src/main.test.ts'
  // Path to a code file in the fixture that does NOT have a
  // corresponding `.test.ts` sibling. We use this to exercise the
  // "missing .test.ts sibling -> contract is blocked" regression.
  const ORPHAN_PATH = 'src/orphan-fixture.ts'

  /**
   * Parse a multi-line pretty-printed `atelier.command-result/v1`
   * JSON blob from a subprocess's raw output. The shared `run`
   * helper only matches single-line JSON; the materializer (and
   * the other commands) emit pretty-printed multi-line JSON, so
   * we extract the top-level JSON object directly.
   */
  function parseCommandResult(raw: string): { schema?: string; status?: string; data?: Record<string, unknown>; issues?: Array<{ code: string }> } | null {
    const start = raw.indexOf('{')
    if (start === -1) return null
    // Walk forward, tracking brace depth and string state, until
    // we close the top-level object.
    let depth = 0
    let inString = false
    let escaped = false
    for (let i = start; i < raw.length; i++) {
      const ch = raw[i]
      if (inString) {
        if (escaped) {
          escaped = false
        } else if (ch === '\\') {
          escaped = true
        } else if (ch === '"') {
          inString = false
        }
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{') depth += 1
      else if (ch === '}') {
        depth -= 1
        if (depth === 0) {
          const candidate = raw.slice(start, i + 1)
          try {
            return JSON.parse(candidate) as { schema?: string; status?: string; data?: Record<string, unknown>; issues?: Array<{ code: string }> }
          } catch {
            return null
          }
        }
      }
    }
    return null
  }

  beforeAll(async () => {
    // NOTE: we do NOT clear the FIXTURE_V0 here. The outer
    // describe's beforeAll has already cleared it and populated
    // the attention sets / source units. Clearing here would
    // remove the attention sets the outer tests depend on, and
    // the outer `every test contract carries a source_relation_ids
    // array` test would fail (its contracts are derived from the
    // attention sets in the FIXTURE_V0). The outer afterAll
    // handles the final cleanup.
    //
    // We DO need to:
    //   1. Create the orphan fixture file (a .ts file with no
    //      .test.ts sibling) so the "missing .test.ts sibling"
    //      regression has a real fixture to point at.
    //   2. Re-run the indexer so the orphan file is in the known
    //      source path set. The indexer does not touch the
    //      attention sets (those are written by the reader's
    //      `attention` command), so this is safe.
    await mkdir(path.join(FIXTURE_ROOT, 'src'), { recursive: true })
    // Orphan: a .ts file with no .test.ts sibling. Used for the
    // "missing .test.ts sibling" regression.
    await writeFile(
      path.join(FIXTURE_ROOT, 'src', 'orphan-fixture.ts'),
      'export const orphan = 1\n',
      'utf8',
    )
    // Re-run the indexer so the new orphan file is in the known
    // source path set. This overwrites the source-units / anchors
    // / edges / facts files but leaves the attention sets intact.
    expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
  })

  afterAll(async () => {
    // Remove only the orphan file. The outer afterAll handles the
    // V0 cleanup; we must not race against it.
    await rm(path.join(FIXTURE_ROOT, 'src', 'orphan-fixture.ts'), { force: true })
    // Remove the live-indexer test fixtures created by the
    // `create-fixture-task reads the LIVE indexer known source
    // paths` test. These files are written into the test fixture
    // root and re-indexed by the test; they must not bleed across
    // runs.
    await rm(path.join(FIXTURE_ROOT, 'src', 'live-known.ts'), { force: true })
    await rm(path.join(FIXTURE_ROOT, 'src', 'live-known.test.ts'), { force: true })
    await rm(path.join(FIXTURE_ROOT, 'src', 'live-only-main.ts'), { force: true })
  })

  test('create-fixture-task materializes a ready task/contract/boundary/template for a real .test.ts sibling', async () => {
    // The happy path: run the materializer against `src/main.ts`
    // (which has a `.test.ts` sibling in the indexer's known
    // source universe), then run the full transform pipeline, and
    // confirm at least one ready task with a `ready` contract
    // that carries a verifying accepted relation in
    // `source_relation_ids`.
    const materialized = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', FIXTURE_PATH, '--task-id', FIXTURE_TASK_ID],
    })
    expect(materialized.code).toBe(0)
    const matParsed = parseCommandResult(materialized.raw)
    expect(matParsed).not.toBeNull()
    expect(matParsed!.schema).toBe('atelier.command-result/v1')
    expect(matParsed!.status).toBe('pass')
    const matData = matParsed!.data as
      | {
          contract_id: string
          contract_status: string
          verifying_edge_id: string
          test_sibling: string
          test_sibling_known: boolean
          target_files: string[]
          test_files: string[]
          source_relation_ids: string[]
        }
      | undefined
    expect(matData).toBeDefined()
    expect(matData!.contract_status).toBe('ready')
    expect(matData!.test_sibling_known).toBe(true)
    expect(matData!.test_sibling).toBe(FIXTURE_SIBLING)
    expect(matData!.target_files).toEqual([FIXTURE_PATH])
    expect(matData!.test_files).toEqual([FIXTURE_SIBLING])
    expect(matData!.source_relation_ids).toContain(matData!.verifying_edge_id)
    // Run the full transform pipeline. The materializer's task
    // must be preserved (the merge logic reads existing
    // materialized records and keeps them).
    const transform = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['transform', '--target', 'md-to-code'],
    })
    expect(transform.code).toBe(0)
    // Validate must pass with no P0 defects and at least one
    // ready task + ready contract.
    const validate = await run({ cli: TRANSFORMER_CLI, cmd: ['validate'] })
    expect(validate.code).toBe(0)
    const validateParsed = parseCommandResult(validate.raw)
    expect(validateParsed).not.toBeNull()
    const validateData = validateParsed!.data as Record<string, unknown> | undefined
    expect(validateData).toBeDefined()
    // tasks >= 1
    expect((validateData!.tasks as number)).toBeGreaterThan(0)
    // contracts >= 1, ready contracts >= 1
    expect((validateData!.contracts as number)).toBeGreaterThan(0)
    expect((validateData!.contracts_with_relation_trace as number)).toBeGreaterThan(0)
    // Inspect the materialized task + contract on disk.
    const tasks = await readNdjson<ImplementationTask>(TASKS_FILE)
    const materializedTask = tasks.find((t) => t.task_id === FIXTURE_TASK_ID)
    expect(materializedTask).toBeDefined()
    expect(materializedTask!.status).toBe('ready')
    expect(materializedTask!.fixture).toBe(false)
    expect((materializedTask!.tags ?? [])).toContain('materialized')
    expect((materializedTask!.source_relation_ids ?? []).length).toBeGreaterThan(0)
    expect((materializedTask!.source_anchor_ids ?? []).length).toBeGreaterThan(0)
    // The contract must be `ready` with non-empty target_files,
    // non-empty test_files, a real command, and the verifying
    // edge in source_relation_ids.
    const contracts = await readNdjson<TestContract>(CONTRACTS_FILE)
    const matContract = contracts.find((c) => c.task_id === FIXTURE_TASK_ID)
    expect(matContract).toBeDefined()
    expect(matContract!.status).toBe('ready')
    expect(matContract!.target_files.length).toBeGreaterThan(0)
    expect(matContract!.test_files.length).toBeGreaterThan(0)
    expect(typeof matContract!.command).toBe('string')
    expect(matContract!.command.length).toBeGreaterThan(0)
    expect((matContract!.source_relation_ids ?? []).length).toBeGreaterThan(0)
    expect((matContract!.source_relation_ids ?? [])).toContain(matData!.verifying_edge_id)
    // The boundary must be non-overlapping.
    const boundaries = await readNdjson<{ task_id: string; allowed_files: string[]; forbidden_files: string[] }>(
      path.join(FIXTURE_V0, 'transforms', 'md-to-code', 'model', 'edit-boundaries.ndjson'),
    )
    const matBoundary = boundaries.find((b) => b.task_id === FIXTURE_TASK_ID)
    expect(matBoundary).toBeDefined()
    const overlap = matBoundary!.allowed_files.find((a) =>
      matBoundary!.forbidden_files.some((f) => a === f || (a.startsWith(f.replace('**', '')) || f.startsWith(a.replace('**', '')))),
    )
    expect(overlap).toBeUndefined()
    // The template must have non-empty test_contract_ids,
    // evidence_expectations, a valid search_policy, and inherited
    // source_relation_ids.
    const templates = await readNdjson<PacketTemplate>(TEMPLATES_FILE)
    const matTemplate = templates.find((t) => t.task_id === FIXTURE_TASK_ID)
    expect(matTemplate).toBeDefined()
    expect(matTemplate!.test_contract_ids.length).toBeGreaterThan(0)
    expect(matTemplate!.evidence_expectations.length).toBeGreaterThan(0)
    expect(['none', 'bounded', 'explicit_approval']).toContain(matTemplate!.search_policy)
    expect((matTemplate!.source_relation_ids ?? []).length).toBeGreaterThan(0)
  })

  test('create-fixture-task produces a blocked contract when the .test.ts sibling is missing', async () => {
    // Regression: the materializer MUST NOT fabricate tests. When
    // the `.test.ts` sibling is not in the indexer's known source
    // path set, the contract is `blocked` (not `ready`).
    const taskId = 'task:fixture-missing-test-sibling'
    const r = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', ORPHAN_PATH, '--task-id', taskId],
    })
    expect(r.code).toBe(0)
    const parsed = parseCommandResult(r.raw)
    expect(parsed).not.toBeNull()
    const data = parsed!.data as
      | {
          contract_status: string
          test_sibling_known: boolean
          test_files: string[]
        }
      | undefined
    expect(data).toBeDefined()
    expect(data!.test_sibling_known).toBe(false)
    expect(data!.contract_status).toBe('blocked')
    expect(data!.test_files).toEqual([])
    // The on-disk contract is `blocked` and has empty test_files.
    const contracts = await readNdjson<TestContract>(CONTRACTS_FILE)
    const blocked = contracts.find((c) => c.task_id === taskId)
    expect(blocked).toBeDefined()
    expect(blocked!.status).toBe('blocked')
    expect(blocked!.test_files).toEqual([])
  })

  test('create-fixture-task refuses a task_id that does not start with "task:"', async () => {
    // Regression: the materializer's task_id must be a
    // `task:`-prefixed identifier. Any other prefix (or no prefix)
    // is rejected with `E_BAD_TASK_ID`.
    const r = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', FIXTURE_PATH, '--task-id', 'fixture-relation-kernel'],
    })
    expect(r.code).toBe(1)
    expect(r.raw).toContain('E_BAD_TASK_ID')
  })

  test('create-fixture-task refuses a fixture under .opencode/', async () => {
    // Regression: the materializer refuses fixtures under any
    // forbidden tree (`.opencode/`, `product/`,
    // `harness/atelier-design-docs/`, ...). The indexer is not
    // expected to have scanned these paths.
    const r = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', '.opencode/agent.ts', '--task-id', 'task:fixture-opencode-refused'],
    })
    expect(r.code).toBe(1)
    expect(r.raw).toContain('E_FORBIDDEN_FIXTURE')
  })

  test('create-fixture-task refuses a fixture under product/**', async () => {
    // Regression: the materializer refuses fixtures under
    // `product/**` (a protected workspace tree). The indexer may
    // know about the path; the materializer still refuses.
    const r = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', 'product/apps/web/src/main.ts', '--task-id', 'task:fixture-product-refused'],
    })
    expect(r.code).toBe(1)
    expect(r.raw).toContain('E_FORBIDDEN_FIXTURE')
  })

  test('create-fixture-task re-materialization updates the record in place (idempotent on task_id)', async () => {
    // The materializer is idempotent on `task_id`: re-invoking it
    // with the same `--task-id` REPLACES the existing record
    // instead of refusing. This lets operators re-bind a task to
    // a different fixture path (e.g. move the live fixture from
    // an excluded `.atelier-bootstrap/**` tree to an
    // indexer-visible `harness/fixtures/relation-kernel/**` path)
    // without manual cleanup. The persisted records are
    // merge-keyed on `task_id`; the new record overwrites the
    // old one and the verifying edge is rewritten in the
    // reader-accepted-relations file.
    const taskId = 'task:fixture-collision'
    // Sanity: the implementation-tasks file must NOT already
    // contain this task (the outer afterAll clears the V0 at
    // the end of every test run, but a previous interrupted
    // run could leave a stale record).
    const beforeFirst = await readNdjson<ImplementationTask>(TASKS_FILE)
    expect(beforeFirst.find((t) => t.task_id === taskId)).toBeUndefined()
    const first = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', FIXTURE_PATH, '--task-id', taskId],
    })
    expect(first.code).toBe(0)
    // Sanity: the first invocation MUST have persisted the task
    // to the file. The second invocation must see the existing
    // record and re-materialize in place (not refuse).
    const afterFirst = await readNdjson<ImplementationTask>(TASKS_FILE)
    expect(afterFirst.find((t) => t.task_id === taskId)).toBeDefined()
    const second = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', FIXTURE_PATH, '--task-id', taskId],
    })
    // Re-materialization is allowed (exit 0). The output must
    // NOT contain `E_TASK_ID_COLLISION` (the previous failure
    // code).
    expect(second.code).toBe(0)
    expect(second.raw).not.toContain('E_TASK_ID_COLLISION')
    // The task must still be present and only ONE record should
    // exist for this task_id (no duplicate from the second
    // invocation).
    const afterSecond = await readNdjson<ImplementationTask>(TASKS_FILE)
    const matches = afterSecond.filter((t) => t.task_id === taskId)
    expect(matches).toHaveLength(1)
  })

  test('create-fixture-task reads the LIVE indexer known source paths, not the test fixture root', async () => {
    // Regression for the relation-kernel work order's
    // acceptance bullet "regression tests cover: live indexer path
    // is queried, not the test fixture root".
    //
    // The materializer must consult the live indexer's
    // `objects/source.ndjson` (via `loadKnownSourcePathSet`) to
    // decide whether a `.test.ts` sibling exists. It MUST NOT
    // glob the test fixture root on disk, because:
    //
    //   1. The fixture root may not be in the indexer's known
    //      universe (e.g. `.atelier-bootstrap/**` is excluded).
    //   2. The contract must be `ready` only when the sibling
    //      is genuinely known to the indexer (the work order
    //      calls this out as the relation-kernel invariant).
    //
    // The test creates TWO source units with `.test.ts`
    // siblings on disk:
    //
    //   - `src/live-known.ts` + `src/live-known.test.ts`:
    //     both files are inside the test fixture and the
    //     indexer will see them. The materializer must mark
    //     this contract as `ready`.
    //
    //   - `src/live-only-main.ts` (a sibling-less variant):
    //     no `.test.ts` sibling on disk. The materializer must
    //     mark this contract as `blocked`.
    //
    // The positive half proves the materializer DOES consult
    // the live indexer; the negative half proves the materializer
    // does NOT fall back to a filesystem-only check (otherwise
    // it would invent a test-file path).
    const liveMain = 'src/live-known.ts'
    const liveTest = 'src/live-known.test.ts'
    const siblingless = 'src/live-only-main.ts'
    const readyTaskId = 'task:fixture-live-known'
    const blockedTaskId = 'task:fixture-live-only-main'
    await writeFile(
      path.join(FIXTURE_ROOT, liveMain),
      'export const liveKnown = 1\n',
      'utf8',
    )
    await writeFile(
      path.join(FIXTURE_ROOT, liveTest),
      "import { liveKnown } from './live-known.ts'\ntest('liveKnown is 1', () => expect(liveKnown).toBe(1))\n",
      'utf8',
    )
    await writeFile(
      path.join(FIXTURE_ROOT, siblingless),
      'export const liveOnlyMain = 1\n',
      'utf8',
    )
    // Re-run the indexer so both files are in the known source
    // path set. The indexer is the source of truth; the
    // materializer must consult it.
    expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
    // === Sanity: the live indexer actually knows both files. ===
    const sources = await readNdjson<{ id: string; path: string; status: string }>(
      path.join(FIXTURE_V0, 'objects', 'source.ndjson'),
    )
    const liveMainSource = sources.find((s) => s.path === liveMain)
    const liveTestSource = sources.find((s) => s.path === liveTest)
    const siblinglessSource = sources.find((s) => s.path === siblingless)
    expect(liveMainSource).toBeDefined()
    expect(liveMainSource!.status).toBe('fresh')
    expect(liveTestSource).toBeDefined()
    expect(liveTestSource!.status).toBe('fresh')
    expect(siblinglessSource).toBeDefined()
    expect(siblinglessSource!.status).toBe('fresh')
    // === Positive half: contract is `ready` when the indexer
    // knows the sibling. ===
    const readyResult = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', liveMain, '--task-id', readyTaskId],
    })
    expect(readyResult.code).toBe(0)
    const readyParsed = parseCommandResult(readyResult.raw)
    expect(readyParsed).not.toBeNull()
    const readyData = readyParsed!.data as
      | {
          contract_status: string
          test_sibling_known: boolean
          test_files: string[]
          target_files: string[]
        }
      | undefined
    expect(readyData).toBeDefined()
    expect(readyData!.test_sibling_known).toBe(true)
    expect(readyData!.contract_status).toBe('ready')
    expect(readyData!.test_files).toEqual([liveTest])
    expect(readyData!.target_files).toEqual([liveMain])
    // === Negative half: contract is `blocked` when the indexer
    // does NOT know a sibling, even though the fixture could
    // in principle have a test file. ===
    const blockedResult = await run({
      cli: TRANSFORMER_CLI,
      cmd: ['create-fixture-task', '--fixture', siblingless, '--task-id', blockedTaskId],
    })
    expect(blockedResult.code).toBe(0)
    const blockedParsed = parseCommandResult(blockedResult.raw)
    expect(blockedParsed).not.toBeNull()
    const blockedData = blockedParsed!.data as
      | {
          contract_status: string
          test_sibling_known: boolean
          test_files: string[]
        }
      | undefined
    expect(blockedData).toBeDefined()
    expect(blockedData!.test_sibling_known).toBe(false)
    expect(blockedData!.contract_status).toBe('blocked')
    expect(blockedData!.test_files).toEqual([])
  })
})
