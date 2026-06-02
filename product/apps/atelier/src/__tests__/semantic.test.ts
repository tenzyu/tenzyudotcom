import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  buildSemanticQuery,
  findDuplicateKnowledgeCandidates,
  runSemanticExpansion,
  type SemanticOptions,
} from '../core/semantic'

const ROOT = mkdtempSync(path.join(tmpdir(), 'atelier-semantic-'))

function writeFile(relativePath: string, body: string) {
  const target = path.join(ROOT, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, body)
}

function seed() {
  writeFile(
    'harness/knowledge/decisions/rust-boundary.md',
    [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: decision',
      'id: knowledge.decision.rust-boundary',
      'title: Rust Boundary Decision',
      'status: active',
      'tags: [rust, tauri, workbench]',
      'summary: Use rust-tauri-engineer for the workbench native boundary.',
      '---',
      '',
      'Tauri native workbench boundary must stay under the workbench app.',
    ].join('\n')
  )
  writeFile(
    'harness/knowledge/lessons/dx-lint.md',
    [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: lesson',
      'id: knowledge.lesson.dx-lint',
      'title: DX Lint Lesson',
      'status: active',
      'tags: [linter, dx, eslint]',
      'summary: Centralize lint policy in the linter package.',
      '---',
      '',
      'ESLint policy must live in the linter package and be consumed by every app.',
    ].join('\n')
  )
  writeFile(
    'harness/knowledge/lessons/dx-lint-followup.md',
    [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: lesson',
      'id: knowledge.lesson.dx-lint-followup',
      'title: DX Lint Followup Lesson',
      'status: active',
      'tags: [linter, dx, eslint, followup]',
      'summary: Lint rollout followup.',
      '---',
      '',
      'ESLint policy must live in the linter package and be consumed by every app. Followup on rollout.',
    ].join('\n')
  )
  writeFile(
    'harness/knowledge/incidents/login-outage.md',
    [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: incident',
      'id: knowledge.incident.login-outage',
      'title: Login Outage',
      'status: archived',
      'tags: [incident, web, auth, login, oauth, sso, session, retry, cache]',
      'summary: SSO login retry storm during cache flush.',
      '---',
      '',
      'Session cache invalidation caused a thundering herd of OAuth login retries.',
    ].join('\n')
  )
}

describe('semantic expansion (M12)', () => {
  beforeEach(() => {
    rmSync(ROOT, { recursive: true, force: true })
    mkdirSync(ROOT, { recursive: true })
    seed()
  })

  afterAll(() => {
    rmSync(ROOT, { recursive: true, force: true })
  })

  test('returns empty hits when enabled is false', () => {
    const query = buildSemanticQuery('lint policy for eslint', 'product/apps/web/src')
    const result = runSemanticExpansion({ projectRoot: ROOT, enabled: false }, query)
    expect(result.enabled).toBe(false)
    expect(result.hits).toEqual([])
    expect(result.unknownTerms).toEqual([])
  })

  test('surfaces deterministic optional hits with reasons when enabled', () => {
    const query = buildSemanticQuery('lint policy for eslint', 'product/apps/web/src')
    const result = runSemanticExpansion({ projectRoot: ROOT, enabled: true }, query)
    expect(result.enabled).toBe(true)
    expect(result.hits.length).toBeGreaterThan(0)
    for (const hit of result.hits) {
      expect(hit.reason).toMatch(/Matched \d+ term\(s\)/)
      expect(hit.score).toBeGreaterThan(0)
    }
  })

  test('flags unknown terms (terms that did not match any document)', () => {
    const query = buildSemanticQuery('quokka migration', 'product/apps/web/src')
    const result = runSemanticExpansion({ projectRoot: ROOT, enabled: true }, query)
    expect(result.unknownTerms).toContain('quokka')
  })

  test('finds duplicate candidates by body overlap', () => {
    const candidates = findDuplicateKnowledgeCandidates({
      projectRoot: ROOT,
      enabled: true,
      candidateId: 'knowledge.lesson.dx-lint',
    })
    expect(candidates.length).toBeGreaterThan(0)
    const ids = candidates.map((candidate) => candidate.id)
    expect(ids).toContain('knowledge.lesson.dx-lint-followup')
  })

  test('returns nothing when semantic is disabled for duplicate search', () => {
    const candidates = findDuplicateKnowledgeCandidates({
      projectRoot: ROOT,
      enabled: false,
      candidateId: 'knowledge.lesson.dx-lint',
    })
    expect(candidates).toEqual([])
  })

  test('respects maxResults cap', () => {
    const options: SemanticOptions = { projectRoot: ROOT, enabled: true, maxResults: 1 }
    const query = buildSemanticQuery('lint eslint web app', 'product/apps/web')
    const result = runSemanticExpansion(options, query)
    expect(result.hits.length).toBeLessThanOrEqual(1)
  })
})
