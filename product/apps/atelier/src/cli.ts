#!/usr/bin/env bun

import path from 'node:path'
import {
  buildContextPlan,
  normalizeContextMode,
  type ContextPlan,
} from './core/context'
import { runDoctor } from './core/doctor'
import { generateGeneratedFiles, type GenerateResult } from './core/generate'
import {
  buildGraph,
  computeGraphStatus,
  graphBlame,
  graphImpact,
  isGraphStale,
  readGraph,
  scanProject,
  writeGraph,
  type GraphSnapshot,
} from './core/graph'
import { compileIndexes, type IndexResult } from './core/indexer'
import { listControls, buildCoverageReport, findMissingControls } from './core/controls'
import { reconcile, repairDryRun } from './core/reconciler'
import {
  promoteKnowledgeProposal,
  proposeKnowledge,
  rejectKnowledgeProposal,
  type KnowledgePromotionResult,
} from './core/knowledge'
import {
  buildRunInitCommand,
  listAtelierRegistryEntries,
  recoveryLinesForDiagnostic,
  type AtelierRegistryEntry,
} from './core/llm-protocol'
import {
  renameId,
  type IdRenameChange,
  type IdRenameResult,
} from './core/rename'
import {
  closeRun,
  expandRunContext,
  initRun,
  renderContextForOptions,
  type ContextExpandResult,
  type RunCloseResult,
} from './core/runs'
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
    '  atelier scan [--json] [--write] [--project-root <path>]',
    '  atelier graph [--json] [--project-root <path>]',
    '  atelier status [--json] [--project-root <path>]',
    '  atelier impact --path <path> [--json] [--project-root <path>]',
    '  atelier blame ARTIFACT_ID [--json] [--project-root <path>]',
    '  atelier workflow list [--json]',
    '  atelier role list [--json]',
    '  atelier context plan --workflow <id> [--role <id>] [--role <id>] [--path <path>] --intent <text> [--mode compact|full|linked] [--required-only] [--semantic] [--semantic-max-results <n>] [--json]',
    '  atelier context render --workflow <id> [--role <id>] [--role <id>] [--path <path>] --intent <text> [--mode compact|full|linked] [--id <run-id>] [--json]',
    '  atelier context expand RUN-ID DOC-ID-OR-PATH [--json]',
    '  atelier run init --workflow <id> [--role <id>] [--role <id>] [--path <path>] --intent <text> [--mode compact|full|linked] [--id <run-id>] [--json]',
    '  atelier run status RUN-ID [--json]',
    '  atelier run close RUN-ID [--json]',
    '  atelier repo owner --path <path> [--json]',
    '  atelier repo map [--json]',
    '  atelier knowledge propose --from-run RUN-ID --kind <type> --title <title> [--tag <tag>] [--evidence <text>] [--why-recur <text>] [--why-not-covered <text>] [--json]',
    '  atelier knowledge promote PROPOSAL_PATH [--json]',
    '  atelier knowledge reject PROPOSAL_PATH [--reason <text>] [--json]',
    '  atelier controls list [--json] [--project-root <path>]',
    '  atelier controls coverage [--json] [--project-root <path>]',
    '  atelier controls missing [--json] [--project-root <path>]',
    '  atelier reconcile [--json] [--project-root <path>]',
    '  atelier repair --dry-run [--json] [--project-root <path>]',
    '  atelier id rename OLD_ID NEW_ID [--write] [--json]',
    '  atelier generate [--write] [--json]',
    '  atelier mcp [--allow-mutations] [--project-root <path>]',
    '  atelier gui [--port <port>] [--host <host>] [--allow-mutations] [--project-root <path>]',
    '',
    'Commands:',
    '  doctor   Inspect harness Markdown for schema, link, ID, and stale path issues.',
    '  index    Compile generated harness indexes.',
    '  scan     Observe project artifacts and build the Artifact Graph.',
    '  graph    Display the current Artifact Graph snapshot.',
    '  status   Summarize graph health, stale artifacts, and orphaned controls.',
    '  impact   Show artifacts and edges affected by a path change.',
    '  blame    Trace incoming and outgoing edges for an artifact.',
    '  workflow List callable workflow ids for deterministic agent selection.',
    '  role     List role ids for deterministic agent selection.',
    '  context  Plan or render role-routed context without creating a run.',
    '  run      Materialize, inspect, and close a run.',
    '  repo     Query repository facts (path ownership).',
    '  knowledge Create, promote, or reject knowledge proposals from run evidence.',
    '  controls Observe and query control mechanisms (checks, linters, hooks, etc.).',
    '  reconcile Reconcile the Artifact Graph against current filesystem state.',
    '  repair    Preview what reconcile would change (dry-run).',
    '  id       Rename symbolic ids across the harness.',
    '  generate Refresh generated skills and root adapters.',
    '  mcp      Start a stdio Model Context Protocol server. Mutations require --allow-mutations or a confirm flag from the client.',
    '  gui      Start the local HTTP GUI. Binds to 127.0.0.1 by default. Mutations require --allow-mutations or a confirm flag from the UI.',
    '',
    'LLM entrypoint:',
    `  ${buildRunInitCommand()}`,
  ].join('\n')
}

