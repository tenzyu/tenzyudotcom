import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { runReady } from '../lib/review.ts'

export async function runReadyCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const review = await runReady()
    if (review.status === 'pass') {
      const result = ok('operation', 'ready', {
        status: review.status,
        commands_run: review.commands_run.length,
        verified: review.verified_invariants.length,
      }, { startedAt })
      printResult(result)
      return 0
    }
    const result = fail('operation', 'ready', review.blocking_defects.map((d) => ({
      severity: d.severity,
      code: d.defect_id,
      message: d.reason,
      affected_record: d.affected_record,
      recommended_next_action: d.recommended_next_action,
    })), {
      status: review.status,
      commands_run: review.commands_run,
      verified: review.verified_invariants,
    }, { warnings: review.warnings, startedAt })
    printResult(result)
    return 1
  } catch (err) {
    const result = fail<unknown>('operation', 'ready', [
      { severity: 'P0', code: 'E_READY', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runReadyCommand().then((code) => process.exit(code))
}
