import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { emitRecommendationsDetailed } from '../lib/recommend.ts'

export async function runRecommendCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const r = await emitRecommendationsDetailed()
    const result = ok(
      'transformer',
      'recommend',
      {
        unique_recommendations: r.recommendations.length,
        raw_recommendation_pairs: r.raw_pair_count,
        duplicate_pairs: r.duplicates.length,
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('transformer', 'recommend', [
      { severity: 'P0', code: 'E_RECOMMEND', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runRecommendCommand().then((code) => process.exit(code))
}
