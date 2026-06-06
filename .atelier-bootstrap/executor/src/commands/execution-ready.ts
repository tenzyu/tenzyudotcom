import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { listPackets, getDuplicatePacketStatuses } from '../lib/packet.ts'
import { listEvidence, hasRuntimeProof } from '../lib/evidence.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { TRANSFORMER_PATHS } from '../../../lib/src/index.ts'

export async function runExecutionReadyCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const packets = await listPackets()
    const evidence = await listEvidence()
    const tasks = await readNdjson<{ status: string }>(TRANSFORMER_PATHS.implementationTasks)
    const draft = tasks.filter((t) => t.status === 'draft' || t.status === 'blocked' || t.status === 'stale').length
    const issues: Array<{ severity: 'P0' | 'P1' | 'P2'; code: string; message: string; affected_record?: string; recommended_next_action?: string }> = []
    if (packets.length === 0) {
      issues.push({ severity: 'P1', code: 'E_NO_PACKETS', message: 'no packets exist', recommended_next_action: 'run packet:create' })
    }
    if (evidence.length === 0) {
      issues.push({ severity: 'P1', code: 'E_NO_EVIDENCE', message: 'no evidence has been recorded', recommended_next_action: 'run test:run or evidence:add' })
    }
    if (draft > 0) {
      issues.push({ severity: 'P2', code: 'E_DRAFT_TASKS', message: `${draft} tasks are not in ready state`, recommended_next_action: 'rerun transform' })
    }
    // Lifecycle consistency: duplicate packet ids with conflicting
    // statuses must fail execution readiness (P0-004).
    const conflicts = getDuplicatePacketStatuses(packets)
    for (const c of conflicts) {
      issues.push({
        severity: 'P0',
        code: 'E_PACKET_LIFECYCLE_CONFLICT',
        message: `packet ${c.id} has conflicting lifecycle statuses: ${c.statuses.join(', ')}`,
        affected_record: c.id,
        recommended_next_action: 'run `bun run atelier:executor:migrate` to normalize the registry',
      })
    }
    // Evidence runtime proof (P0-003): `passed` evidence without
    // raw_output_ref / diff_ref / file_hashes must fail readiness.
    for (const e of evidence) {
      if (!(await hasRuntimeProof(e))) {
        const isPassed = e.status === 'passed'
        issues.push({
          severity: 'P0',
          code: isPassed ? 'E_EVIDENCE_PASSED_NO_PROOF' : 'E_EVIDENCE_NOT_RUNTIME',
          message: isPassed
            ? `evidence ${e.evidence_id} has status 'passed' but lacks runtime proof`
            : `evidence ${e.evidence_id} lacks runtime proof`,
          affected_record: e.evidence_id,
          recommended_next_action: 'rerun the test and capture raw output, or attach a diff / file_hashes',
        })
      }
    }
    const ready = issues.length === 0
    if (ready) {
      const result = ok('executor', 'execution:ready', {
        ready: true,
        packets: packets.length,
        evidence: evidence.length,
      }, { startedAt })
      printResult(result)
      return 0
    }
    const result = fail<{ ready: false }>('executor', 'execution:ready', issues, { ready: false }, { startedAt })
    printResult(result)
    return 1
  } catch (err) {
    const result = fail<unknown>('executor', 'execution:ready', [
      { severity: 'P0', code: 'E_EXECUTION_READY', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runExecutionReadyCommand().then((code) => process.exit(code))
}
