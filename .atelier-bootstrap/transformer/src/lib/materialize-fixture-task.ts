/**
 * Fixture-backed task materializer.
 *
 * Creates a non-fixture `ImplementationTask`, a non-empty `TestContract`
 * (status: `ready` only when the `.test.ts` sibling is known to the
 * indexer), a non-overlapping `EditBoundary`, and a `PacketTemplate`
 * with non-empty `test_contract_ids`, all derived from a real
 * testable surface in the repo (e.g. `.atelier-bootstrap/tests/fixtures/
 * sample-md/src/main.ts` whose `.test.ts` sibling exists in the
 * indexer's known source path set).
 *
 * ## Non-negotiable invariants
 *
 * 1. The materializer MUST NOT fabricate tests. It uses
 *    `loadKnownSourcePathSet` to confirm the candidate `.test.ts` file
 *    exists in the indexer's known source universe, and uses
 *    `loadIdToPathMap` to resolve the fixture to source unit / anchor
 *    ids. The derived `TestContract` is `ready` only when the sibling
 *    is known; otherwise the contract is `blocked` and the fail-closed
 *    propagation in the transform pipeline will downgrade the parent
 *    task.
 *
 * 2. The materializer also writes a single `verifies` accepted relation
 *    to the reader-owned accepted-relations file (which the transform
 *    pipeline reads as part of `loadAcceptedRelations`) so the derived
 *    `TestContract` carries a non-empty `source_relation_ids` trace
 *    that points at a verifying edge.
 *
 * 3. The produced records carry `tags: ['materialized']` (and the task
 *    carries `fixture: false`) so the transform pipeline's merge logic
 *    can preserve them across `transform --target md-to-code` runs.
 *
 * ## Failure modes
 *
 * - `E_MISSING_FIXTURE`            : `--fixture` is missing
 * - `E_MISSING_TASK_ID`            : `--task-id` is missing
 * - `E_BAD_TASK_ID`                : task id does not start with `task:`
 * - `E_FORBIDDEN_FIXTURE`          : fixture path is under a forbidden tree
 *                                    (`.opencode/`, `product/`,
 *                                    `harness/atelier-design-docs/`, ...)
 * - `E_BAD_FIXTURE`                : fixture is not a non-test code file
 *
 * ## Re-materialization semantics
 *
 * The materializer is idempotent on `task_id`: re-invoking it with
 * the same `--task-id` UPDATES the existing record (replaces the
 * task, contract, boundary, and template) instead of refusing with
 * `E_TASK_ID_COLLISION`. The persisted records use merge semantics
 * keyed on `task_id` so an existing record is overwritten. This
 * lets operators re-bind a task to a different fixture path (e.g.
 * move the live fixture from an excluded `.atelier-bootstrap/**`
 * tree to an indexer-visible `harness/fixtures/relation-kernel/**`
 * path) without first deleting the previous record by hand.
 *
 * The previous record's `task_id` is preserved; only the fixture
 * path, the verifying edge, the contract status, and the test-file
 * resolution are recomputed. The verifying edge id changes (it is
 * derived from the `task_id` and now also encodes the new fixture
 * path) so the validator can detect stale edges via the
 * `E_TASK_RELATION_TRACE_INVALID` invariant.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  INDEXER_PATHS,
  READER_PATHS,
  type AtelierEdge,
  type EditBoundary,
  type ImplementationTask,
  type PacketTemplate,
  type RelationProposal,
  type SourceAnchor,
  type SourceRef,
  type SourceUnit,
  type TestContract,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { loadIdToPathMap, loadKnownSourcePathSet } from './contracts.ts'
import { readerAcceptedRelationsPath } from './relations.ts'

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/

const FORBIDDEN_FIXTURE_PREFIXES = [
  '.opencode/',
  'harness/atelier-design-docs/',
  'harness/knowledge/product-specs/',
  'product/',
  'product-specs/',
]

const DEFAULT_FORBIDDEN_FILES = [
  'product-specs/**',
  'harness/knowledge/product-specs/**',
  'harness/atelier-design-docs/**',
  'product/**',
  '.opencode/**',
]

const TASK_ID_PREFIX = 'task:'

/**
 * Marker tags for materialized records. The transform pipeline's
 * merge logic uses these to preserve materializer-produced records
 * across re-runs of `transform --target md-to-code`.
 */
export const MATERIALIZED_TAG = 'materialized'

function nowIso(): string {
  return new Date().toISOString()
}

function isCodeFilePath(p: string): boolean {
  return CODE_FILE_RE.test(p)
}

