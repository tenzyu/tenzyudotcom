import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { setPacketStatus, appendLedgerEvent } from '../lib/packet.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runPacketRejectCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const packetId = readFlag([...argv], '--packet')
    if (!packetId) throw new Error('packet:reject requires --packet <id>')
    const next = await setPacketStatus(packetId, 'rejected')
    await appendLedgerEvent({
      schema: 'atelier.run-ledger-event/v1',
      event_id: `evt:${Date.now()}`,
      created_at: new Date().toISOString(),
      event_type: 'packet_rejected',
      subject_id: packetId,
      refs: [],
      status: 'rejected',
    })
    const result = ok('executor', 'packet:reject', { packet_id: next.id, status: next.status }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'packet:reject', [
      { severity: 'P0', code: 'E_PACKET_REJECT', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runPacketRejectCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
