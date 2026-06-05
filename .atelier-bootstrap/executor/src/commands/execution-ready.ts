import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { listPackets } from '../lib/packet.ts'
import { listEvidence } from '../lib/evidence.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { TRANSFORMER_PATHS } from '../../../lib/src/index.ts'

export async function runExecutionReadyCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const packets = await listPackets()
    const evidence = await listEvidence()
    const tasks = await readNdjson<{ status: string }>(TRANSFORMER_PATHS.implementationTasks)
    const draft = tasks.filter((t) => t.status === 'draft' || t.status === 'blocked' || t.status === 'stale').length
    const issues: Array<{ severity: 'P0' | 'P1' | 'P2'; code: string; message: string; recommended_next_action?: string }> = []
    if (packets.length === 0) {
      issues.push({ severity: 'P1', code: 'E_NO_PACKETS', message: 'no packets exist', recommended_next_action: 'run packet:create' })
    }
    if (evidence.length === 0) {
      issues.push({ severity: 'P1', code: 'E_NO_EVIDENCE', message: 'no evidence has been recorded', recommended_next_action: 'run test:run or evidence:add' })
    }
    if (draft > 0) {
      issues.push({ severity: 'P2', code: 'E_DRAFT_TASKS', message: `${draft} tasks are not in ready state`, recommended_next_action: 'rerun transform' })
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