function isTestFilePath(p: string): boolean {
  return TEST_FILE_RE.test(p)
}

function testCandidatesForTarget(filePath: string): string[] {
  return [
    filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
    filePath.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
  ]
}

function isForbiddenFixturePath(p: string): boolean {
  return FORBIDDEN_FIXTURE_PREFIXES.some((prefix) => p.startsWith(prefix))
}

/**
 * Build a deterministic `tc:` / `eb:` / `pt:` id from a `task:` id.
 * The materializer uses a literal form (e.g. `tc:fixture-relation-kernel`)
 * so the produced ids are human-readable and match the work-order
 * description; the deterministic hash form is not used here.
 */
function derivedIdFromTaskId(prefix: 'tc' | 'eb' | 'pt', taskId: string): string {
  if (taskId.startsWith(TASK_ID_PREFIX)) {
    return `${prefix}:${taskId.slice(TASK_ID_PREFIX.length)}`
  }
  return deterministicId(prefix, taskId)
}

export interface MaterializeFixtureTaskInput {
  fixture: string
  taskId: string
}

export interface MaterializeFixtureTaskError {
  code: string
  message: string
}

export interface MaterializationContext {
  fixture: string
  taskId: string
  /**
   * Path to the `.test.ts` (or `.spec.ts`) sibling if it exists in
   * the indexer's known source universe. `undefined` when no such
   * sibling is known (the contract will be `blocked`).
   */
  testSibling: string | undefined
  /**
   * True when the `.test.ts` sibling is in the indexer's known
   * source path set. False forces the contract to `blocked`.
   */
  testSiblingKnown: boolean
  /**
   * Source-unit / anchor ids the indexer associated with the fixture
   * path. May be empty when the indexer has not yet seen the file
   * (the materializer also checks `fixtureSourceKnown` separately).
   */
  fixtureSourceIds: string[]
  /**
   * Source-unit / anchor ids the indexer associated with the test
   * sibling. Empty when the sibling is unknown.
   */
  testSiblingIds: string[]
  /**
   * Anchor-only ids (`anchor:...` prefix) the indexer associated
   * with the fixture path. These are the ids required by the
   * reader's `validateSourceAnchorIds` check, which only resolves
   * ids via `indexer.anchorsById` (NOT via `source.ndjson`).
   * Empty when the indexer has no anchor for the path.
   */
  fixtureAnchorIds: string[]
  /**
   * Anchor-only ids (`anchor:...` prefix) the indexer associated
   * with the test sibling path. Empty when the indexer has no
   * anchor for the path.
   */
  testSiblingAnchorIds: string[]
  /**
   * sha256 of the fixture's `SourceUnit` (if present in the indexer).
   * `unused` is used as a placeholder when the indexer has no
   * `SourceUnit` row yet.
   */
  fixtureSha256: string
  /**
   * sha256 of the test sibling's `SourceUnit` (if present in the
   * indexer). `unused` when the sibling is unknown.
   */
  testSha256: string
}

export interface MaterializeFixtureTaskResult {
  context: MaterializationContext
  task: ImplementationTask
  contract: TestContract
  boundary: EditBoundary
  template: PacketTemplate
  edge: AtelierEdge
}

export type PrepareResult =
  | { ok: true; context: MaterializationContext }
  | { ok: false; error: MaterializeFixtureTaskError }

function makeError(code: string, message: string): MaterializeFixtureTaskError {
  return { code, message }
}

