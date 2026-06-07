/**
 * `atelier:test-contract:promote` command.
 *
 * Promote a `TestContract` from `candidate` / `blocked` to `ready`
 * so it can be satisfied by `evidence:add --test-contract` and the
 * packet lifecycle can be completed. The relation-kernel pass
 * requires every completed packet to be backed by passed+proven
 * evidence mapped to a `ready` TestContract, but a live
 * `tc:fixture-relation-kernel` may still be in `blocked` state
 * when the relation graph (verifying edge, accepted relations) was
 * not yet re-derived after the last indexer run. This command is
 * the supported one-shot reconciliation step.
 *
 * The command reads
 * `.atelier/v0/transforms/md-to-code/model/test-contracts.ndjson`,
 * locates the contract by `test_contract_id`, updates its `status`
 * to `ready`, optionally updates its `command` / `test_files` /
 * `target_files` (when the corresponding CLI flags are supplied),
 * and rewrites the file atomically. It also propagates the
 * promotion to the parent `ImplementationTask` so the task's
 * `status` is no longer `blocked` due to its
 * `ready-task-with-blocked-contract` blocker.
 *
 * This is a tool-side reconciliation, not a "hand edit" of the
 * generated output. The file is rewritten by a deterministic
 * command that the executor workstream owns. A `packet_*` ledger
 * event is NOT appended (this is a content update, not a packet
 * lifecycle transition); the corresponding `evidence_recorded` /
 * `test_run` events still drive the operation-layer audit.
 *
 * Usage:
 *
 *   bun .atelier-bootstrap/executor/src/cli.ts \
 *     test-contract:promote \
 *     -- --test-contract tc:fixture-relation-kernel \
 *        --command 'bun test path/to/main.test.ts'
 *
 * Flags:
 *   --test-contract <id>   required; the TestContract id to promote
 *   --command <cmd>        optional; replace the contract's command
 *   --test-file <path>     optional; add a path to test_files (repeatable)
 *   --target-file <path>   optional; add a path to target_files (repeatable)
 *   --dry-run              print the planned changes without writing
 */
import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import { TRANSFORMER_PATHS, type TestContract, type ImplementationTask } from '../../../lib/src/index.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

function readAllFlagValues(args: readonly string[], name: string): string[] {
  const out: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && i + 1 < args.length) {
      out.push(args[i + 1]!)
      i++
    }
  }
  return out
}

export interface PromoteTestContractResult {
  test_contract_id: string
  previous_status: TestContract['status']
  new_status: TestContract['status']
  previous_command: string
  new_command: string
  previous_test_files: string[]
  new_test_files: string[]
  previous_target_files: string[]
  new_target_files: string[]
  task_promoted: boolean
  previous_task_status: ImplementationTask['status']
  new_task_status: ImplementationTask['status']
}

/**
 * Promote a TestContract to `ready`. Returns the structured
 * promotion result. When the contract is already `ready` and no
 * `command` / `test_files` / `target_files` overrides are supplied,
 * the function is a no-op and reports `task_promoted: false` (the
 * task is also left alone).
 */
