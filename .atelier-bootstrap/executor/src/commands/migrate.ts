import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { migratePacketsRegistry } from '../lib/packet.ts'

/**
 * One-shot migration that normalizes the packets registry.
 *
 * Reads `.atelier/v0/runs/handoffs/packets.ndjson`, reduces duplicate
 * packet ids to a single current record (last-write-wins by
 * `created_at`), and writes the result back ONCE. This is the
 * supported way to clear the legacy `pkt:8d402e5e069cc51f` conflict
 * flagged in REVIEW-LATEST.md (P0-004).
 *
 * The migration is idempotent: running it on an already-normalized
 * registry is a no-op and reports `written: false`.
 */
export async function runMigrateCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const result = await migratePacketsRegistry()
    const out = ok<typeof result>('executor', 'migrate', result, { startedAt })
    printResult(out)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'migrate', [
      { severity: 'P0', code: 'E_MIGRATE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runMigrateCommand().then((code) => process.exit(code))
}
