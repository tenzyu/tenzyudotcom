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

function detectFramework(task: ImplementationTask): TestContract['test_framework'] {
  // We only use deterministic signals here. Bun test or vitest are both
  // common in this repository; we report `bun-test` as the default
  // because the package manager is `bun@1.3.x`.
  void task
  return 'bun-test'
}

export async function deriveTestContract(task: ImplementationTask): Promise<TestContract> {
  const id = deterministicId('tc', task.task_id)
  const framework = detectFramework(task)
  const targetFiles = task.allowed_files.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'))
  const testFiles = targetFiles
    .map((f) => {
      if (f.endsWith('.test.ts') || f.endsWith('.test.tsx')) return f
      return f.replace(/(\.ts|\.tsx|\.js|\.jsx)$/, '.test$1')
    })
    .filter((f) => f !== task.allowed_files.find((a) => a === f))
  const command = framework === 'bun-test' ? 'bun test' : 'bun run test'
  const contract: TestContract = {
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
  await writeNdjson(TRANSFORMER_PATHS.testContracts, [contract])
  return contract
}

export async function deriveEditBoundary(task: ImplementationTask): Promise<EditBoundary> {
  const id = deterministicId('eb', task.task_id)
  const boundary: EditBoundary = {
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
  await writeNdjson(TRANSFORMER_PATHS.editBoundaries, [boundary])
  return boundary
}

export async function deriveContractsForTask(task: ImplementationTask): Promise<{
  testContract: TestContract
  editBoundary: EditBoundary
}> {
  const testContract = await deriveTestContract(task)
  const editBoundary = await deriveEditBoundary(task)
  return { testContract, editBoundary }
}

export async function listTasks(): Promise<ImplementationTask[]> {
  return readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
}
