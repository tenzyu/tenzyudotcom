import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { validateExecutor } from '../lib/render.ts'

export async function runValidateCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const r = await validateExecutor()
    if (r.issues.length === 0) {
      const result = ok('executor', 'validate', { ...(r.stats as object), warnings: r.warnings.length }, { warnings: r.warnings, startedAt })
      printResult(result)
      return 0
    }
    const result = fail('executor', 'validate', r.issues, r.stats, { warnings: r.warnings, startedAt })
    printResult(result)
    return 1
  } catch (err) {
    const result = fail<unknown>('executor', 'validate', [
      { severity: 'P0', code: 'E_VALIDATE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runValidateCommand().then((code) => process.exit(code))
}
