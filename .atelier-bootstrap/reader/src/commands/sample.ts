import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { buildProjectBrief, persistProjectBrief } from '../lib/sample.ts'

export async function runSampleCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const brief = await buildProjectBrief(process.cwd())
    if (brief.status !== 'hypothesis') {
      throw new Error('reader sample must produce hypothesis-only brief')
    }
    const out = await persistProjectBrief(brief)
    const result = ok('reader', 'sample', {
      brief_status: brief.status,
      observed_facts: brief.observed_facts.length,
      hypotheses: brief.hypotheses.length,
      paths: out,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'sample', [
      { severity: 'P0', code: 'E_SAMPLE', message: (err as Error).message, recommended_next_action: 'run the indexer first' },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runSampleCommand().then((code) => process.exit(code))
}
