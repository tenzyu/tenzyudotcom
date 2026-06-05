import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { scanRepo } from '../lib/scan.ts'
import { writeIndex } from '../lib/build.ts'
import { INDEXER_OUTPUT } from '../lib/paths.ts'

/**
 * `bun run index` command.
 *
 * Reads the latest scan facts and produces SourceUnit, SourceFact,
 * SourceEdge NDJSON plus lookup indexes. Does not perform an
 * affected run; that is the `affected` command.
 */
export async function runIndexCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const scan = await scanRepo(process.cwd(), {
      factsDir: INDEXER_OUTPUT.factsRepo.replace(/[^/]+$/, ''),
    })
    const out = await writeIndex(scan)
    const result = ok('indexer', 'index', out, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('indexer', 'index', [
      {
        severity: 'P0',
        code: 'E_INDEX',
        message: (err as Error).message,
        recommended_next_action: 'rerun `bun run scan` first',
      },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runIndexCommand().then((code) => process.exit(code))
}
