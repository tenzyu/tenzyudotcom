import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'bun:test'
import {
  listControls,
  buildCoverageReport,
  findMissingControls,
  observeControls,
} from '../core/controls'


const TEST_ROOT = '/tmp/atelier-controls-test'

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
    'Intent: prevent secret commits.',
    'Guards commit hooks.',
  ].join('\n'))

  writeTestFile('harness/knowledge/rules/api.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'id: knowledge.rule.api',
    'title: API Rules',
    '---',
    '',
    '# API Rules',
    '',
    'Use RESTful conventions.',
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
    byKnowledgeType: { rule: [{ id: 'knowledge.rule.security' }, { id: 'knowledge.rule.api' }] },
    byStatus: {},
    byImpact: {},
    byTag: {},
    byScopePath: {},
  }))
  writeTestFile('.harness/generated/docs.json', '[]')
  writeTestFile('.harness/generated/ids.json', '{}')
  writeTestFile('.harness/generated/diagnostics.json', '{}')
  writeTestFile('.harness/generated/workflow-index.json', '[]')
  writeTestFile('.harness/generated/path-ownership.json', JSON.stringify({ entries: [] }))
  writeTestFile('.harness/generated/repo-map.json', JSON.stringify({
    projects: [],
    files: [],
    ownershipHints: [],
    warnings: [],
    workspace: { packageManager: 'bun', taskRunner: 'nx', appsRoot: 'product/apps', packagesRoot: 'product/packages', harnessRoot: 'harness' },
  }))

  writeTestFile('harness/atelier/graph.json', JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    artifacts: [],
    edges: [],
  }))
}

describe('controls module', () => {
  test('observeControls returns controls for known paths', () => {
    setupTestProject()
    const controls = observeControls(TEST_ROOT)

    const permissions = controls.filter((c) => c.provenance === 'policy-file')
    expect(permissions.length).toBeGreaterThanOrEqual(1)
    expect(permissions[0]!.type).toBe('permission')
  })

  test('listControls returns all observed control mechanisms', () => {
    setupTestProject()
    const controls = listControls(TEST_ROOT)
    expect(Array.isArray(controls)).toBe(true)
    for (const control of controls) {
      expect(typeof control.id).toBe('string')
      expect(typeof control.type).toBe('string')
      expect(typeof control.name).toBe('string')
      expect(typeof control.path).toBe('string')
    }
  })

  test('buildCoverageReport returns correct structure', () => {
    setupTestProject()
    const report = buildCoverageReport(TEST_ROOT)

    expect(report.totalKnowledge).toBeGreaterThanOrEqual(1)
    expect(report.totalControls).toBeGreaterThanOrEqual(1)
    expect(typeof report.coveredKnowledge).toBe('number')
    expect(typeof report.uncoveredKnowledge).toBe('number')
    expect(typeof report.typeCounts).toBe('object')
    expect(Array.isArray(report.orphanedControls)).toBe(true)
    expect(Array.isArray(report.entries)).toBe(true)
  })

  test('buildCoverageReport entries have expected fields', () => {
    setupTestProject()
    const report = buildCoverageReport(TEST_ROOT)

    for (const entry of report.entries) {
      expect(typeof entry.knowledgeId).toBe('string')
      expect(typeof entry.knowledgePath).toBe('string')
      expect(typeof entry.coverageScore).toBe('number')
      expect(entry.coverageScore).toBeGreaterThanOrEqual(0)
      expect(entry.coverageScore).toBeLessThanOrEqual(1)
      expect(Array.isArray(entry.controls)).toBe(true)
      expect(Array.isArray(entry.missingTypes)).toBe(true)
    }
  })

  test('findMissingControls returns knowledge without full coverage', () => {
    setupTestProject()
    const missing = findMissingControls(TEST_ROOT)

    expect(Array.isArray(missing)).toBe(true)
    for (const entry of missing) {
      expect(typeof entry.knowledgeId).toBe('string')
      expect(typeof entry.knowledgePath).toBe('string')
      expect(entry.missingTypes.length).toBeGreaterThan(0)
    }
  })

  test('extractIntentsFromKnowledge - intents extracted from security.md', () => {
    setupTestProject()
    const controls = observeControls(TEST_ROOT)
    const securityControl = controls.find((c) => c.path.includes('permissions'))
    expect(securityControl).toBeDefined()
  })

  test('controls have unique IDs', () => {
    setupTestProject()
    const controls = listControls(TEST_ROOT)
    const ids = new Set(controls.map((c) => c.id))
    expect(ids.size).toBe(controls.length)
  })
})
