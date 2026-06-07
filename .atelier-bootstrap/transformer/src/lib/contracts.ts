/**
 * Test contract and edit boundary derivation.
 *
 * Given an `ImplementationTask`, derive:
 *   - a `TestContract` with an executable `command`
 *   - an `EditBoundary` that lists allowed/forbidden files and operations
 *
 * Both records carry `source_relation_ids` inherited from the parent
 * task. The TestContract's `status` is `ready` only when at least one
 * accepted `verifies` or `references` relation from the parent task
 * points at the contract's `target_files`. Otherwise the contract is
 * `status: 'candidate'` and a warning is emitted at the call site.
 *
 * The test framework is detected from the project brief or scripts.
 * If the project has no test framework detected, the contract is marked
 * `no-test-required` by setting `test_files: []` and `command: "echo"`.
 * The validator requires the `command` to be a non-empty string either way.
 *
 * ## Fail-closed ready/contract propagation
 *
 * The Relation Kernel invariant: a `ready` task MUST have a `ready`
 * TestContract with non-empty `target_files` and non-empty
 * `test_files`. When a parent task is `status: 'ready'` but its
 * derived contract is `blocked` (or has empty `test_files` /
 * `target_files`), the transformer MUST downgrade the parent task to
 * `blocked` and emit a `ready-task-with-blocked-contract` warning.
 * The propagation is implemented in `propagateContractBlockersToTasks`
 * and is applied by `deriveAllContractsAndBoundaries` after the
 * per-task contract build step.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  INDEXER_PATHS,
  type EditBoundary,
  type ImplementationTask,
  type SourceAnchor,
  type SourceUnit,
  type TestContract,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { loadAcceptedRelations, relationEndpointIds, type AtelierEdge } from './relations.ts'
import { isMaterializedRecord } from './materialize-fixture-task.ts'

function nowIso(): string {
  return new Date().toISOString()
}

function detectFramework(_task: ImplementationTask): TestContract['test_framework'] {
  // We only use deterministic signals here. Bun test or vitest are both
  // common in this repository; we report `bun-test` as the default
  // because the package manager is `bun@1.3.x`.
  return 'bun-test'
}

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/

const DEFAULT_EVIDENCE_REQUIREMENTS = [
  'command_output',
  'raw_output_ref',
  'diff_ref',
  'file_hashes',
  'validated_handoff',
] as const

type TestContractWithTrace = TestContract & {
  source_anchor_ids: string[]
  evidence_requirements: string[]
}

type EditBoundaryWithTrace = EditBoundary & {
  source_anchor_ids: string[]
}

function isCodeFilePath(filePath: string): boolean {
  return CODE_FILE_RE.test(filePath)
}

function isTestFilePath(filePath: string): boolean {
  return TEST_FILE_RE.test(filePath)
}

function testCandidatesForTarget(filePath: string): string[] {
  return [
    filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
    filePath.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
  ]
}

function deriveTargetFiles(task: ImplementationTask): string[] {
  return Array.from(
    new Set(task.allowed_files.filter((f) => isCodeFilePath(f) && !isTestFilePath(f))),
  ).sort()
}

function deriveTestFiles(
  task: ImplementationTask,
  targetFiles: ReadonlyArray<string>,
  knownSourcePaths?: ReadonlySet<string>,
): string[] {
  const out = new Set<string>()
  for (const f of task.allowed_files) {
    if (isCodeFilePath(f) && isTestFilePath(f)) out.add(f)
  }
  for (const f of targetFiles) {
    for (const candidate of testCandidatesForTarget(f)) {
      if (!knownSourcePaths || knownSourcePaths.has(candidate)) out.add(candidate)
    }
  }
  return [...out].sort()
}

function collectSourceAnchorIds(
  task: ImplementationTask,
  relations: ReadonlyArray<AtelierEdge>,
): string[] {
  return Array.from(
    new Set([...(task.source_anchor_ids ?? []), ...relationEndpointIds(relations)]),
  ).sort()
}

/**
 * Subset of the parent task's accepted relations (full edge objects)
 * that the orchestrator supplies, restricted to `verifies` or
 * `references` edges that touch the contract's `target_files`. The
 * resulting id list is written into the contract as
 * `source_relation_ids` (in addition to the parent task's inherited
 * ids).
 */
