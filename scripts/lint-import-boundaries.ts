import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type ImportBoundaryIssue = {
  ruleName: string
  from: string
  to: string
}

type AnalyzeOptions = {
  projectRoot?: string
  tsconfigPath?: string
}

const ROUTE_FEATURE_ROOTS = [
  { root: 'src/app/[locale]/_features' },
  { root: 'src/app/[locale]/(admin)/editor/_features' },
  { root: 'src/app/[locale]/(main)/_features' },
  { root: 'src/app/[locale]/(main)/(home)/_features' },
  { root: 'src/app/[locale]/(main)/archives/_features' },
  { root: 'src/app/[locale]/(main)/archives/osu-profile/_features' },
  {
    root: 'src/app/[locale]/(main)/blog/_features',
    allowWithinDomain: ['src/app/[locale]/(main)/blog/[slug]/_features'],
  },
  {
    root: 'src/app/[locale]/(main)/blog/[slug]/_features',
    allowWithinDomain: ['src/app/[locale]/(main)/blog/_features'],
  },
  { root: 'src/app/[locale]/(main)/links/_features' },
  { root: 'src/app/[locale]/(main)/links/[shortUrl]/_features' },
  { root: 'src/app/[locale]/(main)/notes/_features' },
  { root: 'src/app/[locale]/(main)/pointers/_features' },
  { root: 'src/app/[locale]/(main)/portfolio/_features' },
  { root: 'src/app/[locale]/(main)/puzzles/_features' },
  { root: 'src/app/[locale]/(main)/recommendations/_features' },
  { root: 'src/app/[locale]/(main)/tools/_features' },
  { root: 'src/app/[locale]/(main)/tools/dot-type/_features' },
] as const

const INCLUDED_ROOTS = ['src']
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs)$/
const IGNORED_SUFFIX_PATTERN = /\.(test|spec|d)\.(ts|tsx|js|jsx|mjs)$/

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join('/')
}

function isSourceFile(relativePath: string) {
  return SOURCE_FILE_PATTERN.test(relativePath) && !IGNORED_SUFFIX_PATTERN.test(relativePath)
}

function collectSourceFiles(rootDir: string, currentDir: string, results: string[]) {
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    const absolutePath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      collectSourceFiles(rootDir, absolutePath, results)
      continue
    }

    const relativePath = normalizePath(path.relative(rootDir, absolutePath))
    if (isSourceFile(relativePath)) {
      results.push(relativePath)
    }
  }
}

function loadTsConfig(tsconfigPath: string) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
  }

  const config = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
  )

  if (config.errors.length > 0) {
    throw new Error(
      config.errors
        .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n'))
        .join('\n'),
    )
  }

  return config
}

function getOwnerPathFromFeatureRoot(root: string) {
  return root.replace(/\/_features$/, '')
}

function getAncestorFeatureRoots(root: string) {
  const currentOwner = getOwnerPathFromFeatureRoot(root)

  return ROUTE_FEATURE_ROOTS
    .map((entry) => entry.root)
    .filter((candidateRoot) => candidateRoot !== root)
    .filter((candidateRoot) => {
      const candidateOwner = getOwnerPathFromFeatureRoot(candidateRoot)
      return currentOwner.startsWith(`${candidateOwner}/`)
    })
}

function isRouteFeaturePath(filePath: string, root: string) {
  return filePath.startsWith(`${root}/`)
}

function isRouteFeatureFile(filePath: string) {
  return ROUTE_FEATURE_ROOTS.some(({ root }) => isRouteFeaturePath(filePath, root))
}

function getAllowedFeatureRoots(root: string, allowWithinDomain: readonly string[] = []) {
  return [root, ...allowWithinDomain, ...getAncestorFeatureRoots(root)]
}

function isAppEntrypoint(filePath: string) {
  return (
    /^src\/app\/.*\/page\.tsx$/.test(filePath) ||
    /^src\/app\/.*\/layout\.tsx$/.test(filePath) ||
    /^src\/app\/.*\/route\.ts$/.test(filePath) ||
    /^src\/app\/.*\/actions\.ts$/.test(filePath) ||
    /^src\/app\/.*\/[^/]+\.actions\.ts$/.test(filePath)
  )
}

function resolveImportPath(
  moduleSpecifier: string,
  containingFile: string,
  compilerOptions: ts.CompilerOptions,
  host: ts.ModuleResolutionHost,
) {
  const resolved = ts.resolveModuleName(
    moduleSpecifier,
    containingFile,
    compilerOptions,
    host,
  ).resolvedModule

  return resolved?.resolvedFileName
}

