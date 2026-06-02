#!/usr/bin/env bun

import path from 'node:path'
import { buildContextPreview, type ContextPreview } from './core/context'
import { runDoctor } from './core/doctor'
import { compileIndexes, type IndexResult } from './core/indexer'
import { initRun } from './core/runs'
import type { Diagnostic, DoctorReport } from './core/schema'

type BaseOptions = {
  projectRoot: string
  json: boolean
}

function usage() {
  return [
    'Usage:',
    '  atelier doctor [--json] [--fix] [--project-root <path>]',
    '  atelier index [--check] [--project-root <path>]',
    '  atelier context preview --workflow <id> --role <id> [--role <id>] --path <path> --intent <text> [--required-only] [--json]',
    '  atelier run init --workflow <id> --role <id> [--role <id>] --path <path> --intent <text> [--id <run-id>] [--json]',
    '',
    'Commands:',
    '  doctor   Inspect harness Markdown for schema, link, ID, and stale path issues.',
    '  index    Compile generated harness indexes.',
    '  context  Preview role-routed context without creating a run.',
    '  run      Materialize a context preview into a run.',
  ].join('\n')
}

function parseBase(rest: readonly string[]): BaseOptions & { remaining: string[] } {
  let projectRoot = path.resolve(process.cwd())
  let json = false
  const remaining: string[] = []

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]

    if (arg === '--json') {
      json = true
      continue
    }

    if (arg === '--project-root') {
      const value = rest[index + 1]
      if (!value) {
        throw new Error('--project-root requires a value')
      }
      projectRoot = path.resolve(process.cwd(), value)
      index += 1
      continue
    }

    remaining.push(arg)
  }

  return { json, projectRoot, remaining }
}

function readRequiredOption(args: readonly string[], name: string) {
  const index = args.indexOf(name)
  if (index === -1 || !args[index + 1]) {
    throw new Error(`${name} requires a value`)
  }
  return args[index + 1]
}

function readOptionalOption(args: readonly string[], name: string) {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  if (!args[index + 1]) {
    throw new Error(`${name} requires a value`)
  }
  return args[index + 1]
}

function readRepeatedOption(args: readonly string[], name: string) {
  const values: string[] = []
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name) {
      const value = args[index + 1]
      if (!value) throw new Error(`${name} requires a value`)
      values.push(value)
      index += 1
    }
  }
  return values
}

function formatDiagnostic(diagnostic: Diagnostic) {
  const location = [diagnostic.path, diagnostic.line].filter(Boolean).join(':')
  const prefix = location ? `${location}: ` : ''
  return `${prefix}${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`
}

function printHumanReport(report: DoctorReport, fix: boolean) {
  console.log('Atelier Doctor')
  console.log(`Documents: ${report.summary.documentCount}`)
  console.log(
    `Diagnostics: ${report.summary.errorCount} errors, ${report.summary.warningCount} warnings, ${report.summary.infoCount} info`,
  )

  if (fix) {
    console.log('--fix requested: no safe automatic fixes are implemented in this version.')
  }

  if (report.diagnostics.length === 0) {
    console.log('No diagnostics.')
    return
  }

  console.log('')
  for (const diagnostic of report.diagnostics) {
    console.log(formatDiagnostic(diagnostic))
  }
}

function printIndexReport(result: IndexResult, check: boolean) {
  console.log('Atelier Index')
  console.log(`Generated root: ${path.relative(process.cwd(), result.generatedRoot)}`)
  if (check) {
    console.log(result.staleFiles.length === 0 ? 'Generated indexes are fresh.' : 'Generated indexes are stale.')
  } else {
    console.log('Generated indexes written.')
  }
  if (result.staleFiles.length > 0) {
    console.log(`Stale files: ${result.staleFiles.join(', ')}`)
  }
}

