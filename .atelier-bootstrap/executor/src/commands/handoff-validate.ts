import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { validateHandoffFile } from '../lib/evidence.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runHandoffValidateCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const file = readFlag([...argv], '--file')
    const packetId = readFlag([...argv], '--packet')
    if (!file) throw new Error('handoff:validate requires --file <path>')
    if (!packetId) throw new Error('handoff:validate requires --packet <id>')
    const v = await validateHandoffFile(file, packetId)
    if (v.ok) {
      const result = ok('executor', 'handoff:validate', { ok: true, file, packet_id: packetId }, { startedAt })
      printResult(result)
      return 0
    }
    const result = fail<{ ok: false }>('executor', 'handoff:validate', v.errors.map((e) => ({
      severity: 'P0' as const,
      code: 'E_HANDOFF',
      message: e,
      affected_record: file,
    })), { ok: false }, { startedAt })
    printResult(result)
    return 1
  } catch (err) {
    const result = fail<unknown>('executor', 'handoff:validate', [
      { severity: 'P0', code: 'E_HANDOFF_VALIDATE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runHandoffValidateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
