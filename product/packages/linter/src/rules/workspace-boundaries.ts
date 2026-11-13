import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type WorkspaceBoundaryIssue = {
  from: string
  message: string
  ruleName: string
  to: string
}

type AnalyzeOptions = {
  projectRoot?: string
}

type WorkspaceProject = {
  name: string
  packageName?: string
  root: string
  projectType?: string
  tags: string[]
}

type PackageJsonWorkspaces = string[] | {
  packages?: string[]
}

type ModuleReference = {
  hasBindings: boolean
  isExport: boolean
  isTypeOnly: boolean
  specifier: string
}

type ResolvedImport = {
  filePath?: string
  project?: WorkspaceProject
  root?: string
}

const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs)$/
const IGNORED_PATH_SEGMENTS = new Set(['dist', 'node_modules', '.next', 'target'])
const NODE_BUILTINS = new Set([
  'assert',
  'buffer',
  'child_process',
  'crypto',
  'events',
  'fs',
  'http',
  'https',
  'os',
  'path',
  'process',
  'stream',
  'url',
  'util',
  'zlib',
])

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join('/')
}

function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

function collectSourceFiles(rootDir: string, workspaceRoot: string, results: string[]) {
  if (!existsSync(rootDir)) return

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (IGNORED_PATH_SEGMENTS.has(entry.name)) continue

    const absolutePath = path.join(rootDir, entry.name)

    if (entry.isDirectory()) {
      collectSourceFiles(absolutePath, workspaceRoot, results)
      continue
    }

    const relativePath = normalizePath(path.relative(workspaceRoot, absolutePath))
    if (SOURCE_FILE_PATTERN.test(relativePath) && !relativePath.endsWith('.d.ts')) {
      results.push(relativePath)
    }
  }
}

function parseSourceFile(workspaceRoot: string, relativePath: string) {
  const absolutePath = path.join(workspaceRoot, relativePath)
  const text = readFileSync(absolutePath, 'utf8')
  return ts.createSourceFile(
    absolutePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

function collectModuleReferences(sourceFile: ts.SourceFile) {
  const references: ModuleReference[] = []

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      references.push({
        hasBindings: Boolean(statement.importClause),
        isExport: false,
        isTypeOnly: statement.importClause?.isTypeOnly ?? false,
        specifier: statement.moduleSpecifier.text,
      })
      continue
    }

    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      references.push({
        hasBindings: true,
        isExport: true,
        isTypeOnly: statement.isTypeOnly,
        specifier: statement.moduleSpecifier.text,
      })
    }
  }

  return references
}

function getPackageName(moduleSpecifier: string) {
  if (moduleSpecifier.startsWith('@')) {
    const [scope, name] = moduleSpecifier.split('/')
    return `${scope}/${name}`
  }

  return moduleSpecifier.split('/')[0] ?? moduleSpecifier
}

function candidateFiles(base: string) {
  return [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ]
}

function resolveCandidate(workspaceRoot: string, base: string) {
  const resolved = candidateFiles(base).find((candidate) => existsSync(candidate))
  return resolved ? normalizePath(path.relative(workspaceRoot, resolved)) : null
}

function resolveRelativeImport(workspaceRoot: string, from: string, moduleSpecifier: string) {
  if (!moduleSpecifier.startsWith('.')) return null

  return resolveCandidate(
    workspaceRoot,
    path.resolve(path.join(workspaceRoot, path.dirname(from)), moduleSpecifier),
  )
}

function workspacePatternRoot(pattern: string) {
  const wildcardIndex = pattern.indexOf('*')
  const root = wildcardIndex === -1 ? pattern : pattern.slice(0, wildcardIndex)
  return root.replace(/\/$/, '')
}

function workspacePatternsFromPackageJson(workspaces: PackageJsonWorkspaces | undefined) {
  if (Array.isArray(workspaces)) return workspaces
  return workspaces?.packages ?? ['product/apps/*', 'product/packages/*']
}

function discoverWorkspaceProjects(workspaceRoot: string): WorkspaceProject[] {
  const rootPackageJson = readJson<{ workspaces?: PackageJsonWorkspaces }>(
    path.join(workspaceRoot, 'package.json'),
  )
  const workspacePatterns = workspacePatternsFromPackageJson(rootPackageJson?.workspaces)
  const projects: WorkspaceProject[] = []

  for (const pattern of workspacePatterns) {
    const root = path.join(workspaceRoot, workspacePatternRoot(pattern))
    if (!existsSync(root)) continue

    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue

      const absoluteRoot = path.join(root, entry.name)
      const relativeRoot = normalizePath(path.relative(workspaceRoot, absoluteRoot))
      const packageJson = readJson<{ name?: string }>(path.join(absoluteRoot, 'package.json'))
      const projectJson = readJson<{
        name?: string
        projectType?: string
        root?: string
        tags?: string[]
      }>(path.join(absoluteRoot, 'project.json'))

      projects.push({
        name: projectJson?.name ?? packageJson?.name ?? entry.name,
        packageName: packageJson?.name,
        root: projectJson?.root ?? relativeRoot,
        projectType: projectJson?.projectType,
        tags: projectJson?.tags ?? [],
      })
    }
  }

  return projects.sort((left, right) => right.root.length - left.root.length)
}

