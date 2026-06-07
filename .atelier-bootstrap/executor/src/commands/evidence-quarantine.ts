/**
 * `atelier:evidence:quarantine` — move a top-level passed-but-broken
 * evidence file to `runs/evidence/_fixtures/` and emit a ledger event.
 *
 * The strict runtime-proof invariant and the strict test-contract
 * correspondence invariant are applied to the LIVE evidence set
 * (top-level `runs/evidence/*.json`); records under `_fixtures/` are
 * exempt. When an evidence file is mis-recorded (e.g. a
 * `status: 'passed'` record with no on-disk `raw_output_ref` or with
 * a command that does not match the referenced TestContract), the
 * supported repair is to quarantine it. The file is moved — not
 * deleted — so the operation layer's strict checks stop flagging it
 * while the original record is preserved as a fixture for future
 * analysis and test inputs.
 *
 * Usage:
 *   bun run atelier:evidence:quarantine -- --evidence <evi:id>
 *   bun run atelier:evidence:quarantine -- --all
 *
 * `--evidence` quarantines a single record by its `evidence_id`.
 * `--all` scans every top-level `.json` record and quarantines each
 * one that is quarantine-eligible. The two flags are mutually
 * exclusive.
 */
import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { quarantineEvidenceRecord, quarantineAll } from '../lib/evidence.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runEvidenceQuarantineCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const evidenceId = readFlag(args, '--evidence')
    const allFlag = args.includes('--all')
    if (!evidenceId && !allFlag) {
      throw new Error('evidence:quarantine requires either --evidence <evi:id> or --all')
    }
    if (evidenceId && allFlag) {
      throw new Error('evidence:quarantine: --evidence and --all are mutually exclusive')
    }
    if (allFlag) {
      const summary = await quarantineAll()
      const result = ok('executor', 'evidence:quarantine', {
        mode: 'all',
        scanned: summary.scanned,
        quarantined_count: summary.quarantined.length,
        quarantined: summary.quarantined,
        skipped: summary.skipped,
      }, { startedAt })
      printResult(result)
      return 0
    }
    const r = await quarantineEvidenceRecord(evidenceId!)
    const result = ok('executor', 'evidence:quarantine', r, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'evidence:quarantine', [
      { severity: 'P0', code: 'E_EVIDENCE_QUARANTINE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runEvidenceQuarantineCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
