import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { runTestCommand } from '../lib/evidence.ts'
import { getPacket, setPacketStatus } from '../lib/packet.ts'
import { appendLedgerEvent } from '../lib/packet.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runPacketRunCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const packetId = readFlag([...argv], '--packet')
    if (!packetId) throw new Error('packet:run requires --packet <id>')
    const evidence = await runTestCommand(packetId)
    // If the test passed, mark the packet completed (requires evidence).
    if (evidence.status === 'passed') {
      await setPacketStatus(packetId, 'completed')
      await appendLedgerEvent({
        schema: 'atelier.run-ledger-event/v1',
        event_id: `evt:${Date.now()}`,
        created_at: new Date().toISOString(),
        event_type: 'packet_completed',
        subject_id: packetId,
        refs: [evidence.evidence_id],
        status: 'completed',
      })
    } else {
      await setPacketStatus(packetId, 'blocked')
    }
    void getPacket
    const result = ok('executor', 'packet:run', {
      packet_id: packetId,
      evidence: evidence.evidence_id,
      status: evidence.status,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'packet:run', [
      { severity: 'P0', code: 'E_PACKET_RUN', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runPacketRunCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
