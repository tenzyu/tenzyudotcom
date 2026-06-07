/**
 * `atelier:packet:downgrade` — move a packet from `completed` (or any
 * other state) to `rejected` or `blocked` and emit a ledger event.
 *
 * The strict packet/evidence correspondence invariant
 * (REVIEW-LATEST.md P0-005) refuses a `completed` packet that has no
 * passed+proven evidence mapped to one of its `test_contract_ids`.
 * When the underlying evidence is broken — for example, a legacy
 * evidence file pointing at a non-existent `raw_output_ref` — the
 * supported repair is to downgrade the packet so it is no longer in
 * the `completed` state. The `checkEvidenceInvariant` and
 * `checkPacketLifecycleInvariant` checks both skip non-`completed`
 * packets, so the strict invariants no longer fire on the broken
 * evidence mapping.
 *
 * `packet:reject` is a thin wrapper around `setPacketStatus` that
 * always sets `status='rejected'`. `packet:downgrade` is its
 * generalisation: it accepts `--status rejected|blocked` and applies
 * the same lifecycle bookkeeping (append a `packet_rejected` /
 * `packet_blocked` event to the run ledger).
 *
 * Usage:
 *   bun run atelier:packet:downgrade -- --packet <pkt:id> --status rejected
 *   bun run atelier:packet:downgrade -- --packet <pkt:id> --status blocked
 */
import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { setPacketStatus, appendLedgerEvent, getPacket } from '../lib/packet.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

const ALLOWED_STATUSES = new Set(['rejected', 'blocked'])

export async function runPacketDowngradeCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const packetId = readFlag(args, '--packet')
    const status = readFlag(args, '--status')
    if (!packetId) throw new Error('packet:downgrade requires --packet <id>')
    if (!status || !ALLOWED_STATUSES.has(status)) {
      throw new Error('packet:downgrade requires --status rejected|blocked')
    }
    const existing = await getPacket(packetId)
    if (!existing) throw new Error(`packet not found: ${packetId}`)
    if (existing.status === status) {
      // Idempotent: the packet is already in the requested state.
      const result = ok('executor', 'packet:downgrade', {
        packet_id: packetId,
        status,
        changed: false,
        from_status: existing.status,
      }, { startedAt })
      printResult(result)
      return 0
    }
    const next = await setPacketStatus(packetId, status as 'rejected' | 'blocked')
    const eventType = status === 'rejected' ? 'packet_rejected' : 'packet_blocked'
    await appendLedgerEvent({
      schema: 'atelier.run-ledger-event/v1',
      event_id: `evt:${Date.now()}`,
      created_at: new Date().toISOString(),
      event_type: eventType,
      subject_id: packetId,
      refs: [],
      status,
    })
    const result = ok('executor', 'packet:downgrade', {
      packet_id: next.id,
      status: next.status,
      changed: true,
      from_status: existing.status,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'packet:downgrade', [
      { severity: 'P0', code: 'E_PACKET_DOWNGRADE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runPacketDowngradeCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
