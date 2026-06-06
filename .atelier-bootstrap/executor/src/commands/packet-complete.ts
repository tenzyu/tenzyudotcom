import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { getPacket, setPacketStatus, appendLedgerEvent } from '../lib/packet.ts'
import { listEvidence, hasRuntimeProof } from '../lib/evidence.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runPacketCompleteCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const packetId = readFlag([...argv], '--packet')
    if (!packetId) throw new Error('packet:complete requires --packet <id>')
    const packet = await getPacket(packetId)
    if (!packet) throw new Error(`packet not found: ${packetId}`)
    const evidence = await listEvidence()
    const packetEvidence = evidence.filter((e) => e.packet_id === packetId)
    if (packetEvidence.length === 0) {
      throw new Error(`packet ${packetId} cannot be completed without evidence`)
    }
    // Completion requires at least one PASSED evidence record that
    // carries runtime proof (P0-003 / P0-004). Metadata-only records
    // do not satisfy this invariant.
    const passed = packetEvidence.filter((e) => e.status === 'passed')
    if (passed.length === 0) {
      throw new Error(
        `packet ${packetId} cannot be completed without at least one passed evidence record for its test contracts`,
      )
    }
    const proofs = await Promise.all(passed.map((e) => hasRuntimeProof(e)))
    if (!proofs.some((x) => x)) {
      throw new Error(
        `packet ${packetId} cannot be completed: no passed evidence carries runtime proof (raw_output_ref, file_hashes, or diff_ref)`,
      )
    }
    const next = await setPacketStatus(packetId, 'completed')
    await appendLedgerEvent({
      schema: 'atelier.run-ledger-event/v1',
      event_id: `evt:${Date.now()}`,
      created_at: new Date().toISOString(),
      event_type: 'packet_completed',
      subject_id: packetId,
      refs: [packet.task_id],
      status: 'completed',
    })
    const result = ok('executor', 'packet:complete', { packet_id: next.id, status: next.status }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'packet:complete', [
      { severity: 'P0', code: 'E_PACKET_COMPLETE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runPacketCompleteCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
