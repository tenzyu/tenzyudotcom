import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { validateIndex } from '../lib/validate.ts'

/**
 * `bun run validate` command.
 *
 * STRICT by default. This is the validator that powers operational
 * pass: it must check every unit, every source ref, and every edge.
 *
 * Pass `--quick` (or run `bun run validate:quick`) for a small-sample
 * smoke test suitable for editor use. Quick mode must NEVER be the
 * basis for `atelier:ready` or `atelier:verify` pass.
 */
export async function runValidateCommand(argv: readonly string[] = []): Promise<number> {
  const quick = argv.includes('--quick') || argv.includes('-q')
  const startedAt = new Date().toISOString()
  try {
    const r = await validateIndex({ quick })
    if (r.issues.length === 0) {
      const result = ok(
        'indexer',
        'validate',
        { ...r.stats, warnings: r.warnings.length },
        { warnings: r.warnings, startedAt },
      )
      printResult(result)
      return 0
    }
    const result = fail('indexer', 'validate', r.issues, r.stats, {
      warnings: r.warnings,
      startedAt,
    })
    printResult(result)
    return 1
  } catch (err) {
    const result = fail<unknown>('indexer', 'validate', [
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
  runValidateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
