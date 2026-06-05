import { runScanCommand } from './scan.ts'
import { runIndexCommand } from './index.ts'
import { runAffectedCommand } from './affected.ts'
import { runRenderCommand } from './render.ts'

/**
 * `bun run update` command.
 *
 * Runs scan -> index -> affected in order so the user gets a fresh
 * `.atelier/v0` snapshot with affected state in one command.
 */
export async function runUpdateCommand(): Promise<number> {
  const steps: Array<() => Promise<number>> = [
    runScanCommand,
    runIndexCommand,
    runAffectedCommand,
    runRenderCommand,
  ]
  for (const step of steps) {
    const code = await step()
    if (code !== 0) return code
  }
  return 0
}

if (import.meta.main) {
  runUpdateCommand().then((code) => process.exit(code))
}
