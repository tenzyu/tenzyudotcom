import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { addEvidence } from '../lib/evidence.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

const ALLOWED = new Set(['passed', 'failed', 'skipped', 'blocked', 'unknown'])

export async function runEvidenceAddCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date()
  const startedAtIso = startedAt.toISOString()
  try {
    const args = [...argv]
    const packetId = readFlag(args, '--packet')
    const gateId = readFlag(args, '--gate')
    const testContractId = readFlag(args, '--test-contract')
    const taskId = readFlag(args, '--task-id')
    const status = readFlag(args, '--status') as
      | 'passed' | 'failed' | 'skipped' | 'blocked' | 'unknown' | undefined
    const command = readFlag(args, '--command')
    const rawOutputRef = readFlag(args, '--raw-output-ref')
    const diffRef = readFlag(args, '--diff-ref')
    const handoffRef = readFlag(args, '--handoff-ref')
    // file-hashes is a JSON object stringified on the command line:
    //   --file-hashes '{"path/a":"sha256:a...","path/b":"sha256:b..."}'
    const fileHashesJson = readFlag(args, '--file-hashes')
    let fileHashes: Record<string, string> | undefined
    if (fileHashesJson) {
      try {
        const parsed = JSON.parse(fileHashesJson) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          fileHashes = parsed as Record<string, string>
        } else {
          throw new Error('--file-hashes must be a JSON object of path->hash')
        }
      } catch (err) {
        throw new Error(`--file-hashes must be valid JSON object: ${(err as Error).message}`)
      }
    }
    if (!packetId) throw new Error('evidence:add requires --packet <id>')
    if (!gateId) throw new Error('evidence:add requires --gate <id>')
    if (!status || !ALLOWED.has(status)) {
      throw new Error('evidence:add requires --status passed|failed|skipped|blocked|unknown')
    }
    if (status === 'passed') {
      // CLI-level enforcement of the strict runtime-proof invariant
      // (REVIEW-LATEST.md P0-003). The same checks are also enforced
      // inside `addEvidence`, but failing fast at the CLI gives a
      // clearer error path for callers.
      const hasCommandRaw = !!command && !!rawOutputRef
      const hasHashes = !!fileHashes && Object.keys(fileHashes).length > 0
      const hasDiffHashes = !!diffRef && hasHashes
      const hasHandoff = !!handoffRef
      if (rawOutputRef && !command) {
        throw new Error('passed evidence with --raw-output-ref requires --command <cmd>')
      }
      if (!hasCommandRaw && !hasDiffHashes && !hasHandoff) {
        throw new Error(
          'passed evidence requires runtime proof: provide --command + --raw-output-ref, --diff-ref + --file-hashes, or --handoff-ref. `command` alone is not sufficient.',
        )
      }
      if (testContractId) {
        // The contract id is checked again in `addEvidence` against the
        // contract registry. CLI does not re-validate the contract here
        // to avoid duplicating the registry read; the canonical check
        // is `addEvidence`.
      } else {
        throw new Error(
          'passed evidence requires --test-contract <id> so it can be bound to a real TestContract (REVIEW-LATEST.md P0-005)',
        )
      }
    }
    const record = await addEvidence(packetId, gateId, status, {
      testContractId,
      taskId,
      command,
      rawOutputRef,
      diffRef,
      fileHashes,
      handoffRef,
    })
    const result = ok('executor', 'evidence:add', {
      evidence_id: record.evidence_id,
      status: record.status,
      test_contract_id: record.test_contract_id ?? null,
    }, { startedAt: startedAtIso })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'evidence:add', [
      { severity: 'P0', code: 'E_EVIDENCE_ADD', message: (err as Error).message },
    ], undefined, { startedAt: startedAtIso })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runEvidenceAddCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
