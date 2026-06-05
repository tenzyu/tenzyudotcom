import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { runRender } from '../lib/render.ts'

export async function runRenderCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const r = await runRender()
    if (r.failed === 0) {
      const result = ok('operation', 'render', r, { startedAt })
      printResult(result)
      return 0
    }
    const result = fail('operation', 'render', [{
      severity: 'P0',
      code: 'E_RENDER_STEP',
      message: `${r.failed} render steps failed`,
      recommended_next_action: 'rerun the failing render',
    }], r, { startedAt })
    printResult(result)
    return 1
  } catch (err) {
    const result = fail<unknown>('operation', 'render', [
      { severity: 'P0', code: 'E_RENDER', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runRenderCommand().then((code) => process.exit(code))
}
