import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { generateGeneratedFiles } from '../core/generate'
import { renameId } from '../core/rename'

function writeMarkdown(root: string, relativePath: string, lines: string[]) {
  const target = path.join(root, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, lines.join('\n'))
}

function createRenameFixture(root: string) {
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
    'pinned:',
    '  - knowledge.example',
    '  - policy.repository',
    '---',
    '# Example Role',
    '',
    'See `role.domain.example` for context.',
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

  writeMarkdown(root, 'harness/knowledge/example.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'knowledge_type: rule',
    'id: knowledge.example',
    'title: Example Rule',
    'status: active',
    'tags:',
    '  - example',
    '---',
    '# Example Rule',
    '',
    'Reference: `knowledge.example`.',
  ])
}

function createGenerateFixture(root: string) {
  writeMarkdown(root, 'harness/actions/workflows/isolated-run.md', [
    '---',
    'schema: harness/v1',
    'kind: workflow',
    'id: workflow.isolated-run',
    'title: Isolated Run',
    'status: active',
    'callable: true',
    'use_when:',
    '  - non-trivial mutable work',
    'phases:',
    '  - phase.intake',
    '  - phase.implementation',
    '---',
    '# Workflow',
    '',
    '## Purpose',
    '',
    'Run bounded work.',
    '',
    '## Completion standard',
    '',
    'All evidence is recorded.',
  ])

  writeMarkdown(root, 'harness/actions/roles/domain/example.md', [
    '---',
    'schema: harness/v1',
    'kind: role',
    'id: role.domain.example',
    'title: Example Role',
    'status: active',
    'role_type: domain',
    'activation:',
    '  use_when:',
    '    - editing the example app',
    '  paths:',
    '    - product/apps/example/**',
    'selectors:',
    '  paths:',
    '    - product/apps/example/**',
    'pinned:',
    '  - policy.repository',
    '---',
    '# Role',
    '',
    '## Mission',
    '',
    'Maintain the example app.',
    '',
    '## Primary scope',
    '',
    '- product/apps/example/**',
    '',
    '## Forbidden default scope',
    '',
    '- unrelated apps',
    '',
    '## Outputs',
    '',
    '- scoped diff',
    '',
    '## Review criteria',
    '',
    '- tests pass',
  ])
}