function pickContractRelations(
  task: ImplementationTask,
  acceptedRelations: ReadonlyArray<AtelierEdge>,
  targetFiles: ReadonlyArray<string>,
  idToPath: ReadonlyMap<string, string>,
): AtelierEdge[] {
  const taskRelationIds = new Set(task.source_relation_ids ?? [])
  if (taskRelationIds.size === 0) return []
  const out: AtelierEdge[] = []
  for (const e of acceptedRelations) {
    if (!taskRelationIds.has(e.id)) continue
    if (e.kind !== 'verifies' && e.kind !== 'references') continue
    // Touch test: at least one of e.from/e.to must resolve to a
    // path in targetFiles, or one of the edge's source_refs must
    // name a target file. The `idToPath` map is built from the
    // indexer's `objects/source.ndjson` and
    // `anchors/source-anchors.ndjson` so a relation between two
    // anchor ids can be resolved to the underlying file paths.
    if (!edgeTouchesAnyPath(e, targetFiles, idToPath)) continue
    out.push(e)
  }
  return out
}

function edgeTouchesAnyPath(
  e: AtelierEdge,
  targetFiles: ReadonlyArray<string>,
  idToPath: ReadonlyMap<string, string>,
): boolean {
  if (targetFiles.length === 0) return false
  const targets = new Set(targetFiles)
  // 1. Direct hit: the relation's `from` or `to` id is itself a
  //    path-shaped string in `target_files`. This covers the rare
  //    case where the indexer named a source unit after a target
  //    file path verbatim.
  if (targets.has(e.from) || targets.has(e.to)) return true
  // 2. Resolved hit: resolve `from`/`to` through the
  //    `id -> path` map (built from `objects/source.ndjson` and
  //    `anchors/source-anchors.ndjson`).
  const fromPath = idToPath.get(e.from)
  if (fromPath && targets.has(fromPath)) return true
  const toPath = idToPath.get(e.to)
  if (toPath && targets.has(toPath)) return true
  // 3. Source-ref hit: the edge carries a `source_refs[*].path`
  //    that names a target file. This is the most common hit
  //    for reader-accepted relations, which encode the source
  //    locations of the proposal in `source_refs`.
  if (Array.isArray(e.source_refs)) {
    for (const r of e.source_refs) {
      if (r && typeof r.path === 'string' && targets.has(r.path)) return true
    }
  }
  return false
}

/**
 * Build a deterministic `id -> path` map from the indexer's
 * `objects/source.ndjson` and `anchors/source-anchors.ndjson`. The
 * map is used to resolve an edge's endpoint ids to file paths so
 * `edgeTouchesAnyPath` can decide whether a relation touches a
 * `target_files` entry.
 *
 * The map is read-only and shared across all edges in a single
 * `buildTestContract` call. Both source files are read; missing
 * files produce an empty contribution (no error). The read is
 * deterministic: it walks the files in the order the indexer wrote
 * them and never performs I/O inside the per-edge loop.
 */
export async function loadIdToPathMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const sources = await readNdjsonSafe<SourceUnit>(INDEXER_PATHS.objectsSource)
  for (const s of sources) {
    if (s && typeof s.id === 'string' && typeof s.path === 'string' && s.id && s.path) {
      map.set(s.id, s.path)
    }
  }
  const anchors = await readNdjsonSafe<SourceAnchor>(INDEXER_PATHS.anchorsFile)
  for (const a of anchors) {
    if (a && typeof a.id === 'string' && typeof a.path === 'string' && a.id && a.path) {
      // Anchors are finer-grained than source units, so they win
      // when both define the same id (which happens when an anchor
      // shadows a source unit's id). The map is intentionally
      // overwrite-on-second-wins: anchors carry the more precise
      // `path` value.
      map.set(a.id, a.path)
    }
  }
  return map
}

