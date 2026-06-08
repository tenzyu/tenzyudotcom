/**
 * `atelier:materialize:validate` command.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/materialize-validate.ts -- --proposal <id>
 *
 * Reads the MaterializationProposal and runs the gate
 * (see lib/materialize.ts). On success the proposal is
 * promoted to lifecycle_state='accepted' and status='validated'.
 * The validation report is appended to
 * `.atelier/v0/autopoiesis/materialization-reports.ndjson` and
 * printed to stdout.
 *
 * Exit codes:
 *   0  proposal validated and promoted
 *   1  one or more gate defects (rejected)
 *   2  CLI argument error
 */
import { validateProposal } from '../lib/materialize.ts'
import { ok, fail, printResult } from '../../../lib/src/index.ts'

/**
 * The literal task id used to resolve the smoke proposal. Mirrors
 * the smoke flag in `materialize-create.ts`.
 */
export const SMOKE_TASK_ID = 'task:smoke-autopoiesis'

export async function runMaterializeValidateCommand(
  argv: readonly string[],
): Promise<number> {
  const opts = parseArgs(argv)
  if (opts.smoke && !opts.proposal) {
    // Resolve the most recent proposal for the smoke task.
    opts.proposal = await resolveSmokeProposal()
  }
  if (!opts.proposal) {
    process.stderr.write('atelier:materialize:validate: --proposal <id> is required (or pass --smoke)\n')
    return 2
  }
  const r = await validateProposal(opts.proposal)
  if (r.report.status === 'validated') {
    const result = ok('autopoiesis', 'materialize:validate', r, {
      warnings: r.report.warnings,
    })
    printResult(result)
    return 0
  }
  const result = fail('autopoiesis', 'materialize:validate', r.report.defects, r, {
    warnings: r.report.warnings,
  })
  printResult(result)
  return 1
}

function parseArgs(argv: readonly string[]): { proposal: string | undefined; smoke: boolean } {
  let proposal: string | undefined
  let smoke = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--proposal') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        proposal = v
        i++
      }
    } else if (a && a.startsWith('--proposal=')) {
      proposal = a.slice('--proposal='.length)
    } else if (a === '--smoke') {
      smoke = true
    }
  }
  return { proposal, smoke }
}

/**
 * Resolve the most recent MaterializationProposal for the smoke
 * task. Returns `undefined` when no proposal exists.
 */
async function resolveSmokeProposal(): Promise<string | undefined> {
  const { readNdjsonAutopoiesis } = await import('../lib/store.ts')
  const { AUTOPOIESIS_PATHS } = await import('../lib/paths.ts')
  const proposals = await readNdjsonAutopoiesis<{ id: string; task_id: string; created_at: string }>(
    AUTOPOIESIS_PATHS.materializationProposals,
  )
  const filtered = proposals.filter((p) => p.task_id === SMOKE_TASK_ID)
  if (filtered.length === 0) return undefined
  // Most recent first.
  filtered.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  return filtered[0]?.id
}

if (import.meta.main) {
  runMaterializeValidateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
