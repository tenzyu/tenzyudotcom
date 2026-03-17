import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { loadVsaConfig } from '../config'

export type RestrictedImportUsageIssue = {
  filePath: string
  message: string
  ruleName: string
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

  if (existsSync(rootDir)) {
    visit(rootDir)
  }

  return results.sort()
}

function collectProjectSourceFiles(projectRoot: string) {
  return collectFiles(
    path.join(projectRoot, 'src'),
    (relativePath) =>
      /\.(ts|tsx)$/.test(relativePath) &&
      !relativePath.endsWith('.test.ts') &&
      !relativePath.endsWith('.spec.ts'),
  ).map((relativePath) => normalizePath(path.join('src', relativePath)))
}

function sourceFileHasImport(sourceFile: ts.SourceFile, moduleName: string) {
  return sourceFile.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === moduleName,
  )
}

export function analyzeRestrictedImportUsage(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()
  const config = loadVsaConfig(projectRoot)
  const issues: RestrictedImportUsageIssue[] = []
  const nextServerApis = ['next/cache', 'next/headers', 'next/navigation']

  for (const filePath of collectProjectSourceFiles(projectRoot)) {
    const sourceFile = readSourceFile(projectRoot, filePath)
    const sourceText = sourceFile.getFullText()

    if (
      !config.restrictedImportUsage.storageOwnerRoots.some((root) => filePath.startsWith(root)) &&
      (
        sourceFileHasImport(sourceFile, 'node:fs') ||
        sourceFileHasImport(sourceFile, 'node:fs/promises') ||
        sourceText.includes("process.cwd(), 'storage'") ||
        sourceText.includes('process.cwd(), "storage"') ||
        sourceText.includes("'storage/") ||
        sourceText.includes('"storage/')
      )
    ) {
      issues.push({
        filePath,
        message: 'storage access must be owned by the configured storage modules',
        ruleName: 'storage-owner',
      })
    }

    const zodAllowed =
      config.restrictedImportUsage.zodAllowedPrefixes.some((prefix) => filePath.startsWith(prefix)) ||
      config.restrictedImportUsage.zodAllowedSuffixes.some((suffix) => filePath.endsWith(suffix))

    if (!zodAllowed && sourceFileHasImport(sourceFile, 'zod')) {
      issues.push({
        filePath,
        message: 'zod usage must be owned by the configured validation modules',
        ruleName: 'zod-owner',
      })
    }

    const nextAllowed =
      config.restrictedImportUsage.nextServerApiAllowedPrefixes.some((prefix) => filePath.startsWith(prefix)) ||
      filePath.endsWith('.assemble.ts')

    if (!nextAllowed && nextServerApis.some((moduleName) => sourceFileHasImport(sourceFile, moduleName))) {
      issues.push({
        filePath,
        message: 'Next server APIs must be owned by the configured server-entry modules',
        ruleName: 'next-server-api-owner',
      })
    }
  }

  return issues.sort((left, right) =>
    left.filePath === right.filePath
      ? left.ruleName.localeCompare(right.ruleName)
      : left.filePath.localeCompare(right.filePath),
  )
}

export function formatRestrictedImportUsageIssue(issue: RestrictedImportUsageIssue) {
  return `${issue.filePath}: [${issue.ruleName}] ${issue.message}. Read: /docs/design-docs/references/site-rules.md`
}