export async function loadKnownSourcePathSet(): Promise<Set<string>> {
  const out = new Set<string>()
  const sources = await readNdjsonSafe<SourceUnit>(INDEXER_PATHS.objectsSource)
  for (const s of sources) {
    if (s && typeof s.path === 'string' && s.path.length > 0) out.add(s.path)
  }
  const anchors = await readNdjsonSafe<SourceAnchor>(INDEXER_PATHS.anchorsFile)
  for (const a of anchors) {
    if (a && typeof a.path === 'string' && a.path.length > 0) out.add(a.path)
  }
  return out
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
 * Pure builder for a `TestContract`. The caller decides whether to
 * write the result to disk. The task is referenced by `task_id` only
 * (no embedding) so the contract survives re-derivation.
 *
 * `acceptedRelations` is the full set of accepted edges the
 * orchestrator loaded. `idToPath` is the deterministic
 * `id -> path` map loaded from the indexer's
 * `objects/source.ndjson` and `anchors/source-anchors.ndjson`. The
 * contract inherits only the subset that verifies/references its
 * `target_files`. The contract is `ready` only when that subset is
 * non-empty; otherwise it is `candidate` and a warning is emitted.
 */
export function buildTestContract(
  task: ImplementationTask,
  acceptedRelations: ReadonlyArray<AtelierEdge>,
  idToPath: ReadonlyMap<string, string> = new Map(),
  knownSourcePaths?: ReadonlySet<string>,
): TestContract {
  const id = deterministicId('tc', task.task_id)
  const framework = detectFramework(task)
  const targetFiles = deriveTargetFiles(task)
  const testFiles = deriveTestFiles(task, targetFiles, knownSourcePaths)
  const command = framework === 'bun-test' ? 'bun test' : 'bun run test'
  const verifyingRelations = pickContractRelations(task, acceptedRelations, targetFiles, idToPath)
  const inheritedRelationIds = (task.source_relation_ids ?? []).slice()
  const verifyingRelationIds = verifyingRelations.map((e) => e.id)
  // The contract inherits all parent task relations as the
  // transitive relation trace, AND specifically records the
  // verifying/referencing subset that motivated the readiness.
  const sourceRelationIds = Array.from(new Set([...inheritedRelationIds, ...verifyingRelationIds]))
  const sourceAnchorIds = collectSourceAnchorIds(task, verifyingRelations)
  // Empty test files for a contract with no verifying relations is
  // P0 (already enforced elsewhere); a contract with non-empty test
  // files but no verifying relations is `candidate` (not `ready`).
  let status: TestContract['status']
  if (task.status !== 'ready') {
    status = task.status === 'blocked' ? 'blocked' : 'candidate'
  } else if (targetFiles.length === 0 || testFiles.length === 0) {
    status = 'blocked'
  } else if (verifyingRelationIds.length > 0) {
    status = 'ready'
  } else {
    status = 'candidate'
  }
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
    test_framework: framework,
    target_files: targetFiles,
    test_files: testFiles,
    expected_behavior: ['command exits with code 0', 'output is captured to raw_output_ref'],
    negative_cases: ['modifying a forbidden file does not exit 0'],
    command,
    source_relation_ids: sourceRelationIds,
    source_anchor_ids: sourceAnchorIds,
    evidence_requirements: [...DEFAULT_EVIDENCE_REQUIREMENTS],
  }
  return contract
}

/**
 * Pure builder for an `EditBoundary`. The caller decides whether to
 * write the result to disk.
 *
 * The boundary inherits the parent task's `source_relation_ids` and
 * records the rationale set (the same ids) so the validator can check
 * that allowed/forbidden file partitioning is motivated by accepted
 * relations.
 */
export function buildEditBoundary(
  task: ImplementationTask,
  acceptedRelations: ReadonlyArray<AtelierEdge>,
): EditBoundary {
  const id = deterministicId('eb', task.task_id)
  const taskRelationIds = new Set(task.source_relation_ids ?? [])
  const inheritedRelationIds = (task.source_relation_ids ?? []).slice()
  const rationaleRelationIds: string[] = []
  for (const e of acceptedRelations) {
    if (!taskRelationIds.has(e.id)) continue
    // Rationale = relations that motivate the boundary partition.
    // `constrains` and `references` are the most common.
    if (e.kind === 'constrains' || e.kind === 'references' || e.kind === 'depends_on') {
      rationaleRelationIds.push(e.id)
    }
  }
  const relatedRelations = acceptedRelations.filter((e) => taskRelationIds.has(e.id))
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
    source_relation_ids: inheritedRelationIds,
    rationale_relation_ids: rationaleRelationIds,
    source_anchor_ids: collectSourceAnchorIds(task, relatedRelations),
  }
  return boundary
}

/**
 * Derive a test contract for a single task and overwrite the
 * test-contracts file. Used by the `test-contract:derive --task <id>`
 * CLI command.
 */
