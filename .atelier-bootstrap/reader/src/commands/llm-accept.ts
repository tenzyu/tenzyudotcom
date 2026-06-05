import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { acceptProposals } from '../lib/deep-read.ts'

function readFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runLlmAcceptCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const input = readFlag([...argv], '--input')
    if (!input) throw new Error('llm:accept requires --input <glob>')
    const accepted = await acceptProposals(input)
    const result = ok('reader', 'llm:accept', {
      knowledge: accepted.knowledge.length,
      semantics: accepted.semantics.length,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'llm:accept', [
      { severity: 'P0', code: 'E_LLMACCEPT', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runLlmAcceptCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
