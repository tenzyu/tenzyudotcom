/**
 * `atelier:autopoiesis:validate` command.
 *
 * Runs `validateAutopoiesis()` and exits 0 on success, 1 on any
 * defect. The output is a JSON `AtelierResult` to stdout; the
 * evaluator and the operation layer consume it directly.
 */
import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { validateAutopoiesis } from '../lib/validate.ts'

export async function runValidateCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const r = await validateAutopoiesis()
    if (r.issues.length === 0) {
      const result = ok(
        'autopoiesis',
        'validate',
        {
          ...r.stats,
          warnings: r.warnings.length,
        },
        { warnings: r.warnings, startedAt },
      )
      printResult(result)
      return 0
    }
    const result = fail('autopoiesis', 'validate', r.issues, r.stats, {
      warnings: r.warnings,
      startedAt,
    })
    printResult(result)
    return 1
  } catch (err) {
    const result = fail<unknown>('autopoiesis', 'validate', [
      {
        severity: 'P0',
        code: 'E_VALIDATE',
        message: (err as Error).message,
      },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runValidateCommand().then((code) => process.exit(code))
}