function parseBase(
  rest: readonly string[]
): BaseOptions & { remaining: string[] } {
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
  return [
    `${prefix}${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`,
    ...recoveryLinesForDiagnostic(diagnostic),
  ].join('\n')
}

function printRegistryList(label: string, entries: readonly AtelierRegistryEntry[]) {
  console.log(`Atelier ${label} List`)
  if (entries.length === 0) {
    console.log('- None')
    return
  }
  for (const entry of entries) {
    const summary = entry.summary ? ` - ${entry.summary}` : ''
    console.log(`- ${entry.id} (${entry.path})${summary}`)
  }
}

function printHumanReport(report: DoctorReport, fix: boolean) {
  console.log('Atelier Doctor')
  console.log(`Documents: ${report.summary.documentCount}`)
  console.log(
    `Diagnostics: ${report.summary.errorCount} errors, ${report.summary.warningCount} warnings, ${report.summary.infoCount} info`
  )

  if (fix) {
    console.log(
      '--fix requested: no safe automatic fixes are implemented in this version.'
    )
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
  console.log(
    `Generated root: ${path.relative(process.cwd(), result.generatedRoot)}`
  )
  if (check) {
    console.log(
      result.staleFiles.length === 0
        ? 'Generated indexes are fresh.'
        : 'Generated indexes are stale.'
    )
  } else {
    console.log('Generated indexes written.')
  }
  console.log(
    `Doctor diagnostics: ${result.diagnosticSummary.errorCount} errors, ${result.diagnosticSummary.warningCount} warnings, ${result.diagnosticSummary.infoCount} info`
  )
  if (result.staleFiles.length > 0) {
    console.log(`Stale files: ${result.staleFiles.join(', ')}`)
  }
}

function printContextPlan(plan: ContextPlan) {
  console.log('Atelier Context Plan')
  console.log(`Workflow: ${plan.workflowId}`)
  console.log(`Roles: ${plan.roleIds.join(', ')}`)
  console.log(`Path: ${plan.inputPath}`)
  console.log(`Intent: ${plan.intent}`)
  console.log(`Mode: ${plan.mode}`)
  console.log(
    `Token Estimate: ${plan.budgetEstimate.tokens}/${plan.budgetEstimate.limit}`
  )

  console.log('\nRequired Context')
  for (const document of plan.required) {
    console.log(`- ${document.path}: ${document.reasons.join('; ')}`)
  }

  console.log('\nOptional Context')
  if (plan.optional.length === 0) console.log('- None')
  for (const document of plan.optional) {
    console.log(`- ${document.path}: ${document.reasons.join('; ')}`)
  }

  console.log('\nSkipped Context')
  if (plan.skipped.length === 0) console.log('- None')
  for (const document of plan.skipped.slice(0, 40)) {
    console.log(`- ${document.path}: ${document.reason}`)
  }
  if (plan.skipped.length > 40) {
    console.log(`- ... ${plan.skipped.length - 40} more skipped documents`)
  }

  console.log('\nDiagnostics')
  if (plan.diagnostics.length === 0) console.log('- None')
  for (const diagnostic of plan.diagnostics) {
    console.log(`- ${formatDiagnostic(diagnostic)}`)
  }

  console.log('\nSemantic Recall (optional)')
  console.log(`Enabled: ${plan.semantic.enabled}`)
  if (!plan.semantic.enabled) {
    console.log('Pass --semantic to enable.')
  } else {
    if (plan.semantic.hits.length === 0) console.log('- No semantic hits.')
    for (const hit of plan.semantic.hits) {
      console.log(
        `- ${hit.path} (score=${hit.score}, source=${hit.source}, matched=${hit.matchedTerms.join(',') || '∅'})`
      )
      console.log(`    ${hit.reason}`)
    }
    if (plan.semantic.unknownTerms.length > 0) {
      console.log(`Unknown terms: ${plan.semantic.unknownTerms.join(', ')}`)
    }
  }

  console.log('\nNext Render Command')
  console.log(plan.nextRenderCommand)
  console.log('\nNext Run Init Command')
  console.log(plan.nextRunInitCommand)
}

function printContextExpand(result: ContextExpandResult, projectRoot: string) {
  console.log('Atelier Context Expand')
  console.log(`Run: ${result.runId}`)
  console.log(
    `Status: ${result.alreadyExpanded ? 'already expanded' : 'expanded'}`
  )
  console.log(`Document: ${result.expandedDocument.path}`)
  console.log(`Context: ${path.relative(projectRoot, result.contextPath)}`)
  console.log(`Manifest: ${path.relative(projectRoot, result.manifestPath)}`)
}

function printCloseReport(result: RunCloseResult, projectRoot: string) {
  console.log('Atelier Run Close')
  console.log(`Run: ${result.runId}`)
  console.log(
    `Status: ${result.ok ? (result.alreadyClosed ? 'already closed' : 'closed') : 'blocked'}`
  )
  console.log(`Non-trivial: ${result.nonTrivial ? 'yes' : 'no'}`)
  console.log(`Review required: ${result.reviewRequired ? 'yes' : 'no'}`)
  if (result.moved) {
    console.log(`Moved: ${path.relative(projectRoot, result.completedPath)}`)
  }

  console.log('\nDiagnostics')
  if (result.diagnostics.length === 0) console.log('- None')
  for (const diagnostic of result.diagnostics) {
    console.log(`- ${formatDiagnostic(diagnostic)}`)
  }
}

function printKnowledgePromotion(
  result: KnowledgePromotionResult,
  projectRoot: string
) {
  console.log('Atelier Knowledge Promote')
  console.log(`Status: ${result.ok ? 'promoted' : 'blocked'}`)
  if (result.promotedId) console.log(`ID: ${result.promotedId}`)
  if (result.destinationPath)
    console.log(
      `Destination: ${path.relative(projectRoot, result.destinationPath)}`
    )

  console.log('\nDuplicate Candidates')
  if (result.duplicateCandidates.length === 0) console.log('- None')
  for (const candidate of result.duplicateCandidates)
    console.log(`- ${candidate}`)

  console.log('\nRole Bundle Impact')
  if (result.roleBundleImpact.length === 0) console.log('- None')
  for (const roleId of result.roleBundleImpact) console.log(`- ${roleId}`)

  console.log('\nDiagnostics')
  if (result.diagnostics.length === 0) console.log('- None')
  for (const diagnostic of result.diagnostics)
    console.log(`- ${formatDiagnostic(diagnostic)}`)
}

function printRenameChanges(label: string, changes: readonly IdRenameChange[]) {
  console.log(`\n${label}`)
  if (changes.length === 0) {
    console.log('- None')
    return
  }
  for (const change of changes) {
    const fieldSuffix = change.field ? ` (${change.field})` : ''
    console.log(
      `- ${change.path}${fieldSuffix}: ${change.kind} x${change.count}`
    )
    for (const sample of change.samples) console.log(`    ${sample}`)
  }
}

function printIdRename(
  result: IdRenameResult,
  projectRoot: string,
  write: boolean
) {
  const mode = write ? (result.written ? 'written' : 'preview') : 'preview'
  console.log('Atelier ID Rename')
  console.log(`Mode: ${mode}`)
  console.log(`Old ID: ${result.oldId}`)
  console.log(`New ID: ${result.newId}`)
  if (result.oldPath) {
    console.log(`Owner: ${result.oldPath}`)
  }

  const sourceChanges = (result.written ? result.changes : result.preview).filter(
    (change) =>
      change.kind !== 'json-string' && change.kind !== 'manifest'
  )
  const generatedChanges = (result.written ? result.changes : result.preview).filter(
    (change) =>
      change.kind === 'json-string' || change.kind === 'manifest'
  )

  printRenameChanges('Source File Changes', sourceChanges)
  printRenameChanges('Generated File Changes', generatedChanges)

  console.log('\nDiagnostics')
  if (result.diagnostics.length === 0) console.log('- None')
  for (const diagnostic of result.diagnostics) {
    console.log(`- ${formatDiagnostic({ ...diagnostic, path: diagnostic.path ?? path.relative(projectRoot, diagnostic.path ?? '.') })}`)
  }

  if (!result.written && result.preview.length > 0) {
    console.log('\nNext Commands')
    for (const command of result.nextCommands) console.log(command)
  }
}

function printGenerate(
  result: GenerateResult,
  projectRoot: string,
  write: boolean
) {
  console.log('Atelier Generate')
  console.log(`Mode: ${write ? 'written' : 'preview'}`)
  console.log(`Generated root: ${path.relative(projectRoot, result.generatedRoot)}`)
  console.log(`Adapter root: ${path.relative(projectRoot, result.adapterRoot)}`)
  console.log(`Files: ${result.files.length}`)

  for (const file of result.files) {
    console.log(`- ${path.relative(projectRoot, file.absolutePath)} (${file.kind})`)
  }

  console.log('\nDiagnostics')
  if (result.diagnostics.length === 0) console.log('- None')
  for (const diagnostic of result.diagnostics)
    console.log(`- ${formatDiagnostic(diagnostic)}`)

  if (!write && result.files.length > 0) {
    console.log('\nNext Commands')
    for (const command of result.nextCommands) console.log(command)
  }
}

function hasErrorDiagnostic(diagnostics: readonly Diagnostic[]) {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error')
}

export async function runCli(argv: readonly string[]) {
  const [command = 'help', subcommand, ...restRaw] = argv

  if (
    command === 'help' ||
    command === '--help' ||
    command === '-h' ||
    subcommand === 'help' ||
    subcommand === '--help' ||
    subcommand === '-h' ||
    restRaw.includes('--help') ||
    restRaw.includes('-h')
  ) {
    console.log(usage())
    return 0
  }

  if (command === 'doctor') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
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
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const check = base.remaining.includes('--check')
    const unknown = base.remaining.filter((arg) => arg !== '--check')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)
    const result = compileIndexes({
      projectRoot: base.projectRoot,
      check,
      write: !check,
    })

    if (base.json) {
      console.log(
        JSON.stringify(
          {
            ok: result.ok,
            generatedRoot: result.generatedRoot,
            staleFiles: result.staleFiles,
            diagnosticSummary: result.diagnosticSummary,
          },
          null,
          2
        )
      )
    } else {
      printIndexReport(result, check)
    }

    return result.ok ? 0 : 1
  }

  if (command === 'scan') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const write = base.remaining.includes('--write')
    const unknown = base.remaining.filter((arg) => arg !== '--write')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    const result = scanProject(base.projectRoot)

    if (write) {
      writeGraph(base.projectRoot, result.graph)
    }

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('Atelier Scan')
      console.log(`Artifacts observed: ${result.graph.artifacts.length}`)
      console.log(`Edges extracted: ${result.graph.edges.length}`)
      console.log(`Artifact kinds:`)
      const counts: Record<string, number> = {}
      for (const artifact of result.graph.artifacts) {
        counts[artifact.kind] = (counts[artifact.kind] ?? 0) + 1
      }
      for (const [kind, count] of Object.entries(counts).sort()) {
        console.log(`  ${kind}: ${count}`)
      }
      if (result.errors.length > 0) {
        console.log('\nErrors:')
        for (const error of result.errors) console.log(`  - ${error}`)
      }
      if (write) {
        console.log(`\nGraph written to: harness/atelier/graph.json`)
      }
    }

    return result.errors.length === 0 ? 0 : 1
  }

  if (command === 'graph') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const unknown = base.remaining.filter((arg) => arg !== '')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    const graph: GraphSnapshot = readGraph(base.projectRoot) ?? buildGraph(base.projectRoot)

    if (base.json) {
      console.log(JSON.stringify(graph, null, 2))
    } else {
      console.log('Atelier Graph')
      console.log(`Version: ${graph.version}`)
      console.log(`Generated: ${graph.generatedAt}`)
      console.log(`Artifacts: ${graph.artifacts.length}`)
      console.log(`Edges: ${graph.edges.length}`)
    }

    return 0
  }

  if (command === 'status') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const unknown = base.remaining.filter((arg) => arg !== '')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    const graph = readGraph(base.projectRoot) ?? buildGraph(base.projectRoot)
    const stale = isGraphStale(base.projectRoot, graph)
    const status = computeGraphStatus(graph)

    if (base.json) {
      console.log(JSON.stringify({ graph: status, stale }, null, 2))
    } else {
      console.log('Atelier Status')
      console.log(`Artifacts: ${status.artifactCount}`)
      console.log(`Edges: ${status.edgeCount}`)
      console.log(`Stale: ${status.staleArtifacts.length}`)
      console.log(`Orphaned: ${status.orphanedArtifacts.length}`)
      console.log(`Stale graph: ${stale ? 'yes (re-run atelier scan --write)' : 'no'}`)
      if (status.staleArtifacts.length > 0) {
        console.log('\nStale Artifacts:')
        for (const artifact of status.staleArtifacts.slice(0, 20)) {
          console.log(`  - ${artifact.id} (${artifact.path})`)
        }
        if (status.staleArtifacts.length > 20) {
          console.log(`  ... ${status.staleArtifacts.length - 20} more`)
        }
      }
      if (status.orphanedArtifacts.length > 0) {
        console.log('\nOrphaned Artifacts:')
        for (const artifact of status.orphanedArtifacts.slice(0, 20)) {
          console.log(`  - ${artifact.id} (${artifact.path})`)
        }
        if (status.orphanedArtifacts.length > 20) {
          console.log(`  ... ${status.orphanedArtifacts.length - 20} more`)
        }
      }
    }

    return stale ? 2 : 0
  }

  if (command === 'impact') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const target = readRequiredOption(base.remaining, '--path')
    const graph = readGraph(base.projectRoot) ?? buildGraph(base.projectRoot)
    const impact = graphImpact(graph, target)

    if (base.json) {
      console.log(JSON.stringify(impact, null, 2))
    } else {
      console.log('Atelier Impact')
      console.log(`Target: ${target}`)
      console.log(`Affected artifacts: ${impact.artifacts.length}`)
      console.log(`Related edges: ${impact.edges.length}`)
      for (const artifact of impact.artifacts) {
        console.log(`  - ${artifact.id} (${artifact.kind}, ${artifact.path})`)
      }
    }

    return 0
  }

  if (command === 'blame') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const artifactId = base.remaining[0]
    if (!artifactId) throw new Error('blame requires ARTIFACT_ID')
    if (base.remaining.length > 1) throw new Error(`Unknown argument: ${base.remaining[1]}`)

    const graph = readGraph(base.projectRoot) ?? buildGraph(base.projectRoot)
    const blame = graphBlame(graph, artifactId)

    if (base.json) {
      console.log(JSON.stringify(blame, null, 2))
    } else {
      console.log('Atelier Blame')
      if (blame.artifact) {
        console.log(`Artifact: ${blame.artifact.id} (${blame.artifact.kind})`)
        console.log(`Path: ${blame.artifact.path}`)
      } else {
        console.log(`Artifact not found: ${artifactId}`)
      }
      console.log(`\nIncoming edges (${blame.incomingEdges.length}):`)
      for (const edge of blame.incomingEdges) {
        console.log(`  ${edge.from} --[${edge.kind}]--> ${edge.to}`)
      }
      console.log(`\nOutgoing edges (${blame.outgoingEdges.length}):`)
      for (const edge of blame.outgoingEdges) {
        console.log(`  ${edge.from} --[${edge.kind}]--> ${edge.to}`)
      }
    }

    return 0
  }

  if (command === 'controls' && subcommand === 'list') {
    const base = parseBase(restRaw)
    const controls = listControls(base.projectRoot)

    if (base.json) {
      console.log(JSON.stringify(controls, null, 2))
    } else {
      console.log('Atelier Controls List')
      console.log(`Total: ${controls.length}`)
      const byType: Record<string, number> = {}
      for (const c of controls) {
        byType[c.type] = (byType[c.type] ?? 0) + 1
      }
      for (const [type, count] of Object.entries(byType).sort()) {
        console.log(`  ${type}: ${count}`)
      }
    }

    return 0
  }

  if (command === 'controls' && subcommand === 'coverage') {
    const base = parseBase(restRaw)
    const report = buildCoverageReport(base.projectRoot)

    if (base.json) {
      console.log(JSON.stringify(report, null, 2))
    } else {
      console.log('Atelier Controls Coverage')
      console.log(`Knowledge: ${report.coveredKnowledge}/${report.totalKnowledge} covered`)
      console.log(`Uncovered: ${report.uncoveredKnowledge}`)
      console.log(`Controls: ${report.totalControls}`)
      console.log(`Orphaned: ${report.orphanedControls.length}`)
      console.log('\nType counts:')
      for (const [type, count] of Object.entries(report.typeCounts).sort()) {
        console.log(`  ${type}: ${count}`)
      }
      if (report.entries.length <= 5) {
        for (const entry of report.entries) {
          console.log(`\n${entry.knowledgeId}:`)
          console.log(`  score: ${(entry.coverageScore * 100).toFixed(0)}%`)
          console.log(`  controls: ${entry.controls.length}`)
          console.log(`  missing: ${entry.missingTypes.join(', ') || 'none'}`)
        }
      }
    }

    return 0
  }

  if (command === 'controls' && subcommand === 'missing') {
    const base = parseBase(restRaw)
    const missing = findMissingControls(base.projectRoot)

    if (base.json) {
      console.log(JSON.stringify(missing, null, 2))
    } else {
      console.log('Atelier Controls Missing')
      console.log(`Knowledge items with missing controls: ${missing.length}`)
      for (const entry of missing.slice(0, 20)) {
        console.log(`  ${entry.knowledgeId}: missing ${entry.missingTypes.join(', ')}`)
      }
      if (missing.length > 20) {
        console.log(`  ... ${missing.length - 20} more`)
      }
    }

    return 0
  }

  if (command === 'reconcile') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const unknown = base.remaining.filter((arg) => arg !== '')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    const result = reconcile({ projectRoot: base.projectRoot })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('Atelier Reconcile')
      console.log(`Findings: ${result.findings.length}`)
      for (const finding of result.findings) {
        console.log(`  [${finding.riskAction}] ${finding.kind}: ${finding.message}`)
      }
      console.log('\nRisk action counts:')
      for (const [action, count] of Object.entries(result.riskActionCounts)) {
        if (count > 0) console.log(`  ${action}: ${count}`)
      }
    }

    return 0
  }

  if (command === 'repair') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const dryRun = base.remaining.includes('--dry-run')
    const unknown = base.remaining.filter((arg) => arg !== '--dry-run')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)
    if (!dryRun) throw new Error('repair requires --dry-run (safe mode)')

    const result = repairDryRun({ projectRoot: base.projectRoot })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('Atelier Repair (Dry Run)')
      console.log(`Would change: ${result.wouldChange ? 'yes' : 'no'}`)
      console.log(`Findings: ${result.findings.length}`)
      for (const change of result.changes) {
        console.log(`  ${change}`)
      }
    }

    return 0
  }

  if (command === 'workflow' && subcommand === 'list') {
    const base = parseBase(restRaw)
    const entries = listAtelierRegistryEntries(base.projectRoot, 'workflow')

    if (base.json) {
      console.log(JSON.stringify({ workflows: entries }, null, 2))
    } else {
      printRegistryList('Workflow', entries)
    }

    return 0
  }

  if (command === 'role' && subcommand === 'list') {
    const base = parseBase(restRaw)
    const entries = listAtelierRegistryEntries(base.projectRoot, 'role')

    if (base.json) {
      console.log(JSON.stringify({ roles: entries }, null, 2))
    } else {
      printRegistryList('Role', entries)
    }

    return 0
  }

  if (command === 'context' && subcommand === 'plan') {
    const base = parseBase(restRaw)
    const roles = readRepeatedOption(base.remaining, '--role')
    const semanticMaxResultsRaw = readOptionalOption(base.remaining, '--semantic-max-results')
    const semanticMaxResults = semanticMaxResultsRaw === undefined ? undefined : Number(semanticMaxResultsRaw)
    if (
      semanticMaxResultsRaw !== undefined &&
      (!Number.isFinite(semanticMaxResults) || (semanticMaxResults as number) < 1)
    ) {
      throw new Error('--semantic-max-results must be a positive integer')
    }
    const semantic = base.remaining.includes('--semantic')
    const plan = buildContextPlan({
      projectRoot: base.projectRoot,
      workflowId: readRequiredOption(base.remaining, '--workflow'),
      roleIds: roles,
      inputPath: readOptionalOption(base.remaining, '--path') ?? '.',
      intent: readRequiredOption(base.remaining, '--intent'),
      requiredOnly: base.remaining.includes('--required-only'),
      mode: normalizeContextMode(readOptionalOption(base.remaining, '--mode')),
      semantic,
      semanticMaxResults: semanticMaxResults as number | undefined,
    })

    if (base.json) {
      console.log(JSON.stringify(plan, null, 2))
    } else {
      printContextPlan(plan)
    }

    return hasErrorDiagnostic(plan.diagnostics) ? 1 : 0
  }

  if (command === 'context' && subcommand === 'render') {
    const base = parseBase(restRaw)
    const roles = readRepeatedOption(base.remaining, '--role')
    const rendered = renderContextForOptions({
      projectRoot: base.projectRoot,
      workflowId: readRequiredOption(base.remaining, '--workflow'),
      roleIds: roles,
      inputPath: readOptionalOption(base.remaining, '--path') ?? '.',
      intent: readRequiredOption(base.remaining, '--intent'),
      requiredOnly: base.remaining.includes('--required-only'),
      mode: normalizeContextMode(readOptionalOption(base.remaining, '--mode')),
      runId: readOptionalOption(base.remaining, '--id'),
    })

    if (base.json) {
      console.log(JSON.stringify(rendered, null, 2))
    } else {
      console.log(rendered.context)
    }

    return hasErrorDiagnostic(rendered.plan.diagnostics) ? 1 : 0
  }

  if (command === 'context' && subcommand === 'expand') {
    const base = parseBase(restRaw)
    const runId = base.remaining[0]
    const reference = base.remaining[1]
    if (!runId || !reference)
      throw new Error('context expand requires RUN-ID and DOC-ID-OR-PATH')
    if (base.remaining.length > 2)
      throw new Error(`Unknown argument: ${base.remaining[2]}`)

    const result = expandRunContext({
      projectRoot: base.projectRoot,
      runId,
      reference,
    })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      printContextExpand(result, base.projectRoot)
    }

    return 0
  }

  if (command === 'run' && subcommand === 'init') {
    const base = parseBase(restRaw)
    const roles = readRepeatedOption(base.remaining, '--role')
    const result = initRun({
      projectRoot: base.projectRoot,
      workflowId: readRequiredOption(base.remaining, '--workflow'),
      roleIds: roles,
      inputPath: readOptionalOption(base.remaining, '--path') ?? '.',
      intent: readRequiredOption(base.remaining, '--intent'),
      mode: normalizeContextMode(readOptionalOption(base.remaining, '--mode')),
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
            diagnostics: result.plan.diagnostics,
            policy: result.policy,
            nextActions: result.nextActions,
          },
          null,
          2
        )
      )
    } else {
      console.log('Atelier Run Init')
      console.log(`Run: ${result.runId}`)
      console.log(`Path: ${path.relative(base.projectRoot, result.runPath)}`)
      console.log(
        `Context: ${path.relative(base.projectRoot, result.contextPath)}`
      )
      console.log(
        `Manifest: ${path.relative(base.projectRoot, result.manifestPath)}`
      )
      console.log('\nPolicy')
      console.log(`Edit allowed: ${result.policy.editAllowed ? 'yes' : 'no'}`)
      console.log(`Purpose: ${result.policy.purpose}`)
      console.log('\nNext actions:')
      for (const [index, action] of result.nextActions.entries()) {
        const value =
          action.kind === 'read_file'
            ? `Read context: cat ${action.path}`
            : action.command
        console.log(`  ${index + 1}. ${value}`)
      }
    }

    return 0
  }

  if (command === 'run' && subcommand === 'status') {
    const base = parseBase(restRaw)
    const runId = base.remaining[0]
    if (!runId) throw new Error('run status requires RUN-ID')
    if (base.remaining.length > 1)
      throw new Error(`Unknown argument: ${base.remaining[1]}`)

    const { runStatus } = await import('./core/runs')
    const result = runStatus({ projectRoot: base.projectRoot, runId })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('Atelier Run Status')
      console.log(`Run: ${result.runId}`)
      console.log(`Completed: ${result.completed ? 'yes' : 'no'}`)
      console.log(`Workflow: ${result.workflowId ?? '(unknown)'}`)
      console.log(`Roles: ${result.roleIds.join(', ') || '(none)'}`)
      console.log(`Input path: ${result.inputPath ?? '(unknown)'}`)
      console.log(`Context mode: ${result.contextMode ?? '(unknown)'}`)
      console.log(
        `Artifacts: brief=${result.artifacts.brief ? 'y' : 'n'} context=${result.artifacts.context ? 'y' : 'n'} manifest=${result.artifacts.manifest ? 'y' : 'n'} worklog=${result.artifacts.worklog ? 'y' : 'n'} verification=${result.artifacts.verification ? 'y' : 'n'} handoff=${result.artifacts.handoff ? 'y' : 'n'} review=${result.artifacts.review ? 'y' : 'n'} plan=${result.artifacts.plan ? 'y' : 'n'}`
      )
      if (result.missingArtifacts.length > 0) {
        console.log(`Missing: ${result.missingArtifacts.join(', ')}`)
      }
      if (result.openKnowledgeProposals.length > 0) {
        console.log(`Open proposals: ${result.openKnowledgeProposals.join(', ')}`)
      }
      if (result.diagnostics.length > 0) {
        console.log('\nDiagnostics')
        for (const diagnostic of result.diagnostics) {
          console.log(`- ${formatDiagnostic(diagnostic)}`)
        }
      }
    }

    return result.diagnostics.some((d) => d.severity === 'error') ? 1 : 0
  }

  if (command === 'run' && subcommand === 'close') {
    const base = parseBase(restRaw)
    const runId = base.remaining[0]
    if (!runId) throw new Error('run close requires RUN-ID')
    if (base.remaining.length > 1)
      throw new Error(`Unknown argument: ${base.remaining[1]}`)

    const result = closeRun({
      projectRoot: base.projectRoot,
      runId,
    })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      printCloseReport(result, base.projectRoot)
    }

    return result.ok ? 0 : 1
  }

  if (command === 'repo' && subcommand === 'owner') {
    const base = parseBase(restRaw)
    const target = readRequiredOption(base.remaining, '--path')
    const { repoOwner } = await import('./core/owner')
    const result = repoOwner(target, base.projectRoot)

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('Atelier Repo Owner')
      console.log(`Path: ${result.path}`)
      console.log(`Project: ${result.project ?? '(none)'}`)
      console.log(`Owner role: ${result.ownerRole ?? '(none)'}`)
      console.log(`Source: ${result.source}`)
      if (result.notes.length > 0) {
        console.log('\nNotes')
        for (const note of result.notes) console.log(`- ${note}`)
      }
    }

    return 0
  }

  if (command === 'repo' && subcommand === 'map') {
    const base = parseBase(restRaw)
    const { compileRepoMap, compilePathOwnership } = await import('./core/repo-map')
    const map = compileRepoMap(base.projectRoot)
    const ownership = compilePathOwnership(base.projectRoot, map)
    if (base.json) {
      console.log(JSON.stringify({ repoMap: map, pathOwnership: ownership }, null, 2))
    } else {
      console.log('Atelier Repo Map')
      console.log(`Workspace: packageManager=${map.workspace.packageManager ?? '?'} taskRunner=${map.workspace.taskRunner ?? '?'}`)
      console.log(`Projects: ${map.projects.length}`)
      for (const project of map.projects) {
        console.log(
          `  - ${project.relativeRoot} (${project.name}, ${project.type}, ${project.files} files, ${project.languages.join(',') || 'no-detected-language'})`
        )
      }
      console.log(`Files: ${map.files.length}`)
      console.log(`Path ownership entries: ${ownership.entries.length}`)
    }
    return 0
  }

  if (command === 'knowledge' && subcommand === 'propose') {
    const base = parseBase(restRaw)
    const result = proposeKnowledge({
      projectRoot: base.projectRoot,
      fromRun: readRequiredOption(base.remaining, '--from-run'),
      knowledgeType: readRequiredOption(base.remaining, '--kind'),
      title: readRequiredOption(base.remaining, '--title'),
      tags: readRepeatedOption(base.remaining, '--tag'),
      evidence: readOptionalOption(base.remaining, '--evidence'),
      whyRecur: readOptionalOption(base.remaining, '--why-recur'),
      whyNotCovered: readOptionalOption(base.remaining, '--why-not-covered'),
    })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('Atelier Knowledge Propose')
      console.log(
        `Proposal: ${path.relative(base.projectRoot, result.proposalPath)}`
      )
    }

    return 0
  }

  if (command === 'knowledge' && subcommand === 'promote') {
    const base = parseBase(restRaw)
    const proposalPath = base.remaining[0]
    if (!proposalPath)
      throw new Error('knowledge promote requires PROPOSAL_PATH')
    if (base.remaining.length > 1)
      throw new Error(`Unknown argument: ${base.remaining[1]}`)

    const result = promoteKnowledgeProposal({
      projectRoot: base.projectRoot,
      proposalPath,
    })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      printKnowledgePromotion(result, base.projectRoot)
    }

    return result.ok ? 0 : 1
  }

  if (command === 'knowledge' && subcommand === 'reject') {
    const base = parseBase(restRaw)
    const proposalPath = base.remaining[0]
    if (!proposalPath)
      throw new Error('knowledge reject requires PROPOSAL_PATH')
    const reason = readOptionalOption(base.remaining, '--reason')

    const result = rejectKnowledgeProposal({
      projectRoot: base.projectRoot,
      proposalPath,
      reason,
    })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('Atelier Knowledge Reject')
      console.log(
        `Archived: ${path.relative(base.projectRoot, result.archivedPath)}`
      )
    }

    return 0
  }

  if (command === 'id' && subcommand === 'rename') {
    const base = parseBase(restRaw)
    const oldId = base.remaining[0]
    const newId = base.remaining[1]
    if (!oldId || !newId)
      throw new Error('id rename requires OLD_ID and NEW_ID')
    const write = base.remaining.includes('--write')
    const unknown = base.remaining
      .slice(2)
      .filter((arg) => arg !== '--write')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    const result = renameId({
      projectRoot: base.projectRoot,
      oldId,
      newId,
      write,
    })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      printIdRename(result, base.projectRoot, write)
    }

    return result.ok ? 0 : 1
  }

  if (command === 'generate') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const write = base.remaining.includes('--write')
    const unknown = base.remaining.filter((arg) => arg !== '--write')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    const result = generateGeneratedFiles({
      projectRoot: base.projectRoot,
      write,
    })

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      printGenerate(result, base.projectRoot, write)
    }

    return result.ok ? 0 : 1
  }

  if (command === 'mcp') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const allowMutations = base.remaining.includes('--allow-mutations')
    const unknown = base.remaining.filter((arg) => arg !== '--allow-mutations')
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    process.stderr.write(
      `[atelier] starting MCP server (projectRoot=${base.projectRoot}, allowMutations=${allowMutations})\n`
    )
    const { runMcpServer } = await import('./core/mcp')
    await runMcpServer({ projectRoot: base.projectRoot, allowMutations })
    return 0
  }

  if (command === 'gui') {
    const base = parseBase(
      [subcommand, ...restRaw].filter(
        (value): value is string => value !== undefined
      )
    )
    const allowMutations = base.remaining.includes('--allow-mutations')
    const portArgIndex = base.remaining.indexOf('--port')
    const portValue = portArgIndex >= 0 ? base.remaining[portArgIndex + 1] : undefined
    const hostArgIndex = base.remaining.indexOf('--host')
    const hostValue = hostArgIndex >= 0 ? base.remaining[hostArgIndex + 1] : undefined
    const unknown = base.remaining.filter(
      (arg, index) =>
        arg !== '--allow-mutations' &&
        arg !== '--port' &&
        arg !== '--host' &&
        !(portArgIndex >= 0 && index === portArgIndex + 1) &&
        !(hostArgIndex >= 0 && index === hostArgIndex + 1)
    )
    if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)

    const port = portValue ? Number.parseInt(portValue, 10) : 4173
    if (!Number.isFinite(port)) throw new Error(`Invalid port: ${portValue}`)
    const host = hostValue ?? '127.0.0.1'
    const projectRoot = base.projectRoot

    const { startGuiServer } = await import('./core/gui-server')
    const server = startGuiServer({
      projectRoot,
      allowMutations,
      host,
      port,
    })
    process.stderr.write(
      `[atelier] GUI server listening at http://${host}:${server.port} (projectRoot=${projectRoot}, allowMutations=${allowMutations})\n`
    )
    const shutdown = () => {
      server.stop()
      process.exit(0)
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    await new Promise(() => {})
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
