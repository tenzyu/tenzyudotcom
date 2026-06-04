import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'bun:test'
import {
  buildGraph,
  computeGraphStatus,
  graphBlame,
  graphFilePath,
  graphImpact,
  isGraphStale,
  readGraph,
  scanProject,
  writeGraph,
} from '../core/graph'

const TEST_ROOT = '/tmp/atelier-graph-test'

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

  writeTestFile('harness/knowledge/rules/api.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'id: knowledge.rule.api',
    'title: API Rules',
    'tags:',
    '  - domain:api',
    '---',
    '',
    '# API Rules',
    '',
    'Use RESTful conventions.',
  ].join('\n'))

  writeTestFile('product/apps/web/src/app.ts', "console.log('hello')\n")
  writeTestFile('product/apps/web/src/lib.ts', "export const x = 1\n")
  writeTestFile('harness/tasks/task.test.md', [
    '---',
    'schema: harness/v1',
    'kind: task',
    'id: task.test',
    'title: Test Task',
    'status: pending',
    '---',
    'Task body',
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
        { id: 'knowledge.rule.api' },
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
      { path: 'product/apps/web', ownerRole: 'role.domain.web', source: 'role-selector' },
    ],
  }))
  writeTestFile('.harness/generated/repo-map.json', JSON.stringify({
    projects: [{ name: 'web', relativeRoot: 'product/apps/web', type: 'app', files: 2, languages: ['typescript'] }],
    files: [],
    ownershipHints: [],
    warnings: [],
    workspace: { packageManager: 'bun', taskRunner: 'nx', appsRoot: 'product/apps', packagesRoot: 'product/packages', harnessRoot: 'harness' },
  }))

  writeTestFile('harness/runs/active/RUN-test-run-abc123/context.manifest.json', JSON.stringify({
    runId: 'RUN-test-run-abc123',
    workflowId: 'workflow.direct-run',
    intent: 'test graph observation',
    inputPath: 'product/apps/web',
    selectedDocuments: [],
    expandedDocuments: [],
  }))
}

describe('graph module', () => {
  test('scanProject observes markdown, runs, generated files, and source files', () => {
    setupTestProject()
    const result = scanProject(TEST_ROOT)

    expect(result.graph.version).toBe(1)
    expect(result.graph.artifacts.length).toBeGreaterThanOrEqual(6)
    expect(result.graph.edges.length).toBeGreaterThanOrEqual(3)
    expect(result.errors).toEqual([])

    const markdownArtifacts = result.graph.artifacts.filter((a) => a.kind === 'markdown' || a.kind === 'knowledge')
    expect(markdownArtifacts.length).toBeGreaterThanOrEqual(2)

    const runArtifacts = result.graph.artifacts.filter((a) => a.kind === 'run')
    expect(runArtifacts.length).toBeGreaterThanOrEqual(1)

    const taskArtifacts = result.graph.artifacts.filter((a) => a.kind === 'task')
    expect(taskArtifacts.length).toBeGreaterThanOrEqual(1)

    const generatedArtifacts = result.graph.artifacts.filter((a) => a.kind === 'generated-file')
    expect(generatedArtifacts.length).toBeGreaterThanOrEqual(8)

    const sourceArtifacts = result.graph.artifacts.filter((a) => a.kind === 'source-file')
    expect(sourceArtifacts.length).toBeGreaterThanOrEqual(2)

    const roleSelectEdges = result.graph.edges.filter((e) => e.kind === 'selects')
    expect(roleSelectEdges.length).toBeGreaterThanOrEqual(1)

    const scopeEdges = result.graph.edges.filter((e) => e.kind === 'scopes')
    expect(scopeEdges.length).toBeGreaterThanOrEqual(1)
  })

  test('buildGraph returns deterministic output for unchanged working tree', () => {
    setupTestProject()
    const first = buildGraph(TEST_ROOT)
    const second = buildGraph(TEST_ROOT)

    expect(first.artifacts.length).toBe(second.artifacts.length)
    expect(first.edges.length).toBe(second.edges.length)

    for (let index = 0; index < first.artifacts.length; index += 1) {
      expect(first.artifacts[index]?.id).toBe(second.artifacts[index]?.id)
      expect(first.artifacts[index]?.contentHash).toBe(second.artifacts[index]?.contentHash)
    }
  })

  test('writeGraph and readGraph round-trip', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)
    writeGraph(TEST_ROOT, graph)

    expect(existsSync(graphFilePath(TEST_ROOT))).toBe(true)

    const loaded = readGraph(TEST_ROOT)
    expect(loaded).not.toBeNull()
    expect(loaded!.artifacts.length).toBe(graph.artifacts.length)
    expect(loaded!.edges.length).toBe(graph.edges.length)
  })

  test('computeGraphStatus returns correct counts', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)
    const status = computeGraphStatus(graph)

    expect(status.artifactCount).toBe(graph.artifacts.length)
    expect(status.edgeCount).toBe(graph.edges.length)
    expect(typeof status.kindCounts).toBe('object')
    expect(status.unresolvedCount).toBeGreaterThanOrEqual(0)
  })

  test('isGraphStale returns false for unchanged tree', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)
    expect(isGraphStale(TEST_ROOT, graph)).toBe(false)
  })

  test('isGraphStale returns true after file change', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)

    writeTestFile('product/apps/web/src/app.ts', "console.log('changed')\n")
    expect(isGraphStale(TEST_ROOT, graph)).toBe(true)
  })

  test('graphImpact returns related artifacts and edges for a path', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)
    const impact = graphImpact(graph, 'product/apps/web')

    expect(impact.artifacts.length).toBeGreaterThanOrEqual(1)
    expect(impact.edges.length).toBeGreaterThanOrEqual(0)
  })

  test('graphBlame returns incoming and outgoing edges for an artifact', () => {
    setupTestProject()
    const graph = buildGraph(TEST_ROOT)

    const knowledgeArtifact = graph.artifacts.find((a) => a.id === 'knowledge.rule.security')
    expect(knowledgeArtifact).toBeDefined()

    const blame = graphBlame(graph, 'knowledge.rule.security')
    expect(blame.artifact).toBeDefined()
    expect(blame.artifact!.id).toBe('knowledge.rule.security')
    expect(blame.incomingEdges.length).toBeGreaterThanOrEqual(0)
    expect(blame.outgoingEdges.length).toBeGreaterThanOrEqual(0)
  })

  test('graphBlame returns undefined artifact for unknown id', () => {
    const graph = buildGraph(TEST_ROOT)
    const blame = graphBlame(graph, 'nonexistent.id')
    expect(blame.artifact).toBeUndefined()
    expect(blame.incomingEdges).toEqual([])
    expect(blame.outgoingEdges).toEqual([])
  })

  test('output stays deterministic across scan calls', () => {
    setupTestProject()
    const first = scanProject(TEST_ROOT)
    const second = scanProject(TEST_ROOT)

    const firstArtifactPaths = first.graph.artifacts.map((a) => a.path)
    const secondArtifactPaths = second.graph.artifacts.map((a) => a.path)
    expect(firstArtifactPaths).toEqual(secondArtifactPaths)

    const firstEdgeTuples = first.graph.edges.map((e) => `${e.from}|${e.to}|${e.kind}`)
    const secondEdgeTuples = second.graph.edges.map((e) => `${e.from}|${e.to}|${e.kind}`)
    expect(firstEdgeTuples).toEqual(secondEdgeTuples)
  })
})
