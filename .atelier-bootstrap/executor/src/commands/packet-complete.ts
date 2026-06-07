import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { getPacket, setPacketStatus, appendLedgerEvent, listPackets, getDuplicatePacketStatuses } from '../lib/packet.ts'
import {
  listEvidence,
  hasRuntimeProof,
  evidenceSatisfiesTestContract,
  testContractCompletionBlocker,
} from '../lib/evidence.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { TRANSFORMER_PATHS, type TestContract } from '../../../lib/src/index.ts'

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
    const packets = await listPackets()
    const conflict = getDuplicatePacketStatuses(packets).find((c) => c.id === packetId)
    if (conflict) {
      throw new Error(
        `packet ${packetId} cannot be completed: conflicting lifecycle statuses ${conflict.statuses.join(', ')} across ${conflict.record_count} records`,
      )
    }
    const packet = await getPacket(packetId)
    if (!packet) throw new Error(`packet not found: ${packetId}`)
    if (packet.status === 'blocked' || packet.status === 'rejected' || packet.status === 'stale') {
      throw new Error(`packet ${packetId} cannot be completed from status '${packet.status}'`)
    }
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
    // Test-contract correspondence (REVIEW-LATEST.md P0-005). Every
    // TestContract referenced by the packet must have a PASSED
    // evidence record with runtime proof AND a contract whose
    // `status` is `ready` (not `candidate` / `blocked`).
    if (packet.test_contract_ids.length === 0) {
      throw new Error(
        `packet ${packetId} cannot be completed: no test_contract_ids on packet`,
      )
    }
    const tests = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
    for (const contractId of packet.test_contract_ids) {
      const contract = tests.find((t) => t.test_contract_id === contractId)
      if (!contract) {
        throw new Error(
          `packet ${packetId} cannot complete: test contract ${contractId} does not exist in ${TRANSFORMER_PATHS.testContracts}`,
        )
      }
      const contractBlocker = testContractCompletionBlocker(contract)
      if (contractBlocker) {
        throw new Error(`packet ${packetId} cannot complete: ${contractBlocker}`)
      }
      // Find a passed+proven evidence record bound to this contract.
      const candidates = passed.filter((e) => e.test_contract_id === contractId)
      if (candidates.length === 0) {
        throw new Error(
          `packet ${packetId} cannot complete: no passed evidence with test_contract_id ${contractId}`,
        )
      }
      const correspondence = await Promise.all(
        candidates.map((e) => evidenceSatisfiesTestContract(e, packet, contract)),
      )
      if (!correspondence.some((x) => x.ok)) {
        const reasons = correspondence
          .filter((x): x is { ok: false; reason: string } => !x.ok)
          .map((x) => x.reason)
          .join('; ')
        throw new Error(
          `packet ${packetId} cannot complete: no passed evidence with runtime proof and command correspondence for test contract ${contractId}${reasons ? ` (${reasons})` : ''}`,
        )
      }
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