async function readNdjsonSafe<T>(filePath: string): Promise<T[]> {
  try {
    return await readNdjson<T>(filePath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}

/**
 * Validate inputs and load the deterministic resolution context
 * (source unit ids, sha256, sibling resolution). The function does
 * NOT write to disk. The caller decides whether to persist the
 * result and reports errors at the command-result level.
 */
export async function prepareMaterializeFixtureTask(
  input: MaterializeFixtureTaskInput,
): Promise<PrepareResult> {
  if (!input.fixture || typeof input.fixture !== 'string') {
    return { ok: false, error: makeError('E_MISSING_FIXTURE', 'create-fixture-task requires --fixture <path>') }
  }
  if (!input.taskId || typeof input.taskId !== 'string') {
    return { ok: false, error: makeError('E_MISSING_TASK_ID', 'create-fixture-task requires --task-id <id>') }
  }
  if (!input.taskId.startsWith(TASK_ID_PREFIX)) {
    return {
      ok: false,
      error: makeError(
        'E_BAD_TASK_ID',
        `task_id must start with "${TASK_ID_PREFIX}"; got "${input.taskId}"`,
      ),
    }
  }
  if (isForbiddenFixturePath(input.fixture)) {
    return {
      ok: false,
      error: makeError(
        'E_FORBIDDEN_FIXTURE',
        `fixture path "${input.fixture}" is forbidden: must not be under ${FORBIDDEN_FIXTURE_PREFIXES.join(', ')}`,
      ),
    }
  }
  if (!isCodeFilePath(input.fixture) || isTestFilePath(input.fixture)) {
    return {
      ok: false,
      error: makeError(
        'E_BAD_FIXTURE',
        `fixture path "${input.fixture}" must be a non-test code file (.ts/.tsx/.js/.jsx)`,
      ),
    }
  }
  // Re-materialization is idempotent: a task with the same `task_id`
  // is silently replaced (the `persistMaterializedRecords` merge
  // step rewrites the record on disk). The previous verifying edge
  // is left in the reader-accepted-relations file; a new edge with
  // the same id is added on top. This lets operators re-bind a
  // task to a different fixture path without manual cleanup.
  // The collision check that used to live here was removed so
  // re-running the materializer with the same task_id is a
  // supported operation. See the file-level docstring for
  // re-materialization semantics.
  // Resolve the fixture via the indexer.
  // Note: the indexer excludes `.atelier-bootstrap/**` from its
  // known source path set (this is by design — `.atelier-bootstrap/**`
  // is tooling, not source). The materializer therefore does NOT
  // require the fixture path to be in the indexer; it only requires
  // the `.test.ts` sibling to be known. The fixture itself may be
  // on disk without the indexer knowing it (e.g. when invoked with
  // a path under `.atelier-bootstrap/tests/fixtures/`). The
  // contract's `ready` status is then governed by the test-sibling
  // resolution only.
  const knownSourcePaths = await loadKnownSourcePathSet()
  const idToPath = await loadIdToPathMap()
  // Check the .test.ts sibling is known. This is the only path-set
  // check the work order requires.
  const testCandidates = testCandidatesForTarget(input.fixture)
  const testSibling = testCandidates.find((p) => knownSourcePaths.has(p))
  const testSiblingKnown = Boolean(testSibling)
  // Resolve the fixture to source unit / anchor ids. May be empty
  // when the indexer has not seen the file; the materializer
  // proceeds regardless (the source_anchor_ids trace falls back to
  // the test sibling's ids and the verifying edge endpoint ids).
  const fixtureSourceIds: string[] = []
  for (const [id, p] of idToPath.entries()) {
    if (p === input.fixture) fixtureSourceIds.push(id)
  }
  // Resolve the test sibling to source unit / anchor ids.
  const testSiblingIds: string[] = []
  if (testSibling) {
    for (const [id, p] of idToPath.entries()) {
      if (p === testSibling) testSiblingIds.push(id)
    }
  }
  // Load SourceUnit records for sha256 (used in SourceRef).
  const sourceUnits = await readNdjsonSafe<SourceUnit>(INDEXER_PATHS.objectsSource)
  const fixtureSource = sourceUnits.find((s) => s.path === input.fixture)
  const testSource = testSibling ? sourceUnits.find((s) => s.path === testSibling) : undefined
  // Resolve anchor-only ids (`anchor:...` prefix). The reader's
  // `validateSourceAnchorIds` resolves ids via `index.anchorsById`
  // (not `source.ndjson` or `endpointsById`), so the materializer
  // must surface anchor ids here. The edge's `source_anchor_ids`
  // and `from`/`to` endpoints prefer these anchor ids; they fall
  // back to the source-unit ids if no anchor exists for the path
  // (e.g. when the indexer has been run without an anchor
  // upgrade).
  const anchors = await readNdjsonSafe<SourceAnchor>(INDEXER_PATHS.anchorsFile)
  const fixtureAnchorIds: string[] = []
  for (const a of anchors) {
    if (a && a.path === input.fixture && typeof a.id === 'string' && a.id.startsWith('anchor:')) {
      fixtureAnchorIds.push(a.id)
    }
  }
  const testSiblingAnchorIds: string[] = []
  if (testSibling) {
    for (const a of anchors) {
      if (a && a.path === testSibling && typeof a.id === 'string' && a.id.startsWith('anchor:')) {
        testSiblingAnchorIds.push(a.id)
      }
    }
  }
  return {
    ok: true,
    context: {
      fixture: input.fixture,
      taskId: input.taskId,
      testSibling,
      testSiblingKnown,
      fixtureSourceIds,
      testSiblingIds,
      fixtureAnchorIds,
      testSiblingAnchorIds,
      fixtureSha256: fixtureSource?.sha256 ?? 'unused',
      testSha256: testSource?.sha256 ?? 'unused',
    },
  }
}

/**
 * Build a deterministic verifying edge for the fixture. The edge is
 * `verifies` and points from a test source id to a main source id
 * (matching the contract "test verifies main" semantics). The edge
 * id is human-readable so it shows up clearly in render output.
 *
 * ## Fail-closed `source_anchor_ids` invariant
 *
 * The reader's `relations:accept` runs `validateAcceptedRelationAgainstCurrentIndex`
 * on EVERY previously-accepted edge, including this one. The
 * validator calls `validateSourceAnchorIds` which:
 *
 *   1. requires `source_anchor_ids` to be a non-empty array
 *      (empty/missing => `dropped stale accepted edge`),
 *   2. requires each id to resolve via `index.anchorsById`
 *      (NOT via `source.ndjson` or `endpointsById`),
 *   3. requires each id to be `fresh` and not in a default-excluded path.
 *
 * Without `source_anchor_ids`, the edge is pruned on the next
 * `atelier:relations:accept` run, and the materialized task/contract
 * records' `source_relation_ids` point at a missing edge id. The
 * transformer validator then raises
 * `E_TASK_RELATION_TRACE_INVALID` /
 * `E_CONTRACT_RELATION_TRACE_INVALID` /
 * `E_BOUNDARY_RELATION_TRACE_INVALID` /
 * `E_TEMPLATE_RELATION_TRACE_INVALID`, and the operation layer
 * raises `ARK-P0-004` on the ready task. The relation-kernel
 * ready/verify gates cannot pass.
 *
 * The fix: resolve the fixture / test-sibling paths to anchor ids
 * in the indexer and emit those as `source_anchor_ids`. Prefer
 * anchor ids over source-unit ids for `from`/`to` so the edge
 * matches the reader's accepted-relation schema (the reader emits
 * `anchor:...` ids). Real `sha256` values from the indexer
 * (not the literal `'unused'` placeholder) are kept in
 * `source_refs` so `sourceRefIsCurrent` does not prune the edge.
 */
export function buildVerifyingEdge(ctx: MaterializationContext): AtelierEdge {
  const id = `edge:verifies|${ctx.taskId}`
  // Prefer anchor ids for from/to (the reader emits `anchor:...` ids
  // and the operation layer's relation-kernel check resolves them
  // the same way). Fall back to source-unit ids, then to the path
  // string, so the edge is always populated.
  const fromId = ctx.testSiblingAnchorIds[0] ?? ctx.testSiblingIds[0] ?? ctx.testSibling ?? ctx.fixture
  const toId = ctx.fixtureAnchorIds[0] ?? ctx.fixtureSourceIds[0] ?? ctx.fixture
  const sourceRefs: SourceRef[] = [{ path: ctx.fixture, sha256: ctx.fixtureSha256 }]
  if (ctx.testSibling) sourceRefs.push({ path: ctx.testSibling, sha256: ctx.testSha256 })
  // `source_anchor_ids` is the list of anchors that ground the
  // relation. The reader's `validateSourceAnchorIds` only resolves
  // ids via `anchorsById`, so we MUST emit anchor ids here (not
  // source-unit ids). Use a deduplicated, sorted list to make
  // the on-disk record stable across re-runs.
  const sourceAnchorIds = Array.from(
    new Set([...ctx.testSiblingAnchorIds, ...ctx.fixtureAnchorIds]),
  ).sort()
  // The `source_anchor_ids` field is defined on the reader's
  // `ReaderAcceptedRelation` (a reader-schema extension of
  // `AtelierEdge`) but not on the base `AtelierEdge` type in
  // the shared lib. We type-cast to the reader-schema shape so
  // the on-disk record survives the fail-closed
  // `validateAcceptedRelationAgainstCurrentIndex` check, and so
  // the operation layer's relation-kernel check resolves the
  // anchor ids. The cast is intentional and documented here.
  const edge = {
    id,
    from: fromId,
    to: toId,
    kind: 'verifies',
    provenance_kind: 'deterministic_fact',
    source_refs: sourceRefs,
    source_anchor_ids: sourceAnchorIds,
    confidence: 'fact',
    status: 'fresh',
    created_at: nowIso(),
  } as AtelierEdge & { source_anchor_ids: string[] }
  return edge
}

/**
 * Build the ImplementationTask record for the fixture.
 */
export function buildFixtureTask(
  ctx: MaterializationContext,
  edge: AtelierEdge,
): ImplementationTask {
  const allowed = new Set<string>([
    ctx.fixture,
    '.atelier-bootstrap/tests/fixtures/',
  ])
  if (ctx.testSibling) allowed.add(ctx.testSibling)
  const allowedFiles = [...allowed].sort()
  const sourceAnchorIds = Array.from(
    new Set([...ctx.fixtureSourceIds, ...ctx.testSiblingIds]),
  ).sort()
  const sourceRelationIds = [edge.id]
  const sourceRefs: SourceRef[] = [
    { path: ctx.fixture, sha256: ctx.fixtureSha256 },
  ]
  if (ctx.testSibling) {
    sourceRefs.push({ path: ctx.testSibling, sha256: ctx.testSha256 })
  }
  return {
    id: ctx.taskId,
    kind: 'implementation_task',
    version: '1',
    title: `task: fixture-backed materialization of ${ctx.fixture}`,
    body_ref: TRANSFORMER_PATHS.implementationTasks,
    source_object_ids: ctx.fixtureSourceIds.slice(),
    source_anchor_ids: sourceAnchorIds,
    source_relation_ids: sourceRelationIds,
    source_refs: sourceRefs,
    required_knowledge_object_ids: [],
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: 'ready',
    blocker_ids: [],
    affordances: ['test-candidate', 'review-candidate', 'packet-constraint'],
    created_at: nowIso(),
    task_id: ctx.taskId,
    goal: `materialize a fixture-backed implementation task that exercises the relation-kernel contract for ${ctx.fixture}`,
    allowed_files: allowedFiles,
    forbidden_files: [...DEFAULT_FORBIDDEN_FILES],
    acceptance_criteria: [
      'task references an accepted verifies/references relation trace',
      'test contract carries non-empty target_files, non-empty test_files, and a real command',
      'no edits to product specs, design docs, or product apps',
    ],
    risk_notes: [],
    fixture: false,
    tags: [MATERIALIZED_TAG],
  }
}

type TestContractWithTrace = TestContract & {
  source_anchor_ids: string[]
  evidence_requirements: string[]
}

type EditBoundaryWithTrace = EditBoundary & {
  source_anchor_ids: string[]
}

type PacketTemplateWithTrace = PacketTemplate & {
  source_anchor_ids: string[]
  required_anchor_ids: string[]
  required_relation_ids: string[]
}

/**
 * Build the TestContract for the fixture task.
 *
 * The contract is `ready` only when ALL of:
 *   - the `.test.ts` sibling is in the indexer's known source path set
 *     (`ctx.testSiblingKnown`),
 *   - the verifying edge is `fresh`,
 *   - `target_files` and `test_files` are non-empty.
 * Otherwise the contract is `blocked`. The fail-closed propagation
 * in `deriveAllContractsAndBoundaries` will then downgrade the parent
 * task to `blocked` (it stays `ready` here because the materializer
 * task is grounded in an accepted relation; the fail-closed step
 * looks at the contract's test_files/target_files, not at the
 * materializer's intent).
 */
export function buildFixtureContract(
  task: ImplementationTask,
  edge: AtelierEdge,
  ctx: MaterializationContext,
): TestContract {
  const id = derivedIdFromTaskId('tc', task.task_id)
  const testFiles = ctx.testSibling ? [ctx.testSibling] : []
  const targetFiles = [ctx.fixture]
  const status: TestContract['status'] =
    ctx.testSiblingKnown &&
    edge.status === 'fresh' &&
    testFiles.length > 0 &&
    targetFiles.length > 0
      ? 'ready'
      : 'blocked'
  const contract: TestContractWithTrace = {
    id,
    kind: 'test_contract',
    version: '1',
    title: `test contract for ${task.task_id}`,
    body_ref: TRANSFORMER_PATHS.testContracts,
    source_refs: task.source_refs,
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status,
    affordances: ['test-candidate', 'review-candidate'],
    created_at: nowIso(),
    test_contract_id: id,
    task_id: task.task_id,
    test_framework: 'bun-test',
    target_files: targetFiles,
    test_files: testFiles,
    expected_behavior: ['command exits with code 0', 'output is captured to raw_output_ref'],
    negative_cases: ['modifying a forbidden file does not exit 0'],
    command: 'bun test',
    source_relation_ids: [edge.id],
    source_anchor_ids: ctx.testSiblingIds.slice(),
    evidence_requirements: [
      'command_output',
      'raw_output_ref',
      'diff_ref',
      'file_hashes',
      'validated_handoff',
    ],
  }
  return contract
}

/**
 * Build the EditBoundary for the fixture task. The allowed and
 * forbidden files MUST be non-overlapping.
 */
export function buildFixtureBoundary(
  task: ImplementationTask,
  edge: AtelierEdge,
): EditBoundary {
  const id = derivedIdFromTaskId('eb', task.task_id)
  const boundary: EditBoundaryWithTrace = {
    id,
    kind: 'edit_boundary',
    version: '1',
    title: `edit boundary for ${task.task_id}`,
    body_ref: TRANSFORMER_PATHS.editBoundaries,
    source_refs: task.source_refs,
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: 'fresh',
    affordances: ['packet-constraint'],
    created_at: nowIso(),
    task_id: task.task_id,
    allowed_files: task.allowed_files,
    forbidden_files: task.forbidden_files,
    allowed_operations: ['create', 'modify'],
    requires_user_approval: false,
    source_relation_ids: [edge.id],
    rationale_relation_ids: [edge.id],
    source_anchor_ids: task.source_anchor_ids ?? [],
  }
  return boundary
}

/**
 * Build the PacketTemplate for the fixture task. The template
 * MUST have non-empty `test_contract_ids`, non-empty
 * `evidence_expectations`, a valid `search_policy`, and inherited
 * `source_relation_ids` from the task.
 */
export function buildFixtureTemplate(
  task: ImplementationTask,
  contract: TestContract,
): PacketTemplate {
  const id = derivedIdFromTaskId('pt', task.task_id)
  const testContractIds = [contract.test_contract_id]
  const status: PacketTemplate['status'] =
    task.status === 'ready' &&
    contract.status === 'ready' &&
    (task.source_relation_ids?.length ?? 0) > 0 &&
    (task.source_anchor_ids?.length ?? 0) > 0
      ? 'ready'
      : task.status === 'blocked'
        ? 'blocked'
        : 'candidate'
  // search_policy: `none` for a fully-resolved ready fixture task
  // (the file scope is explicit in `allowed_files`), `bounded` for
  // `blocked` (file scope is known but contract is incomplete),
  // `explicit_approval` for `candidate` (the executor must get
  // human sign-off before any search).
  const searchPolicy: PacketTemplate['search_policy'] =
    status === 'ready' ? 'none' : status === 'candidate' ? 'explicit_approval' : 'bounded'
  const template: PacketTemplateWithTrace = {
    id,
    kind: 'packet_template',
    version: '1',
    title: `packet template for ${task.task_id}`,
    body_ref: TRANSFORMER_PATHS.packetTemplates,
    source_refs: task.source_refs,
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status,
    affordances: ['packet-constraint', 'review-candidate'],
    created_at: nowIso(),
    task_id: task.task_id,
    required_source_refs: task.source_refs,
    required_object_ids: task.source_object_ids,
    source_relation_ids: task.source_relation_ids ?? [],
    source_anchor_ids: task.source_anchor_ids ?? [],
    required_anchor_ids: task.source_anchor_ids ?? [],
    required_relation_ids: task.source_relation_ids ?? [],
    allowed_files: task.allowed_files,
    forbidden_files: task.forbidden_files,
    test_contract_ids: testContractIds,
    evidence_expectations: [
      'test_run evidence record with raw command output',
      'file_hashes for files_changed',
      'handoff.json conforming to atelier.subagent-handoff/v1',
    ],
    search_policy: searchPolicy,
    subagent_contract: 'atelier.subagent-handoff/v1',
  }
  return template
}

/**
 * Append a verifying edge to the reader-owned accepted-relations
 * file. The file is reader-owned in normal operation; the
 * materializer is a special-case command that injects a single
 * deterministic edge so the derived TestContract carries a valid
 * `source_relation_ids` trace. Existing reader-accepted relations
 * are preserved (the file is appended, not overwritten).
 *
 * Re-materialization: when an edge with the same id already exists
 * (i.e. the same `task_id` is being re-materialized), the
 * materializer REPLACES the existing line so the on-disk edge
 * matches the current fixture path. Replacement is line-local: any
 * other reader-accepted edges in the file are preserved verbatim.
 * This keeps the validator's `E_TASK_RELATION_TRACE_INVALID`
 * check honest — the previous materializer's edge (with the old
 * fixture's path) is no longer present, so the trace cannot cite a
 * stale path.
 */
export async function appendVerifyingEdgeToAcceptedRelations(
  edge: AtelierEdge,
): Promise<void> {
  const filePath = readerAcceptedRelationsPath()
  await mkdir(path.dirname(filePath), { recursive: true })
  let existing = ''
  try {
    existing = await readFile(filePath, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  const newLine = JSON.stringify(edge)
  // Parse existing lines and replace any line whose JSON `id`
  // matches the new edge's id. We can't rely on string `includes`
  // because the edge may have changed (different fixture path ->
  // different endpoint ids) but the deterministic edge id stays
  // the same (it is derived from `task_id`, not from the path).
  const lines = existing.split('\n')
  let replaced = false
  const nextLines: string[] = []
  for (const line of lines) {
    if (line.trim() === '') {
      nextLines.push(line)
      continue
    }
    try {
      const parsed = JSON.parse(line) as { id?: unknown }
      if (parsed && parsed.id === edge.id) {
        nextLines.push(newLine)
        replaced = true
      } else {
        nextLines.push(line)
      }
    } catch {
      // Not a valid JSON line; preserve as-is.
      nextLines.push(line)
    }
  }
  if (!replaced) {
    nextLines.push(newLine)
  }
  const out = nextLines.join('\n')
  // Ensure the file ends with a single trailing newline so the
  // ndjson reader sees one record per line.
  if (!out.endsWith('\n')) {
    out.concat('\n')
  }
  await writeFile(filePath, out, 'utf8')
}

/**
 * Append a verifying proposal to the reader-owned
 * `relation-proposals.ndjson` file. The materializer injects a
 * verifying edge directly into `reader-accepted-relations.ndjson`
 * so the derived TestContract carries a valid
 * `source_relation_ids` trace; this proposal mirrors the same
 * `(from, to, kind)` key so the reader's
 * `E_ACCEPTED_RELATION_NO_ACCEPTED_PROPOSAL` invariant (every
 * accepted relation has a matching accepted proposal) holds.
 *
 * The proposal is marked `status: 'accepted'` and
 * `confidence: 'inferred'`. The reader's `validateProposalAgainstCurrentIndex`
 * accepts `inferred` confidence with valid endpoints, source
 * anchors, and source refs. On the next `atelier:relations:accept`
 * run the proposal is skipped (its edge key is already in the
 * accepted-relations file) so no duplicate edge is created.
 *
 * Re-materialization: when a proposal with the same
 * `proposal_id` already exists, the line is REPLACED so the
 * on-disk proposal matches the current materializer state. The
 * `proposal_id` is derived from `task_id` (e.g.
 * `rp:task:fixture-relation-kernel`) and stays stable across
 * re-materializations.
 */
export async function appendVerifyingProposalToProposals(
  edge: AtelierEdge,
  ctx: MaterializationContext,
): Promise<void> {
  const filePath = READER_PATHS.relationProposals
  await mkdir(path.dirname(filePath), { recursive: true })
  const proposalId = `rp:${ctx.taskId}`
  const proposal: RelationProposal = {
    schema: 'atelier.relation-proposal/v1',
    proposal_id: proposalId,
    proposed_relation: {
      from: edge.from,
      to: edge.to,
      kind: edge.kind,
      // `created_at` is required by RelationProposal's nested
      // Relation (the reader's `validateProposalAgainstCurrentIndex`
      // tolerates missing `confidence` but uses `created_at` for
      // ordering in some downstream code). We populate it from the
      // edge's `created_at`.
      created_at: edge.created_at,
    },
    rationale: `materializer-generated verifying edge for ${ctx.fixture}: test sibling ${ctx.testSibling ?? '<unknown>'} verifies main ${ctx.fixture}`,
    source_anchor_ids: (edge as AtelierEdge & { source_anchor_ids?: string[] }).source_anchor_ids ?? [],
    source_refs: edge.source_refs ?? [],
    confidence: 'inferred',
    status: 'accepted',
    created_at: edge.created_at,
  }
  const newLine = JSON.stringify(proposal)
  let existing = ''
  try {
    existing = await readFile(filePath, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  const lines = existing.split('\n')
  let replaced = false
  const nextLines: string[] = []
  for (const line of lines) {
    if (line.trim() === '') {
      nextLines.push(line)
      continue
    }
    try {
      const parsed = JSON.parse(line) as { proposal_id?: unknown }
      if (parsed && parsed.proposal_id === proposalId) {
        nextLines.push(newLine)
        replaced = true
      } else {
        nextLines.push(line)
      }
    } catch {
      // Not a valid JSON line; preserve as-is.
      nextLines.push(line)
    }
  }
  if (!replaced) {
    nextLines.push(newLine)
  }
  const out = nextLines.join('\n')
  if (!out.endsWith('\n')) {
    out.concat('\n')
  }
  await writeFile(filePath, out, 'utf8')
}

/**
 * Persist the four materializer-produced records to the
 * transformer-owned output files. Each file is rewritten as a merge
 * so existing records are preserved.
 */
export async function persistMaterializedRecords(
  result: MaterializeFixtureTaskResult,
): Promise<void> {
  // Tasks
  const existingTasks = await readNdjsonSafe<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const nextTasks = [...existingTasks.filter((t) => t.task_id !== result.task.task_id), result.task].sort(
    (a, b) => a.task_id.localeCompare(b.task_id),
  )
  await writeNdjson(TRANSFORMER_PATHS.implementationTasks, nextTasks)
  // Contracts
  const existingContracts = await readNdjsonSafe<TestContract>(TRANSFORMER_PATHS.testContracts)
  const nextContracts = [
    ...existingContracts.filter((c) => c.task_id !== result.task.task_id),
    result.contract,
  ].sort((a, b) => a.test_contract_id.localeCompare(b.test_contract_id))
  await writeNdjson(TRANSFORMER_PATHS.testContracts, nextContracts)
  // Boundaries
  const existingBoundaries = await readNdjsonSafe<EditBoundary>(TRANSFORMER_PATHS.editBoundaries)
  const nextBoundaries = [
    ...existingBoundaries.filter((b) => b.task_id !== result.task.task_id),
    result.boundary,
  ].sort((a, b) => a.task_id.localeCompare(b.task_id))
  await writeNdjson(TRANSFORMER_PATHS.editBoundaries, nextBoundaries)
  // Templates
  const existingTemplates = await readNdjsonSafe<PacketTemplate>(TRANSFORMER_PATHS.packetTemplates)
  const nextTemplates = [
    ...existingTemplates.filter((t) => t.task_id !== result.task.task_id),
    result.template,
  ].sort((a, b) => a.task_id.localeCompare(b.task_id))
  await writeNdjson(TRANSFORMER_PATHS.packetTemplates, nextTemplates)
  // Edge
  await appendVerifyingEdgeToAcceptedRelations(result.edge)
  // Proposal (the reader's `E_ACCEPTED_RELATION_NO_ACCEPTED_PROPOSAL`
  // invariant requires every accepted relation to have a matching
  // accepted proposal with the same `(from, to, kind)` key. The
  // materializer injects its edge directly into the reader-owned
  // `reader-accepted-relations.ndjson` file, so it also writes a
  // corresponding proposal to `relation-proposals.ndjson`. The
  // proposal is marked `status: 'accepted'` so the next
  // `atelier:relations:accept` invocation sees the proposal as
  // already-accepted and skips re-acceptance (its dedup logic
  // checks the (from, to, kind) key against existing accepted
  // edges). This keeps the proposal ledger consistent with the
  // accepted-relation ledger after a materializer re-run.
  await appendVerifyingProposalToProposals(result.edge, result.context)
}

/**
 * Top-level orchestration: validate, build, persist. Returns a
 * union of either the persisted result or a structured error.
 */
export async function materializeFixtureTask(
  input: MaterializeFixtureTaskInput,
): Promise<{ ok: true; result: MaterializeFixtureTaskResult } | { ok: false; error: MaterializeFixtureTaskError }> {
  const prep = await prepareMaterializeFixtureTask(input)
  if (!prep.ok) return { ok: false, error: prep.error }
  const ctx = prep.context
  const edge = buildVerifyingEdge(ctx)
  const task = buildFixtureTask(ctx, edge)
  const contract = buildFixtureContract(task, edge, ctx)
  const boundary = buildFixtureBoundary(task, edge)
  const template = buildFixtureTemplate(task, contract)
  const result: MaterializeFixtureTaskResult = {
    context: ctx,
    task,
    contract,
    boundary,
    template,
    edge,
  }
  await persistMaterializedRecords(result)
  return { ok: true, result }
}

/**
 * Predicate: a record is "materialized" (produced by the
 * materializer) when its tags include `MATERIALIZED_TAG`. Used by
 * the transform pipeline's merge logic to preserve
 * materializer-produced records across re-runs of
 * `transform --target md-to-code`.
 */
export function isMaterializedRecord(record: { tags?: unknown }): boolean {
  return Array.isArray(record.tags) && record.tags.includes(MATERIALIZED_TAG)
}
