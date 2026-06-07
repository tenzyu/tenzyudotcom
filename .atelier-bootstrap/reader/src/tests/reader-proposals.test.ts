/**
 * Reader proposal tests.
 *
 * Exercises the deterministic proposal derivation path:
 *
 *   - a fixture repo with one `foo.ts`, one `foo.test.ts`, and a
 *     `package.json` whose `test` script points at `foo.test.ts`;
 *   - the indexer is run on the fixture;
 *   - the reader assembles an attention set, derives proposals, and
 *     asserts that:
 *       * at least one `verifies` proposal is produced (the test
 *         file's path matches the target file's basename);
 *       * at least one `supports` proposal is produced (the
 *         `test` script's argument resolves to a real source
 *         unit);
 *       * every proposal has non-empty `source_anchor_ids`;
 *       * no `contains` proposal is emitted.
 *
 * Uses subprocess execution so `process.cwd()` does not leak
 * between tests.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import { appendFile, rm, mkdir, writeFile, readFile } from 'node:fs/promises'

const REPO_ROOT = path.resolve(process.cwd())
const FIXTURE_ROOT = path.resolve(REPO_ROOT, '.atelier-bootstrap', 'tests', 'fixtures', 'reader-proposals')
const FIXTURE_V0 = path.join(FIXTURE_ROOT, '.atelier', 'v0')
const READER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'reader', 'src', 'cli.ts')
const INDEXER_CLI = path.join(REPO_ROOT, '.atelier-bootstrap', 'indexer', 'src', 'cli.ts')

async function runCli(args: { cli: string; cmd: string[] }): Promise<{ code: number; json: unknown | null; raw: string }> {
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

describe('atelier-reader relation proposals (fixture, subprocess)', () => {
  beforeAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
    await rm(path.join(FIXTURE_ROOT, 'node_modules'), { recursive: true, force: true })
    await rm(path.join(FIXTURE_ROOT, 'dist'), { recursive: true, force: true })
    await writeFile(path.join(FIXTURE_ROOT, 'package.json'), JSON.stringify({
      name: 'reader-proposals-fixture',
      packageManager: 'bun@1.3.10',
      scripts: {
        test: 'vitest run src/foo.test.ts',
        build: 'tsc src/foo.ts',
      },
    }, null, 2), 'utf8')
    await writeFile(path.join(FIXTURE_ROOT, 'README.md'), '# Reader proposals fixture\n', 'utf8')
    await mkdir(path.join(FIXTURE_ROOT, 'src'), { recursive: true })
    await writeFile(path.join(FIXTURE_ROOT, 'src', 'foo.ts'), 'export function foo() { return 42 }\n', 'utf8')
    await writeFile(
      path.join(FIXTURE_ROOT, 'src', 'foo.test.ts'),
      "import { foo } from './foo'\ntest('foo returns 42', () => expect(foo()).toBe(42))\n",
      'utf8',
    )
    // Add a build-artifact directory the validator should ignore.
    await mkdir(path.join(FIXTURE_ROOT, 'target', 'debug'), { recursive: true })
    await writeFile(
      path.join(FIXTURE_ROOT, 'target', 'debug', 'artifact.rmeta'),
      'FAKE RUST METADATA\n',
      'utf8',
    )
    expect((await runCli({ cli: INDEXER_CLI, cmd: ['index'] })).code).toBe(0)
    // Simulate a stale indexer snapshot that still contains a default-excluded
    // OpenCode source unit. Reader attention must ignore it even if present.
    await appendFile(path.join(FIXTURE_V0, 'objects', 'source.ndjson'), `${JSON.stringify({
      id: 'src:stale-opencode-fixture',
      kind: 'source_unit',
      version: '1',
      title: '.opencode/skills/local/SKILL.md',
      body_ref: '.opencode/skills/local/SKILL.md',
      source_refs: [{ path: '.opencode/skills/local/SKILL.md', sha256: 'stale-opencode-sha' }],
      produced_by: 'indexer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'fresh',
      affordances: ['index'],
      created_at: new Date().toISOString(),
      unit_type: 'markdown_section',
      path: '.opencode/skills/local/SKILL.md',
      language: 'markdown',
      sha256: 'stale-opencode-sha',
      byte_size: 100,
    })}\n`, 'utf8')
  })

  afterAll(async () => {
    await rm(FIXTURE_V0, { recursive: true, force: true })
    await rm(path.join(FIXTURE_ROOT, 'node_modules'), { recursive: true, force: true })
    await rm(path.join(FIXTURE_ROOT, 'dist'), { recursive: true, force: true })
    await rm(path.join(FIXTURE_ROOT, 'target'), { recursive: true, force: true })
  })

  test('sample produces a hypothesis-only brief', async () => {
    const r = await runCli({ cli: READER_CLI, cmd: ['sample'] })
    expect(r.code).toBe(0)
  })

  test('attention set exists for the fixture task', async () => {
    const r = await runCli({ cli: READER_CLI, cmd: ['attention', '--task', 'foo test verifier'] })
    expect(r.code).toBe(0)
    const sets = await readNdjsonLocal<{
      selected_source_refs: Array<{ path: string }>
      selected_object_ids: string[]
      selected_anchor_ids: string[]
      gap_status: string
    }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
    expect(sets.length).toBeGreaterThan(0)
    const latest = sets[sets.length - 1]!
    expect(latest.gap_status).toBe('sufficient')
    expect(latest.selected_object_ids.length).toBeGreaterThan(0)
    expect(latest.selected_anchor_ids.length).toBeGreaterThan(0)
    for (const ref of latest.selected_source_refs) {
      expect(ref.path.startsWith('.opencode/')).toBe(false)
      expect(ref.path.includes('/target/')).toBe(false)
    }
  })

  test('relations:propose emits verifies and supports proposals', async () => {
    const sets = await readNdjsonLocal<{ id: string }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
    expect(sets.length).toBeGreaterThan(0)
    const r = await runCli({ cli: READER_CLI, cmd: ['relations:propose', '--attention', sets[0]!.id] })
    expect(r.code).toBe(0)
    const proposals = await readNdjsonLocal<{
      schema: string
      proposed_relation: { kind: string; from: string; to: string }
      source_anchor_ids: string[]
      source_refs: Array<{ path: string }>
      confidence: string
      status: string
    }>(path.join(FIXTURE_V0, 'objects', 'relation-proposals.ndjson'))
    expect(proposals.length).toBeGreaterThan(0)
    const kinds = new Set(proposals.map((p) => p.proposed_relation.kind))
    expect(kinds.has('verifies')).toBe(true)
    expect(kinds.has('supports')).toBe(true)
    // No `contains` from the reader.
    expect(kinds.has('contains')).toBe(false)
    // Every proposal must have a non-empty source_anchor_ids.
    for (const p of proposals) {
      expect(p.schema).toBe('atelier.relation-proposal/v1')
      expect(p.confidence === 'hypothesis' || p.confidence === 'inferred').toBe(true)
      expect(p.status).toBe('proposed')
      expect(p.proposed_relation.from.startsWith('anchor:')).toBe(true)
      expect(p.proposed_relation.to.startsWith('anchor:')).toBe(true)
      expect(p.source_anchor_ids.length).toBeGreaterThan(0)
      for (const id of p.source_anchor_ids) expect(id.startsWith('anchor:')).toBe(true)
      for (const ref of p.source_refs) {
        expect(ref.path.startsWith('.opencode/')).toBe(false)
        expect(ref.path.includes('/target/')).toBe(false)
      }
    }
  })

  test('deep-read emits schema-bound knowledge and semantic records', async () => {
    const sets = await readNdjsonLocal<{ id: string }>(path.join(FIXTURE_V0, 'objects', 'attention.ndjson'))
    expect(sets.length).toBeGreaterThan(0)
    const r = await runCli({ cli: READER_CLI, cmd: ['deep-read', '--attention', sets[0]!.id] })
    expect(r.code).toBe(0)
    const knowledge = await readNdjsonLocal<{ kind: string; source_anchor_ids: string[]; source_refs: unknown[] }>(path.join(FIXTURE_V0, 'objects', 'knowledge.ndjson'))
    const semantics = await readNdjsonLocal<{ kind: string; source_anchor_ids: string[]; source_refs: unknown[] }>(path.join(FIXTURE_V0, 'objects', 'semantics.ndjson'))
    expect(knowledge.length).toBeGreaterThan(0)
    expect(semantics.length).toBeGreaterThan(0)
    for (const k of knowledge) {
      expect(k.kind).toBe('knowledge_object')
      expect(k.source_refs.length).toBeGreaterThan(0)
      expect(k.source_anchor_ids.length).toBeGreaterThan(0)
    }
    for (const s of semantics) {
      expect(s.kind).toBe('semantic_claim')
      expect(s.source_refs.length).toBeGreaterThan(0)
      expect(s.source_anchor_ids.length).toBeGreaterThan(0)
    }
  })

  test('relations:accept rejects stale and default-excluded proposals', async () => {
    const before = await readNdjsonLocal<{ id: string }>(path.join(FIXTURE_V0, 'edges', 'reader-accepted-relations.ndjson'))
    const badPath = path.join(FIXTURE_V0, 'objects', 'bad-relation-proposals.ndjson')
    await writeNdjsonLocal(badPath, [{
      schema: 'atelier.relation-proposal/v1',
      proposal_id: 'rp:bad-default-excluded',
      proposed_relation: { from: 'anchor:missing-from', to: 'anchor:missing-to', kind: 'references' },
      rationale: 'bad proposal should not enter accepted truth',
      source_anchor_ids: ['anchor:missing-from'],
      source_refs: [{ path: '.opencode/skills/local/SKILL.md', sha256: 'stale-opencode-sha' }],
      confidence: 'inferred',
      status: 'proposed',
      created_at: new Date().toISOString(),
    }])
    const r = await runCli({ cli: READER_CLI, cmd: ['relations:accept', '--input', badPath] })
    expect(r.code).toBe(0)
    const updatedBad = await readNdjsonLocal<{ status: string }>(badPath)
    expect(updatedBad[0]!.status).toBe('rejected')
    const after = await readNdjsonLocal<{ id: string }>(path.join(FIXTURE_V0, 'edges', 'reader-accepted-relations.ndjson'))
    expect(after.length).toBe(before.length)
  })

  test('relations:accept writes the reader accepted-edges file', async () => {
    const proposalsPath = path.join(FIXTURE_V0, 'objects', 'relation-proposals.ndjson')
    const r = await runCli({ cli: READER_CLI, cmd: ['relations:accept', '--input', proposalsPath] })
    expect(r.code).toBe(0)
    const accepted = await readNdjsonLocal<{ kind: string }>(path.join(FIXTURE_V0, 'edges', 'reader-accepted-relations.ndjson'))
    expect(accepted.length).toBeGreaterThan(0)
    // No accepted edge may be `contains`.
    for (const e of accepted as Array<{ kind: string; source_anchor_ids: string[]; confidence: string }>) {
      expect(e.kind).not.toBe('contains')
      expect(e.confidence).toBe('validated')
      expect(e.source_anchor_ids.length).toBeGreaterThan(0)
      for (const id of e.source_anchor_ids) expect(id.startsWith('anchor:')).toBe(true)
    }
  })

  /**
   * Regression test for the fail-closed pruning policy.
   *
   * Prior `relations:accept` invocations may have written accepted
   * edges whose endpoints no longer resolve against the current
   * indexer universe (a previous run, a file rename, a hash drift,
   * etc.). A fresh `relations:accept` pass must rewrite the file
   * and drop those stale edges, even when they are not present in
   * the new proposal input.
   *
   * The flow:
   *   1. Read the current valid accepted edges (set up by the
   *      prior `relations:accept writes the reader accepted-edges
   *      file` test).
   *   2. Inject a stale edge whose `from`, `to`, `source_anchor_ids`,
   *      and `source_refs` all fail resolution against the current
   *      index. Persist the modified file.
   *   3. Run `relations:accept` again with the existing valid
   *      proposals. The command must rewrite the file.
   *   4. Assert that the injected stale edge is dropped, the
   *      pre-existing valid edges survive, and a `dropped stale
   *      accepted edge` warning is emitted.
   *   5. Restore the original file so subsequent tests are
   *      unaffected.
   */
  test('relations:accept prunes previously-stale edges with unresolvable endpoints', async () => {
    const proposalsPath = path.join(FIXTURE_V0, 'objects', 'relation-proposals.ndjson')
    const acceptedPath = path.join(FIXTURE_V0, 'edges', 'reader-accepted-relations.ndjson')
    const originalAccepted = await readTextOrEmpty(acceptedPath)
    const before = await readNdjsonLocal<{ id: string; from: string; to: string; kind: string }>(acceptedPath)
    expect(before.length).toBeGreaterThan(0)
    // Capture a known-good edge id so we can confirm the file is
    // still being rewritten (not appended-only) after the rewrite.
    const survivingId = before[0]!.id
    const staleEdgeId = 'edge:reader:rp:stale-fixture-unresolvable'
    try {
      const injected = [
        ...before,
        {
          id: staleEdgeId,
          proposal_id: 'rp:stale-fixture-unresolvable',
          from: 'anchor:stale-fixture-from',
          to: 'anchor:stale-fixture-to',
          kind: 'references',
          provenance_kind: 'llm_extracted',
          source_refs: [{
            path: 'stale-fixture-nonexistent.md',
            sha256: '0000000000000000000000000000000000000000000000000000000000000000',
          }],
          source_anchor_ids: ['anchor:stale-fixture-from', 'anchor:stale-fixture-to'],
          confidence: 'validated',
          status: 'fresh',
          created_at: new Date().toISOString(),
        },
      ]
      await writeNdjsonLocal(acceptedPath, injected)
      const written = await readNdjsonLocal<{ id: string }>(acceptedPath)
      expect(written.map((e) => e.id)).toContain(staleEdgeId)
      expect(written.length).toBe(before.length + 1)
      // A fresh `relations:accept` pass with the existing valid
      // proposals must rewrite the file. The injected stale edge
      // must be dropped because its endpoints, source_anchor_ids,
      // and source_refs all fail to resolve against the current
      // indexer endpoint universe.
      const r = await runCli({ cli: READER_CLI, cmd: ['relations:accept', '--input', proposalsPath] })
      expect(r.code).toBe(0)
      const after = await readNdjsonLocal<{ id: string; from: string; to: string; kind: string }>(acceptedPath)
      expect(after.map((e) => e.id)).not.toContain(staleEdgeId)
      // No `from`/`to` pair from the injected stale edge may
      // survive the rewrite.
      for (const edge of after) {
        const isStaleEndpoints = edge.from === 'anchor:stale-fixture-from' || edge.to === 'anchor:stale-fixture-to'
        expect(isStaleEndpoints).toBe(false)
      }
      // The pre-existing valid edge must still be in the file.
      expect(after.map((e) => e.id)).toContain(survivingId)
      // A warning naming the dropped stale edge must be emitted
      // so the operation/review layers can see what was pruned.
      expect(r.raw).toContain('dropped stale accepted edge')
      expect(r.raw).toContain(staleEdgeId)
      // The file is rewritten, not appended-only: the surviving
      // valid edge appears exactly once after the rewrite.
      const survivingCount = after.filter((e) => e.id === survivingId).length
      expect(survivingCount).toBe(1)
    } finally {
      await writeFile(acceptedPath, originalAccepted, 'utf8')
    }
  })

  test('validate passes once proposals + accepts are present', async () => {
    const r = await runCli({ cli: READER_CLI, cmd: ['validate'] })
    expect(r.code).toBe(0)
  })

  test('validate fails for unresolved/default-excluded proposals and accepted records', async () => {
    const proposalsPath = path.join(FIXTURE_V0, 'objects', 'relation-proposals.ndjson')
    const acceptedPath = path.join(FIXTURE_V0, 'edges', 'reader-accepted-relations.ndjson')
    const originalProposals = await readTextOrEmpty(proposalsPath)
    const originalAccepted = await readTextOrEmpty(acceptedPath)
    try {
      await writeNdjsonLocal(proposalsPath, [{
        schema: 'atelier.relation-proposal/v1',
        proposal_id: 'rp:bad-validation',
        proposed_relation: { from: 'anchor:missing-from', to: 'anchor:missing-to', kind: 'references', confidence: 'fact' },
        rationale: 'bad canonical proposal should fail validation',
        source_anchor_ids: ['anchor:missing-from'],
        source_refs: [{ path: '.opencode/skills/local/SKILL.md', sha256: 'stale-opencode-sha' }],
        confidence: 'inferred',
        status: 'accepted',
        created_at: new Date().toISOString(),
      }])
      await writeNdjsonLocal(acceptedPath, [{
        id: 'edge:reader:rp:bad-validation',
        from: 'anchor:missing-from',
        to: 'anchor:missing-to',
        kind: 'references',
        provenance_kind: 'llm_extracted',
        source_refs: [{ path: '.opencode/skills/local/SKILL.md', sha256: 'stale-opencode-sha' }],
        confidence: 'inferred',
        status: 'fresh',
        created_at: new Date().toISOString(),
      }])
      const r = await runCli({ cli: READER_CLI, cmd: ['validate'] })
      expect(r.code).toBe(1)
      expect(r.raw).toContain('E_RELATION_PROPOSAL_INVALID')
      expect(r.raw).toContain('E_ACCEPTED_RELATION_INVALID')
    } finally {
      await writeFile(proposalsPath, originalProposals, 'utf8')
      await writeFile(acceptedPath, originalAccepted, 'utf8')
    }
  })
})