describe('Atelier M7 (id rename)', () => {
  const tmpRoot = mkdtempSync(path.join(tmpdir(), 'atelier-m7-'))

  beforeEach(() => {
    rmSync(path.join(tmpRoot, 'harness'), { recursive: true, force: true })
    rmSync(path.join(tmpRoot, '.harness'), { recursive: true, force: true })
    createRenameFixture(tmpRoot)
  })

  afterAll(() => {
    if (existsSync(tmpRoot)) {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  test('preview reports all affected files without writing', () => {
    const preview = renameId({
      projectRoot: tmpRoot,
      oldId: 'knowledge.example',
      newId: 'knowledge.example-v2',
    })

    expect(preview.written).toBe(false)
    expect(preview.oldPath).toBe('harness/knowledge/example.md')
    expect(preview.preview.length).toBeGreaterThan(0)

    const knowledgePreview = preview.preview.find(
      (change) => change.path === 'harness/knowledge/example.md'
    )
    expect(knowledgePreview?.kind).toBe('frontmatter-id')
    expect(
      preview.preview.some(
        (change) =>
          change.path === 'harness/actions/roles/domain/example.md' &&
          change.kind === 'frontmatter-array'
      )
    ).toBe(true)

    const owner = readFileSync(
      path.join(tmpRoot, 'harness/knowledge/example.md'),
      'utf-8'
    )
    expect(owner).toContain('id: knowledge.example')
    expect(owner).not.toContain('knowledge.example-v2')
  })

  test('refuses to rename when newId already exists', () => {
    writeMarkdown(tmpRoot, 'harness/knowledge/other.md', [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: rule',
      'id: knowledge.clash',
      'title: Clash',
      'status: active',
      '---',
      '# Clash',
    ])

    const result = renameId({
      projectRoot: tmpRoot,
      oldId: 'knowledge.example',
      newId: 'knowledge.clash',
    })

    expect(result.ok).toBe(false)
    expect(result.written).toBe(false)
    expect(result.diagnostics[0]?.code).toBe('DUPLICATE_ID')
  })

  test('reports unresolved when oldId does not exist', () => {
    const result = renameId({
      projectRoot: tmpRoot,
      oldId: 'knowledge.missing',
      newId: 'knowledge.missing-v2',
    })

    expect(result.ok).toBe(false)
    expect(result.diagnostics[0]?.code).toBe('UNRESOLVED_ID_REFERENCE')
  })

  test('write mode renames frontmatter, body references, and context manifest', () => {
    const init = require('../core/runs').initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth',
      runId: 'RUN-rename-target',
    })

    const writeResult = renameId({
      projectRoot: tmpRoot,
      oldId: 'knowledge.example',
      newId: 'knowledge.example-v2',
      write: true,
    })

    expect(writeResult.written).toBe(true)
    expect(writeResult.changes.length).toBeGreaterThan(0)

    const owner = readFileSync(
      path.join(tmpRoot, 'harness/knowledge/example.md'),
      'utf-8'
    )
    expect(owner).toContain('id: knowledge.example-v2')
    expect(owner).toContain('`knowledge.example-v2`')

    const role = readFileSync(
      path.join(tmpRoot, 'harness/actions/roles/domain/example.md'),
      'utf-8'
    )
    expect(role).toContain('- knowledge.example-v2')
    expect(role).toContain('`role.domain.example`')

    const manifest = JSON.parse(
      readFileSync(path.join(init.manifestPath), 'utf-8')
    )
    const manifestIds = manifest.selectedDocuments.map(
      (document: { id: string }) => document.id
    )
    expect(manifestIds).toContain('knowledge.example-v2')
    expect(manifestIds).not.toContain('knowledge.example')

    const ids = JSON.parse(
      readFileSync(path.join(tmpRoot, '.harness/generated/ids.json'), 'utf-8')
    )
    expect(ids['knowledge.example-v2']).toBeDefined()
    expect(ids['knowledge.example']).toBeUndefined()
  })
})

describe('Atelier M8 (generate skills and adapters)', () => {
  const tmpRoot = mkdtempSync(path.join(tmpdir(), 'atelier-m8-'))

  beforeEach(() => {
    rmSync(path.join(tmpRoot, 'harness'), { recursive: true, force: true })
    rmSync(path.join(tmpRoot, '.harness'), { recursive: true, force: true })
    createGenerateFixture(tmpRoot)
  })

  afterAll(() => {
    if (existsSync(tmpRoot)) {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  test('preview lists the expected generated files', () => {
    const preview = generateGeneratedFiles({ projectRoot: tmpRoot })

    expect(preview.files.map((file) => file.path)).toContain(
      '.harness/generated/skills/atelier.md'
    )
    expect(preview.files.map((file) => file.path)).toContain(
      '.harness/generated/skills/workflows/isolated-run.md'
    )
    expect(preview.files.map((file) => file.path)).toContain(
      '.harness/generated/skills/roles/example.md'
    )
    expect(preview.files.map((file) => file.path)).toContain(
      'harness/adapters/root/AGENTS.md'
    )
    expect(preview.files.map((file) => file.path)).toContain(
      'harness/adapters/root/CLAUDE.md'
    )
    expect(preview.files.map((file) => file.path)).toContain(
      'harness/adapters/root/GEMINI.md'
    )
  })

  test('write mode creates files and root adapters stay short', () => {
    const result = generateGeneratedFiles({
      projectRoot: tmpRoot,
      write: true,
    })

    expect(result.ok).toBe(true)
    expect(
      existsSync(
        path.join(tmpRoot, '.harness/generated/skills/atelier.md')
      )
    ).toBe(true)
    expect(
      existsSync(
        path.join(
          tmpRoot,
          '.harness/generated/skills/workflows/isolated-run.md'
        )
      )
    ).toBe(true)
    expect(
      existsSync(
        path.join(tmpRoot, '.harness/generated/skills/roles/example.md')
      )
    ).toBe(true)
    expect(existsSync(path.join(tmpRoot, 'harness/adapters/root/AGENTS.md'))).toBe(
      true
    )
    expect(existsSync(path.join(tmpRoot, 'harness/adapters/root/CLAUDE.md'))).toBe(
      true
    )
    expect(existsSync(path.join(tmpRoot, 'harness/adapters/root/GEMINI.md'))).toBe(
      true
    )

    const agents = readFileSync(
      path.join(tmpRoot, 'harness/adapters/root/AGENTS.md'),
      'utf-8'
    )
    expect(agents).toContain('Do not manually discover harness context first.')
    expect(agents).toContain(
      'atelier run init --workflow workflow.isolated-run --role role.domain.example --path . --intent "<request>"'
    )
    expect(agents).not.toContain('atelier run init --workflow isolated-run --intent')
    expect(agents).toContain('atelier run close')
    expect(agents.split('\n').length).toBeLessThan(50)

    const skill = readFileSync(
      path.join(
        tmpRoot,
        '.harness/generated/skills/workflows/isolated-run.md'
      ),
      'utf-8'
    )
    expect(skill).toContain('workflow_id:')
    expect(skill).toContain('workflow.isolated-run')

    const roleSkill = readFileSync(
      path.join(tmpRoot, '.harness/generated/skills/roles/example.md'),
      'utf-8'
    )
    expect(roleSkill).toContain('role_id:')
    expect(roleSkill).toContain('role.domain.example')
    expect(roleSkill).toContain('editing the example app')
  })

  test('write mode is idempotent', () => {
    generateGeneratedFiles({ projectRoot: tmpRoot, write: true })
    const second = generateGeneratedFiles({ projectRoot: tmpRoot, write: true })
    expect(second.ok).toBe(true)
    expect(
      readFileSync(
        path.join(tmpRoot, '.harness/generated/skills/atelier.md'),
        'utf-8'
      ).length
    ).toBeGreaterThan(0)
  })
})
