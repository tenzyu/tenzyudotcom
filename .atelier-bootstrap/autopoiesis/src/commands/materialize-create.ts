/**
 * `atelier:materialize:create` command.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/materialize-create.ts -- --task <id> --diff <ref>
 *
 * Builds a `MaterializationProposal` (atelier.materialization-proposal/v1)
 * and persists it to
 * `.atelier/v0/autopoiesis/materialization-proposals.ndjson`.
 *
 * Exit codes:
 *   0  proposal generated and persisted
 *   1  E_TASK_NOT_FOUND
 *   2  CLI argument error
 */
import { createProposal } from '../lib/materialize.ts'

/**
 * The literal task id and diff ref used by the `--smoke` flag.
 * Mirrors `packet-create.ts` so the same fixture is exercised.
 */
export const SMOKE_TASK_ID = 'task:smoke-autopoiesis'
export const SMOKE_DIFF_REF = 'd:smoke'

export async function runMaterializeCreateCommand(
  argv: readonly string[],
): Promise<number> {
  const opts = parseArgs(argv)
  if (opts.smoke) {
    opts.task = opts.task ?? SMOKE_TASK_ID
    opts.diff = opts.diff ?? SMOKE_DIFF_REF
  }
  if (!opts.task) {
    process.stderr.write('atelier:materialize:create: --task <id> is required (or pass --smoke)\n')
    return 2
  }
  if (!opts.diff) {
    process.stderr.write('atelier:materialize:create: --diff <ref> is required (or pass --smoke)\n')
    return 2
  }
  const r = await createProposal(opts.task, { taskId: opts.task, diffRef: opts.diff })
  if (!r.ok) {
    const payload = {
      schema: 'atelier.command-result/v1',
      status: 'fail' as const,
      component: 'autopoiesis',
      command: 'materialize:create',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: 0,
      data: {},
      issues: [
        {
          severity: 'P0' as const,
          code: r.code,
          message: r.message,
        },
      ],
      warnings: [],
    }
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n')
    return 1
  }
  process.stdout.write(JSON.stringify(r.proposal, null, 2) + '\n')
  return 0
}

function parseArgs(argv: readonly string[]): {
  task: string | undefined
  diff: string | undefined
  smoke: boolean
} {
  let task: string | undefined
  let diff: string | undefined
  let smoke = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--task') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        task = v
        i++
      }
    } else if (a && a.startsWith('--task=')) {
      task = a.slice('--task='.length)
    } else if (a === '--diff') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        diff = v
        i++
      }
    } else if (a && a.startsWith('--diff=')) {
      diff = a.slice('--diff='.length)
    } else if (a === '--smoke') {
      smoke = true
    }
  }
  return { task, diff, smoke }
}

if (import.meta.main) {
  runMaterializeCreateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
