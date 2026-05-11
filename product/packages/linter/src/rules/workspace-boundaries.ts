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

const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs)$/
const IGNORED_PATH_SEGMENTS = new Set(['dist', 'node_modules'])
const PACKAGE_ROOTS = new Map([
  ['@tenzyu/ui', 'product/packages/ui'],
  ['@tenzyu/osu-skin-core', 'product/packages/osu-skin-core'],
  ['@tenzyu/linter', 'product/packages/linter'],
])
const CORE_ALLOWED_EXTERNALS = new Set<string>()

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join('/')
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

function collectModuleSpecifiers(sourceFile: ts.SourceFile) {
  const specifiers: string[] = []

  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      specifiers.push(statement.moduleSpecifier.text)
    }
  }

  return specifiers
}

function getPackageName(moduleSpecifier: string) {
  if (moduleSpecifier.startsWith('@')) {
    const [scope, name] = moduleSpecifier.split('/')
    return `${scope}/${name}`
  }

  return moduleSpecifier.split('/')[0] ?? moduleSpecifier
}

function resolveRelativeImport(workspaceRoot: string, from: string, moduleSpecifier: string) {
  if (!moduleSpecifier.startsWith('.')) return null

  const base = path.resolve(path.join(workspaceRoot, path.dirname(from)), moduleSpecifier)
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]

  const resolved = candidates.find((candidate) => existsSync(candidate))
  return resolved ? normalizePath(path.relative(workspaceRoot, resolved)) : null
}

function resolveWorkspaceImport(moduleSpecifier: string) {
  for (const [packageName, packageRoot] of PACKAGE_ROOTS) {
    if (moduleSpecifier === packageName || moduleSpecifier.startsWith(`${packageName}/`)) {
      return packageRoot
    }
  }

  return null
}

function isPackageFile(filePath: string) {
  return filePath.startsWith('product/packages/')
}

function isAppFile(filePath: string) {
  return filePath.startsWith('product/apps/')
}

function isCoreSourceFile(filePath: string) {
  return filePath.startsWith('product/packages/osu-skin-core/src/')
}

export function analyzeWorkspaceBoundaries(options: AnalyzeOptions = {}) {
  const workspaceRoot = options.projectRoot ?? process.cwd()
  const sourceFiles: string[] = []
  const issues: WorkspaceBoundaryIssue[] = []

  collectSourceFiles(path.join(workspaceRoot, 'product/apps'), workspaceRoot, sourceFiles)
  collectSourceFiles(path.join(workspaceRoot, 'product/packages'), workspaceRoot, sourceFiles)

  for (const from of sourceFiles.sort()) {
    const sourceFile = parseSourceFile(workspaceRoot, from)

    for (const moduleSpecifier of collectModuleSpecifiers(sourceFile)) {
      const relativeTarget = resolveRelativeImport(workspaceRoot, from, moduleSpecifier)
      const workspaceTarget = relativeTarget ?? resolveWorkspaceImport(moduleSpecifier)

      if (isPackageFile(from) && workspaceTarget && isAppFile(workspaceTarget)) {
        issues.push({
          from,
          message: 'workspace packages must not depend on app code',
          ruleName: 'package-to-app',
          to: moduleSpecifier,
        })
      }

      if (from.startsWith('product/packages/ui/') && workspaceTarget && isAppFile(workspaceTarget)) {
        issues.push({
          from,
          message: '@tenzyu/ui must not depend on app code',
          ruleName: 'ui-app-boundary',
          to: moduleSpecifier,
        })
      }

      if (!isCoreSourceFile(from)) continue

      if (moduleSpecifier.startsWith('.')) continue

      const packageName = getPackageName(moduleSpecifier)
      if (!CORE_ALLOWED_EXTERNALS.has(packageName)) {
        issues.push({
          from,
          message: '@tenzyu/osu-skin-core source must stay pure and avoid runtime package dependencies',
          ruleName: 'osu-skin-core-pure',
          to: moduleSpecifier,
        })
      }
    }
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
  return `${issue.from}: [${issue.ruleName}] ${issue.message}: ${issue.to}. Read: /docs/design-docs/references/import-boundaries.md`
}
