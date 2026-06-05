import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { runVerify } from '../lib/verify.ts'

export async function runVerifyCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const review = await runVerify()
    if (review.status === 'pass') {
      const result = ok('operation', 'verify', {
        status: review.status,
        commands_run: review.commands_run.length,
        verified: review.verified_invariants.length,
      }, { startedAt })
      printResult(result)
      return 0
    }
    const result = fail('operation', 'verify', review.blocking_defects.map((d) => ({
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
    const result = fail<unknown>('operation', 'verify', [
      { severity: 'P0', code: 'E_VERIFY', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runVerifyCommand().then((code) => process.exit(code))
}