export async function deriveTestContract(task: ImplementationTask): Promise<TestContract> {
  const accepted = await loadAcceptedRelations()
  const idToPath = await loadIdToPathMap()
  const knownSourcePaths = await loadKnownSourcePathSet()
  const contract = buildTestContract(task, accepted, idToPath, knownSourcePaths)
  await writeNdjson(TRANSFORMER_PATHS.testContracts, [contract])
  return contract
}

/**
 * Derive an edit boundary for a single task and overwrite the
 * edit-boundaries file. (No single-task CLI consumes this today, but
 * it keeps the file in lock-step with the task list.)
 */
export async function deriveEditBoundary(task: ImplementationTask): Promise<EditBoundary> {
  const accepted = await loadAcceptedRelations()
  const boundary = buildEditBoundary(task, accepted)
  await writeNdjson(TRANSFORMER_PATHS.editBoundaries, [boundary])
  return boundary
}

/**
 * Derive test contract + edit boundary for a single task. Each file
 * is overwritten with the single record.
 */
export async function deriveContractsForTask(task: ImplementationTask): Promise<{
  testContract: TestContract
  editBoundary: EditBoundary
}> {
  const testContract = await deriveTestContract(task)
  const editBoundary = await deriveEditBoundary(task)
  return { testContract, editBoundary }
}

/**
 * Apply the fail-closed propagation: when a parent task is `ready`
 * but its derived TestContract is `blocked` or has empty
 * `test_files` / `target_files`, downgrade the task to `blocked` and
 * add explicit `blocker_ids` referencing the offending contract id.
 *
 * The Relation Kernel invariant is: a `ready` task MUST have a
 * `ready` TestContract with non-empty `target_files` and non-empty
 * `test_files`. A contract that is `blocked` (because no verifying
 * relation touched its `target_files` in the known source universe)
 * or that has empty `test_files` (because the indexer does not know
 * a `.test.ts` / `.spec.ts` for any `target_file`) cannot satisfy
 * a `ready` task, so the task itself is downgraded to `blocked`.
 *
 * The downgrade is a single-shot: if any contract for the same task
 * is non-`ready` or empty, the task becomes `blocked` and ALL
 * offending contract ids are recorded in `blocker_ids` (one entry
 * per offending contract, format
 * `ready-task-with-blocked-contract:<test_contract_id>`).
 *
 * The function does NOT write to disk. The caller decides whether
 * to persist the updated tasks and surfaces the warnings at the
 * command-result level.
 */
export function propagateContractBlockersToTasks(
  tasks: ReadonlyArray<ImplementationTask>,
  contracts: ReadonlyArray<TestContract>,
): { tasks: ImplementationTask[]; warnings: string[] } {
  const warnings: string[] = []
  // Map of task_id -> list of offending contracts.
  const offendersByTaskId = new Map<string, TestContract[]>()
  for (const c of contracts) {
    const isContractOffending =
      c.status !== 'ready' || c.test_files.length === 0 || c.target_files.length === 0
    if (!isContractOffending) continue
    const parent = tasks.find((t) => t.task_id === c.task_id)
    if (!parent || parent.status !== 'ready') continue
    warnings.push(
      `ready-task-with-blocked-contract: task ${parent.task_id} (${c.test_contract_id} status=${c.status}, test_files=${c.test_files.length}, target_files=${c.target_files.length}); downgrading task to blocked`,
    )
    const list = offendersByTaskId.get(parent.task_id) ?? []
    list.push(c)
    offendersByTaskId.set(parent.task_id, list)
  }
  if (offendersByTaskId.size === 0) {
    // No task needs to be downgraded. Return a shallow copy so the
    // caller can safely pass the array around without aliasing.
    return { tasks: tasks.slice(), warnings }
  }
  const updatedTasks: ImplementationTask[] = tasks.map((t) => {
    const offenders = offendersByTaskId.get(t.task_id)
    if (!offenders) return t
    const existing = Array.isArray(t.blocker_ids) ? t.blocker_ids : []
    const newBlockers = offenders.map(
      (c) => `ready-task-with-blocked-contract:${c.test_contract_id}`,
    )
    return {
      ...t,
      status: 'blocked' as const,
      blocker_ids: Array.from(new Set([...existing, ...newBlockers])).sort(),
    }
  })
  return { tasks: updatedTasks, warnings }
}

