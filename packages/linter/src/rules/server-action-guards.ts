import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { loadVsaConfig } from '../config'

export type ServerActionGuardIssue = {
  filePath: string
  symbolName: string
  message: string
}

type AnalyzeOptions = {
  projectRoot?: string
}

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join('/')
}

function readSourceFile(projectRoot: string, relativePath: string) {
  const absolutePath = path.join(projectRoot, relativePath)
  const sourceText = readFileSync(absolutePath, 'utf8')
  return ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

function collectFiles(rootDir: string, predicate: (relativePath: string) => boolean) {
  const results: string[] = []

  function visit(currentDir: string) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        visit(absolutePath)
        continue
      }

      const relativePath = normalizePath(path.relative(rootDir, absolutePath))
      if (predicate(relativePath)) {
        results.push(relativePath)
      }
    }
  }

  visit(rootDir)
  return results.sort()
}

function isUseServerFile(sourceFile: ts.SourceFile) {
  const [firstStatement] = sourceFile.statements

  return (
    firstStatement !== undefined &&
    ts.isExpressionStatement(firstStatement) &&
    ts.isStringLiteral(firstStatement.expression) &&
    firstStatement.expression.text === 'use server'
  )
}

function isGuardCallExpression(node: ts.Node, identifiers: readonly string[]) {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    identifiers.includes(node.expression.text)
  )
}

function functionBodyHasGuard(
  body: ts.FunctionBody | ts.ConciseBody | undefined,
  identifiers: readonly string[],
) {
  if (!body) {
    return false
  }

  let found = false
  function visit(node: ts.Node) {
    if (found) return
    if (isGuardCallExpression(node, identifiers)) {
      found = true
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(body)
  return found
}

export function analyzeServerActionGuards(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()
  const config = loadVsaConfig(projectRoot)
  const issues: ServerActionGuardIssue[] = []
  const identifiers = config.serverActionGuards.authGuardIdentifiers
  const exceptions = new Set(config.serverActionGuards.serverActionExceptions)

  for (const root of config.serverActionGuards.serverActionRoots) {
    const absoluteRoot = path.join(projectRoot, root)
    const relativePaths = collectFiles(
      absoluteRoot,
      (relativePath) => /\.(ts|tsx)$/.test(relativePath) && !relativePath.endsWith('.test.ts'),
    )

    for (const relativePathFromRoot of relativePaths) {
      const filePath = normalizePath(path.join(root, relativePathFromRoot))
      const sourceFile = readSourceFile(projectRoot, filePath)

      if (!isUseServerFile(sourceFile)) {
        continue
      }

      for (const statement of sourceFile.statements) {
        if (
          ts.isFunctionDeclaration(statement) &&
          statement.name &&
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          if (!exceptions.has(statement.name.text) && !functionBodyHasGuard(statement.body, identifiers)) {
            issues.push({
              filePath,
              symbolName: statement.name.text,
              message:
                'server actions under configured roots must call one of the configured auth guards',
            })
          }
        }

        if (
          ts.isVariableStatement(statement) &&
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          for (const declaration of statement.declarationList.declarations) {
            if (!ts.isIdentifier(declaration.name)) {
              continue
            }

            const initializer = declaration.initializer
            const body =
              initializer && (
                ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)
              )
                ? initializer.body
                : undefined

            if (
              !exceptions.has(declaration.name.text) &&
              !functionBodyHasGuard(body, identifiers)
            ) {
              issues.push({
                filePath,
                symbolName: declaration.name.text,
                message:
                  'server actions under configured roots must call one of the configured auth guards',
              })
            }
          }
        }
      }
    }
  }

  return issues.sort((left, right) =>
    left.filePath === right.filePath
      ? left.symbolName.localeCompare(right.symbolName)
      : left.filePath.localeCompare(right.filePath),
  )
}

export function formatServerActionGuardIssue(issue: ServerActionGuardIssue) {
  return `${issue.filePath}#${issue.symbolName}: ${issue.message}. Read: /docs/design-docs/references/site-rules.md`
}
