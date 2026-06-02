import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments, toPosixPath } from './docs'
import { asStringArray as toStringArray, type HarnessDocument } from './schema'

export type RepoFileKind =
  | 'source'
  | 'test'
  | 'config'
  | 'docs'
  | 'harness'
  | 'manifest'
  | 'unknown'

export type RepoProjectType = 'app' | 'lib' | 'rust' | 'nix' | 'unknown'

export type RepoProject = {
  name: string
  relativeRoot: string
  sourceRoot: string | null
  type: RepoProjectType
  manifest: 'project.json' | 'package.json' | 'Cargo.toml' | 'flake.nix' | null
  tags: string[]
  files: number
  languages: string[]
}

export type RepoFile = {
  path: string
  kind: RepoFileKind
  size: number
}

export type RepoMap = {
  workspace: {
    root: string
    packageManager: string | null
    taskRunner: string | null
    appsRoot: string
    packagesRoot: string
    harnessRoot: string
  }
  projects: RepoProject[]
  files: RepoFile[]
  ownershipHints: OwnershipHint[]
  warnings: string[]
}

export type OwnershipHint = {
  project: string
  path: string
  ownerRole: string | null
  source: 'nx-project' | 'role-selector' | 'harness-repo-map' | 'unknown'
}

export type PathOwnershipEntry = {
  path: string
  project: string | null
  ownerRole: string | null
  ownerRolePath: string | null
  source: OwnershipHint['source']
}

export type PathOwnership = {
  entries: PathOwnershipEntry[]
}

type WorkspaceMarkers = {
  packageManager: string | null
  taskRunner: string | null
}

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.rs',
  '.go',
  '.py',
  '.rb',
  '.java',
  '.kt',
  '.swift',
  '.c',
  '.cc',
  '.cpp',
  '.h',
  '.hpp',
])

const TEST_PATTERNS = [/\.test\.[a-z]+$/, /\.spec\.[a-z]+$/, /__tests__\//, /\/tests?\//]
const DOC_EXTENSIONS = new Set(['.md', '.mdx'])
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.harness',
  'dist',
  'build',
  '.next',
  '.cache',
  '.nx',
  'target',
  '.turbo',
])
const LANGUAGE_BY_EXT: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.rs': 'rust',
  '.go': 'go',
  '.py': 'python',
  '.rb': 'ruby',
  '.java': 'java',
  '.kt': 'kotlin',
  '.swift': 'swift',
  '.c': 'c',
  '.cc': 'cpp',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.nix': 'nix',
}

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function collectSelectors(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return []
  const record = raw as Record<string, unknown>
  const out: string[] = []
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') out.push(item)
      }
      continue
    }
    if (typeof value === 'string') out.push(value)
  }
  return out
}

