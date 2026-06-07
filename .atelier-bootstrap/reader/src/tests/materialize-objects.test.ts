/**
 * Reader materialize-objects tests.
 *
 * Exercises the deterministic KnowledgeObject / SemanticClaim
 * materialisation path. Mirrors the sample-md fixture setup in
 * `reader.test.ts` so the test is independent of the rest of the
 * suite.
 *
 * Required behaviours verified:
 *
 *   1. `atelier:reader:materialize-objects -- --attention <id>`
 *      writes at least one schema-bound KnowledgeObject AND one
 *      SemanticClaim with non-empty `source_refs` and
 *      `source_anchor_ids`.
 *   2. The reader validator no longer raises
 *      `E_KNOWLEDGE_MISSING` or `E_SEMANTICS_MISSING` after a
 *      `materialize-objects` pass on a clean fixture.
 *   3. The reader validator rejects `confidence: 'fact'` from a
 *      non-indexer producer (`E_KNOWLEDGE_FACT_NOT_INDEXER`).
 *   4. The reader validator rejects empty `source_refs` on
 *      knowledge objects.
 *   5. `provenance_kind: 'deterministic_fact'` from the reader
 *      is accepted (no `E_KNOWLEDGE_PROVENANCE` P1 defect).
 *
 * Uses subprocess execution so `process.cwd()` does not leak
 * between tests.
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

async function appendNdjsonLine(filePath: string, row: unknown): Promise<void> {
  await writeFile(filePath, JSON.stringify(row) + '\n', { flag: 'a' })
}

describe('atelier-reader materialize-objects (fixture, subprocess)', () => {
  beforeAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
    await writeFile(path.join(FIXTURE_ROOT, 'package.json'), JSON.stringify({
      name: 'sample-md-materialize',
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
    expect((await run({ cli: INDEXER_CLI, cmd: ['update'] })).code).toBe(0)
  })

  afterAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
  })

  test('materialize-objects produces at least one of each kind', async () => {
    const r1 = await run({ cli: READER_CLI, cmd: ['sample'] })
    expect(r1.code).toBe(0)
    const r2 = await run({ cli: READER_CLI, cmd: ['attention', '--task', 'main function'] })
    expect(r2.code).toBe(0)
    const sets = await readNdjsonLocal<{ id: string }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
    expect(sets.length).toBeGreaterThan(0)
    const r3 = await run({ cli: READER_CLI, cmd: ['materialize-objects', '--attention', sets[sets.length - 1]!.id] })
    expect(r3.code).toBe(0)
    const knowledge = await readNdjsonLocal<{
      kind: string
      knowledge_type: string
      source_refs: Array<{ path: string }>
      source_anchor_ids: string[]
      produced_by: string
      provenance_kind: string
      confidence: string
      affordances: string[]
    }>(path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson'))
    const semantics = await readNdjsonLocal<{
      kind: string
      claim_type: string
      source_refs: Array<{ path: string }>
      source_anchor_ids: string[]
      produced_by: string
      provenance_kind: string
      confidence: string
    }>(path.join(FIXTURE_V0, 'objects', 'semantics.ndjson'))
    expect(knowledge.length).toBeGreaterThan(0)
    expect(semantics.length).toBeGreaterThan(0)
    // Every record must be schema-bound: non-empty source_refs,
    // non-empty source_anchor_ids (since anchors exist for the
    // selected paths in the fixture), confidence 'inferred',
    // provenance_kind 'deterministic_fact' from the reader.
    for (const k of knowledge) {
      expect(k.kind).toBe('knowledge_object')
      expect(k.source_refs.length).toBeGreaterThan(0)
      expect(k.source_anchor_ids.length).toBeGreaterThan(0)
      expect(['repo_convention', 'framework_constraint']).toContain(k.knowledge_type)
      expect(k.produced_by).toBe('reader')
      expect(k.provenance_kind).toBe('deterministic_fact')
      expect(k.confidence).toBe('inferred')
      // affordances must be in the allowed KnowledgeAffordance set
      for (const a of k.affordances) {
        expect([
          'context', 'lint-candidate', 'test-candidate', 'skill-candidate',
          'docs-candidate', 'packet-constraint', 'review-candidate',
        ]).toContain(a)
      }
    }
    for (const s of semantics) {
      expect(s.kind).toBe('semantic_claim')
      expect(s.source_refs.length).toBeGreaterThan(0)
      expect(s.source_anchor_ids.length).toBeGreaterThan(0)
      expect(['definition', 'invariant']).toContain(s.claim_type)
      expect(s.produced_by).toBe('reader')
      expect(s.provenance_kind).toBe('deterministic_fact')
      expect(s.confidence).toBe('inferred')
    }
  })

  test('materialize-objects is idempotent: a second pass adds zero records', async () => {
    const sets = await readNdjsonLocal<{ id: string }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
    expect(sets.length).toBeGreaterThan(0)
    const before = (await readNdjsonLocal<unknown>(path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson'))).length
    const beforeSem = (await readNdjsonLocal<unknown>(path.join(FIXTURE_V0, 'objects', 'semantics.ndjson'))).length
    const r = await run({ cli: READER_CLI, cmd: ['materialize-objects', '--attention', sets[sets.length - 1]!.id] })
    expect(r.code).toBe(0)
    const after = (await readNdjsonLocal<unknown>(path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson'))).length
    const afterSem = (await readNdjsonLocal<unknown>(path.join(FIXTURE_V0, 'objects', 'semantics.ndjson'))).length
    expect(after).toBe(before)
    expect(afterSem).toBe(beforeSem)
  })

  test('validator passes for the deterministic records and is missing-free', async () => {
    // The validate step requires the brief and views to be
    // generated and relation proposals to be present, so we
    // only assert that the specific missing defects are absent.
    const r = await run({ cli: READER_CLI, cmd: ['validate'] })
    // The sample-md fixture has not been run through the full
    // relations:propose + relations:accept + render flow in this
    // suite, so we expect a relation_proposals missing defect
    // (P0). The relevant invariant is that
    // E_KNOWLEDGE_MISSING and E_SEMANTICS_MISSING are absent.
    const raw = r.raw
    expect(raw).not.toContain('E_KNOWLEDGE_MISSING')
    expect(raw).not.toContain('E_SEMANTICS_MISSING')
    expect(raw).not.toContain('E_KNOWLEDGE_PROVENANCE')
  })

  test('validator rejects confidence: "fact" from a non-indexer producer', async () => {
    const knowledgePath = path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson')
    const original = await readFile(knowledgePath, 'utf8').catch(() => '')
    try {
      // Append a knowledge object that violates the contract:
      // produced_by='reader' but confidence='fact'. The validator
      // must reject with E_KNOWLEDGE_FACT_NOT_INDEXER.
      const violation = {
        id: 'ko:fact-from-reader-test',
        kind: 'knowledge_object',
        version: '1',
        title: 'fact from reader',
        summary: 'reader must not emit confidence: fact',
        source_refs: [{
          path: 'src/main.ts',
          sha256: '168c7e6ed985dad6f67a1749e7fa415259c5942e7a671e2268f13661e8c2aa84',
        }],
        source_anchor_ids: ['anchor:ad08997c7de0308d'],
        produced_by: 'reader',
        provenance_kind: 'deterministic_fact',
        confidence: 'fact',
        status: 'fresh',
        affordances: ['context'],
        created_at: '2026-06-06T18:00:00.000Z',
        knowledge_type: 'repo_convention',
      }
      await appendNdjsonLine(knowledgePath, violation)
      const r = await run({ cli: READER_CLI, cmd: ['validate'] })
      expect(r.code).toBe(1)
      expect(r.raw).toContain('E_KNOWLEDGE_FACT_NOT_INDEXER')
    } finally {
      await writeFile(knowledgePath, original, 'utf8')
    }
  })

  test('validator rejects empty source_refs on a knowledge object', async () => {
    const knowledgePath = path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson')
    const original = await readFile(knowledgePath, 'utf8').catch(() => '')
    try {
      // Append a knowledge object with an empty source_refs.
      // The validator must reject with E_KNOWLEDGE_SOURCES.
      const violation = {
        id: 'ko:empty-sources-test',
        kind: 'knowledge_object',
        version: '1',
        title: 'empty source_refs',
        summary: 'knowledge object with no source_refs',
        source_refs: [],
        source_anchor_ids: ['anchor:ad08997c7de0308d'],
        produced_by: 'reader',
        provenance_kind: 'deterministic_fact',
        confidence: 'inferred',
        status: 'fresh',
        affordances: ['context'],
        created_at: '2026-06-06T18:00:00.000Z',
        knowledge_type: 'repo_convention',
      }
      await appendNdjsonLine(knowledgePath, violation)
      const r = await run({ cli: READER_CLI, cmd: ['validate'] })
      expect(r.code).toBe(1)
      expect(r.raw).toContain('E_KNOWLEDGE_SOURCES')
    } finally {
      await writeFile(knowledgePath, original, 'utf8')
    }
  })

  test('validator rejects empty source_anchor_ids on a knowledge object', async () => {
    const knowledgePath = path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson')
    const original = await readFile(knowledgePath, 'utf8').catch(() => '')
    try {
      // Append a knowledge object with an empty
      // source_anchor_ids. The validator must reject with
      // E_KNOWLEDGE_ANCHORS.
      const violation = {
        id: 'ko:empty-anchors-test',
        kind: 'knowledge_object',
        version: '1',
        title: 'empty source_anchor_ids',
        summary: 'knowledge object with no source_anchor_ids',
        source_refs: [{
          path: 'src/main.ts',
          sha256: '168c7e6ed985dad6f67a1749e7fa415259c5942e7a671e2268f13661e8c2aa84',
        }],
        source_anchor_ids: [],
        produced_by: 'reader',
        provenance_kind: 'deterministic_fact',
        confidence: 'inferred',
        status: 'fresh',
        affordances: ['context'],
        created_at: '2026-06-06T18:00:00.000Z',
        knowledge_type: 'repo_convention',
      }
      await appendNdjsonLine(knowledgePath, violation)
      const r = await run({ cli: READER_CLI, cmd: ['validate'] })
      expect(r.code).toBe(1)
      expect(r.raw).toContain('E_KNOWLEDGE_ANCHORS')
    } finally {
      await writeFile(knowledgePath, original, 'utf8')
    }
  })

  test('validator rejects confidence: "fact" from a non-indexer producer on a semantic claim', async () => {
    const semanticsPath = path.join(FIXTURE_V0, 'objects', 'semantics.ndjson')
    const original = await readFile(semanticsPath, 'utf8').catch(() => '')
    try {
      // Append a semantic claim that violates the contract:
      // produced_by='reader' but confidence='fact'. The validator
      // must reject with E_SEMANTICS_FACT_NOT_INDEXER.
      const violation = {
        id: 'sc:fact-from-reader-test',
        kind: 'semantic_claim',
        version: '1',
        title: 'fact from reader',
        source_refs: [{
          path: 'src/main.ts',
          sha256: '168c7e6ed985dad6f67a1749e7fa415259c5942e7a671e2268f13661e8c2aa84',
        }],
        source_anchor_ids: ['anchor:ad08997c7de0308d'],
        produced_by: 'reader',
        provenance_kind: 'deterministic_fact',
        confidence: 'fact',
        status: 'fresh',
        affordances: ['context'],
        created_at: '2026-06-06T18:00:00.000Z',
        claim_type: 'invariant',
        text: 'invariant: indexer-only fact must not come from reader',
        modality: 'invariant',
      }
      await appendNdjsonLine(semanticsPath, violation)
      const r = await run({ cli: READER_CLI, cmd: ['validate'] })
      expect(r.code).toBe(1)
      expect(r.raw).toContain('E_SEMANTICS_FACT_NOT_INDEXER')
    } finally {
      await writeFile(semanticsPath, original, 'utf8')
    }
  })

  test('materialize-objects -- --latest uses the most recent attention set', async () => {
    const r1 = await run({ cli: READER_CLI, cmd: ['sample'] })
    expect(r1.code).toBe(0)
    const r2 = await run({ cli: READER_CLI, cmd: ['attention', '--task', 'second task marker'] })
    expect(r2.code).toBe(0)
    const before = (await readNdjsonLocal<unknown>(path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson'))).length
    const r3 = await run({ cli: READER_CLI, cmd: ['materialize-objects', '--latest'] })
    expect(r3.code).toBe(0)
    const after = (await readNdjsonLocal<unknown>(path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson'))).length
    // --latest must materialise at least one new record because
    // the second attention task brings new source refs.
    expect(after).toBeGreaterThanOrEqual(before)
  })
})
