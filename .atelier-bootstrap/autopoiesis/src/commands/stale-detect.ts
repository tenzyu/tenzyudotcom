/**
 * `atelier:stale:detect` command.
 *
 * Thin CLI wrapper around `lib/stale-detector.ts::runStaleDetect`.
 * The command exits 0 unconditionally (a missing semantic-nodes
 * ledger is not an error) and prints the
 * `atelier.stale-detect-result/v1` JSON envelope to stdout.
 */
import { runStaleDetect } from '../lib/stale-detector.ts'

/**
 * CLI entry: parse argv (no flags), run the detector, print the
 * JSON result, and return the process exit code.
 */
export async function runStaleDetectCommand(
  _argv: readonly string[],
): Promise<number> {
  try {
    const result = await runStaleDetect()
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    return 0
  } catch (err) {
    const fallback = {
      schema: 'atelier.stale-detect-result/v1',
      ran_at: new Date().toISOString(),
      detected: 0,
      records: [],
      scanned_nodes: 0,
      anchor_index_size: 0,
      duration_ms: 0,
      error: (err as Error).message,
    }
    process.stdout.write(JSON.stringify(fallback, null, 2) + '\n')
    return 1
  }
}

if (import.meta.main) {
  runStaleDetectCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
