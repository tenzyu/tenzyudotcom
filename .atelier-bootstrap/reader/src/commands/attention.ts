import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { assembleAttention } from '../lib/attention.ts'

function readFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runAttentionCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const task = readFlag([...argv], '--task')
    if (!task) {
      throw new Error('attention requires --task "<task description>"')
    }
    const set = await assembleAttention(task)
    const result = ok('reader', 'attention', {
      id: set.id,
      selected: set.selected_object_ids.length,
      gap_status: set.gap_status,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'attention', [
      { severity: 'P0', code: 'E_ATTENTION', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runAttentionCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
