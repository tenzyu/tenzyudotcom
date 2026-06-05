import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { renderAll } from '../lib/render.ts'

export async function runRenderCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const out = await renderAll()
    const result = ok('indexer', 'render', { views: out.files.length, files: out.files }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('indexer', 'render', [
      {
        severity: 'P0',
        code: 'E_RENDER',
        message: (err as Error).message,
        recommended_next_action: 'run `bun run scan && bun run index` first',
      },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runRenderCommand().then((code) => process.exit(code))
}
