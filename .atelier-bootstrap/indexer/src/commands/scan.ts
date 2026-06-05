import path from 'node:path'
import { writeJson, writeNdjson, ok, fail, printResult, type AtelierResult } from '../../../lib/src/index.ts'
import { scanRepo } from '../lib/scan.ts'
import { INDEXER_OUTPUT } from '../lib/paths.ts'

/**
 * `bun run scan` command.
 *
 * Walks the repository, records file metadata, and writes deterministic
 * facts to `.atelier/v0/facts/**`. Does not produce SourceUnit objects;
 * that is the index step.
 */
export async function runScanCommand(): Promise<number> {
  const root = process.cwd()
  const startedAt = new Date().toISOString()
  try {
    const scan = await scanRepo(root, { factsDir: INDEXER_OUTPUT.factsRepo.replace(/[^/]+$/, '') })
    await writeJson(INDEXER_OUTPUT.factsRepo, scan.repo)
    await writeJson(INDEXER_OUTPUT.factsPackage, scan.package)
    await writeJson(INDEXER_OUTPUT.factsScripts, scan.scripts)
    await writeJson(INDEXER_OUTPUT.factsWorkspace, scan.workspace)
    await writeJson(INDEXER_OUTPUT.factsGit, null)
    await writeNdjson(
      INDEXER_OUTPUT.factsFiles,
      scan.files.map((f) => ({
        relpath: f.relpath,
        size: f.size,
        sha256: f.sha256,
        mtime_ms: f.mtime_ms,
      })),
    )
    await writeJson(INDEXER_OUTPUT.factsExtensions, scan.extensions)
    const result = ok(
      'indexer',
      'scan',
      {
        total_files: scan.repo.total_files,
        total_bytes: scan.repo.total_bytes,
        extensions: Object.keys(scan.extensions).length,
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('indexer', 'scan', [
      {
        severity: 'P0',
        code: 'E_SCAN',
        message: (err as Error).message,
        recommended_next_action: 'check the repository path and permissions',
      },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runScanCommand().then((code) => process.exit(code))
}
