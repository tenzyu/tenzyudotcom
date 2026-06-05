import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { listTasks } from '../lib/contracts.ts'
import { derivePacketTemplate } from '../lib/packet-template.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runPacketTemplateCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const taskId = readFlag([...argv], '--task')
    if (!taskId) throw new Error('packet:template requires --task <id>')
    const tasks = await listTasks()
    const task = tasks.find((t) => t.task_id === taskId)
    if (!task) throw new Error(`task not found: ${taskId}`)
    const template = await derivePacketTemplate(task)
    const result = ok('transformer', 'packet:template', { id: template.id, status: template.status }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('transformer', 'packet:template', [
      { severity: 'P0', code: 'E_PACKET_TEMPLATE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runPacketTemplateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