function printContextPreview(preview: ContextPreview) {
  console.log('Atelier Context Preview')
  console.log(`Workflow: ${preview.workflowId}`)
  console.log(`Roles: ${preview.roleIds.join(', ')}`)
  console.log(`Path: ${preview.inputPath}`)
  console.log(`Intent: ${preview.intent}`)
  console.log(`Token Estimate: ${preview.budgetEstimate.tokens}/${preview.budgetEstimate.limit}`)

  console.log('\nRequired Context')
  for (const document of preview.required) {
    console.log(`- ${document.path}: ${document.reasons.join('; ')}`)
  }

  console.log('\nOptional Context')
  if (preview.optional.length === 0) console.log('- None')
  for (const document of preview.optional) {
    console.log(`- ${document.path}: ${document.reasons.join('; ')}`)
  }

  console.log('\nSkipped Context')
  if (preview.skipped.length === 0) console.log('- None')
  for (const document of preview.skipped.slice(0, 40)) {
    console.log(`- ${document.path}: ${document.reason}`)
  }
  if (preview.skipped.length > 40) {
    console.log(`- ... ${preview.skipped.length - 40} more skipped documents`)
  }

  console.log('\nDiagnostics')
  if (preview.diagnostics.length === 0) console.log('- None')
  for (const diagnostic of preview.diagnostics) {
    console.log(`- ${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`)
  }

  console.log('\nNext Command')
  console.log(preview.nextCommand)
}

function hasErrorDiagnostic(diagnostics: readonly Diagnostic[]) {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error')
}

export async function runCli(argv: readonly string[]) {
  const [command = 'help', subcommand, ...restRaw] = argv

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(usage())
    return 0
  }

  if (command === 'doctor') {
    const base = parseBase([subcommand, ...restRaw].filter((value): value is string => value !== undefined))
    const fix = base.remaining.includes('--fix')
    const unknown = base.remaining.filter((arg) => arg !== '--fix')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    const report = runDoctor({ projectRoot: base.projectRoot })

    if (base.json) {
      console.log(JSON.stringify(report, null, 2))
    } else {
      printHumanReport(report, fix)
    }

    return 0
  }

  if (command === 'index') {
    const base = parseBase([subcommand, ...restRaw].filter((value): value is string => value !== undefined))
    const check = base.remaining.includes('--check')
    const unknown = base.remaining.filter((arg) => arg !== '--check')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)
    const result = compileIndexes({ projectRoot: base.projectRoot, check, write: !check })

    if (base.json) {
      console.log(JSON.stringify({ ok: result.ok, generatedRoot: result.generatedRoot, staleFiles: result.staleFiles }, null, 2))
    } else {
      printIndexReport(result, check)
    }

    return result.ok ? 0 : 1
  }

  if (command === 'context' && subcommand === 'preview') {
    const base = parseBase(restRaw)
    const roles = readRepeatedOption(base.remaining, '--role')
    if (roles.length === 0) throw new Error('--role requires at least one value')
    const preview = buildContextPreview({
      projectRoot: base.projectRoot,
      workflowId: readRequiredOption(base.remaining, '--workflow'),
      roleIds: roles,
      inputPath: readRequiredOption(base.remaining, '--path'),
      intent: readRequiredOption(base.remaining, '--intent'),
      requiredOnly: base.remaining.includes('--required-only'),
    })

    if (base.json) {
      console.log(JSON.stringify(preview, null, 2))
    } else {
      printContextPreview(preview)
    }

    return hasErrorDiagnostic(preview.diagnostics) ? 1 : 0
  }

  if (command === 'run' && subcommand === 'init') {
    const base = parseBase(restRaw)
    const roles = readRepeatedOption(base.remaining, '--role')
    if (roles.length === 0) throw new Error('--role requires at least one value')
    const result = initRun({
      projectRoot: base.projectRoot,
      workflowId: readRequiredOption(base.remaining, '--workflow'),
      roleIds: roles,
      inputPath: readRequiredOption(base.remaining, '--path'),
      intent: readRequiredOption(base.remaining, '--intent'),
      runId: readOptionalOption(base.remaining, '--id'),
    })

    if (base.json) {
      console.log(
        JSON.stringify(
          {
            runId: result.runId,
            runPath: result.runPath,
            briefPath: result.briefPath,
            contextPath: result.contextPath,
            manifestPath: result.manifestPath,
            diagnostics: result.preview.diagnostics,
          },
          null,
          2,
        ),
      )
    } else {
      console.log('Atelier Run Init')
      console.log(`Run: ${result.runId}`)
      console.log(`Path: ${path.relative(base.projectRoot, result.runPath)}`)
      console.log(`Context: ${path.relative(base.projectRoot, result.contextPath)}`)
      console.log(`Manifest: ${path.relative(base.projectRoot, result.manifestPath)}`)
    }

    return 0
  }

  console.log(usage())
  return 1
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
