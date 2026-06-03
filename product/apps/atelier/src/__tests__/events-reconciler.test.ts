import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'bun:test'
import { buildGraph, writeGraph } from '../core/graph'
import {
  appendEvent,
  classifyChange,
  classifyCuratedEdit,
  classifyDeletionIntent,
  classifyMissingControl,
  classifyOrphanSource,
  createEvent,
  createFileChangedEvent,
  createFileMovedEvent,
  createFileDeletedEvent,
  createReconciliationFindingEvent,
  createRunStartedEvent,
  createRunCompletedEvent,
  generateEventId,
  readEvents,
} from '../core/events'
import { reconcile, repairDryRun } from '../core/reconciler'

const TEST_ROOT = '/tmp/atelier-events-test'

function writeTestFile(relativePath: string, content: string) {
  const target = path.join(TEST_ROOT, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, content)
}

function setupTestProject() {
  rmSync(TEST_ROOT, { recursive: true, force: true })
  mkdirSync(TEST_ROOT, { recursive: true })

  writeTestFile('harness/knowledge/rules/security.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'id: knowledge.rule.security',
    'title: Security Rules',
    'tags:',
    '  - domain:security',
    '---',
    '',
    '# Security Rules',
    '',
    'Do not commit secrets.',
  ].join('\n'))

  writeTestFile('harness/policies/permissions.md', [
    '---',
    'schema: harness/v1',
    'kind: policy',
    'id: policy.permissions',
    'title: Permissions Policy',
    '---',
    '',
    '# Permissions',
    '',
    'rule allow-read { match: "*.ts" }',
  ].join('\n'))

  mkdirSync(path.join(TEST_ROOT, '.harness/generated'), { recursive: true })
  writeTestFile('.harness/generated/role-bundles.json', JSON.stringify([
    {
      id: 'role.domain.web',
      selectors: { tags: ['domain:security'] },
      matchedDocuments: [
        { id: 'knowledge.rule.security', path: 'harness/knowledge/rules/security.md', reasons: ['matched role selector tags'] },
      ],
    },
  ]))
  writeTestFile('.harness/generated/knowledge-index.json', JSON.stringify({
    byKnowledgeType: {
      rule: [
        { id: 'knowledge.rule.security' },
      ],
    },
    byStatus: {},
    byImpact: {},
    byTag: {},
    byScopePath: {},
  }))
  writeTestFile('.harness/generated/docs.json', '[]')
  writeTestFile('.harness/generated/ids.json', '{}')
  writeTestFile('.harness/generated/diagnostics.json', '{}')
  writeTestFile('.harness/generated/workflow-index.json', '[]')
  writeTestFile('.harness/generated/path-ownership.json', JSON.stringify({
    entries: [
      { path: 'harness/knowledge/rules', ownerRole: 'role.domain.web', source: 'role-selector' },
    ],
  }))
  writeTestFile('.harness/generated/repo-map.json', JSON.stringify({
    projects: [],
    files: [],
    ownershipHints: [],
    warnings: [],
    workspace: { packageManager: 'bun', taskRunner: 'nx', appsRoot: 'product/apps', packagesRoot: 'product/packages', harnessRoot: 'harness' },
  }))
}

describe('event log', () => {
  test('appendEvent and readEvents round-trip', () => {
    setupTestProject()
    const event = createFileChangedEvent('product/apps/web/src/app.ts', null, 'abc123', 'test')
    appendEvent(TEST_ROOT, event)

    const events = readEvents(TEST_ROOT)
    expect(events.length).toBe(1)
    expect(events[0]!.kind).toBe('file_changed')
    expect(events[0]!.payload.path).toBe('product/apps/web/src/app.ts')
    expect(events[0]!.id).toBe(event.id)
  })

  test('appendEvent is append-only preserves prior events', () => {
    setupTestProject()
    const first = createFileChangedEvent('a.ts', null, 'hash1', 'test')
    const second = createFileChangedEvent('b.ts', null, 'hash2', 'test')
    appendEvent(TEST_ROOT, first)
    appendEvent(TEST_ROOT, second)

    const events = readEvents(TEST_ROOT)
    expect(events.length).toBe(2)
    expect(events[0]!.payload.path).toBe('a.ts')
    expect(events[1]!.payload.path).toBe('b.ts')
  })

  test('readEvents returns empty for missing log', () => {
    rmSync(TEST_ROOT, { recursive: true, force: true })
    mkdirSync(TEST_ROOT, { recursive: true })
    const events = readEvents(TEST_ROOT)
    expect(events).toEqual([])
  })

  test('generateEventId produces unique non-empty ids', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateEventId())
    }
    expect(ids.size).toBe(100)
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0)
    }
  })

  test('createEvent constructs valid event', () => {
    const event = createEvent('file_changed', { path: 'test.md', oldHash: null, newHash: 'xyz' }, 'test-suite')
    expect(event.kind).toBe('file_changed')
    expect(event.source).toBe('test-suite')
    expect(event.id).toBeTruthy()
    expect(event.timestamp).toBeTruthy()
    expect(event.payload).toEqual({ path: 'test.md', oldHash: null, newHash: 'xyz' })
  })

  test('createFileMovedEvent and createFileDeletedEvent', () => {
    const moved = createFileMovedEvent('old.ts', 'new.ts', 'hash', 'test')
    expect(moved.kind).toBe('file_moved')
    expect(moved.payload.from).toBe('old.ts')
    expect(moved.payload.to).toBe('new.ts')

    const deleted = createFileDeletedEvent('gone.ts', 'hash', 'test')
    expect(deleted.kind).toBe('file_deleted')
    expect(deleted.payload.path).toBe('gone.ts')
  })

  test('createRunStartedEvent and createRunCompletedEvent', () => {
    const started = createRunStartedEvent('RUN-000', 'workflow.test', 'test')
    expect(started.kind).toBe('run_started')
    expect(started.payload.runId).toBe('RUN-000')

    const completed = createRunCompletedEvent('RUN-000', true, 'test')
    expect(completed.kind).toBe('run_completed')
    expect(completed.payload.ok).toBe(true)
  })

  test('createReconciliationFindingEvent', () => {
    const finding = {
      kind: 'orphan-source' as const,
      riskAction: 'advisory' as const,
      artifactId: 'knowledge.rule.security',
      artifactPath: 'harness/knowledge/rules/security.md',
      message: 'Source deleted but enforcement remains',
    }
    const event = createReconciliationFindingEvent(finding, 'test')
    expect(event.kind).toBe('reconciliation_finding')
    expect(event.payload.finding).toBeDefined()
  })
})

