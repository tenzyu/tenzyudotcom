import path from 'node:path'
import ts from 'typescript'

export type OwnershipIssue = {
  kind: 'demote' | 'promote'
  symbolName: string
  declarationFile: string
  declarationOwner: string
  referenceOwners: string[]
}

type ExportRecord = {
  symbol: ts.Symbol
  symbolName: string
  declarationFile: string
  declarationOwner: string
  layer: 'shared' | 'route-local'
}

type AnalyzeOptions = {
  projectRoot?: string
  tsconfigPath?: string
}

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join('/')
}

function isTestFile(relativePath: string) {
  return /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(relativePath)
}

function isDeclarationFile(relativePath: string) {
  return relativePath.endsWith('.d.ts')
}

function isSourceFile(relativePath: string) {
  return relativePath.startsWith('src/') && !isTestFile(relativePath) && !isDeclarationFile(relativePath)
}

function isAnalyzedImplementationFile(relativePath: string) {
  return (
    !/\.(infra|domain|port|assemble|data)\.ts$/.test(relativePath) &&
    !relativePath.startsWith('src/features/editor-collections/') &&
    relativePath !== 'src/lib/editor/editor-version.ts'
  )
}

function getRouteOwner(relativePath: string) {
  if (relativePath.startsWith('src/app/[locale]/(admin)/editor/')) {
    return 'route/editor'
  }

  if (relativePath.startsWith('src/app/[locale]/_features/')) {
    return 'route/root'
  }

  const mainPrefix = 'src/app/[locale]/(main)/'
  if (!relativePath.startsWith(mainPrefix)) {
    return null
  }

  const remainder = relativePath.slice(mainPrefix.length)

  if (remainder.startsWith('(home)/')) return 'route/home'
  if (remainder.startsWith('archives/')) return 'route/archives'
  if (remainder.startsWith('blog/')) return 'route/blog'
  if (remainder.startsWith('links/')) return 'route/links'
  if (remainder.startsWith('tools/')) return 'route/tools'

  const firstSegment = remainder.split('/')[0]
  if (!firstSegment) return null
  return `route/${firstSegment}`
}

function getOwner(relativePath: string) {
  if (relativePath.startsWith('src/app/api/auth/')) {
    return 'route/editor'
  }

  if (relativePath.startsWith('src/app/api/editor/')) {
    return 'route/editor'
  }

  if (relativePath.startsWith('src/features/')) {
    const domain = relativePath.split('/')[2]
    return domain ? `features/${domain}` : 'features'
  }

  if (relativePath.startsWith('src/lib/')) {
    const domain = relativePath.split('/')[2]
    return domain ? `lib/${domain}` : 'lib'
  }

  if (relativePath.startsWith('src/config/')) {
    return 'config'
  }

  return getRouteOwner(relativePath)
}

function isRouteLocalFeature(relativePath: string) {
  return /src\/app\/\[locale\]\/.*\/_features\//.test(relativePath)
}

function isSharedFile(relativePath: string) {
  return relativePath.startsWith('src/features/') || relativePath.startsWith('src/lib/')
}

function hasExportModifier(node: ts.Node) {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0
}

function collectNamedExportDeclarations(sourceFile: ts.SourceFile) {
  const declarations: ts.Declaration[] = []

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          declarations.push(declaration)
        }
      }
      continue
    }

    if (ts.isFunctionDeclaration(statement) && statement.name && hasExportModifier(statement)) {
      declarations.push(statement)
    }
  }

  return declarations
}

function getDeclarationNameNode(declaration: ts.Declaration) {
  if (ts.isVariableDeclaration(declaration) && ts.isIdentifier(declaration.name)) {
    return declaration.name
  }

  if (ts.isFunctionDeclaration(declaration) && declaration.name) {
    return declaration.name
  }

  return null
}

function resolveAliasedSymbol(checker: ts.TypeChecker, symbol: ts.Symbol | undefined) {
  if (!symbol) return null
  return (symbol.flags & ts.SymbolFlags.Alias) !== 0
    ? checker.getAliasedSymbol(symbol)
    : symbol
}

