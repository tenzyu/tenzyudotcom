import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { runTestCommand } from '../lib/evidence.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runTestRunCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const packetId = readFlag([...argv], '--packet')
    if (!packetId) throw new Error('test:run requires --packet <id>')
    const evidence = await runTestCommand(packetId)
    const result = ok('executor', 'test:run', {
      packet_id: packetId,
      evidence: evidence.evidence_id,
      status: evidence.status,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'test:run', [
      { severity: 'P0', code: 'E_TEST_RUN', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runTestRunCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
