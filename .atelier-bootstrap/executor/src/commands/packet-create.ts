import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { createPacketFromTask } from '../lib/packet.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runPacketCreateCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const taskId = readFlag([...argv], '--task')
    if (!taskId) throw new Error('packet:create requires --task <id>')
    const packet = await createPacketFromTask(taskId)
    const result = ok('executor', 'packet:create', {
      packet_id: packet.id,
      status: packet.status,
      allowed_files: packet.allowed_files.length,
      forbidden_files: packet.forbidden_files.length,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'packet:create', [
      { severity: 'P0', code: 'E_PACKET_CREATE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runPacketCreateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
