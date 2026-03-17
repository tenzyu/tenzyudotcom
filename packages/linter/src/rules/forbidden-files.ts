import { existsSync } from 'node:fs'
import path from 'node:path'
import { loadVsaConfig } from '../config'

export type ForbiddenFileIssue = {
  filePath: string
  message: string
}

type AnalyzeOptions = {
  projectRoot?: string
}

export function analyzeForbiddenFiles(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()
  const config = loadVsaConfig(projectRoot)
  const issues: ForbiddenFileIssue[] = []

  for (const filePath of config.forbiddenFiles) {
    if (existsSync(path.join(projectRoot, filePath))) {
      issues.push({
        filePath,
        message:
          'This project forbids these framework-level files in favor of the configured replacement.',
      })
    }
  }

  return issues.sort((left, right) => left.filePath.localeCompare(right.filePath))
}

export function formatForbiddenFileIssue(issue: ForbiddenFileIssue) {
  return `${issue.filePath}: ${issue.message}. Read: /docs/design-docs/references/site-rules.md`
}
