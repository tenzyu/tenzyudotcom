import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { loadVsaConfig } from '../config'

export type ImportBoundaryIssue = {
  ruleName: string
  from: string
  to: string
}

type AnalyzeOptions = {
  projectRoot?: string
  tsconfigPath?: string
}

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

function collectRouteFeatureRoots(
  relativePaths: readonly string[],
  featureMarker: string,
  appRoots: readonly string[],
) {
  const roots = new Set<string>()
  const markerSegment = `/${featureMarker}/`

  for (const filePath of relativePaths) {
    if (!appRoots.some((root) => filePath.startsWith(`${root}/`))) {
      continue
    }

    const markerIndex = filePath.indexOf(markerSegment)
    if (markerIndex === -1) {
      continue
    }

    roots.add(filePath.slice(0, markerIndex + markerSegment.length - 1))
  }

  return [...roots].sort()
}

function getOwnerPathFromFeatureRoot(root: string, featureMarker: string) {
  return root.replace(new RegExp(`/${featureMarker}$`), '')
}

function isRouteFeaturePath(filePath: string, root: string) {
  return filePath.startsWith(`${root}/`)
}

function isRouteFeatureFile(filePath: string, routeFeatureRoots: readonly string[]) {
  return routeFeatureRoots.some((root) => isRouteFeaturePath(filePath, root))
}

function getDirectDescendantFeatureRoots(
  root: string,
  routeFeatureRoots: readonly string[],
  featureMarker: string,
) {
  const owner = getOwnerPathFromFeatureRoot(root, featureMarker)
  const ownerDepth = owner.split('/').length

  return routeFeatureRoots.filter((candidateRoot) => {
    if (candidateRoot === root) {
      return false
    }

    const candidateOwner = getOwnerPathFromFeatureRoot(candidateRoot, featureMarker)
    return (
      candidateOwner.startsWith(`${owner}/`) &&
      candidateOwner.split('/').length === ownerDepth + 1
    )
  })
}

function getAncestorFeatureRoots(
  root: string,
  routeFeatureRoots: readonly string[],
  featureMarker: string,
) {
  const owner = getOwnerPathFromFeatureRoot(root, featureMarker)

  return routeFeatureRoots.filter((candidateRoot) => {
    if (candidateRoot === root) {
      return false
    }

    const candidateOwner = getOwnerPathFromFeatureRoot(candidateRoot, featureMarker)
    return owner.startsWith(`${candidateOwner}/`)
  })
}

function getAllowedFeatureRoots(
  root: string,
  routeFeatureRoots: readonly string[],
  featureMarker: string,
  allowances: Record<string, string[]>,
) {
  return [
    root,
    ...getAncestorFeatureRoots(root, routeFeatureRoots, featureMarker),
    ...getDirectDescendantFeatureRoots(root, routeFeatureRoots, featureMarker),
    ...(allowances[root] ?? []),
  ]
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
  const vsaConfig = loadVsaConfig(projectRoot)

  const relativePaths: string[] = []
  collectSourceFiles(projectRoot, path.join(projectRoot, 'src'), relativePaths)

  const routeFeatureRoots = collectRouteFeatureRoots(
    relativePaths,
    vsaConfig.architecture.featureMarker,
    vsaConfig.architecture.appRoots,
  )

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

      for (const root of routeFeatureRoots) {
        if (!isRouteFeaturePath(fromRelativePath, root)) {
          continue
        }

        if (!isRouteFeatureFile(toRelativePath, routeFeatureRoots)) {
          continue
        }

        const allowedRoots = getAllowedFeatureRoots(
          root,
          routeFeatureRoots,
          vsaConfig.architecture.featureMarker,
          vsaConfig.architecture.routeFeatureAllowances,
        )

        if (allowedRoots.some((allowedRoot) => isRouteFeaturePath(toRelativePath, allowedRoot))) {
          continue
        }

        issues.push({
          ruleName: `Route-local slices under ${root} must not depend on another route-local slice.`,
          from: fromRelativePath,
          to: toRelativePath,
        })
      }

      if (
        vsaConfig.architecture.sharedRoots.some((root) => fromRelativePath.startsWith(`${root}/`)) &&
        isRouteFeatureFile(toRelativePath, routeFeatureRoots)
      ) {
        issues.push({
          ruleName:
            'Shared modules must not depend on route-local slices.',
          from: fromRelativePath,
          to: toRelativePath,
        })
      }

      const fromAllowsInfra =
        fromRelativePath.endsWith('.assemble.ts') ||
        fromRelativePath.endsWith('.infra.ts') ||
        /\/createApi\.ts$/.test(fromRelativePath)
      const isGeneralInfra =
        toRelativePath.endsWith('.infra.ts') &&
        !toRelativePath.startsWith('src/config/')

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
      !vsaConfig.architecture.promotionRoots.some((root) => filePath.startsWith(`${root}/`))
    ) {
      continue
    }

    if (
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
        'Modules in promoted/shared layers should only exist after promotion from route-local slices, which requires at least two dependents.',
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
  const projectRootArg = process.argv[2]
  const projectRoot = projectRootArg
    ? path.resolve(process.cwd(), projectRootArg)
    : process.cwd()
  const issues = analyzeImportBoundaries({ projectRoot })

  if (issues.length === 0) {
    console.log('No import boundary issues found.')
    return
  }

  for (const issue of issues) {
    console.error(formatImportBoundaryIssue(issue))
  }

  process.exitCode = 1
}

export function formatImportBoundaryIssue(issue: ImportBoundaryIssue) {
  return `${issue.ruleName}: ${issue.from} -> ${issue.to}. Read: /docs/design-docs/references/import-boundaries.md`
}

if (import.meta.main) {
  main()
}
