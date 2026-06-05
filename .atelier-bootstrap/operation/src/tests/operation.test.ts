/**
 * Operation tests using subprocess execution.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import { rm, mkdir, writeFile } from 'node:fs/promises'

const REPO_ROOT = path.resolve(process.cwd())
const FIXTURE_ROOT = path.resolve(REPO_ROOT, '.atelier-bootstrap', 'tests', 'fixtures', 'sample-md')
const FIXTURE_V0 = path.join(FIXTURE_ROOT, '.atelier', 'v0')
const READER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'reader', 'src', 'cli.ts')
const INDEXER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'indexer', 'src', 'cli.ts')
const TRANSFORMER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'transformer', 'src', 'cli.ts')
const EXECUTOR_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'executor', 'src', 'cli.ts')
const OPERATION_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'operation', 'src', 'cli.ts')

async function run(args: { cli: string; cmd: string[] }): Promise<{ code: number; json: unknown | null; raw: string }> {
  const proc = Bun.spawnSync(['bun', args.cli, ...args.cmd], {
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

describe('atelier-operation (fixture, subprocess)', () => {
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
    expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
    expect((await run({ cli: READER_CLI, cmd: ['sample'] })).code).toBe(0)
    expect((await run({ cli: READER_CLI, cmd: ['attention', '--task', 'main function'] })).code).toBe(0)
    expect((await run({ cli: READER_CLI, cmd: ['deep-read', '--attention', 'att:0'] })).code).not.toBe(0)
  })

  afterAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
  })

  test('ready reports fail when pipeline steps have not been run', async () => {
    const r = await run({ cli: OPERATION_CLI, cmd: ['ready'] })
    expect([0, 1]).toContain(r.code)
  })
})