function pathMatches(target: string, pattern: string): boolean {
  if (pattern === target) return true
  if (!pattern.includes('*')) return pattern === target
  const regex = new RegExp(
    '^' + pattern.split('*').map((segment) => segment.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$',
  )
  return regex.test(target)
}

function classifyFile(relativePath: string): RepoFileKind {
  if (relativePath.startsWith('harness/')) return 'harness'
  if (DOC_EXTENSIONS.has(path.extname(relativePath))) return 'docs'
  for (const pattern of TEST_PATTERNS) {
    if (pattern.test(relativePath)) return 'test'
  }
  if (/(^|\/)(package\.json|tsconfig[^/]*\.json|nx\.json|project\.json|Cargo\.toml|flake\.nix)$/.test(relativePath)) {
    return 'manifest'
  }
  if (/\.(json|ya?ml|toml|nix|lock)$/.test(relativePath)) return 'config'
  if (SOURCE_EXTENSIONS.has(path.extname(relativePath))) return 'source'
  return 'unknown'
}

function detectLanguage(relativePath: string): string | null {
  return LANGUAGE_BY_EXT[path.extname(relativePath)] ?? null
}

function detectWorkspaceMarkers(projectRoot: string): WorkspaceMarkers {
  const rootPackage = readJson(path.join(projectRoot, 'package.json')) as Record<string, unknown> | null
  let packageManager: string | null = null
  if (existsSync(path.join(projectRoot, 'bun.lockb')) || existsSync(path.join(projectRoot, 'bun.lock'))) {
    packageManager = 'bun'
  } else if (existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm'
  } else if (existsSync(path.join(projectRoot, 'yarn.lock'))) {
    packageManager = 'yarn'
  } else if (existsSync(path.join(projectRoot, 'package-lock.json'))) {
    packageManager = 'npm'
  }
  if (!packageManager && rootPackage && typeof rootPackage.packageManager === 'string') {
    packageManager = String(rootPackage.packageManager).split('@')[0] ?? null
  }
  const taskRunner = existsSync(path.join(projectRoot, 'nx.json')) ? 'nx' : null
  return { packageManager, taskRunner }
}

function walkFiles(projectRoot: string, maxFiles = 5000): string[] {
  const out: string[] = []
  const visit = (dir: string) => {
    if (out.length >= maxFiles) return
    let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>
    try {
      const raw = readdirSync(dir, { withFileTypes: true, encoding: 'utf-8' })
      entries = raw as unknown as Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>
    } catch {
      return
    }
    for (const entry of entries) {
      if (out.length >= maxFiles) return
      if (entry.name.startsWith('.') && entry.name !== '.opencode' && entry.name !== '.agent') continue
      if (IGNORE_DIRS.has(entry.name)) continue
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        visit(absolute)
      } else if (entry.isFile()) {
        out.push(toPosixPath(path.relative(projectRoot, absolute)))
      }
    }
  }
  visit(projectRoot)
  return out.sort()
}

function detectProjectType(projectDir: string): RepoProjectType {
  if (existsSync(path.join(projectDir, 'project.json'))) {
    const data = readJson(path.join(projectDir, 'project.json')) as Record<string, unknown> | null
    const projectType = asString(data?.projectType)
    if (projectType === 'library') return 'lib'
    if (projectType === 'application') return 'app'
  }
  if (existsSync(path.join(projectDir, 'Cargo.toml'))) return 'rust'
  if (existsSync(path.join(projectDir, 'flake.nix'))) return 'nix'
  return 'unknown'
}

function collectProjects(projectRoot: string): RepoProject[] {
  const appsRoot = path.join(projectRoot, 'product/apps')
  const packagesRoot = path.join(projectRoot, 'product/packages')
  const out: RepoProject[] = []

  const visit = (root: string, defaultType: 'app' | 'lib') => {
    if (!existsSync(root)) return
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const projectDir = path.join(root, entry.name)
      const projectJsonPath = path.join(projectDir, 'project.json')
      const manifest: RepoProject['manifest'] = existsSync(projectJsonPath)
        ? 'project.json'
        : existsSync(path.join(projectDir, 'package.json'))
          ? 'package.json'
          : existsSync(path.join(projectDir, 'Cargo.toml'))
            ? 'Cargo.toml'
            : existsSync(path.join(projectDir, 'flake.nix'))
              ? 'flake.nix'
              : null
      if (!manifest) continue

      let name = entry.name
      let sourceRoot: string | null = null
      let tags: string[] = []
      let type: RepoProjectType = defaultType

      if (manifest === 'project.json') {
        const data = readJson(projectJsonPath) as Record<string, unknown> | null
        if (data) {
          if (asString(data.name)) name = asString(data.name) as string
          if (asString(data.sourceRoot)) sourceRoot = toPosixPath(asString(data.sourceRoot) as string)
          tags = toStringArray(data.tags)
        }
        type = detectProjectType(projectDir)
      } else {
        type = detectProjectType(projectDir)
      }

      const relativeRoot = toPosixPath(path.relative(projectRoot, projectDir))
      const files = walkFiles(projectDir).filter((filePath) => !filePath.includes('/node_modules/'))
      const languages = new Set<string>()
      for (const file of files) {
        const language = detectLanguage(file)
        if (language) languages.add(language)
      }

      out.push({
        name,
        relativeRoot,
        sourceRoot,
        type,
        manifest,
        tags,
        files: files.length,
        languages: [...languages].sort(),
      })
    }
  }

  visit(appsRoot, 'app')
  visit(packagesRoot, 'lib')
  return out.sort((left, right) => left.relativeRoot.localeCompare(right.relativeRoot))
}

