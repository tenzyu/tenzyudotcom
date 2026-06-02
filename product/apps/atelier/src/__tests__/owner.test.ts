import { afterAll, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { listNxProjects, repoOwner } from '../core/owner'

const PROJECT_ROOT = mkdtempSync(path.join(tmpdir(), 'atelier-owner-'))

function writeMarkdown(relativePath: string, lines: string[]) {
  const target = path.join(PROJECT_ROOT, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, lines.join('\n'))
}

function writeJson(relativePath: string, value: unknown) {
  const target = path.join(PROJECT_ROOT, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, JSON.stringify(value, null, 2))
}

function seed() {
  writeJson('product/apps/atelier/project.json', {
    name: 'atelier',
    root: 'product/apps/atelier',
    sourceRoot: 'product/apps/atelier/src',
    projectType: 'application',
    tags: ['scope:atelier', 'type:app'],
  })
  writeJson('product/apps/web/project.json', {
    name: 'web',
    root: 'product/apps/web',
    sourceRoot: 'product/apps/web',
    projectType: 'application',
    tags: ['scope:web'],
  })
  writeMarkdown('harness/actions/roles/domain/harness-engineer.md', [
    '---',
    'schema: harness/v1',
    'kind: role',
    'id: role.domain.harness-engineer',
    'title: Harness Engineer',
    'status: active',
    'selectors:',
    '  paths:',
    '    - product/apps/atelier/**',
    '---',
    '# Harness Engineer',
  ])
  writeMarkdown('harness/actions/roles/domain/web-app-engineer.md', [
    '---',
    'schema: harness/v1',
    'kind: role',
    'id: role.domain.web-app-engineer',
    'title: Web App Engineer',
    'status: active',
    'selectors:',
    '  paths:',
    '    - product/apps/web/**',
    '---',
    '# Web App Engineer',
  ])
}

describe('repoOwner', () => {
  afterAll(() => {
    rmSync(PROJECT_ROOT, { recursive: true, force: true })
  })

  test('resolves Nx project and role for a path', () => {
    seed()
    const result = repoOwner('product/apps/atelier/src/cli.ts', PROJECT_ROOT)
    expect(result.project).toBe('atelier')
    expect(result.ownerRole).toBe('role.domain.harness-engineer')
    expect(result.source).toBe('nx-project')
    expect(result.notes.length).toBeGreaterThan(0)
  })

  test('returns unknown for a path that matches no project or role', () => {
    seed()
    const result = repoOwner('docs/notes.md', PROJECT_ROOT)
    expect(result.project).toBeNull()
    expect(result.ownerRole).toBeNull()
    expect(result.source).toBe('unknown')
  })

  test('matches role selector when no Nx project matches', () => {
    seed()
    const result = repoOwner('product/apps/web/src/app.tsx', PROJECT_ROOT)
    expect(result.ownerRole).toBe('role.domain.web-app-engineer')
    expect(result.project).toBe('web')
  })

  test('listNxProjects returns every Nx project', () => {
    seed()
    const projects = listNxProjects(PROJECT_ROOT)
    const names = projects.map((project) => project.name).sort()
    expect(names).toContain('atelier')
    expect(names).toContain('web')
  })
})
