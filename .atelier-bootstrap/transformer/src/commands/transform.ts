import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { deriveAllTasks } from '../lib/task.ts'
import { deriveAllContractsAndBoundaries } from '../lib/contracts.ts'
import { deriveAllPacketTemplates } from '../lib/packet-template.ts'
import { emitRecommendationsDetailed } from '../lib/recommend.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runTransformCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const target = readFlag([...argv], '--target')
    if (target !== 'md-to-code') {
      throw new Error('transform requires --target md-to-code')
    }
    const tasks = await deriveAllTasks()
    const { testContracts } = await deriveAllContractsAndBoundaries(tasks)
    const templates = await deriveAllPacketTemplates(tasks, testContracts)
    const recResult = await emitRecommendationsDetailed()
    const result = ok(
      'transformer',
      'transform',
      {
        target,
        tasks: tasks.length,
        contracts: testContracts.length,
        templates: templates.length,
        recommendations: recResult.recommendations.length,
        duplicates: recResult.duplicates.length,
        raw_recommendation_pairs: recResult.raw_pair_count,
        design_doc_tasks: tasks.filter((t) =>
          t.source_refs.some((r) => r.path.startsWith('harness/atelier-design-docs/')),
        ).length,
        fixture_tasks: tasks.filter((t) => t.fixture === true).length,
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('transformer', 'transform', [
      { severity: 'P0', code: 'E_TRANSFORM', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runTransformCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
