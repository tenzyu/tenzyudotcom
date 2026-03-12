import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type PureReexportIssue = {
  filePath: string
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

export function analyzePureReexports(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()
  const relativePaths: string[] = []

  for (const includedRoot of INCLUDED_ROOTS) {
    const absoluteRoot = path.join(projectRoot, includedRoot)
    collectSourceFiles(projectRoot, absoluteRoot, relativePaths)
  }

  return relativePaths
    .filter((relativePath) => {
      const absolutePath = path.join(projectRoot, relativePath)
      const sourceText = readFileSync(absolutePath, 'utf8')
      const sourceFile = ts.createSourceFile(
        absolutePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
      )

      return isPureReexportFile(sourceFile)
    })
    .sort()
    .map((filePath) => ({ filePath }) satisfies PureReexportIssue)
}

function main() {
  const issues = analyzePureReexports()

  if (issues.length === 0) {
    console.log('No pure re-export files found.')
    return
  }

  for (const issue of issues) {
    console.error(
      `${issue.filePath}: pure re-export files are prohibited; import the source module directly instead.`,
    )
  }

  process.exitCode = 1
}

if (import.meta.main) {
  main()
}