/**
 * Derive test contracts + edit boundaries for every task and write
 * the merged list to disk in a single write. Used by the
 * `transform --target md-to-code` command.
 *
 * After the per-task contract build, the fail-closed ready/contract
 * propagation is applied: any `ready` task whose contract is
 * `blocked` or has empty `test_files` / `target_files` is
 * downgraded to `blocked` with explicit `blocker_ids`. The
 * downgraded tasks are persisted to `implementation-tasks.ndjson`
 * so subsequent pipeline stages (packet template, recommend, render,
 * validate) see the corrected state.
 *
 * Materialized contracts and boundaries (those whose parent task is
 * a `tags: ['materialized']` record produced by
 * `create-fixture-task`) are preserved across re-runs of
 * `transform --target md-to-code`. Newly derived contracts and
 * boundaries are merged in; the materialized ones stay.
 */
export async function deriveAllContractsAndBoundaries(
  tasks: ReadonlyArray<ImplementationTask>,
  acceptedRelations: ReadonlyArray<AtelierEdge>,
): Promise<{
  testContracts: TestContract[]
  editBoundaries: EditBoundary[]
  warnings: string[]
  tasks: ImplementationTask[]
}> {
  // Build a set of task_ids that are materialized. The materializer
  // sets `tags: ['materialized']` on its task, and the contracts /
  // boundaries it produces use the same task_id. The merge below
  // preserves those records.
  const materializedTaskIds = new Set(
    tasks.filter(isMaterializedRecord).map((t) => t.task_id),
  )
  // Read existing contracts / boundaries and preserve the ones
  // whose task_id is in `materializedTaskIds`. Idempotent: when
  // there is no existing record, nothing is preserved.
  const existingContracts = await readNdjsonSafe<TestContract>(TRANSFORMER_PATHS.testContracts)
  const existingBoundaries = await readNdjsonSafe<EditBoundary>(TRANSFORMER_PATHS.editBoundaries)
  const preservedContracts = existingContracts.filter((c) => materializedTaskIds.has(c.task_id))
  const preservedBoundaries = existingBoundaries.filter((b) => materializedTaskIds.has(b.task_id))
  const testContracts: TestContract[] = preservedContracts.slice()
  const editBoundaries: EditBoundary[] = preservedBoundaries.slice()
  // Build per-task contracts / boundaries, but skip tasks whose
  // records were already preserved (otherwise we'd duplicate the
  // materializer's record).
  const tasksToDerive = tasks.filter((t) => !materializedTaskIds.has(t.task_id))
  // Load the `id -> path` map ONCE per batch and pass it to every
  // `buildTestContract` call. The map is the deterministic
  // resolution from the indexer's `objects/source.ndjson` and
  // `anchors/source-anchors.ndjson`; sharing it across all
  // contracts in the batch keeps the readiness check fast and
  // consistent.
  const idToPath = await loadIdToPathMap()
  const knownSourcePaths = await loadKnownSourcePathSet()
  for (const t of tasksToDerive) {
    testContracts.push(buildTestContract(t, acceptedRelations, idToPath, knownSourcePaths))
    editBoundaries.push(buildEditBoundary(t, acceptedRelations))
  }
  // === Fail-closed ready/contract propagation ===
  // The task input is read-only; `propagateContractBlockersToTasks`
  // returns a new array with downgraded status + explicit
  // `blocker_ids`. The warnings are surfaced to the caller for the
  // transform-command result and the validator.
  const { tasks: updatedTasks, warnings } = propagateContractBlockersToTasks(
    tasks,
    testContracts,
  )
  await writeNdjson(TRANSFORMER_PATHS.testContracts, testContracts)
  await writeNdjson(TRANSFORMER_PATHS.editBoundaries, editBoundaries)
  // Persist the (potentially downgraded) tasks so subsequent
  // pipeline stages see the corrected state. We rewrite the file
  // atomically (single writeNdjson call) so the on-disk view of
  // tasks is always either the pre-propagation or post-propagation
  // state, never an intermediate partial write.
  await writeNdjson(TRANSFORMER_PATHS.implementationTasks, updatedTasks)
  return { testContracts, editBoundaries, warnings, tasks: updatedTasks }
}

export async function listTasks(): Promise<ImplementationTask[]> {
  return readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
}
