import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { renderAll } from '../lib/render.ts'
import { buildProjectBrief, persistProjectBrief } from '../lib/sample.ts'

export async function runBriefCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const brief = await buildProjectBrief(process.cwd())
    await persistProjectBrief(brief)
    const rendered = await renderAll()
    const result = ok('reader', 'brief', { brief: brief.status, views: rendered.files }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'brief', [
      { severity: 'P0', code: 'E_BRIEF', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runBriefCommand().then((code) => process.exit(code))
}
