import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { emitDeepReadProposals } from '../lib/deep-read.ts'
import { acceptProposals } from '../lib/deep-read.ts'
import { deriveRelationProposals } from '../lib/proposals.ts'

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
    // Also derive schema-bound relation proposals. Dedupe is
    // handled inside `deriveRelationProposals`. We do not
    // auto-accept the relations here; that is the explicit
    // `atelier:relations:accept` step.
    let proposalsDerived: Awaited<ReturnType<typeof deriveRelationProposals>> | null = null
    try {
      proposalsDerived = await deriveRelationProposals(attentionId)
    } catch {
      // Derivation may fail (e.g. attention set not found in the
      // proposals pass); deep-read itself remains successful
      // because it succeeded at its primary job.
    }
    const result = ok('reader', 'deep-read', {
      proposals: emitted.proposalCount,
      knowledge: accepted.knowledge.length,
      semantics: accepted.semantics.length,
      relation_proposals_total: proposalsDerived?.total ?? 0,
      relation_proposals_by_kind: proposalsDerived?.byKind ?? {},
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
