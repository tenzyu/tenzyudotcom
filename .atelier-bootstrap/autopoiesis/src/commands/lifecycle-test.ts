/**
 * `atelier:lifecycle:test` command.
 *
 * Spawns `bun test` against the autopoiesis test suite and passes
 * through the exit code. The test file owns its own fixture setup
 * (a temp directory under `process.tmpdir()`); this command just
 * needs to invoke the runner.
 *
 * The command exits 0 only when every negative-control test passes.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const COMPONENT_ROOT = path.resolve(import.meta.dir, '..', '..')
const TESTS_PATH = path.join(COMPONENT_ROOT, 'src', 'tests', 'lifecycle.test.ts')

export async function runLifecycleTestCommand(): Promise<number> {
  process.stderr.write(`[atelier:lifecycle:test] running ${TESTS_PATH}\n`)
  const proc = spawnSync('bun', ['test', TESTS_PATH], {
    cwd: COMPONENT_ROOT,
    stdio: 'inherit',
  })
  return proc.status ?? 1
}

if (import.meta.main) {
  runLifecycleTestCommand().then((code) => process.exit(code))
}
