import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { emitRecommendations } from '../lib/recommend.ts'

export async function runRecommendCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const recs = await emitRecommendations()
    const result = ok('transformer', 'recommend', { count: recs.length }, { startedAt })
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