describe('classifyChange', () => {
  test('detects added, changed, moved, and deleted paths', () => {
    const oldMap = new Map([
      ['a.md', 'hash1'],
      ['b.md', 'hash2'],
      ['c.md', 'hash3'],
    ])
    const newMap = new Map([
      ['b.md', 'hash2-new'],
      ['harness/knowledge/rules/c.md', 'hash1'],
      ['d.md', 'hash4'],
    ])
    const result = classifyChange(oldMap, newMap, new Set(['knowledge']))

    expect(result.added).toContain('d.md')
    expect(result.changed).toContain('b.md')
    expect(result.deleted).toContain('c.md')
    expect(result.moved).toContain('a.md')
  })

  test('returns empty arrays for no changes', () => {
    const map = new Map([['a.md', 'hash1']])
    const result = classifyChange(map, map, new Set())
    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
    expect(result.moved).toEqual([])
    expect(result.deleted).toEqual([])
  })
})

describe('classifyDeletionIntent', () => {
  test('dangerous permission returns block', () => {
    const result = classifyDeletionIntent('harness/policies/permissions.md', true, true, true)
    expect(result.riskAction).toBe('block')
    expect(result.reason).toContain('Dangerous permission')
  })

  test('orphan source with active enforcement returns advisory', () => {
    const result = classifyDeletionIntent('harness/knowledge/rules/security.md', true, false, false)
    expect(result.riskAction).toBe('advisory')
    expect(result.reason).toContain('enforcement remains')
  })

  test('policy deletion returns advisory', () => {
    const result = classifyDeletionIntent('harness/policies/permissions.md', false, true, false)
    expect(result.riskAction).toBe('advisory')
    expect(result.reason).toContain('Policy file deleted')
  })

  test('normal deletion without enforcement returns silent', () => {
    const result = classifyDeletionIntent('some/file.ts', false, false, false)
    expect(result.riskAction).toBe('silent')
    expect(result.reason).toContain('No active enforcement')
  })
})

describe('classify helpers', () => {
  test('classifyMissingControl returns task finding', () => {
    const finding = classifyMissingControl('knowledge.rule.api', 'harness/knowledge/rules/api.md')
    expect(finding.kind).toBe('missing-control')
    expect(finding.riskAction).toBe('task')
    expect(finding.artifactId).toBe('knowledge.rule.api')
  })

  test('classifyOrphanSource returns advisory finding', () => {
    const finding = classifyOrphanSource('knowledge.rule.security', 'harness/knowledge/rules/security.md', 3)
    expect(finding.kind).toBe('orphan-source')
    expect(finding.riskAction).toBe('advisory')
    expect(finding.message).toContain('3 enforcement(s) remain')
  })

  test('classifyCuratedEdit with stricter control returns advisory', () => {
    const finding = classifyCuratedEdit('rule.test', 'some/path.md', true)
    expect(finding.kind).toBe('curated-edit')
    expect(finding.riskAction).toBe('advisory')
  })

  test('classifyCuratedEdit with non-stricter returns silent', () => {
    const finding = classifyCuratedEdit('rule.test', 'some/path.md', false)
    expect(finding.kind).toBe('curated-edit')
    expect(finding.riskAction).toBe('silent')
  })
})

describe('reconciler', () => {
  test('reconcile returns no findings in clean project', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)
    writeGraph(TEST_ROOT, graph)

    const result = reconcile({ projectRoot: TEST_ROOT })

    expect(typeof result.riskActionCounts).toBe('object')
    expect(typeof result.eventCount).toBe('number')
  })

  test('reconcile is non-mutating', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)
    writeGraph(TEST_ROOT, graph)
    const logPath = path.join(TEST_ROOT, 'harness/atelier/events.ndjson')

    reconcile({ projectRoot: TEST_ROOT })

    expect(existsSync(logPath)).toBe(false)
  })

  test('repairDryRun returns wouldChange false for clean project', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)
    writeGraph(TEST_ROOT, graph)

    const result = repairDryRun({ projectRoot: TEST_ROOT })
    expect(typeof result.wouldChange).toBe('boolean')
    expect(Array.isArray(result.changes)).toBe(true)
    expect(Array.isArray(result.findings)).toBe(true)
  })

  test('repairDryRun is non-mutating', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)
    writeGraph(TEST_ROOT, graph)

    repairDryRun({ projectRoot: TEST_ROOT })

    const logPath = path.join(TEST_ROOT, 'harness/atelier/events.ndjson')
    expect(existsSync(logPath)).toBe(false)
  })
})