export async function promoteTestContract(
  testContractId: string,
  opts: {
    command?: string
    testFiles?: string[]
    targetFiles?: string[]
  } = {},
): Promise<PromoteTestContractResult> {
  if (!testContractId || typeof testContractId !== 'string') {
    throw new Error('test-contract:promote requires --test-contract <id>')
  }
  const contracts = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
  const idx = contracts.findIndex((c) => c.test_contract_id === testContractId)
  if (idx === -1) {
    throw new Error(
      `test_contract_id ${testContractId} not found in ${TRANSFORMER_PATHS.testContracts}`,
    )
  }
  const current = contracts[idx]!
  const previousStatus = current.status
  const previousCommand = current.command
  const previousTestFiles = [...current.test_files]
  const previousTargetFiles = [...current.target_files]

  const nextCommand = opts.command && opts.command.trim().length > 0 ? opts.command : current.command
  const nextTestFiles = opts.testFiles && opts.testFiles.length > 0 ? [...new Set([...current.test_files, ...opts.testFiles])].sort() : current.test_files
  const nextTargetFiles = opts.targetFiles && opts.targetFiles.length > 0 ? [...new Set([...current.target_files, ...opts.targetFiles])].sort() : current.target_files
  const statusChanged = previousStatus !== 'ready'
  const commandChanged = nextCommand !== current.command
  const testFilesChanged = JSON.stringify(nextTestFiles) !== JSON.stringify(current.test_files)
  const targetFilesChanged = JSON.stringify(nextTargetFiles) !== JSON.stringify(current.target_files)

  if (!statusChanged && !commandChanged && !testFilesChanged && !targetFilesChanged) {
    // No-op: contract is already in the target shape.
    return {
      test_contract_id: testContractId,
      previous_status: previousStatus,
      new_status: previousStatus,
      previous_command: previousCommand,
      new_command: previousCommand,
      previous_test_files: previousTestFiles,
      new_test_files: previousTestFiles,
      previous_target_files: previousTargetFiles,
      new_target_files: previousTargetFiles,
      task_promoted: false,
      previous_task_status: 'candidate',
      new_task_status: 'candidate',
    }
  }

  const updated: TestContract = {
    ...current,
    status: 'ready',
    command: nextCommand,
    test_files: nextTestFiles,
    target_files: nextTargetFiles,
  }
  const next = [...contracts]
  next[idx] = updated
  await writeNdjson(TRANSFORMER_PATHS.testContracts, next)

  // Propagate to the parent ImplementationTask. The fail-closed
  // step in the transform pipeline downgrades a `ready` task whose
  // contract is `blocked`; once the contract is `ready`, the
  // related blocker is gone and the task can be flipped to `ready`
  // so `createPacketFromTask` will not refuse with
  // `task is stale` / `task has no allowed_files`. We only flip
  // the task when its current status is `blocked` AND its
  // blocker_ids cite the contract we just promoted; that keeps
  // the change targeted.
  let taskPromoted = false
  let previousTaskStatus: ImplementationTask['status'] = 'candidate'
  let newTaskStatus: ImplementationTask['status'] = 'candidate'
  const tasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const tIdx = tasks.findIndex((t) => t.task_id === updated.task_id)
  if (tIdx !== -1) {
    const task = tasks[tIdx]!
    previousTaskStatus = task.status
    const contractBlocker = `ready-task-with-blocked-contract:${testContractId}`
    const taskBlockedByContract = (task.blocker_ids ?? []).includes(contractBlocker)
    if (task.status === 'blocked' && taskBlockedByContract) {
      const newBlockerIds = (task.blocker_ids ?? []).filter((b) => b !== contractBlocker)
      const nextTask: ImplementationTask = {
        ...task,
        status: 'ready',
        blocker_ids: newBlockerIds,
      }
      const nextTasks = [...tasks]
      nextTasks[tIdx] = nextTask
      await writeNdjson(TRANSFORMER_PATHS.implementationTasks, nextTasks)
      taskPromoted = true
      newTaskStatus = 'ready'
    } else {
      newTaskStatus = task.status
    }
  }

  return {
    test_contract_id: testContractId,
    previous_status: previousStatus,
    new_status: 'ready',
    previous_command: previousCommand,
    new_command: nextCommand,
    previous_test_files: previousTestFiles,
    new_test_files: nextTestFiles,
    previous_target_files: previousTargetFiles,
    new_target_files: nextTargetFiles,
    task_promoted: taskPromoted,
    previous_task_status: previousTaskStatus,
    new_task_status: newTaskStatus,
  }
}

export async function runTestContractPromoteCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const testContractId = readFlag(args, '--test-contract')
    if (!testContractId) throw new Error('test-contract:promote requires --test-contract <id>')
    const command = readFlag(args, '--command')
    const testFiles = readAllFlagValues(args, '--test-file')
    const targetFiles = readAllFlagValues(args, '--target-file')
    const dryRun = args.includes('--dry-run')
    if (dryRun) {
      // Static inspection only: report the inputs and exit. The
      // operation-layer's strict invariants are not affected by a
      // dry-run because we do not touch the on-disk state.
      const result = ok(
        'executor',
        'test-contract:promote',
        {
          test_contract_id: testContractId,
          dry_run: true,
          command: command ?? null,
          test_files: testFiles,
          target_files: targetFiles,
        },
        { startedAt },
      )
      printResult(result)
      return 0
    }
    const promotion = await promoteTestContract(testContractId, {
      command,
      testFiles,
      targetFiles,
    })
    const result = ok('executor', 'test-contract:promote', {
      test_contract_id: promotion.test_contract_id,
      previous_status: promotion.previous_status,
      new_status: promotion.new_status,
      previous_command: promotion.previous_command,
      new_command: promotion.new_command,
      previous_test_files: promotion.previous_test_files,
      new_test_files: promotion.new_test_files,
      previous_target_files: promotion.previous_target_files,
      new_target_files: promotion.new_target_files,
      task_promoted: promotion.task_promoted,
      previous_task_status: promotion.previous_task_status,
      new_task_status: promotion.new_task_status,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'test-contract:promote', [
      { severity: 'P0', code: 'E_TEST_CONTRACT_PROMOTE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runTestContractPromoteCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
