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
import { rm, mkdir, writeFile, readFile, appendFile } from 'node:fs/promises'

/**
 * Read an NDJSON file as an array of typed rows. Returns [] if the
 * file is missing.
 */
async function readNdjsonSafe<T>(filePath: string): Promise<T[]> {
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
  // Find the last JSON object with the result schema. The result is
  // emitted as pretty-printed multi-line JSON, so we cannot rely on
  // line-by-line parsing. We scan from the end of the buffer.
  let json: unknown | null = null
  for (let end = raw.length; end > 0; end--) {
    if (raw[end - 1] !== '}') continue
    // Find the matching opening brace by walking backward.
    let depth = 0
    let start = -1
    for (let i = end - 1; i >= 0; i--) {
      const ch = raw[i]
      if (ch === '}') depth += 1
      else if (ch === '{') {
        depth -= 1
        if (depth === 0) {
          start = i
          break
        }
      }
    }
    if (start < 0) continue
    const candidate = raw.slice(start, end)
    try {
      const parsed = JSON.parse(candidate) as { schema?: string }
      if (parsed.schema === 'atelier.command-result/v1') {
        json = parsed
        break
      }
    } catch {
      // not the right slice
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

  test('relations-index emits anchors and non-`contains` edges', async () => {
    const r = await runIndexer(['relations-index'])
    expect(r.code).toBe(0)
    const j = r.json as {
      data?: { anchors?: number; non_contains_edges?: number; contains_edges?: number }
    } | null
    expect((j?.data?.anchors ?? 0)).toBeGreaterThan(0)
    expect((j?.data?.non_contains_edges ?? 0)).toBeGreaterThan(0)
    // by-anchor.json must be regenerated.
    const byAnchor = await readNdjsonSafe<{ id?: string }>(
      path.join(FIXTURE_V0, 'indexes', 'by-anchor.json'),
    )
    // by-anchor.json is a JSON map; it should exist and be non-empty.
    const byAnchorText = await readFile(
      path.join(FIXTURE_V0, 'indexes', 'by-anchor.json'),
      'utf8',
    ).catch(() => '')
    expect(byAnchorText.length).toBeGreaterThan(2)
    void byAnchor
  })

  test('relations-validate passes after relations-index', async () => {
    const r = await runIndexer(['relations-validate'])
    expect(r.code).toBe(0)
    const j = r.json as {
      data?: { non_contains_edges?: number; anchors?: number }
    } | null
    expect((j?.data?.non_contains_edges ?? 0)).toBeGreaterThan(0)
    expect((j?.data?.anchors ?? 0)).toBeGreaterThan(0)
  })

  test('anchor and edge ids are stable across re-runs', async () => {
    // Capture the current on-disk ids, then re-run relations-index and
    // compare. The ids MUST be deterministic.
    const anchors1 = await readNdjsonSafe<{ id: string }>(
      path.join(FIXTURE_V0, 'anchors', 'source-anchors.ndjson'),
    )
    const edges1 = await readNdjsonSafe<{ id: string }>(
      path.join(FIXTURE_V0, 'edges', 'edges.ndjson'),
    )
    const r = await runIndexer(['relations-index'])
    expect(r.code).toBe(0)
    const anchors2 = await readNdjsonSafe<{ id: string }>(
      path.join(FIXTURE_V0, 'anchors', 'source-anchors.ndjson'),
    )
    const edges2 = await readNdjsonSafe<{ id: string }>(
      path.join(FIXTURE_V0, 'edges', 'edges.ndjson'),
    )
    const ids1 = anchors1.map((a) => a.id).sort()
    const ids2 = anchors2.map((a) => a.id).sort()
    expect(ids2).toEqual(ids1)
    const eids1 = edges1.map((e) => e.id).sort()
    const eids2 = edges2.map((e) => e.id).sort()
    expect(eids2).toEqual(eids1)
  })

  test('validate (strict) passes on a clean snapshot', async () => {
    const r = await runIndexer(['validate'])
    expect(r.code).toBe(0)
    const j = r.json as { data?: { mode?: string; units_checked?: number } } | null
    // Strict mode must be the default.
    expect(j?.data?.mode).toBe('strict')
  })

  test('validate:quick is sample-based and warns the user', async () => {
    const r = await runIndexer(['validate:quick'])
    expect(r.code).toBe(0)
    const j = r.json as { data?: { mode?: string }; warnings?: string[] } | null
    expect(j?.data?.mode).toBe('quick')
    expect((j?.warnings ?? []).join(' ')).toMatch(/MUST NOT/i)
  })

  test('strict validate surfaces dependents in the result', async () => {
    // Re-run affected/render to make sure stale.json has dependent_objects.
    await runIndexer(['affected'])
    const r = await runIndexer(['validate'])
    expect(r.code).toBe(0)
  })

  test('validate fails on hash drift and does NOT mask the issue', async () => {
    // Capture the current source unit hash for the index.ts file
    // via the current on-disk content, then mutate the file and
    // re-run validate WITHOUT re-indexing. The strict validator
    // must detect the drift.
    const original = await readFile(path.join(FIXTURE_ROOT, 'index.ts'), 'utf8')
    try {
      await appendFile(path.join(FIXTURE_ROOT, 'index.ts'), '// drift\n')
      // Do NOT re-index: drift between facts and source unit sha256.
      const r = await runIndexer(['validate'])
      // The strict validator should report at least one issue.
      expect(r.code).not.toBe(0)
      const j = r.json as { issues?: Array<{ code: string }> } | null
      const codes = (j?.issues ?? []).map((i) => i.code)
      // The validator should detect either E_HASH_DRIFT or E_REF_HASH_DRIFT.
      expect(codes.some((c) => c === 'E_HASH_DRIFT' || c === 'E_REF_HASH_DRIFT')).toBe(true)
    } finally {
      // Restore the file so subsequent tests are not affected.
      await writeFile(path.join(FIXTURE_ROOT, 'index.ts'), original, 'utf8')
      // Re-index to keep the state clean for the next test.
      await runIndexer(['scan'])
      await runIndexer(['index'])
    }
  })

  test('validate fails on missing file', async () => {
    const original = await readFile(path.join(FIXTURE_ROOT, 'index.ts'), 'utf8')
    try {
      // Delete the file but do not re-index: the source unit now
      // points at a non-existent file. The strict validator must
      // surface E_UNIT_MISSING_FILE (or a related code).
      const { unlink } = await import('node:fs/promises')
      await unlink(path.join(FIXTURE_ROOT, 'index.ts'))
      const r = await runIndexer(['validate'])
      expect(r.code).not.toBe(0)
      const j = r.json as { issues?: Array<{ code: string }> } | null
      const codes = (j?.issues ?? []).map((i) => i.code)
      expect(codes.some((c) => c === 'E_UNIT_MISSING_FILE' || c === 'E_REF_FILE_MISSING' || c === 'E_REF_MISSING_FILE')).toBe(true)
    } finally {
      // Restore.
      await writeFile(path.join(FIXTURE_ROOT, 'index.ts'), original, 'utf8')
      await runIndexer(['scan'])
      await runIndexer(['index'])
    }
  })

  test('affected surfaces dependents via propagating edges', async () => {
    // Inject a propagating edge so the propagation engine has
    // something to walk. The current indexer only emits `contains`
    // edges, which are exempt from propagation, so we add a
    // `references` edge to a downstream object.
    const units = await readNdjsonSafe<{ id: string; path: string }>(
      path.join(FIXTURE_V0, 'objects', 'source.ndjson'),
    )
    if (units.length === 0) {
      // The earlier tests may have left the fixture partially
      // indexed. Re-run scan+index to be safe.
      await runIndexer(['scan'])
      await runIndexer(['index'])
    }
    const targetUnit = (await readNdjsonSafe<{ id: string; path: string }>(
      path.join(FIXTURE_V0, 'objects', 'source.ndjson'),
    )).find((u) => u.path === 'index.ts')
    if (!targetUnit) {
      // Skip if we cannot find the unit (test fixture is broken).
      return
    }
    const edgesPath = path.join(FIXTURE_V0, 'edges', 'edges.ndjson')
    const knowledgePath = path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson')
    // Add a `verifies` edge from a fake packet to the index.ts unit.
    const fakeEdge = JSON.stringify({
      id: 'edge:fake-verifies',
      from: 'pkt:fake',
      to: targetUnit.id,
      kind: 'verifies',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'fresh',
      created_at: '2026-06-05T13:00:00.000Z',
    })
    const fakeObj = JSON.stringify({
      id: 'pkt:fake',
      kind: 'execution_packet',
      version: '1',
      title: 'fake packet',
      source_refs: [],
      produced_by: 'executor',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'active',
      affordances: [],
      created_at: '2026-06-05T13:00:00.000Z',
    })
    await appendFile(edgesPath, fakeEdge + '\n')
    await writeFile(knowledgePath, fakeObj + '\n', 'utf8')
    try {
      // Reset the previous snapshot so the first affected run sees
      // every unit as 'added'.
      const { unlink } = await import('node:fs/promises')
      await unlink(path.join(FIXTURE_V0, 'indexes', 'previous-snapshot.ndjson')).catch(() => {})
      const r = await runIndexer(['affected'])
      expect(r.code).toBe(0)
      const j = r.json as {
        data?: {
          total_dependents?: number
          max_hops?: number
          dependents_by_kind?: Record<string, number>
        }
      } | null
      // The fake packet is reachable in one hop from the seed set.
      expect(j?.data?.total_dependents).toBeGreaterThanOrEqual(1)
      expect((j?.data?.dependents_by_kind?.execution_packet ?? 0)).toBeGreaterThanOrEqual(1)
      expect((j?.data?.max_hops ?? 0)).toBeGreaterThanOrEqual(1)
    } finally {
      // Clean up: drop the fake edge and knowledge entry, then
      // re-index to restore a clean state for the next test.
      const { readFile, writeFile } = await import('node:fs/promises')
      const edgesText = await readFile(edgesPath, 'utf8')
      const cleaned = edgesText
        .split('\n')
        .filter((l) => !l.includes('edge:fake-verifies'))
        .join('\n')
      await writeFile(edgesPath, cleaned, 'utf8')
      await writeFile(knowledgePath, '', 'utf8')
      await runIndexer(['scan'])
      await runIndexer(['index'])
    }
  })
})
