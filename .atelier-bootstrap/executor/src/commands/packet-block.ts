import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { setPacketStatus, appendLedgerEvent } from '../lib/packet.ts'
import { recordBlocker } from '../lib/evidence.ts'
import { getPacket } from '../lib/packet.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

const SEVERITY = new Set(['P0', 'P1', 'P2'])

export async function runPacketBlockCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const packetId = readFlag(args, '--packet')
    const severity = readFlag(args, '--severity') as 'P0' | 'P1' | 'P2' | undefined
    const reason = readFlag(args, '--reason')
    const next = readFlag(args, '--next-action')
    if (!packetId) throw new Error('packet:block requires --packet <id>')
    if (!severity || !SEVERITY.has(severity)) {
      throw new Error('packet:block requires --severity P0|P1|P2')
    }
    if (!reason) throw new Error('packet:block requires --reason <text>')
    const packet = await getPacket(packetId)
    if (!packet) throw new Error(`packet not found: ${packetId}`)
    const blocker = await recordBlocker(packetId, packet.task_id, severity, reason, next ?? 'investigate')
    await setPacketStatus(packetId, 'blocked')
    await appendLedgerEvent({
      schema: 'atelier.run-ledger-event/v1',
      event_id: `evt:${Date.now()}`,
      created_at: new Date().toISOString(),
      event_type: 'packet_blocked',
      subject_id: packetId,
      refs: [blocker.id],
      status: severity,
    })
    const result = ok('executor', 'packet:block', { packet_id: packetId, blocker_id: blocker.id, severity }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'packet:block', [
      { severity: 'P0', code: 'E_PACKET_BLOCK', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runPacketBlockCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
