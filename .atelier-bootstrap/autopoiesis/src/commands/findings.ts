/**
 * `atelier:autopoiesis:findings` command.
 *
 * Reads `.atelier/v0/autopoiesis/findings.ndjson` (tolerant) and
 * emits the latest findings, optionally filtered by capability.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/findings.ts [--capability <C1..C8>]
 */
import { readNdjsonAutopoiesisTolerant } from '../lib/store.ts'
import { AUTOPOIESIS_PATHS } from '../lib/paths.ts'
import type { AutopoiesisFinding } from '../lib/records.ts'
import type { AutopoiesisCapabilityId } from '../lib/evaluator.ts'

export async function runFindingsCommand(argv: readonly string[]): Promise<number> {
  const capability = parseCapability(argv)
  const { records, lineErrors } = await readNdjsonAutopoiesisTolerant<AutopoiesisFinding>(
    AUTOPOIESIS_PATHS.findings,
  )
  if (lineErrors.length > 0) {
    process.stderr.write(
      `[findings] ${lineErrors.length} corrupt line(s) in ${AUTOPOIESIS_PATHS.findings}; skipping them.\n`,
    )
  }
  const filtered = capability ? records.filter((r) => r.capability_id === capability) : records
  process.stdout.write(JSON.stringify(filtered, null, 2) + '\n')
  return 0
}

function parseCapability(argv: readonly string[]): AutopoiesisCapabilityId | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--capability') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) return v as AutopoiesisCapabilityId
    } else if (a && a.startsWith('--capability=')) {
      return a.slice('--capability='.length) as AutopoiesisCapabilityId
    }
  }
  return undefined
}

if (import.meta.main) {
  runFindingsCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
