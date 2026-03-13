import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type PureReexportIssue = {
  filePath: string
  reason: 'pure-reexport-file' | 'port-export-from'
}

type AnalyzeOptions = {
  projectRoot?: string
}

const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs)$/
const IGNORED_SUFFIX_PATTERN = /\.(test|spec|d)\.(ts|tsx|js|jsx|mjs)$/
const INCLUDED_ROOTS = ['src']

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

function isPureReexportFile(sourceFile: ts.SourceFile) {
  if (sourceFile.statements.length === 0) {
    return false
  }

  return sourceFile.statements.every(
    (statement) =>
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier !== undefined &&
      statement.attributes === undefined,
  )
}

function hasExportFromStatement(sourceFile: ts.SourceFile) {
  return sourceFile.statements.some(
    (statement) =>
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier !== undefined &&
      statement.attributes === undefined,
  )
}

export function analyzePureReexports(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()
  const relativePaths: string[] = []

  for (const includedRoot of INCLUDED_ROOTS) {
    const absoluteRoot = path.join(projectRoot, includedRoot)
    collectSourceFiles(projectRoot, absoluteRoot, relativePaths)
  }

  return relativePaths
    .flatMap((relativePath) => {
      const absolutePath = path.join(projectRoot, relativePath)
      const sourceText = readFileSync(absolutePath, 'utf8')
      const sourceFile = ts.createSourceFile(
        absolutePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
      )

      const issues: PureReexportIssue[] = []

      if (isPureReexportFile(sourceFile)) {
        issues.push({
          filePath: relativePath,
          reason: 'pure-reexport-file',
        })
      }

      if (relativePath.endsWith('.port.ts') && hasExportFromStatement(sourceFile)) {
        issues.push({
          filePath: relativePath,
          reason: 'port-export-from',
        })
      }

      return issues
    })
    .sort((left, right) =>
      left.filePath === right.filePath
        ? left.reason.localeCompare(right.reason)
        : left.filePath.localeCompare(right.filePath),
    )
}

function main() {
  const issues = analyzePureReexports()

  if (issues.length === 0) {
    console.log('No pure re-export files found.')
    return
  }

  for (const issue of issues) {
    const message =
      issue.reason === 'port-export-from'
        ? 'port modules must not re-export from other modules; import the source module directly instead.'
        : 'pure re-export files are prohibited; import the source module directly instead.'
    console.error(`${issue.filePath}: ${message} Read: /docs/design-docs/references/no-reexport.md`)
  }

  process.exitCode = 1
}

if (import.meta.main) {
  main()
}
