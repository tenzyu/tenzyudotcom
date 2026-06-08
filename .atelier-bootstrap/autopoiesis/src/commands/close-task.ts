/**
 * `atelier:closeTask` command.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/close-task.ts -- --task <id>
 *
 * Closes a task. A task is closable only when a
 * MaterializationProposal with `task_id=...`,
 * `status='validated'`, AND `lifecycle_state='accepted'` exists
 * in the materialization-proposals ledger. The command does NOT
 * mutate the implementation-tasks.ndjson file; it only emits a
 * `task_closed_ack` SemanticNode so the operational review can
 * verify the closure was gated.
 *
 * Exit codes:
 *   0  task closed (ack emitted)
 *   1  E_CLOSE_NO_VALIDATED_PROPOSAL or E_TASK_NOT_FOUND
 *   2  CLI argument error
 */
import { closeTask } from '../lib/materialize.ts'
import { ok, fail, printResult } from '../../../lib/src/index.ts'

export async function runCloseTaskCommand(argv: readonly string[]): Promise<number> {
  const opts = parseArgs(argv)
  if (!opts.task) {
    process.stderr.write('atelier:closeTask: --task <id> is required\n')
    return 2
  }
  const r = await closeTask(opts.task)
  if (r.ok) {
    const result = ok('autopoiesis', 'closeTask', r, {})
    printResult(result)
    return 0
  }
  const result = fail(
    'autopoiesis',
    'closeTask',
    [
      {
        severity: 'P0',
        code: r.code,
        message: r.message,
      },
    ],
    r,
  )
  printResult(result)
  return 1
}

function parseArgs(argv: readonly string[]): { task: string | undefined } {
  let task: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--task') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        task = v
        i++
      }
    } else if (a && a.startsWith('--task=')) {
      task = a.slice('--task='.length)
    }
  }
  return { task }
}

if (import.meta.main) {
  runCloseTaskCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
