import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { computeAffected } from '../lib/affected.ts'

/**
 * `bun run affected` command.
 *
 * Surfaces the change set AND its dependents. Reviewer must be able
 * to verify that a change to a source unit cascades through edges to
 * dependent objects/transforms/packets, not just stops at the changed
 * file.
 */
export async function runAffectedCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const map = await computeAffected()
    const result = ok(
      'indexer',
      'affected',
      {
        changed: map.changed.length,
        added: map.added.length,
        deleted: map.deleted.length,
        moved: map.moved.length,
        stale_units: map.stale_units.length,
        stale_edges: map.stale_edges.length,
        total_dependents: map.total_dependents,
        max_hops: map.max_hops,
        dependents_by_kind: Object.fromEntries(
          Object.entries(map.dependent_objects).map(([k, v]) => [k, (v as string[]).length]),
        ),
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('indexer', 'affected', [
      {
        severity: 'P0',
        code: 'E_AFFECTED',
        message: (err as Error).message,
        recommended_next_action: 'run `bun run scan && bun run index` first',
      },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runAffectedCommand().then((code) => process.exit(code))
}
