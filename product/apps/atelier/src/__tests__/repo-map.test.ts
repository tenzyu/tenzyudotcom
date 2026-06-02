import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  compilePathOwnership,
  compileRepoMap,
  lookupOwnership,
  type RepoMap,
} from '../core/repo-map'

const ROOT = mkdtempSync(path.join(tmpdir(), 'atelier-repo-map-'))

function writeFile(relativePath: string, body: string) {
  const target = path.join(ROOT, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, body)
}

function seed() {
  writeFile(
    'package.json',
    JSON.stringify({ name: 'workspace-root', workspaces: ['product/*'] }, null, 2)
  )
  writeFile('nx.json', JSON.stringify({ namedInputs: {}, targetDefaults: {} }))

  writeFile(
    'product/apps/web/project.json',
    JSON.stringify({
      name: 'web',
      root: 'product/apps/web',
      sourceRoot: 'product/apps/web/src',
      projectType: 'application',
      tags: ['scope:web'],
    })
  )
  writeFile('product/apps/web/src/app.tsx', 'export const App = () => null\n')

  writeFile(
    'product/packages/ui/project.json',
    JSON.stringify({
      name: 'ui',
      root: 'product/packages/ui',
      sourceRoot: 'product/packages/ui/src',
      projectType: 'library',
      tags: ['scope:ui'],
    })
  )
  writeFile('product/packages/ui/src/button.tsx', 'export const Button = () => null\n')

  writeFile(
    'product/apps/castalia/Cargo.toml',
    '[package]\nname = "castalia"\nversion = "0.1.0"\n'
  )

  writeFile(
    'harness/actions/roles/domain/web-app-engineer.md',
    [
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
    ].join('\n')
  )
}

describe('repo-map generator (M11)', () => {
  beforeEach(() => {
    rmSync(ROOT, { recursive: true, force: true })
    mkdirSync(ROOT, { recursive: true })
    seed()
  })

  afterAll(() => {
    rmSync(ROOT, { recursive: true, force: true })
  })

  test('compiles workspace markers from package.json and nx.json', () => {
    const map = compileRepoMap(ROOT) as RepoMap & { workspace: { packageManager: string | null; taskRunner: string | null } }
    expect(map.workspace.taskRunner).toBe('nx')
    expect(map.workspace.appsRoot).toBe('product/apps')
    expect(map.workspace.packagesRoot).toBe('product/packages')
  })

  test('detects Nx apps, libs, and Cargo projects with their languages', () => {
    const map = compileRepoMap(ROOT)
    const web = map.projects.find((project) => project.relativeRoot === 'product/apps/web')
    const ui = map.projects.find((project) => project.relativeRoot === 'product/packages/ui')
    const castalia = map.projects.find((project) => project.relativeRoot === 'product/apps/castalia')

    expect(web?.type).toBe('app')
    expect(web?.manifest).toBe('project.json')
    expect(web?.languages).toContain('typescript')

    expect(ui?.type).toBe('lib')
    expect(ui?.manifest).toBe('project.json')

    expect(castalia?.type).toBe('rust')
    expect(castalia?.manifest).toBe('Cargo.toml')
  })

  test('classifies files into kind buckets', () => {
    const map = compileRepoMap(ROOT)
    const sourceFiles = map.files.filter((file) => file.kind === 'source')
    const manifestFiles = map.files.filter((file) => file.kind === 'manifest')
    expect(sourceFiles.length).toBeGreaterThan(0)
    expect(manifestFiles.some((file) => file.path.endsWith('package.json'))).toBe(true)
  })

  test('matches owner role for projects covered by selectors', () => {
    const map = compileRepoMap(ROOT)
    const web = map.ownershipHints.find((hint) => hint.path === 'product/apps/web')
    expect(web?.ownerRole).toBe('role.domain.web-app-engineer')
    expect(web?.source).toBe('role-selector')
  })

  test('builds path-ownership index sorted by path', () => {
    const map = compileRepoMap(ROOT)
    const ownership = compilePathOwnership(ROOT, map)
    expect(ownership.entries.length).toBeGreaterThan(0)
    const paths = ownership.entries.map((entry) => entry.path)
    const sorted = [...paths].sort((a, b) => a.localeCompare(b))
    expect(paths).toEqual(sorted)
  })

  test('lookupOwnership returns exact then longest-prefix match', () => {
    const map = compileRepoMap(ROOT)
    const ownership = compilePathOwnership(ROOT, map)
    const exact = lookupOwnership(ownership, 'product/apps/web')
    expect(exact?.project).toBe('web')
    const nested = lookupOwnership(ownership, 'product/apps/web/src/app.tsx')
    expect(nested?.project).toBe('web')
    const unknown = lookupOwnership(ownership, 'product/apps/missing/src/x.ts')
    expect(unknown).toBeNull()
  })
})
