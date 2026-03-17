#!/usr/bin/env bun

import path from 'node:path'
import {
  analyzeImportBoundaries,
  analyzeForbiddenFiles,
  analyzePureReexports,
  analyzeRestrictedImportUsage,
  analyzeServerActionGuards,
  analyzeSymbolOwnership,
  formatForbiddenFileIssue,
  formatImportBoundaryIssue,
  formatOwnershipIssue,
  formatPureReexportIssue,
  formatRestrictedImportUsageIssue,
  formatServerActionGuardIssue,
} from './index'

const DEFAULT_RULES = [
  'no-reexport',
  'feature-slice-boundaries',
  'symbol-ownership',
  'server-action-guards',
  'restricted-import-usage',
  'forbidden-files',
] as const

const OPTIONAL_RULES = ['rules'] as const

export type SupportedRule =
  | (typeof DEFAULT_RULES)[number]
  | (typeof OPTIONAL_RULES)[number]

type CliOptions = {
  projectRoot: string
  tsconfigPath?: string
  rules: SupportedRule[]
}

function isSupportedRule(value: string): value is SupportedRule {
  return [...DEFAULT_RULES, ...OPTIONAL_RULES].includes(value as SupportedRule)
}

function parseArgs(argv: readonly string[]): CliOptions {
  let projectRoot = process.cwd()
  let tsconfigPath: string | undefined
  const requestedRules: SupportedRule[] = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--project-root') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error('--project-root requires a value')
      }
      projectRoot = path.resolve(process.cwd(), value)
      index += 1
      continue
    }

    if (arg === '--tsconfig') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error('--tsconfig requires a value')
      }
      tsconfigPath = path.resolve(process.cwd(), value)
      index += 1
      continue
    }

    if (!isSupportedRule(arg)) {
      throw new Error(
        `Unknown rule '${arg}'. Supported rules: ${[
          ...DEFAULT_RULES,
          ...OPTIONAL_RULES,
        ].join(', ')}`,
      )
    }

    requestedRules.push(arg)
  }

  return {
    projectRoot,
    tsconfigPath,
    rules: requestedRules.length > 0 ? requestedRules : [...DEFAULT_RULES],
  }
}

export async function runCli(argv: readonly string[]) {
  const options = parseArgs(argv)
  let hasIssues = false

  for (const rule of options.rules) {
    if (rule === 'no-reexport') {
      const issues = analyzePureReexports({ projectRoot: options.projectRoot })
      if (issues.length > 0) {
        hasIssues = true
        for (const issue of issues) {
          console.error(formatPureReexportIssue(issue))
        }
      }
      continue
    }

    if (rule === 'feature-slice-boundaries') {
      const issues = analyzeImportBoundaries({
        projectRoot: options.projectRoot,
        tsconfigPath: options.tsconfigPath,
      })
      if (issues.length > 0) {
        hasIssues = true
        for (const issue of issues) {
          console.error(formatImportBoundaryIssue(issue))
        }
      }
      continue
    }

    if (rule === 'symbol-ownership') {
      const issues = analyzeSymbolOwnership({
        projectRoot: options.projectRoot,
        tsconfigPath: options.tsconfigPath,
      })
      if (issues.length > 0) {
        hasIssues = true
        for (const issue of issues) {
          console.error(formatOwnershipIssue(issue))
        }
      }
      continue
    }

    if (rule === 'server-action-guards') {
      const issues = analyzeServerActionGuards({ projectRoot: options.projectRoot })
      if (issues.length > 0) {
        hasIssues = true
        for (const issue of issues) {
          console.error(formatServerActionGuardIssue(issue))
        }
      }
      continue
    }

    if (rule === 'restricted-import-usage') {
      const issues = analyzeRestrictedImportUsage({ projectRoot: options.projectRoot })
      if (issues.length > 0) {
        hasIssues = true
        for (const issue of issues) {
          console.error(formatRestrictedImportUsageIssue(issue))
        }
      }
      continue
    }

    if (rule === 'forbidden-files') {
      const issues = analyzeForbiddenFiles({ projectRoot: options.projectRoot })
      if (issues.length > 0) {
        hasIssues = true
        for (const issue of issues) {
          console.error(formatForbiddenFileIssue(issue))
        }
      }
      continue
    }

    if (rule === 'rules') {
      console.error(
        'The docs/rules linter is not exposed through tenzyu-linter yet. Run packages/linter/src/rules/document-rules.ts directly if needed.',
      )
      hasIssues = true
    }
  }

  return hasIssues ? 1 : 0
}

if (import.meta.main) {
  runCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exit(exitCode)
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exit(1)
    })
}