function projectForFile(projects: readonly WorkspaceProject[], filePath: string) {
  return projects.find(
    (project) => filePath === project.root || filePath.startsWith(`${project.root}/`),
  )
}

function projectForRoot(projects: readonly WorkspaceProject[], targetRoot: string) {
  return projects.find((project) => project.root === targetRoot)
}

function isAppProject(project: WorkspaceProject | undefined) {
  return Boolean(
    project &&
      (project.projectType === 'application' ||
        project.tags.includes('type:app') ||
        project.root.startsWith('product/apps/')),
  )
}

function isLibraryProject(project: WorkspaceProject | undefined) {
  return Boolean(
    project &&
      (project.projectType === 'library' ||
        project.tags.includes('type:library') ||
        project.root.startsWith('product/packages/')),
  )
}

function resolveAliasImport(
  workspaceRoot: string,
  ownerProject: WorkspaceProject | undefined,
  moduleSpecifier: string,
) {
  if (!ownerProject || !moduleSpecifier.startsWith('@/')) return null

  return resolveCandidate(
    workspaceRoot,
    path.join(workspaceRoot, ownerProject.root, 'src', moduleSpecifier.slice(2)),
  )
}

function packageSourceCandidates(
  workspaceRoot: string,
  project: WorkspaceProject,
  packageName: string,
  moduleSpecifier: string,
) {
  const subpath = moduleSpecifier === packageName
    ? ''
    : moduleSpecifier.slice(packageName.length + 1)
  const sourceRoot = path.join(workspaceRoot, project.root, 'src')

  if (!subpath) {
    return [path.join(sourceRoot, 'index')]
  }

  return [
    path.join(sourceRoot, subpath),
    path.join(sourceRoot, 'components', 'ui', subpath),
    path.join(sourceRoot, 'components', 'site', subpath),
  ]
}

function resolveWorkspaceImport(
  workspaceRoot: string,
  projects: readonly WorkspaceProject[],
  moduleSpecifier: string,
): ResolvedImport | null {
  for (const project of projects) {
    if (
      project.packageName &&
      (moduleSpecifier === project.packageName ||
        moduleSpecifier.startsWith(`${project.packageName}/`))
    ) {
      for (const base of packageSourceCandidates(
        workspaceRoot,
        project,
        project.packageName,
        moduleSpecifier,
      )) {
        const filePath = resolveCandidate(workspaceRoot, base)
        if (filePath) return { filePath, project, root: project.root }
      }

      return { project, root: project.root }
    }
  }

  return null
}

function resolveImport(
  workspaceRoot: string,
  projects: readonly WorkspaceProject[],
  from: string,
  moduleSpecifier: string,
): ResolvedImport | null {
  const ownerProject = projectForFile(projects, from)
  const relativeTarget = resolveRelativeImport(workspaceRoot, from, moduleSpecifier)
  if (relativeTarget) {
    return {
      filePath: relativeTarget,
      project: projectForFile(projects, relativeTarget),
    }
  }

  const aliasTarget = resolveAliasImport(workspaceRoot, ownerProject, moduleSpecifier)
  if (aliasTarget) {
    return {
      filePath: aliasTarget,
      project: projectForFile(projects, aliasTarget),
    }
  }

  return resolveWorkspaceImport(workspaceRoot, projects, moduleSpecifier)
}

function isRuntimePureProject(project: WorkspaceProject | undefined) {
  return Boolean(project?.tags.includes('runtime:pure'))
}

function isNodeImport(moduleSpecifier: string) {
  return moduleSpecifier.startsWith('node:') || NODE_BUILTINS.has(moduleSpecifier)
}

function isRouteLocalFeature(filePath: string) {
  return /\/src\/app\/.*\/_features\//.test(filePath)
}

function routeFeatureRoot(filePath: string) {
  const marker = '/_features/'
  const markerIndex = filePath.indexOf(marker)
  if (markerIndex === -1) return null
  return filePath.slice(0, markerIndex + marker.length - 1)
}

function ownerRouteFromFeatureRoot(root: string) {
  return root.replace(/\/_features$/, '')
}

function canImportRouteFeature(from: string, to: string) {
  const targetRoot = routeFeatureRoot(to)
  if (!targetRoot) return true

  const isApiImporter = /\/src\/app\/api\//.test(from)
  if (!isApiImporter) return true
  if (/\.assemble\.(ts|tsx)$/.test(to)) return true

  if (from.startsWith(`${targetRoot}/`)) return true

  const ownerRoute = ownerRouteFromFeatureRoot(targetRoot)
  return from.startsWith(`${ownerRoute}/`)
}

