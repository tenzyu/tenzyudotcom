/**
 * Test contract and edit boundary derivation.
 *
 * Given an `ImplementationTask`, derive:
 *   - a `TestContract` with an executable `command`
 *   - an `EditBoundary` that lists allowed/forbidden files and operations
 *
 * The test framework is detected from the project brief or scripts.
 * If the project has no test framework detected, the contract is marked
 * `no-test-required` by setting `test_files: []` and `command: "echo"`.
 * The validator requires the `command` to be a non-empty string either way.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type EditBoundary,
  type ImplementationTask,
  type TestContract,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'

function nowIso(): string {
  return new Date().toISOString()
}

function detectFramework(_task: ImplementationTask): TestContract['test_framework'] {
  // We only use deterministic signals here. Bun test or vitest are both
  // common in this repository; we report `bun-test` as the default
  // because the package manager is `bun@1.3.x`.
  return 'bun-test'
}

/**
 * Pure builder for a `TestContract`. The caller decides whether to
 * write the result to disk. The task is referenced by `task_id` only
 * (no embedding) so the contract survives re-derivation.
 */
export function buildTestContract(task: ImplementationTask): TestContract {
  const id = deterministicId('tc', task.task_id)
  const framework = detectFramework(task)
  const targetFiles = task.allowed_files.filter(
    (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'),
  )
  const testFiles = targetFiles
    .map((f) => {
      if (f.endsWith('.test.ts') || f.endsWith('.test.tsx')) return f
      return f.replace(/(\.ts|\.tsx|\.js|\.jsx)$/, '.test$1')
    })
    .filter((f) => !task.allowed_files.includes(f))
  const command = framework === 'bun-test' ? 'bun test' : 'bun run test'
  return {
    id,
    kind: 'test_contract',
    version: '1',
    title: `test contract for ${task.task_id}`,
    body_ref: TRANSFORMER_PATHS.testContracts,
    source_refs: task.source_refs,
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: testFiles.length > 0 ? 'ready' : 'blocked',
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
  }
}

/**
 * Pure builder for an `EditBoundary`. The caller decides whether to
 * write the result to disk.
 */
export function buildEditBoundary(task: ImplementationTask): EditBoundary {
  const id = deterministicId('eb', task.task_id)
  return {
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
  }
}

/**
 * Derive a test contract for a single task and overwrite the
 * test-contracts file. Used by the `test-contract:derive --task <id>`
 * CLI command.
 */
export async function deriveTestContract(task: ImplementationTask): Promise<TestContract> {
  const contract = buildTestContract(task)
  await writeNdjson(TRANSFORMER_PATHS.testContracts, [contract])
  return contract
}

/**
 * Derive an edit boundary for a single task and overwrite the
 * edit-boundaries file. (No single-task CLI consumes this today, but
 * it keeps the file in lock-step with the task list.)
 */
export async function deriveEditBoundary(task: ImplementationTask): Promise<EditBoundary> {
  const boundary = buildEditBoundary(task)
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
 * Derive test contracts + edit boundaries for every task and write
 * the merged list to disk in a single write. Used by the
 * `transform --target md-to-code` command.
 */
export async function deriveAllContractsAndBoundaries(
  tasks: ReadonlyArray<ImplementationTask>,
): Promise<{ testContracts: TestContract[]; editBoundaries: EditBoundary[] }> {
  const testContracts: TestContract[] = []
  const editBoundaries: EditBoundary[] = []
  for (const t of tasks) {
    testContracts.push(buildTestContract(t))
    editBoundaries.push(buildEditBoundary(t))
  }
  await writeNdjson(TRANSFORMER_PATHS.testContracts, testContracts)
  await writeNdjson(TRANSFORMER_PATHS.editBoundaries, editBoundaries)
  return { testContracts, editBoundaries }
}

export async function listTasks(): Promise<ImplementationTask[]> {
  return readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
}
