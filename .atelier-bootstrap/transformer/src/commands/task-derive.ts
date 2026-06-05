import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { deriveTask } from '../lib/task.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runTaskDeriveCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const attention = readFlag([...argv], '--attention')
    if (!attention) throw new Error('task:derive requires --attention <id>')
    const task = await deriveTask(attention)
    const result = ok('transformer', 'task:derive', { task_id: task.task_id, status: task.status }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('transformer', 'task:derive', [
      { severity: 'P0', code: 'E_TASK_DERIVE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runTaskDeriveCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
