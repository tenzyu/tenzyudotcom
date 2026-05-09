import path from 'node:path'
import ts from 'typescript'
import { loadVsaConfig } from '../config'

export type OwnershipIssue = {
  kind: 'demote' | 'promote'
  symbolName: string
  declarationFile: string
  declarationOwner: string
  referenceOwners: string[]
  targetOwner: string
}

type ExportRecord = {
  symbol: ts.Symbol
  symbolName: string
  declarationFile: string
  declarationOwner: string
  layer: 'app-owner' | 'shared-owner'
}

type AnalyzeOptions = {
  projectRoot?: string
  tsconfigPath?: string
}

const OWNERSHIP_DEBT_ALLOWLIST = new Set<string>()
let activeConfig = loadVsaConfig(process.cwd())

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
    !relativePath.endsWith('.content.ts')
  )
}

function getTopLevelOwnedDirectory(relativePath: string, prefix: string) {
  const remainder = relativePath.slice(prefix.length)
  const segment = remainder.split('/')[0]
  return segment ? `${prefix}${segment}` : prefix.slice(0, -1)
}

function getAppOwner(relativePath: string) {
  if (!activeConfig.architecture.appRoots.some((root) => relativePath.startsWith(`${root}/`))) {
    return null
  }

  const parts = relativePath.split('/')
  const featureIndex = parts.indexOf(activeConfig.architecture.featureMarker)
  if (featureIndex > 0) {
    return parts.slice(0, featureIndex).join('/')
  }

  return normalizePath(path.dirname(relativePath))
}

function getOwner(relativePath: string) {
  if (activeConfig.architecture.appRoots.some((root) => relativePath.startsWith(`${root}/`))) {
    return getAppOwner(relativePath)
  }

  for (const sharedRoot of activeConfig.architecture.sharedRoots) {
    const normalizedRoot = `${sharedRoot}/`
    if (relativePath.startsWith(normalizedRoot)) {
      return getTopLevelOwnedDirectory(relativePath, normalizedRoot)
    }
  }

  for (const utilityRoot of activeConfig.architecture.utilityRoots) {
    const normalizedRoot = `${utilityRoot}/`
    if (relativePath.startsWith(normalizedRoot)) {
      return getTopLevelOwnedDirectory(relativePath, normalizedRoot)
    }
  }

  return null
}

function getLayer(relativePath: string): ExportRecord['layer'] | null {
  if (activeConfig.architecture.appRoots.some((root) => relativePath.startsWith(`${root}/`))) {
    return 'app-owner'
  }

  if (activeConfig.architecture.sharedRoots.some((root) => relativePath.startsWith(`${root}/`))) {
    return 'shared-owner'
  }

  return null
}

function isAppOwner(owner: string) {
  return activeConfig.architecture.appRoots.some((root) => owner === root || owner.startsWith(`${root}/`))
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

function getLeastCommonOwner(owners: readonly string[]) {
  if (owners.length === 0) {
    return null
  }

  const segments = owners.map((owner) => owner.split('/'))
  const minLength = Math.min(...segments.map((parts) => parts.length))
  const common: string[] = []

  for (let index = 0; index < minLength; index += 1) {
    const candidate = segments[0][index]
    if (segments.every((parts) => parts[index] === candidate)) {
      common.push(candidate)
      continue
    }
    break
  }

  return common.length > 0 ? common.join('/') : null
}

export function analyzeSymbolOwnership(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()
  activeConfig = loadVsaConfig(projectRoot)
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
    const layer = getLayer(relativePath)
    if (!declarationOwner || !layer) continue

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
    if (!isSourceFile(relativePath) || isTestFile(relativePath)) continue

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

    if (record.layer === 'shared-owner') {
      if (referenceOwners.length === 0) {
        continue
      }

      const appOwners = referenceOwners.filter(isAppOwner)
      if (appOwners.length === 0 || appOwners.length !== referenceOwners.length) {
        continue
      }

      const targetOwner =
        appOwners.length === 1
          ? appOwners[0]
          : getLeastCommonOwner(appOwners)

      if (!targetOwner || targetOwner === 'src/app') {
        continue
      }

      issues.push({
        kind: 'demote',
        symbolName: record.symbolName,
        declarationFile: record.declarationFile,
        declarationOwner: record.declarationOwner,
        referenceOwners,
        targetOwner,
      })
      continue
    }

    if (record.layer === 'app-owner') {
      const effectiveOwners = [...new Set([record.declarationOwner, ...referenceOwners])]
      const targetOwner = getLeastCommonOwner(
        effectiveOwners.filter(isAppOwner),
      )

      if (
        targetOwner &&
        targetOwner !== record.declarationOwner &&
        targetOwner.startsWith('src/app/')
      ) {
        issues.push({
          kind: 'promote',
          symbolName: record.symbolName,
          declarationFile: record.declarationFile,
          declarationOwner: record.declarationOwner,
          referenceOwners,
          targetOwner,
        })
      }
    }
  }

  return issues
    .filter(
      (issue) =>
        !OWNERSHIP_DEBT_ALLOWLIST.has(
          `${issue.declarationFile}#${issue.symbolName}`,
        ),
    )
    .sort((left, right) =>
    left.declarationFile === right.declarationFile
      ? left.symbolName.localeCompare(right.symbolName)
      : left.declarationFile.localeCompare(right.declarationFile),
    )
}

export function formatOwnershipIssue(issue: OwnershipIssue) {
  const refs = issue.referenceOwners.length > 0
    ? issue.referenceOwners.join(', ')
    : '(no external owners)'
  return `${issue.kind} ${issue.declarationFile}#${issue.symbolName} owner=${issue.declarationOwner} target=${issue.targetOwner} refs=${refs}. Read: /docs/design-docs/references/symbol-ownership.md`
}

if (import.meta.main) {
  const projectRootArg = process.argv[2]
  const projectRoot = projectRootArg
    ? path.resolve(process.cwd(), projectRootArg)
    : process.cwd()
  const issues = analyzeSymbolOwnership({ projectRoot })

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(formatOwnershipIssue(issue))
    }
    process.exit(1)
  }

  console.log('No symbol ownership issues found.')
}
