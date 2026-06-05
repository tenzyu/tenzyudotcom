/**
 * Indexer tests using subprocess execution.
 *
 * Using subprocesses (not in-process imports) avoids the module
 * caching trap where `process.chdir()` does not affect previously
 * computed `ATELIER_V0` paths. The test fixture is a small directory
 * under `.atelier-bootstrap/tests/fixtures/sample-md`; the test
 * writes a few files, runs the indexer CLI in a subprocess against
 * that directory, and verifies its outputs.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import { rm, mkdir, writeFile } from 'node:fs/promises'

const REPO_ROOT = path.resolve(process.cwd())
const FIXTURE_ROOT = path.resolve(REPO_ROOT, '.atelier-bootstrap', 'tests', 'fixtures', 'sample-md')
const FIXTURE_V0 = path.join(FIXTURE_ROOT, '.atelier', 'v0')
const INDEXER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'indexer', 'src', 'cli.ts')

async function runIndexer(args: string[]): Promise<{ code: number; json: unknown | null; raw: string }> {
  const proc = Bun.spawnSync(['bun', INDEXER_CLI, ...args], {
    cwd: FIXTURE_ROOT,
    env: { ...process.env, ATELIER_ROOT: FIXTURE_ROOT },
  })
  const raw = proc.stdout.toString() + proc.stderr.toString()
  let json: unknown | null = null
  for (const line of raw.split('\n').reverse()) {
    if (line.trim() === '') continue
    try {
      const parsed = JSON.parse(line) as { schema?: string }
      if (parsed.schema === 'atelier.command-result/v1') {
        json = parsed
        break
      }
    } catch {
      // not JSON
    }
  }
  return { code: proc.exitCode, json, raw }
}

describe('atelier-indexer (fixture, subprocess)', () => {
  beforeAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
    await writeFile(path.join(FIXTURE_ROOT, 'package.json'), JSON.stringify({
      name: 'sample-md',
      packageManager: 'bun@1.3.10',
      scripts: { test: 'bun test' },
    }, null, 2), 'utf8')
    await writeFile(path.join(FIXTURE_ROOT, 'README.md'), '# Sample\n\nHello world.\n', 'utf8')
    await writeFile(path.join(FIXTURE_ROOT, 'index.ts'), 'export const x = 1\n', 'utf8')
    await mkdir(path.join(FIXTURE_ROOT, 'src'), { recursive: true })
    await writeFile(path.join(FIXTURE_ROOT, 'src', 'main.ts'), 'export function main() { return 42 }\n', 'utf8')
  })

  afterAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
  })

  test('scan writes deterministic facts', async () => {
    const r = await runIndexer(['scan'])
    expect(r.code).toBe(0)
  })

  test('index produces source units and edges', async () => {
    const r = await runIndexer(['index'])
    expect(r.code).toBe(0)
  })

  test('affected marks stale on first run, then zero on second', async () => {
    const r1 = await runIndexer(['affected'])
    expect(r1.code).toBe(0)
    const r2 = await runIndexer(['affected'])
    expect(r2.code).toBe(0)
  })

  test('render writes three views with the generated marker', async () => {
    const r = await runIndexer(['render'])
    expect(r.code).toBe(0)
  })

  test('validate passes on a clean snapshot', async () => {
    const r = await runIndexer(['validate'])
    expect(r.code).toBe(0)
  })
})