function collectRepoFiles(projectRoot: string): RepoFile[] {
  const files = walkFiles(projectRoot)
  const out: RepoFile[] = []
  for (const relativePath of files) {
    if (relativePath.includes('/node_modules/')) continue
    let size = 0
    try {
      size = statSync(path.join(projectRoot, relativePath)).size
    } catch {
      size = 0
    }
    out.push({ path: relativePath, kind: classifyFile(relativePath), size })
  }
  return out
}

function roleOwners(documents: HarnessDocument[]) {
  return documents
    .filter((document) => document.frontmatter?.kind === 'role')
    .map((document) => ({
      id: asString(document.frontmatter?.id),
      path: document.relativePath,
      selectors: collectSelectors(document.frontmatter?.selectors),
    }))
    .filter(
      (role): role is { id: string; path: string; selectors: string[] } => role.id !== null,
    )
}

function projectForPath(target: string, projects: RepoProject[]): RepoProject | null {
  let best: RepoProject | null = null
  for (const project of projects) {
    if (target === project.relativeRoot || target === project.relativeRoot + '/') return project
    if (target.startsWith(project.relativeRoot + '/')) {
      if (!best || project.relativeRoot.length > best.relativeRoot.length) best = project
    }
    if (project.sourceRoot && target.startsWith(project.sourceRoot + '/')) {
      if (!best || project.sourceRoot.length > (best.sourceRoot?.length ?? 0)) best = project
    }
  }
  return best
}

function selectorMatches(selector: string, target: string): boolean {
  if (pathMatches(target, selector)) return true
  const trimmed = selector.replace(/\/?\*\*?$/, '')
  if (target === trimmed) return true
  return target.startsWith(trimmed + '/')
}