export function analyzeImportBoundaries(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()
  const tsconfigPath = options.tsconfigPath ?? path.join(projectRoot, 'tsconfig.json')
  const config = loadTsConfig(tsconfigPath)
  const compilerOptions = config.options
  const host = ts.createCompilerHost(compilerOptions, true)

  const relativePaths: string[] = []
  for (const includedRoot of INCLUDED_ROOTS) {
    const absoluteRoot = path.join(projectRoot, includedRoot)
    collectSourceFiles(projectRoot, absoluteRoot, relativePaths)
  }

  const issues: ImportBoundaryIssue[] = []
  const incomingDependents = new Map<string, Set<string>>()

  for (const fromRelativePath of relativePaths.sort()) {
    const absolutePath = path.join(projectRoot, fromRelativePath)
    const sourceText = readFileSync(absolutePath, 'utf8')
    const sourceFile = ts.createSourceFile(
      absolutePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      fromRelativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
        continue
      }

      const importClause = statement.importClause
      if (importClause?.isTypeOnly) {
        continue
      }

      const resolvedFile = resolveImportPath(
        statement.moduleSpecifier.text,
        absolutePath,
        compilerOptions,
        host,
      )
      if (!resolvedFile) {
        continue
      }

      const toRelativePath = normalizePath(path.relative(projectRoot, resolvedFile))
      if (!toRelativePath.startsWith('src/') || !isSourceFile(toRelativePath)) {
        continue
      }

      const dependents = incomingDependents.get(toRelativePath) ?? new Set<string>()
      dependents.add(fromRelativePath)
      incomingDependents.set(toRelativePath, dependents)

      for (const { root, allowWithinDomain } of ROUTE_FEATURE_ROOTS) {
        if (!isRouteFeaturePath(fromRelativePath, root)) {
          continue
        }

        if (!isRouteFeatureFile(toRelativePath)) {
          continue
        }

        const allowedRoots = getAllowedFeatureRoots(root, allowWithinDomain)
        if (allowedRoots.some((allowedRoot) => isRouteFeaturePath(toRelativePath, allowedRoot))) {
          continue
        }

        issues.push({
          ruleName: `Route-local _features under ${root} must not depend on another route-local _features slice.`,
          from: fromRelativePath,
          to: toRelativePath,
        })
      }

      if (
        fromRelativePath.startsWith('src/features/') &&
        isRouteFeatureFile(toRelativePath)
      ) {
        issues.push({
          ruleName:
            'Shared features in src/features/ must not depend on route-local src/app/.../_features modules.',
          from: fromRelativePath,
          to: toRelativePath,
        })
      }

      const fromAllowsInfra =
        fromRelativePath.endsWith('.assemble.ts') ||
        fromRelativePath.endsWith('.infra.ts') ||
        fromRelativePath === 'src/config/site.ts' ||
        /\/editor-session\.ts$/.test(fromRelativePath) ||
        /\/createApi\.ts$/.test(fromRelativePath)
      const isGeneralInfra =
        toRelativePath.endsWith('.infra.ts') &&
        toRelativePath !== 'src/config/env.infra.ts'

      if (!fromAllowsInfra && isGeneralInfra) {
        issues.push({
          ruleName:
            'Only assemble and infra modules may depend on general infrastructure implementations.',
          from: fromRelativePath,
          to: toRelativePath,
        })
      }

      if (
        /\.(domain|port)\.ts$/.test(fromRelativePath) &&
        /\.(infra|assemble)\.ts$/.test(toRelativePath)
      ) {
        issues.push({
          ruleName:
            'Domain and port modules must not depend on outer implementation layers like infra or assemble.',
          from: fromRelativePath,
          to: toRelativePath,
        })
      }

      if (isAppEntrypoint(fromRelativePath) && toRelativePath.endsWith('.infra.ts')) {
        issues.push({
          ruleName:
            'Route entrypoints must not depend directly on infrastructure implementations.',
          from: fromRelativePath,
          to: toRelativePath,
        })
      }
    }
  }

  for (const filePath of relativePaths) {
    if (
      !filePath.startsWith('src/features/') &&
      !filePath.startsWith('src/lib/')
    ) {
      continue
    }

    if (
      filePath.startsWith('src/features/editor-collections/') ||
      filePath.endsWith('.content.ts') ||
      filePath.endsWith('.infra.ts') ||
      filePath.endsWith('.port.ts') ||
      filePath.endsWith('.domain.ts') ||
      filePath.endsWith('.assemble.ts')
    ) {
      continue
    }

    const dependents = incomingDependents.get(filePath) ?? new Set<string>()
    if (dependents.size >= 2) {
      continue
    }

    issues.push({
      ruleName:
        'Modules in src/features/ should only exist after promotion from route-local _features, which requires at least two dependents.',
      from: '(project)',
      to: filePath,
    })
  }

  return issues.sort((left, right) =>
    left.ruleName === right.ruleName
      ? left.from === right.from
        ? left.to.localeCompare(right.to)
        : left.from.localeCompare(right.from)
      : left.ruleName.localeCompare(right.ruleName),
  )
}

function main() {
  const issues = analyzeImportBoundaries()

  if (issues.length === 0) {
    console.log('No import boundary issues found.')
    return
  }

  for (const issue of issues) {
    console.error(`${issue.ruleName}: ${issue.from} -> ${issue.to}`)
  }

  process.exitCode = 1
}

if (import.meta.main) {
  main()
}
