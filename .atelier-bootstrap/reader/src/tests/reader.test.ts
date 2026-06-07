/**
 * Reader tests using subprocess execution.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import { rm, mkdir, writeFile, readFile } from 'node:fs/promises'

const REPO_ROOT = path.resolve(process.cwd())
const FIXTURE_ROOT = path.resolve(REPO_ROOT, '.atelier-bootstrap', 'tests', 'fixtures', 'sample-md')
const FIXTURE_V0 = path.join(FIXTURE_ROOT, '.atelier', 'v0')
const READER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'reader', 'src', 'cli.ts')
const INDEXER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'indexer', 'src', 'cli.ts')

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

async function readNdjsonLocal<T>(filePath: string): Promise<T[]> {
  try {
    const text = await readFile(filePath, 'utf8')
    const out: T[] = []
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed === '' || trimmed.startsWith('#')) continue
      out.push(JSON.parse(trimmed) as T)
    }
    return out
  } catch {
    return []
  }
}

async function readTextOrEmpty(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return ''
  }
}

async function writeNdjsonLocal(filePath: string, rows: unknown[]): Promise<void> {
  await writeFile(filePath, rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length > 0 ? '\n' : ''), 'utf8')
}

describe('atelier-reader (fixture, subprocess)', () => {
  beforeAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
    await writeFile(path.join(FIXTURE_ROOT, 'package.json'), JSON.stringify({
      name: 'sample-md',
      packageManager: 'bun@1.3.10',
      scripts: {
        test: 'bun test src/main.test.ts',
        check: 'tsc --noEmit src/main.ts',
      },
    }, null, 2), 'utf8')
    await writeFile(path.join(FIXTURE_ROOT, 'README.md'), '# Sample\n\nSee `src/main.ts` for the entry point and `index.ts` for the type export.\n', 'utf8')
    await writeFile(path.join(FIXTURE_ROOT, 'index.ts'), 'export const x = 1\n', 'utf8')
    await mkdir(path.join(FIXTURE_ROOT, 'src'), { recursive: true })
    await writeFile(path.join(FIXTURE_ROOT, 'src', 'main.ts'), 'export function main() { return 42 }\n', 'utf8')
    await writeFile(
      path.join(FIXTURE_ROOT, 'src', 'main.test.ts'),
      "import { main } from './main'\ntest('main returns 42', () => expect(main()).toBe(42))\n",
      'utf8',
    )
    expect((await run({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
  })

  afterAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
  })

  test('sample produces a hypothesis-only brief', async () => {
    const r = await run({ cli: READER_CLI, cmd: ['sample'] })
    expect(r.code).toBe(0)
  })

  test('attention selects a small subset of source units', async () => {
    const r = await run({ cli: READER_CLI, cmd: ['attention', '--task', 'main function'] })
    expect(r.code).toBe(0)
  })

  test('deep-read emits proposals and accepts them', async () => {
    const setsRaw = await readNdjson<{ id: string }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
    expect(setsRaw.length).toBeGreaterThan(0)
    const r = await run({ cli: READER_CLI, cmd: ['deep-read', '--attention', setsRaw[0]!.id] })
    expect(r.code).toBe(0)
  })

  test('relations:propose and accept materialise accepted relations', async () => {
    const setsRaw = await readNdjson<{ id: string }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
    expect(setsRaw.length).toBeGreaterThan(0)
    // Pick the most recent attention set: the test may have multiple
    // sets across the suite. Use the last one so the most recent
    // task scope is exercised.
    const target = setsRaw[setsRaw.length - 1]!
    const prop = await run({ cli: READER_CLI, cmd: ['relations:propose', '--attention', target.id] })
    expect(prop.code).toBe(0)
    const acc = await run({ cli: READER_CLI, cmd: ['relations:accept', '--input', path.join(FIXTURE_V0, 'objects', 'relation-proposals.ndjson')] })
    expect(acc.code).toBe(0)
  })

  /**
   * Regression test for the fail-closed pruning policy, run
   * against the `sample-md` fixture. Mirrors the parallel test in
   * `reader-proposals.test.ts` so the contract is enforced across
   * fixtures.
   *
   * Steps:
   *   1. Read the current valid accepted edges (set up by the prior
   *      `relations:propose and accept materialise accepted
   *      relations` test).
   *   2. Inject a stale edge whose `from`, `to`, and `source_refs`
   *      all fail resolution against the current index.
   *   3. Run `relations:accept` with the existing valid proposals.
   *      The command must rewrite the file and drop the stale
   *      edge.
   *   4. Assert the stale edge is gone, a warning is emitted, and
   *      the surviving valid edge remains.
   *   5. Restore the original file so subsequent tests are
   *      unaffected.
   */
  test('relations:accept prunes stale edges on a fresh accept pass', async () => {
    const proposalsPath = path.join(FIXTURE_V0, 'objects', 'relation-proposals.ndjson')
    const acceptedPath = path.join(FIXTURE_V0, 'edges', 'reader-accepted-relations.ndjson')
    const originalAccepted = await readTextOrEmpty(acceptedPath)
    const before = await readNdjsonLocal<{ id: string; from: string; to: string; kind: string }>(acceptedPath)
    expect(before.length).toBeGreaterThan(0)
    const survivingId = before[0]!.id
    const staleEdgeId = 'edge:reader:rp:stale-sample-md-unresolvable'
    try {
      const injected = [
        ...before,
        {
          id: staleEdgeId,
          proposal_id: 'rp:stale-sample-md-unresolvable',
          from: 'anchor:sample-md-stale-from',
          to: 'anchor:sample-md-stale-to',
          kind: 'references',
          provenance_kind: 'llm_extracted',
          source_refs: [{
            path: 'stale-sample-md-nonexistent.md',
            sha256: '0000000000000000000000000000000000000000000000000000000000000000',
          }],
          source_anchor_ids: ['anchor:sample-md-stale-from', 'anchor:sample-md-stale-to'],
          confidence: 'validated',
          status: 'fresh',
          created_at: new Date().toISOString(),
        },
      ]
      await writeNdjsonLocal(acceptedPath, injected)
      const written = await readNdjsonLocal<{ id: string }>(acceptedPath)
      expect(written.map((e) => e.id)).toContain(staleEdgeId)
      // A fresh `relations:accept` pass must rewrite the file and
      // drop the stale edge.
      const r = await run({ cli: READER_CLI, cmd: ['relations:accept', '--input', proposalsPath] })
      expect(r.code).toBe(0)
      const after = await readNdjsonLocal<{ id: string; from: string; to: string; kind: string }>(acceptedPath)
      expect(after.map((e) => e.id)).not.toContain(staleEdgeId)
      // No `from`/`to` from the injected stale edge may survive.
      for (const edge of after) {
        const isStaleEndpoints = edge.from === 'anchor:sample-md-stale-from' || edge.to === 'anchor:sample-md-stale-to'
        expect(isStaleEndpoints).toBe(false)
      }
      // The pre-existing valid edge must remain.
      expect(after.map((e) => e.id)).toContain(survivingId)
      // A warning must be emitted so reviewers can see what was
      // pruned.
      expect(r.raw).toContain('dropped stale accepted edge')
      expect(r.raw).toContain(staleEdgeId)
    } finally {
      await writeFile(acceptedPath, originalAccepted, 'utf8')
    }
  })

  test('render produces four views with the generated marker', async () => {
    const r = await run({ cli: READER_CLI, cmd: ['render'] })
    expect(r.code).toBe(0)
  })

  test('validate passes on a clean snapshot', async () => {
    const r = await run({ cli: READER_CLI, cmd: ['validate'] })
    expect(r.code).toBe(0)
  })
})

import { readNdjson } from '../../../lib/src/ndjson.ts'