function extractManualOwnershipFromRepoMap(documents: HarnessDocument[]): OwnershipHint[] {
  const repoMap = documents.find((document) => document.frontmatter?.kind === 'knowledge' && document.frontmatter?.knowledge_type === 'repo-map')
  if (!repoMap) return []
  const out: OwnershipHint[] = []
  const rows = repoMap.body.split(/\r?\n/)
  for (const row of rows) {
    const match = row.match(/^\|\s*`?([\w-]+)`?\s*\|\s*`?([^|`]+?)`?\s*\|\s*([^|]+?)\s*\|/)
    if (!match) continue
    const [, project, projectPath, ownerCell] = match
    if (!project || !projectPath) continue
    const owner = ownerCell.includes('/') ? ownerCell.split('/').map((segment) => segment.trim()).pop() : ownerCell.trim()
    out.push({
      project,
      path: projectPath.trim(),
      ownerRole: owner || null,
      source: 'harness-repo-map',
    })
  }
  return out
}

export function compileRepoMap(projectRoot: string): RepoMap {
  const resolvedRoot = path.resolve(projectRoot)
  const warnings: string[] = []
  const projects = collectProjects(resolvedRoot)
  const files = collectRepoFiles(resolvedRoot)
  const workspace = detectWorkspaceMarkers(resolvedRoot)
  const documents = loadHarnessDocuments(resolvedRoot)
  const roles = roleOwners(documents)
  const manualHints = extractManualOwnershipFromRepoMap(documents)

  const projectRoots = new Set(projects.map((project) => project.relativeRoot))
  for (const project of projects) {
    if (!project.sourceRoot) continue
    if (projectRoots.has(project.sourceRoot)) {
      warnings.push(`Project '${project.name}' has sourceRoot '${project.sourceRoot}' that shadows a known project root.`)
    }
  }

  const hints: OwnershipHint[] = []
  const seenHint = new Set<string>()
  const hintKey = (project: string, pathValue: string) => `${project}::${pathValue}`

  for (const manual of manualHints) {
    const key = hintKey(manual.project, manual.path)
    if (seenHint.has(key)) continue
    seenHint.add(key)
    hints.push(manual)
  }

  for (const project of projects) {
    const role = roles.find((candidate) =>
      candidate.selectors.some((selector) => selectorMatches(selector, project.relativeRoot)),
    )
    const key = hintKey(project.name, project.relativeRoot)
    if (seenHint.has(key)) continue
    seenHint.add(key)
    hints.push({
      project: project.name,
      path: project.relativeRoot,
      ownerRole: role?.id ?? null,
      source: role ? 'role-selector' : 'nx-project',
    })
  }

  return {
    workspace: {
      root: toPosixPath(path.relative(resolvedRoot, resolvedRoot)) || '.',
      packageManager: workspace.packageManager,
      taskRunner: workspace.taskRunner,
      appsRoot: existsSync(path.join(resolvedRoot, 'product/apps')) ? 'product/apps' : '',
      packagesRoot: existsSync(path.join(resolvedRoot, 'product/packages')) ? 'product/packages' : '',
      harnessRoot: existsSync(path.join(resolvedRoot, 'harness')) ? 'harness' : '',
    },
    projects,
    files,
    ownershipHints: hints.sort((left, right) => left.path.localeCompare(right.path)),
    warnings,
  }
}

export function compilePathOwnership(projectRoot: string, repoMap: RepoMap): PathOwnership {
  const resolvedRoot = path.resolve(projectRoot)
  const documents = loadHarnessDocuments(resolvedRoot)
  const roles = roleOwners(documents)
  const entries: PathOwnershipEntry[] = []

  for (const project of repoMap.projects) {
    const role = roles.find((candidate) =>
      candidate.selectors.some((selector) => selectorMatches(selector, project.relativeRoot)),
    )
    entries.push({
      path: project.relativeRoot,
      project: project.name,
      ownerRole: role?.id ?? null,
      ownerRolePath: role?.path ?? null,
      source: role ? 'role-selector' : 'nx-project',
    })
  }

  const knownPaths = new Set(entries.map((entry) => entry.path))
  for (const hint of repoMap.ownershipHints) {
    if (knownPaths.has(hint.path)) continue
    entries.push({
      path: hint.path,
      project: hint.project,
      ownerRole: hint.ownerRole,
      ownerRolePath: null,
      source: hint.source,
    })
  }

  entries.sort((left, right) => left.path.localeCompare(right.path))

  return {
    entries,
  }
}

export function lookupOwnership(
  ownership: PathOwnership,
  target: string,
): PathOwnershipEntry | null {
  const clean = toPosixPath(target).replace(/^\.\//, '').replace(/\/$/, '')
  let best: PathOwnershipEntry | null = null
  for (const entry of ownership.entries) {
    if (entry.path === clean) return entry
    if (clean.startsWith(entry.path + '/')) {
      if (!best || entry.path.length > best.path.length) best = entry
    }
  }
  return best
}

export function resolveOwnership(
  target: string,
  projectRoot: string,
): { entry: PathOwnershipEntry; fromCache: boolean } {
  const ownership = compilePathOwnershipFromCache(projectRoot) ?? compilePathOwnership(projectRoot, compileRepoMap(projectRoot))
  const fromCache = compilePathOwnershipFromCache(projectRoot) !== null
  const clean = toPosixPath(target).replace(/^\.\//, '').replace(/\/$/, '')
  const direct = lookupOwnership(ownership, clean)
  if (direct) return { entry: direct, fromCache }
  const project = projectForPath(clean, ownership.entries.map((entry) => ({ relativeRoot: entry.path, name: entry.project ?? '', sourceRoot: null, type: 'unknown' as const, manifest: null, tags: [], files: 0, languages: [] })))
  return {
    entry: {
      path: clean,
      project: project?.name ?? null,
      ownerRole: null,
      ownerRolePath: null,
      source: 'unknown',
    },
    fromCache,
  }
}

function compilePathOwnershipFromCache(projectRoot: string): PathOwnership | null {
  const target = path.join(projectRoot, '.harness/generated/path-ownership.json')
  if (!existsSync(target)) return null
  try {
    return JSON.parse(readFileSync(target, 'utf-8')) as PathOwnership
  } catch {
    return null
  }
}
