import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { emitDeepReadProposals } from '../lib/deep-read.ts'
import { acceptProposals } from '../lib/deep-read.ts'

function readFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runDeepReadCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const attentionId = readFlag([...argv], '--attention')
    if (!attentionId) throw new Error('deep-read requires --attention <id>')
    const emitted = await emitDeepReadProposals(attentionId)
    const accepted = await acceptProposals(emitted.proposalsPath)
    const result = ok('reader', 'deep-read', {
      proposals: emitted.proposalCount,
      knowledge: accepted.knowledge.length,
      semantics: accepted.semantics.length,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'deep-read', [
      { severity: 'P0', code: 'E_DEEPREAD', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runDeepReadCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
