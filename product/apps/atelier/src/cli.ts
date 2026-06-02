#!/usr/bin/env bun

import path from 'node:path'
import { runDoctor } from './core/doctor'
import type { Diagnostic, DoctorReport } from './core/schema'

type CliOptions = {
  command: 'doctor' | 'help'
  json: boolean
  fix: boolean
  projectRoot: string
}

function usage() {
  return [
    'Usage:',
    '  atelier doctor [--json] [--fix] [--project-root <path>]',
    '',
    'Commands:',
    '  doctor   Inspect harness Markdown for schema, link, ID, and stale path issues.',
  ].join('\n')
}

function parseArgs(argv: readonly string[]): CliOptions {
  const [commandRaw = 'help', ...rest] = argv
  const command = commandRaw === 'doctor' ? 'doctor' : 'help'
  let projectRoot = path.resolve(process.cwd())
  let json = false
  let fix = false

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]

    if (arg === '--json') {
      json = true
      continue
    }

    if (arg === '--fix') {
      fix = true
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

    throw new Error(`Unknown argument: ${arg}`)
  }

  return { command, json, fix, projectRoot }
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

export async function runCli(argv: readonly string[]) {
  const options = parseArgs(argv)

  if (options.command === 'help') {
    console.log(usage())
    return 0
  }

  const report = runDoctor({ projectRoot: options.projectRoot })

  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printHumanReport(report, options.fix)
  }

  return 0
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

