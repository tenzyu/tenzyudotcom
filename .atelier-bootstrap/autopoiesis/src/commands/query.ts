/**
 * `atelier:query` command.
 *
 * Runs a runtime query against the autopoiesis control plane and
 * emits a JSON `atelier.query-result/v1` payload to stdout.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/query.ts -- \
 *     --kind <kind> [--task <id>] [--scope <path>] \
 *     [--include-non-accepted] [--include-ignored]
 *
 * Supported kinds: active-requirements, accepted-decisions,
 * required-checks, permissions, open-findings, stale, conflicts,
 * evidence, recommend.
 *
 * The command exits 0 on every well-formed query, even when the
 * result set is empty. A non-existent scope is not an error — the
 * result set is empty.
 *
 * The `--include-ignored` flag is diagnostic only and is
 * meaningful for the `conflicts` kind. It re-includes
 * `ConflictRecord` records whose `conflict_policy === 'ignore'`,
 * which the resolver and the default query would suppress. When
 * the flag is in effect, the result's `warnings: []` array
 * surfaces a reconciliation warning so operators know the
 * result set differs from the resolver's view.
 */
import { isQueryKind, query, type QueryKind, type QueryOptions } from '../lib/query.ts'

export async function runQueryCommand(argv: readonly string[]): Promise<number> {
  const opts = parseArgs(argv)
  if (!opts.kind) {
    process.stderr.write(
      'atelier:query: --kind <kind> is required (one of: ' +
        'active-requirements, accepted-decisions, required-checks, permissions, ' +
        'open-findings, stale, conflicts, evidence, recommend)\n',
    )
    return 2
  }
  if (!isQueryKind(opts.kind)) {
    process.stderr.write(
      `atelier:query: unknown --kind '${opts.kind}'. Supported: ` +
        'active-requirements, accepted-decisions, required-checks, permissions, ' +
        'open-findings, stale, conflicts, evidence, recommend\n',
    )
    return 2
  }
  const result = await query(opts.kind, {
    task: opts.task,
    scope: opts.scope,
    include_non_accepted: opts.include_non_accepted,
    include_ignored: opts.include_ignored,
  } satisfies QueryOptions)
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  return 0
}

/* -------------------------------------------------------------------------- */
/*                              Argv parsing                                  */
/* -------------------------------------------------------------------------- */

function parseArgs(argv: readonly string[]): {
  kind: string | null
  task: string | undefined
  scope: string | undefined
  include_non_accepted: boolean
  include_ignored: boolean
} {
  let kind: string | null = null
  let task: string | undefined
  let scope: string | undefined
  let include_non_accepted = false
  let include_ignored = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--kind') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        kind = v
        i++
      }
    } else if (a && a.startsWith('--kind=')) {
      kind = a.slice('--kind='.length)
    } else if (a === '--task') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        task = v
        i++
      }
    } else if (a && a.startsWith('--task=')) {
      task = a.slice('--task='.length)
    } else if (a === '--scope') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        scope = v
        i++
      }
    } else if (a && a.startsWith('--scope=')) {
      scope = a.slice('--scope='.length)
    } else if (a === '--include-non-accepted' || a === '--include_non_accepted') {
      include_non_accepted = true
    } else if (a === '--include-ignored' || a === '--include_ignored') {
      include_ignored = true
    }
  }
  return { kind, task, scope, include_non_accepted, include_ignored }
}

if (import.meta.main) {
  runQueryCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
