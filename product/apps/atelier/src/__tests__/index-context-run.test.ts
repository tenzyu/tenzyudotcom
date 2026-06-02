import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildContextPreview } from '../core/context'
import { compileIndexes } from '../core/indexer'
import { initRun } from '../core/runs'

function writeMarkdown(root: string, relativePath: string, lines: string[]) {
  const target = path.join(root, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, lines.join('\n'))
}

function createFixture(root: string) {
  writeMarkdown(root, 'harness/actions/workflows/example.md', [
    '---',
    'schema: harness/v1',
    'kind: workflow',
    'id: workflow.example',
    'title: Example Workflow',
    'status: active',
    'callable: true',
    'phases:',
    '  - phase.implementation',
    '---',
    '# Example Workflow',
  ])

  writeMarkdown(root, 'harness/actions/phases/implementation.md', [
    '---',
    'schema: harness/v1',
    'kind: phase',
    'id: phase.implementation',
    'title: Implementation',
    'status: active',
    '---',
    '# Implementation',
  ])

  writeMarkdown(root, 'harness/actions/roles/domain/example.md', [
    '---',
    'schema: harness/v1',
    'kind: role',
    'id: role.domain.example',
    'title: Example Role',
    'status: active',
    'selectors:',
    '  paths:',
    '    - product/apps/example/**',
    '  tags:',
    '    - example',
    '  knowledge_types:',
    '    - product-spec',
    'pinned:',
    '  - knowledge.repo-map',
    '---',
    '# Example Role',
    '',
    '## Required knowledge',
    '',
    '- `harness/knowledge/product-specs/example/README.md`',
    '',
    '## Optional knowledge',
    '',
    '- `harness/knowledge/product-specs/example/optional.md`',
  ])

  writeMarkdown(root, 'harness/policies/repository.md', [
    '---',
    'schema: harness/v1',
    'kind: policy',
    'id: policy.repository',
    'title: Repository Policy',
    'status: active',
    '---',
    '# Repository Policy',
  ])

  writeMarkdown(root, 'harness/knowledge/repo-map.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'knowledge_type: repo-map',
    'id: knowledge.repo-map',
    'title: Repo Map',
    'status: active',
    'tags:',
    '  - example',
    '---',
    '# Repo Map',
  ])

  writeMarkdown(root, 'harness/knowledge/product-specs/example/README.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'knowledge_type: product-spec',
    'id: knowledge.product-spec.example',
    'title: Example Product Spec',
    'status: active',
    'tags:',
    '  - example',
    'scope:',
    '  paths:',
    '    - product/apps/example/**',
    '---',
    '# Example Product Spec',
  ])

  writeMarkdown(root, 'harness/knowledge/product-specs/example/optional.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'knowledge_type: product-spec',
    'id: knowledge.product-spec.example-optional',
    'title: Example Optional Spec',
    'status: active',
    'tags:',
    '  - example',
    '---',
    '# Example Optional Spec',
    '',
    'Auth behavior for product/apps/example.',
  ])
}

describe('Atelier M2-M4', () => {
  const tmpRoot = mkdtempSync(path.join(tmpdir(), 'atelier-m2-m4-'))

  beforeEach(() => {
    rmSync(path.join(tmpRoot, 'harness'), { recursive: true, force: true })
    rmSync(path.join(tmpRoot, '.harness'), { recursive: true, force: true })
    createFixture(tmpRoot)
  })

  afterAll(() => {
    if (existsSync(tmpRoot)) {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  test('writes generated indexes and reports fresh check state', () => {
    const writeResult = compileIndexes({ projectRoot: tmpRoot, write: true })
    const checkResult = compileIndexes({ projectRoot: tmpRoot, check: true })

    expect(writeResult.staleFiles).toContain('docs.json')
    expect(checkResult.ok).toBe(true)
    expect(checkResult.staleFiles).toEqual([])

    const docs = JSON.parse(readFileSync(path.join(tmpRoot, '.harness/generated/docs.json'), 'utf-8'))
    const ids = JSON.parse(readFileSync(path.join(tmpRoot, '.harness/generated/ids.json'), 'utf-8'))

    expect(docs.some((document: { id: string }) => document.id === 'knowledge.product-spec.example')).toBe(true)
    expect(ids['workflow.example'].path).toBe('harness/actions/workflows/example.md')
  })

  test('builds role-routed context preview with reasons', () => {
    const preview = buildContextPreview({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
    })

    const requiredPaths = preview.required.map((document) => document.path)
    const optionalPaths = preview.optional.map((document) => document.path)

    expect(requiredPaths).toContain('harness/actions/workflows/example.md')
    expect(requiredPaths).toContain('harness/actions/phases/implementation.md')
    expect(requiredPaths).toContain('harness/actions/roles/domain/example.md')
    expect(requiredPaths).toContain('harness/policies/repository.md')
    expect(requiredPaths).toContain('harness/knowledge/product-specs/example/README.md')
    expect(optionalPaths).toContain('harness/knowledge/product-specs/example/optional.md')
    expect(preview.diagnostics).toEqual([])
  })

  test('initializes a run with context and manifest files', () => {
    const result = initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-example-auth',
    })

    expect(existsSync(result.briefPath)).toBe(true)
    expect(existsSync(result.contextPath)).toBe(true)
    expect(existsSync(result.manifestPath)).toBe(true)

    const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf-8'))
    expect(manifest.runId).toBe('RUN-example-auth')
    expect(manifest.selectedDocuments.some((document: { path: string }) => document.path === 'harness/actions/workflows/example.md')).toBe(
      true,
    )
    expect(readFileSync(result.contextPath, 'utf-8')).toContain('## Required Context')
  })
})
