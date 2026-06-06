import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { addEvidence } from '../lib/evidence.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

const ALLOWED = new Set(['passed', 'failed', 'skipped', 'blocked', 'unknown'])

export async function runEvidenceAddCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const packetId = readFlag(args, '--packet')
    const gateId = readFlag(args, '--gate')
    const status = readFlag(args, '--status') as
      | 'passed' | 'failed' | 'skipped' | 'blocked' | 'unknown' | undefined
    const command = readFlag(args, '--command')
    const rawOutputRef = readFlag(args, '--raw-output-ref')
    const diffRef = readFlag(args, '--diff-ref')
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
    const record = await addEvidence(packetId, gateId, status, {
      command,
      rawOutputRef,
      diffRef,
      fileHashes,
    })
    const result = ok('executor', 'evidence:add', {
      evidence_id: record.evidence_id,
      status: record.status,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'evidence:add', [
      { severity: 'P0', code: 'E_EVIDENCE_ADD', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runEvidenceAddCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
