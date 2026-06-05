import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { emitLlmJob, emitDeepReadJobForAttention, type LlmJobKind } from '../lib/llm-jobs.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

function readFlagList(args: string[], name: string): string[] {
  const out: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && i + 1 < args.length) {
      out.push(args[i + 1])
      i += 1
    }
  }
  return out
}

const ALLOWED: ReadonlySet<LlmJobKind> = new Set(['cheap-sample', 'attention', 'deep-read', 'gap-review'])

export async function runLlmJobsCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const kind = readFlag([...argv], '--kind') as LlmJobKind | undefined
    if (!kind || !ALLOWED.has(kind)) {
      throw new Error('llm:jobs requires --kind cheap-sample|attention|deep-read|gap-review')
    }
    const inputObjectIds = readFlagList([...argv], '--input-object-id')
    const attentionId = readFlag([...argv], '--attention')
    let job: Awaited<ReturnType<typeof emitLlmJob>>
    if (attentionId) {
      job = await emitDeepReadJobForAttention(attentionId)
    } else {
      job = await emitLlmJob(kind, inputObjectIds, [])
    }
    const result = ok('reader', 'llm:jobs', { job_id: job.job_id, kind: job.kind }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'llm:jobs', [
      { severity: 'P0', code: 'E_LLMJOBS', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runLlmJobsCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
