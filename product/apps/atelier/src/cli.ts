#!/usr/bin/env bun

import path from 'node:path'
import {
  buildGraphContextPlan,
  normalizeContextMode,
  type ContextPlan,
} from './core/context'
import { runDoctor } from './core/doctor'

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

import { checkPolicy, explainPolicy, simulatePolicy } from './core/policy'
import { listControls, buildCoverageReport, findMissingControls } from './core/controls'
import { createTask, splitTask, assignTask, taskStatus, closeTask, createRole, editRole } from './core/tasks'
import { appendRunHandoff, completeRun, createRun, inspectRun, listRunVerification, recordRunVerification, resumeRun } from './core/runs'
import { reconcile, repairDryRun } from './core/reconciler'

import {
  recoveryLinesForDiagnostic,
} from './core/llm-protocol'
import type { Diagnostic, DoctorReport } from './core/schema'

type BaseOptions = {
  projectRoot: string
  json: boolean
}

function usage() {
  return [
    'Usage:',
    '  atelier doctor [--json] [--fix] [--project-root <path>]',

    '  atelier scan [--json] [--write] [--project-root <path>]',
    '  atelier graph [--json] [--project-root <path>]',
    '  atelier status [--json] [--project-root <path>]',
    '  atelier impact --path <path> [--json] [--project-root <path>]',
    '  atelier blame ARTIFACT_ID [--json] [--project-root <path>]',
    '  atelier context plan --workflow <id> [--role <id>] [--task <task-id>] --path <path> --intent <text> [--mode compact|full|linked] [--required-only] [--json] [--project-root <path>]',
    '  atelier controls list [--json] [--project-root <path>]',
    '  atelier controls coverage [--json] [--project-root <path>]',
    '  atelier controls missing [--json] [--project-root <path>]',
    '  atelier task create --title <text> --description <text> [--phase <phase>] [--scope <path>] [--role <id>] [--parent <id>] [--json]',
    '  atelier task status TASK-ID [--json]',
    '  atelier task assign TASK-ID [--role <id>] [--agent <name>] [--json]',
    '  atelier task close TASK-ID [--outcome completed|cancelled] [--json]',
    '  atelier task split TASK-ID --subtask "<title>::<description>" [--json]',
    '  atelier run create --task <task-id> [--json]',
    '  atelier run inspect RUN-ID [--json]',
    '  atelier run resume RUN-ID [--json]',
    '  atelier run handoff RUN-ID --append <text> [--json]',
    '  atelier run verify RUN-ID --list [--json]',
    '  atelier run verify RUN-ID --record "<check-id>::<status>::<note>" [--json]',
    '  atelier run complete RUN-ID [--json]',
    '  atelier role create --id <id> --title <title> [--pinned <id>] [--json]',
    '  atelier role edit ROLE-ID [--json]',
    '  atelier policy check [--path <path>] [--command <cmd>] [--tool <name>] [--json] [--project-root <path>]',
    '  atelier policy explain [--rule-id <id>] [--json] [--project-root <path>]',
    '  atelier policy simulate <changes-json> [--json] [--project-root <path>]',
    '  atelier reconcile [--json] [--project-root <path>]',
    '  atelier repair --dry-run [--json] [--project-root <path>]',

    '  atelier mcp [--allow-mutations] [--project-root <path>]',
    '  atelier gui [--port <port>] [--host <host>] [--allow-mutations] [--project-root <path>]',
    '',
    'Commands:',
    '  doctor   Inspect harness Markdown for schema, link, ID, and stale path issues.',

    '  scan     Observe project artifacts and build the Artifact Graph.',
    '  graph    Display the current Artifact Graph snapshot.',
    '  status   Summarize graph health, stale artifacts, and orphaned controls.',
    '  impact   Show artifacts and edges affected by a path change.',
    '  blame    Trace incoming and outgoing edges for an artifact.',
    '  context  Plan task context for an external LLM runner without managing run state.',
    '  controls Observe and query control mechanisms (checks, linters, hooks, etc.).',
    '  policy   Check, explain, and simulate governance policy rules.',
    '  task     Create, inspect, assign, split, and close task artifacts.',
    '  run      Create, inspect, resume, verify, handoff, and complete run capsules.',
    '  role     Create and edit role harness documents.',
    '  reconcile Reconcile the Artifact Graph against current filesystem state.',
    '  repair    Preview what reconcile would change (dry-run).',
    '  mcp      Start a stdio Model Context Protocol server. Mutations require --allow-mutations or a confirm flag from the client.',
    '  gui      Start the local HTTP GUI. Binds to 127.0.0.1 by default. Mutations require --allow-mutations or a confirm flag from the UI.',
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

  console.log('')
  console.log('Context plan generated.')
  console.log('No run capsule created.')
  console.log('No task state mutated.')
  console.log('Use --json or pass this plan to an external LLM runner.')
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

  if (command === 'policy' && subcommand === 'check') {
    const base = parseBase(restRaw)
    const pathArg = readOptionalOption(base.remaining, '--path')
    const commandArg = readOptionalOption(base.remaining, '--command')
    const toolArg = readOptionalOption(base.remaining, '--tool')
    const results = checkPolicy({ projectRoot: base.projectRoot, path: pathArg, command: commandArg, tool: toolArg })

    if (base.json) {
      console.log(JSON.stringify(results, null, 2))
    } else {
      console.log('Atelier Policy Check')
      for (const result of results) {
        const icon = result.allowed ? (result.effectiveMode === 'allow' ? '✓' : result.effectiveMode === 'advisory' ? '⚠' : '✓') : '✗'
        console.log(`  ${icon} ${result.effectiveMode.toUpperCase()}: allowed=${result.allowed}`)
        for (const d of result.decisions.filter((dd) => dd.matched)) {
          console.log(`      rule: ${d.ruleId} (${d.mode}) — ${d.reason}`)
        }
      }
    }

    return 0
  }

  if (command === 'policy' && subcommand === 'explain') {
    const base = parseBase(restRaw)
    const ruleId = readOptionalOption(base.remaining, '--rule-id')
    const result = explainPolicy(base.projectRoot, ruleId)

    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log('Atelier Policy Explain')
      console.log(`Path rules: ${result.config.pathRules.length}`)
      console.log(`Command rules: ${result.config.commandRules.length}`)
      console.log(`Tool rules: ${result.config.toolRules.length}`)
      console.log(`Approval policies: ${result.config.approvalPolicies.length}`)
      console.log('\nDecisions:')
      for (const d of result.decisions) {
        const matched = d.matched ? '✓' : '✗'
        console.log(`  ${matched} [${d.ruleKind}] ${d.ruleId}: ${d.mode} — ${d.reason}`)
      }
    }

    return 0
  }

  if (command === 'policy' && subcommand === 'simulate') {
    const base = parseBase(restRaw)
    const changesJson = base.remaining.find((arg) => arg.startsWith('{'))
    if (!changesJson) throw new Error('simulate requires a JSON argument with policy changes')
    const changes = JSON.parse(changesJson)
    const results = simulatePolicy(base.projectRoot, changes)

    if (base.json) {
      console.log(JSON.stringify(results, null, 2))
    } else {
      console.log('Atelier Policy Simulate')
      for (const result of results) {
        const icon = result.allowed ? '✓' : '✗'
        console.log(`  ${icon} ${result.effectiveMode.toUpperCase()}`)
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

  if (command === 'task' && subcommand === 'create') {
    const base = parseBase(restRaw)
    const title = readRequiredOption(base.remaining, '--title')
    const description = readRequiredOption(base.remaining, '--description')
    const phase = readOptionalOption(base.remaining, '--phase') ?? 'unspecified'
    const scope = readOptionalOption(base.remaining, '--scope') ?? '.'
    const roles = readRepeatedOption(base.remaining, '--role')
    const parent = readOptionalOption(base.remaining, '--parent')

    const task = createTask({ projectRoot: base.projectRoot, title, description, phase, scope, assignedRoles: roles, parentTask: parent })
    if (base.json) {
      console.log(JSON.stringify(task, null, 2))
    } else {
      console.log('Atelier Task Create')
      console.log(`ID: ${task.id}`)
      console.log(`Title: ${task.title}`)
      console.log(`Status: ${task.status}`)
    }
    return 0
  }

  if (command === 'task' && subcommand === 'status') {
    const base = parseBase(restRaw)
    const taskId = base.remaining[0]
    if (!taskId) throw new Error('task status requires TASK-ID')
    const result = taskStatus(base.projectRoot, taskId)
    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      if (!result.exists) {
        console.log(`Task not found: ${taskId}`)
        return 1
      }
      console.log('Atelier Task Status')
      console.log(`ID: ${result.task!.id}`)
      console.log(`Title: ${result.task!.title}`)
      console.log(`Status: ${result.task!.status}`)
      console.log(`Phase: ${result.task!.phase}`)
      console.log(`Assigned: ${result.task!.assignedRoles.join(', ') || '(none)'}`)
    }
    return 0
  }

  if (command === 'task' && subcommand === 'assign') {
    const base = parseBase(restRaw)
    const taskId = base.remaining[0]
    if (!taskId) throw new Error('task assign requires TASK-ID')
    const roles = readRepeatedOption(base.remaining, '--role')
    const agent = readOptionalOption(base.remaining, '--agent')
    const task = assignTask({ projectRoot: base.projectRoot, taskId, roleIds: roles, agent })
    if (base.json) {
      console.log(JSON.stringify(task, null, 2))
    } else {
      console.log('Atelier Task Assign')
      console.log(`Task: ${task.id}`)
      console.log(`Roles: ${task.assignedRoles.join(', ') || '(none)'}`)
      console.log(`Agent: ${task.assignedAgent ?? '(none)'}`)
    }
    return 0
  }

  if (command === 'task' && subcommand === 'close') {
    const base = parseBase(restRaw)
    const taskId = base.remaining[0]
    if (!taskId) throw new Error('task close requires TASK-ID')
    const outcome = readOptionalOption(base.remaining, '--outcome') as 'completed' | 'cancelled' | undefined
    if (outcome && outcome !== 'completed' && outcome !== 'cancelled') {
      throw new Error("--outcome must be 'completed' or 'cancelled'")
    }
    const task = closeTask(base.projectRoot, taskId, outcome)
    if (base.json) {
      console.log(JSON.stringify(task, null, 2))
    } else {
      console.log('Atelier Task Close')
      console.log(`Task: ${task.id}`)
      console.log(`Status: ${task.status}`)
    }
    return 0
  }

  if (command === 'task' && subcommand === 'split') {
    const base = parseBase(restRaw)
    const taskId = base.remaining[0]
    if (!taskId) throw new Error('task split requires TASK-ID')
    const specs = readRepeatedOption(base.remaining, '--subtask')
    if (specs.length === 0) throw new Error('task split requires at least one --subtask "<title>::<description>"')
    const subtasks = specs.map((spec) => {
      const [title, ...descriptionParts] = spec.split('::')
      const description = descriptionParts.join('::')
      if (!title || !description) throw new Error('--subtask must use "<title>::<description>"')
      return { title, description }
    })
    const created = splitTask({ projectRoot: base.projectRoot, taskId, subtasks })
    if (base.json) {
      console.log(JSON.stringify(created, null, 2))
    } else {
      console.log('Atelier Task Split')
      console.log(`Parent: ${taskId}`)
      for (const task of created) console.log(`Subtask: ${task.id} ${task.title}`)
    }
    return 0
  }

  if (command === 'run' && subcommand === 'create') {
    const base = parseBase(restRaw)
    const taskId = readRequiredOption(base.remaining, '--task')
    const run = createRun({ projectRoot: base.projectRoot, taskId })
    if (base.json) {
      console.log(JSON.stringify(run, null, 2))
    } else {
      console.log('Atelier Run Create')
      console.log(`Run: ${run.id}`)
      console.log(`Task: ${run.taskId}`)
      console.log(`Path: ${run.path}`)
    }
    return 0
  }

  if (command === 'run' && subcommand === 'inspect') {
    const base = parseBase(restRaw)
    const runId = base.remaining[0]
    if (!runId) throw new Error('run inspect requires RUN-ID')
    const run = inspectRun(base.projectRoot, runId)
    if (base.json) {
      console.log(JSON.stringify(run, null, 2))
    } else {
      console.log('Atelier Run Inspect')
      console.log(`Run: ${run.id}`)
      console.log(`Status: ${run.status}`)
      console.log(`Task: ${run.taskId}`)
      console.log(`Path: ${run.path}`)
    }
    return 0
  }

  if (command === 'run' && subcommand === 'resume') {
    const base = parseBase(restRaw)
    const runId = base.remaining[0]
    if (!runId) throw new Error('run resume requires RUN-ID')
    const resume = resumeRun(base.projectRoot, runId)
    if (base.json) {
      console.log(JSON.stringify(resume, null, 2))
    } else {
      console.log('Atelier Run Resume')
      console.log(`Run path: ${resume.runPath}`)
      console.log(`Reading order: ${resume.readingOrder.join(', ')}`)
      console.log(resume.prompt)
    }
    return 0
  }

  if (command === 'run' && subcommand === 'handoff') {
    const base = parseBase(restRaw)
    const runId = base.remaining[0]
    if (!runId) throw new Error('run handoff requires RUN-ID')
    const text = readRequiredOption(base.remaining, '--append')
    const run = appendRunHandoff(base.projectRoot, runId, text)
    if (base.json) {
      console.log(JSON.stringify(run, null, 2))
    } else {
      console.log('Atelier Run Handoff')
      console.log(`Run: ${run.id}`)
      console.log('Updated: handoff.md')
    }
    return 0
  }

  if (command === 'run' && subcommand === 'verify') {
    const base = parseBase(restRaw)
    const runId = base.remaining[0]
    if (!runId) throw new Error('run verify requires RUN-ID')
    if (base.remaining.includes('--list')) {
      const records = listRunVerification(base.projectRoot, runId)
      if (base.json) console.log(JSON.stringify(records, null, 2))
      else {
        console.log('Atelier Run Verify')
        for (const record of records) console.log(`${record.checkId}: ${record.status} ${record.note}`)
      }
      return 0
    }
    const spec = readRequiredOption(base.remaining, '--record')
    const [checkId, status, ...noteParts] = spec.split('::')
    const note = noteParts.join('::')
    if (!checkId || !status || !note) throw new Error('--record must use "<check-id>::<status>::<note>"')
    const records = recordRunVerification(base.projectRoot, runId, checkId, status, note)
    if (base.json) console.log(JSON.stringify(records, null, 2))
    else {
      console.log('Atelier Run Verify')
      console.log(`Recorded: ${checkId}`)
    }
    return 0
  }

  if (command === 'run' && subcommand === 'complete') {
    const base = parseBase(restRaw)
    const runId = base.remaining[0]
    if (!runId) throw new Error('run complete requires RUN-ID')
    const run = completeRun(base.projectRoot, runId)
    if (base.json) {
      console.log(JSON.stringify(run, null, 2))
    } else {
      console.log('Atelier Run Complete')
      console.log(`Run: ${run.id}`)
      console.log(`Status: ${run.status}`)
      console.log(`Path: ${run.path}`)
    }
    return 0
  }

  if (command === 'role' && subcommand === 'create') {
    const base = parseBase(restRaw)
    const id = readRequiredOption(base.remaining, '--id')
    const title = readRequiredOption(base.remaining, '--title')
    const pinned = readRepeatedOption(base.remaining, '--pinned')
    createRole({ projectRoot: base.projectRoot, id, title, pinned })
    if (base.json) {
      console.log(JSON.stringify({ id, title }, null, 2))
    } else {
      console.log('Atelier Role Create')
      console.log(`Role: ${id}`)
      console.log(`Title: ${title}`)
    }
    return 0
  }

  if (command === 'role' && subcommand === 'edit') {
    const base = parseBase(restRaw)
    const roleId = base.remaining[0]
    if (!roleId) throw new Error('role edit requires ROLE-ID')
    const result = editRole(base.projectRoot, roleId, {})
    if (base.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      if (!result.role) {
        console.log(`Role not found: ${roleId}`)
        return 1
      }
      console.log('Atelier Role Edit')
      console.log(`Role: ${roleId}`)
      console.log('Preview:')
      for (const line of result.preview) {
        console.log(`  ${line}`)
      }
    }
    return 0
  }

  if (command === 'context' && subcommand === 'plan') {
    const base = parseBase(restRaw)
    const roles = readRepeatedOption(base.remaining, '--role')
    const plan = buildGraphContextPlan({
      projectRoot: base.projectRoot,
      workflowId: readRequiredOption(base.remaining, '--workflow'),
      roleIds: roles,
      inputPath: readOptionalOption(base.remaining, '--path') ?? '.',
      intent: readRequiredOption(base.remaining, '--intent'),
      taskId: readOptionalOption(base.remaining, '--task'),
      requiredOnly: base.remaining.includes('--required-only'),
      mode: normalizeContextMode(readOptionalOption(base.remaining, '--mode')),
    })

    if (base.json) {
      console.log(JSON.stringify(plan, null, 2))
    } else {
      printContextPlan(plan)
    }

    return hasErrorDiagnostic(plan.diagnostics) ? 1 : 0
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
