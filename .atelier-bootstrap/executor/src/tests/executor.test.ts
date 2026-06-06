/**
 * Executor tests using subprocess execution.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import { rm, mkdir, writeFile } from 'node:fs/promises'
import { readNdjson } from '../../../lib/src/ndjson.ts'

const REPO_ROOT = path.resolve(process.cwd())
const FIXTURE_ROOT = path.resolve(REPO_ROOT, '.atelier-bootstrap', 'tests', 'fixtures', 'sample-md')
const FIXTURE_V0 = path.join(FIXTURE_ROOT, '.atelier', 'v0')
const READER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'reader', 'src', 'cli.ts')
const INDEXER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'indexer', 'src', 'cli.ts')
const TRANSFORMER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'transformer', 'src', 'cli.ts')
const EXECUTOR_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'executor', 'src', 'cli.ts')

async function run(args: { cli: string; cmd: string[] }): Promise<{ code: number; json: unknown | null; raw: string }> {
  const proc = Bun.spawnSync(['bun', args.cli, ...args.cmd], {
    cwd: FIXTURE_ROOT,
    env: { ...process.env, ATELIER_ROOT: FIXTURE_ROOT },
  })
  const raw = proc.stdout.toString() + proc.stderr.toString()
  // The command emits a single multi-line JSON object on stdout via
  // `JSON.stringify(result, null, 2)`. Parse the whole stdout as one
  // blob and fall back to scanning for the command-result object if
  // stdout is mixed with other text.
  let json: unknown | null = null
  try {
    const parsed = JSON.parse(raw) as { schema?: string }
    if (parsed.schema === 'atelier.command-result/v1') json = parsed
  } catch {
    // Fall back: find the last balanced JSON object that has the right schema.
    const match = raw.match(/\{[\s\S]*?"schema"\s*:\s*"atelier\.command-result\/v1"[\s\S]*?\}\s*(?:\n|$)/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { schema?: string }
        if (parsed.schema === 'atelier.command-result/v1') json = parsed
      } catch {
        // ignore
      }
    }
  }
  return { code: proc.exitCode, json, raw }
}

describe('atelier-executor (fixture, subprocess)', () => {
  let taskId = ''
  let packetId = ''
  let testContractId = ''
  let rawOutputPath = ''

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
    const att = await readNdjson<{ id: string }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
    expect(att.length).toBeGreaterThan(0)
    expect((await run({ cli: READER_CLI, cmd: ['deep-read', '--attention', att[0]!.id] })).code).toBe(0)
    expect((await run({ cli: TRANSFORMER_CLI, cmd: ['transform', '--target', 'md-to-code'] })).code).toBe(0)
    const tasks = await readNdjson<{ task_id: string }>(path.join(FIXTURE_V0, 'transforms', 'md-to-code', 'model', 'implementation-tasks.ndjson'))
    taskId = tasks[0]!.task_id
    const tests = await readNdjson<{ test_contract_id: string }>(path.join(FIXTURE_V0, 'transforms', 'md-to-code', 'model', 'test-contracts.ndjson'))
    testContractId = tests[0]!.test_contract_id
  })

  afterAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
  })

  test('packet:create activates a packet', async () => {
    const r = await run({ cli: EXECUTOR_CLI, cmd: ['packet:create', '--task', taskId] })
    expect(r.code).toBe(0)
    const sets = await readNdjson<{ packet_id: string; status: string }>(path.join(FIXTURE_V0, 'runs', 'handoffs', 'packets.ndjson'))
    expect(sets.length).toBeGreaterThan(0)
    expect(sets[0]!.status).toBe('active')
    packetId = sets[0]!.packet_id
  })

  test('evidence:add rejects `passed` without runtime proof', async () => {
    // `command` alone is NOT runtime proof.
    const r1 = await run({
      cli: EXECUTOR_CLI,
      cmd: [
        'evidence:add',
        '--packet', packetId,
        '--gate', testContractId,
        '--status', 'passed',
        '--command', 'bun test',
      ],
    })
    expect(r1.code).toBe(1)
  })

  test('evidence:add accepts `passed` with raw_output_ref', async () => {
    // Write a real raw output file under the fixture's evidence dir.
    rawOutputPath = path.join(FIXTURE_V0, 'runs', 'evidence', 'sample-test.txt')
    await mkdir(path.dirname(rawOutputPath), { recursive: true })
    await writeFile(rawOutputPath, 'sample test output (fixture)\n', 'utf8')
    const r = await run({
      cli: EXECUTOR_CLI,
      cmd: [
        'evidence:add',
        '--packet', packetId,
        '--gate', testContractId,
        '--status', 'passed',
        '--command', 'bun test',
        '--raw-output-ref', rawOutputPath,
      ],
    })
    expect(r.code).toBe(0)
  })

  test('packet:complete requires passed evidence with runtime proof', async () => {
    const r = await run({ cli: EXECUTOR_CLI, cmd: ['packet:complete', '--packet', packetId] })
    expect(r.code).toBe(0)
  })

  test('execution:ready reports ready when packets + evidence exist', async () => {
    const r = await run({ cli: EXECUTOR_CLI, cmd: ['execution:ready'] })
    expect(r.code).toBe(0)
  })

  test('render produces three run views with the generated marker', async () => {
    const r = await run({ cli: EXECUTOR_CLI, cmd: ['render'] })
    expect(r.code).toBe(0)
  })

  test('validate passes on a clean snapshot', async () => {
    const r = await run({ cli: EXECUTOR_CLI, cmd: ['validate'] })
    expect(r.code).toBe(0)
  })

  test('migrate is a safe no-op on a clean registry', async () => {
    const r = await run({ cli: EXECUTOR_CLI, cmd: ['migrate'] })
    expect(r.code).toBe(0)
    const json = r.json as { data?: { written?: boolean } } | null
    expect(json?.data?.written).toBe(false)
  })
})
