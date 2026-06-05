import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { computeAffected } from '../lib/affected.ts'

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
