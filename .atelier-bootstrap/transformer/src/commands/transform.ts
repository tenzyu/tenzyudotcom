import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { deriveAllTasks } from '../lib/task.ts'
import { deriveContractsForTask } from '../lib/contracts.ts'
import { derivePacketTemplate } from '../lib/packet-template.ts'
import { emitRecommendations } from '../lib/recommend.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runTransformCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const target = readFlag([...argv], '--target')
    if (target !== 'md-to-code') {
      throw new Error('transform requires --target md-to-code')
    }
    const tasks = await deriveAllTasks()
    let contracts = 0
    let templates = 0
    for (const t of tasks) {
      await deriveContractsForTask(t)
      contracts += 1
      await derivePacketTemplate(t)
      templates += 1
    }
    const recs = await emitRecommendations()
    const result = ok('transformer', 'transform', {
      target,
      tasks: tasks.length,
      contracts,
      templates,
      recommendations: recs.length,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('transformer', 'transform', [
      { severity: 'P0', code: 'E_TRANSFORM', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runTransformCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