function graphPathForCycle(path: readonly string[]) {
  return path.join(' -> ')
}

function findImportCycles(graph: Map<string, Set<string>>) {
  const issues: Array<{ from: string; to: string }> = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const stack: string[] = []
  const seenCycles = new Set<string>()

  function visit(node: string) {
    if (visited.has(node)) return
    if (visiting.has(node)) return

    visiting.add(node)
    stack.push(node)

    for (const target of graph.get(node) ?? []) {
      const stackIndex = stack.indexOf(target)
      if (stackIndex !== -1) {
        const cycle = [...stack.slice(stackIndex), target]
        const key = cycle.slice().sort().join('|')
        if (!seenCycles.has(key)) {
          seenCycles.add(key)
          issues.push({
            from: cycle[0],
            to: graphPathForCycle(cycle),
          })
        }
        continue
      }

      visit(target)
    }

    stack.pop()
    visiting.delete(node)
    visited.add(node)
  }

  for (const node of [...graph.keys()].sort()) {
    visit(node)
  }

  return issues
}

export function analyzeWorkspaceBoundaries(options: AnalyzeOptions = {}) {
  const workspaceRoot = options.projectRoot ?? process.cwd()
  const projects = discoverWorkspaceProjects(workspaceRoot)
  const sourceFiles: string[] = []
  const issues: WorkspaceBoundaryIssue[] = []
  const importGraph = new Map<string, Set<string>>()

  collectSourceFiles(path.join(workspaceRoot, 'product/apps'), workspaceRoot, sourceFiles)
  collectSourceFiles(path.join(workspaceRoot, 'product/packages'), workspaceRoot, sourceFiles)

  for (const from of sourceFiles.sort()) {
    const sourceFile = parseSourceFile(workspaceRoot, from)
    const ownerProject = projectForFile(projects, from)

    for (const reference of collectModuleReferences(sourceFile)) {
      if (reference.specifier.endsWith('.css') && (reference.hasBindings || reference.isExport)) {
        issues.push({
          from,
          message: 'CSS files must be imported for side effects only',
          ruleName: 'css-import-only',
          to: reference.specifier,
        })
      }

      const resolved = resolveImport(workspaceRoot, projects, from, reference.specifier)
      const targetProject =
        resolved?.project ?? (resolved?.root ? projectForRoot(projects, resolved.root) : undefined)

      if (resolved?.filePath && !reference.isTypeOnly) {
        const edges = importGraph.get(from) ?? new Set<string>()
        edges.add(resolved.filePath)
        importGraph.set(from, edges)
      }

      if (isLibraryProject(ownerProject) && isAppProject(targetProject)) {
        issues.push({
          from,
          message: 'workspace libraries must not depend on app code',
          ruleName: 'library-to-app',
          to: reference.specifier,
        })
      }

      if (from.startsWith('product/packages/') && isAppProject(targetProject)) {
        issues.push({
          from,
          message: 'workspace packages must not depend on app code',
          ruleName: 'package-to-app',
          to: reference.specifier,
        })
      }

      if (
        resolved?.filePath &&
        isRouteLocalFeature(resolved.filePath) &&
        !canImportRouteFeature(from, resolved.filePath)
      ) {
        issues.push({
          from,
          message: 'route-local _features modules must not be imported from outside their route',
          ruleName: 'route-local-feature',
          to: reference.specifier,
        })
      }

      if (
        !isRuntimePureProject(ownerProject) ||
        !from.startsWith(`${ownerProject?.root}/src/`) ||
        reference.isTypeOnly
      ) {
        continue
      }

      if (reference.specifier.startsWith('.')) continue
      if (resolved?.project === ownerProject) continue

      const packageName = getPackageName(reference.specifier)
      if (
        isNodeImport(reference.specifier) ||
        packageName === 'react' ||
        packageName === 'react-dom' ||
        packageName === '@tauri-apps/api' ||
        !resolved?.project
      ) {
        issues.push({
          from,
          message: 'runtime:pure projects must not import runtime-specific packages',
          ruleName: 'runtime-pure',
          to: reference.specifier,
        })
      }
    }
  }

  for (const cycle of findImportCycles(importGraph)) {
    issues.push({
      from: cycle.from,
      message: 'workspace source files must not form import cycles',
      ruleName: 'import-cycle',
      to: cycle.to,
    })
  }

  return issues.sort((left, right) =>
    left.from === right.from
      ? left.ruleName === right.ruleName
        ? left.to.localeCompare(right.to)
        : left.ruleName.localeCompare(right.ruleName)
      : left.from.localeCompare(right.from),
  )
}

export function formatWorkspaceBoundaryIssue(issue: WorkspaceBoundaryIssue) {
  return `${issue.from}: [${issue.ruleName}] ${issue.message}: ${issue.to}. Read: /harness/ai-org/knowledge/design-docs/references/import-boundaries.md`
}
