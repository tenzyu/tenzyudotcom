import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { packetContext } from '../lib/packet.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runPacketContextCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const packetId = readFlag([...argv], '--packet')
    if (!packetId) throw new Error('packet:context requires --packet <id>')
    const ctx = await packetContext(packetId)
    const result = ok('executor', 'packet:context', {
      packet_id: ctx.packet.id,
      task: ctx.task.task_id,
      tests: ctx.tests.length,
      allowed_files: ctx.packet.allowed_files.length,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'packet:context', [
      { severity: 'P0', code: 'E_PACKET_CONTEXT', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runPacketContextCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
