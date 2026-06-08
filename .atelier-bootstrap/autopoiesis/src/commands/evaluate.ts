/**
 * `atelier:evaluate` command (C8 self-improvement loop).
 *
 * Runs `runEvaluate()` and writes the structured result to
 * `.atelier/v0/autopoiesis/evaluator-result.json`. Exits 0 on
 * pass, 1 on fail. Prints compact JSON to stdout.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/evaluate.ts -- --goal <ref> [--capability <C1..C8>]
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { runEvaluate, type AutopoiesisCapabilityId } from '../lib/evaluator.ts'
import { AUTOPOIESIS_PATHS } from '../lib/paths.ts'

export async function runEvaluateCommand(argv: readonly string[]): Promise<number> {
  const opts = parseArgs(argv)
  const result = await runEvaluate({
    goalRef: opts.goalRef,
    ...(opts.capability ? { capabilityFilter: opts.capability } : {}),
  })
  await mkdir(path.dirname(AUTOPOIESIS_PATHS.evaluatorResult), { recursive: true })
  await writeFile(
    AUTOPOIESIS_PATHS.evaluatorResult,
    JSON.stringify(result, null, 2),
    'utf8',
  )
  process.stdout.write(JSON.stringify(result) + '\n')
  return result.status === 'pass' ? 0 : 1
}

function parseArgs(argv: readonly string[]): { goalRef: string; capability?: AutopoiesisCapabilityId } {
  let goalRef = 'harness/atelier-autopoiesis/MISSION.md'
  let capability: AutopoiesisCapabilityId | undefined
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--goal') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        goalRef = v
        i++
      }
    } else if (a && a.startsWith('--goal=')) {
      goalRef = a.slice('--goal='.length)
    } else if (a === '--capability') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        capability = v as AutopoiesisCapabilityId
        i++
      }
    } else if (a && a.startsWith('--capability=')) {
      capability = a.slice('--capability='.length) as AutopoiesisCapabilityId
    }
  }
  return { goalRef, ...(capability ? { capability } : {}) }
}

if (import.meta.main) {
  runEvaluateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