function collectReferencedSymbolsFromImport(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
) {
  const results: ts.Symbol[] = []

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const importClause = statement.importClause
      if (!importClause || importClause.isTypeOnly) {
        continue
      }

      if (importClause.name) {
        const symbol = resolveAliasedSymbol(
          checker,
          checker.getSymbolAtLocation(importClause.name),
        )
        if (symbol) results.push(symbol)
      }

      const namedBindings = importClause.namedBindings
      if (!namedBindings) continue

      if (ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) {
          if (element.isTypeOnly) continue
          const symbol = resolveAliasedSymbol(
            checker,
            checker.getSymbolAtLocation(element.name),
          )
          if (symbol) results.push(symbol)
        }
      }
    }

    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly || !statement.exportClause) {
        continue
      }

      if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          if (element.isTypeOnly) continue
          const symbol = resolveAliasedSymbol(
            checker,
            checker.getSymbolAtLocation(element.name),
          )
          if (symbol) results.push(symbol)
        }
      }
    }
  }

  return results
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

export function analyzeSymbolOwnership(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()
  const tsconfigPath = options.tsconfigPath ?? path.join(projectRoot, 'tsconfig.json')
  const config = loadTsConfig(tsconfigPath)
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
  })
  const checker = program.getTypeChecker()

  const exportRecords = new Map<ts.Symbol, ExportRecord>()

  for (const sourceFile of program.getSourceFiles()) {
    const relativePath = normalizePath(path.relative(projectRoot, sourceFile.fileName))
    if (!isSourceFile(relativePath) || !isAnalyzedImplementationFile(relativePath)) continue

    const declarationOwner = getOwner(relativePath)
    if (!declarationOwner) continue

    const layer = isSharedFile(relativePath)
      ? 'shared'
      : isRouteLocalFeature(relativePath)
        ? 'route-local'
        : null

    if (!layer) continue

    for (const declaration of collectNamedExportDeclarations(sourceFile)) {
      const nameNode = getDeclarationNameNode(declaration)
      if (!nameNode) continue

      const symbol = checker.getSymbolAtLocation(nameNode)
      if (!symbol) continue

      exportRecords.set(symbol, {
        symbol,
        symbolName: nameNode.text,
        declarationFile: relativePath,
        declarationOwner,
        layer,
      })
    }
  }

  const ownerRefs = new Map<ts.Symbol, Set<string>>()

  for (const sourceFile of program.getSourceFiles()) {
    const relativePath = normalizePath(path.relative(projectRoot, sourceFile.fileName))
    if (!isSourceFile(relativePath)) continue
    if (isTestFile(relativePath)) continue

    const referenceOwner = getOwner(relativePath)
    if (!referenceOwner) continue

    for (const symbol of collectReferencedSymbolsFromImport(checker, sourceFile)) {
      const record = exportRecords.get(symbol)
      if (!record) continue
      if (record.declarationFile === relativePath) continue

      const refs = ownerRefs.get(symbol) ?? new Set<string>()
      refs.add(referenceOwner)
      ownerRefs.set(symbol, refs)
    }
  }

  const issues: OwnershipIssue[] = []

  for (const record of exportRecords.values()) {
    const referenceOwners = [...(ownerRefs.get(record.symbol) ?? new Set<string>())].sort()

    if (record.layer === 'shared' && referenceOwners.length <= 1) {
      issues.push({
        kind: 'demote',
        symbolName: record.symbolName,
        declarationFile: record.declarationFile,
        declarationOwner: record.declarationOwner,
        referenceOwners,
      })
      continue
    }

    if (
      record.layer === 'route-local' &&
      referenceOwners.some((owner) => owner !== record.declarationOwner)
    ) {
      issues.push({
        kind: 'promote',
        symbolName: record.symbolName,
        declarationFile: record.declarationFile,
        declarationOwner: record.declarationOwner,
        referenceOwners,
      })
    }
  }

  return issues.sort((left, right) =>
    left.declarationFile === right.declarationFile
      ? left.symbolName.localeCompare(right.symbolName)
      : left.declarationFile.localeCompare(right.declarationFile),
  )
}

function formatIssue(issue: OwnershipIssue) {
  const refs = issue.referenceOwners.length > 0
    ? issue.referenceOwners.join(', ')
    : '(no external owners)'
  return `${issue.kind} ${issue.declarationFile}#${issue.symbolName} owner=${issue.declarationOwner} refs=${refs}`
}

if (import.meta.main) {
  const issues = analyzeSymbolOwnership()

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(formatIssue(issue))
    }
    process.exit(1)
  }

  console.log('No symbol ownership issues found.')
}
