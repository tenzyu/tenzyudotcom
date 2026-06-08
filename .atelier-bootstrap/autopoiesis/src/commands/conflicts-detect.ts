/**
 * `atelier:conflicts:detect` command.
 *
 * Implements C3: "detectConflicts must be reachable via CLI;
 * ConflictRecord is a typed node family."
 *
 * The command scans the on-disk semantic-nodes ledger for
 * authority conflicts (overlapping scope + non-equal claims),
 * delegates the conflict-emission logic to
 * `lib/authority.ts::detectConflicts`, and appends each new
 * ConflictRecord to the on-disk conflict ledger. The output is
 * a JSON envelope tagged `atelier.conflicts-detect-result/v1`
 * so the evaluator and the packet:validate gate can consume it
 * directly.
 *
 * The detector is idempotent on the deterministic conflict id
 * (`conflict:<sha256[:12]>`), so re-running the command is a
 * no-op once the ledger is warm.
 */
import { detectConflicts } from '../lib/authority.ts'
import { readNdjsonAutopoiesis, appendNdjsonAutopoiesis } from '../lib/store.ts'
import { autopoiesisPaths } from '../lib/paths.ts'
import type { ConflictRecord, SemanticNode } from '../lib/records.ts'

/**
 * Result envelope returned by `runConflictsDetect()`. Mirrors the
 * shape of `StaleDetectResult` from `lib/stale-detector.ts` so
 * both detector commands expose a uniform CLI contract.
 */
export type ConflictsDetectResult = {
  schema: 'atelier.conflicts-detect-result/v1'
  ran_at: string
  /** Number of NEW ConflictRecord entries appended to the ledger. */
  detected: number
  /** The ConflictRecord list that was appended (or skipped on
   *  re-scan, when the same id already exists). */
  records: ConflictRecord[]
  scanned_nodes: number
  duration_ms: number
}

/**
 * Scan the semantic-nodes ledger, append ConflictRecord entries
 * for every overlapping scope + non-equal claims pair, and return
 * the result envelope. Idempotent on the deterministic conflict
 * id.
 */
export async function runConflictsDetect(): Promise<ConflictsDetectResult> {
  const startedAt = Date.now()
  const ranAt = new Date().toISOString()
  // Use the function form so tests that change `process.cwd()`
  // to a per-suite fixture directory read and write the fixture
  // (not the production `.atelier/v0/autopoiesis/` directory).
  const PATHS = autopoiesisPaths()
  const [nodes, existing] = await Promise.all([
    readNdjsonAutopoiesis<SemanticNode>(PATHS.semanticNodes),
    readNdjsonAutopoiesis<ConflictRecord>(PATHS.conflictRecords),
  ])
  const newConflicts = detectConflicts(nodes, existing)
  for (const c of newConflicts) {
    await appendNdjsonAutopoiesis(PATHS.conflictRecords, c)
  }
  return {
    schema: 'atelier.conflicts-detect-result/v1',
    ran_at: ranAt,
    detected: newConflicts.length,
    records: newConflicts,
    scanned_nodes: nodes.length,
    duration_ms: Date.now() - startedAt,
  }
}

/**
 * CLI entry: parse argv (currently a no-op — the command takes no
 * flags), run the detector, print the JSON result, and return
 * the process exit code. Exits 0 unconditionally; a missing
 * semantic-nodes ledger is not an error.
 */
export async function runConflictsDetectCommand(
  _argv: readonly string[],
): Promise<number> {
  try {
    const result = await runConflictsDetect()
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    return 0
  } catch (err) {
    const result: ConflictsDetectResult & { error: string } = {
      schema: 'atelier.conflicts-detect-result/v1',
      ran_at: new Date().toISOString(),
      detected: 0,
      records: [],
      scanned_nodes: 0,
      duration_ms: 0,
      error: (err as Error).message,
    }
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    return 1
  }
}

if (import.meta.main) {
  runConflictsDetectCommand(process.argv.slice(2)).then((code) =>
    process.exit(code),
  )
}
