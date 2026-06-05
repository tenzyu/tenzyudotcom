/**
 * Transformer rendering and validation.
 */
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { writeText } from '../../../lib/src/json.ts'
import {
  type EditBoundary,
  type ImplementationTask,
  type PacketTemplate,
  type TestContract,
  type TransformRecommendation,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'

const GENERATED_MARKER = '<!-- GENERATED FILE. DO NOT EDIT DIRECTLY. -->'

function header(title: string, source: string): string {
  return [
    GENERATED_MARKER,
    `# ${title}`,
    '',
    `Source: \`${source}\``,
    `Generated: ${new Date().toISOString()}`,
    '',
  ].join('\n')
}

export async function renderImplementationTasksView(): Promise<string> {
  const tasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const out: string[] = [header('IMPLEMENTATION_TASKS', 'atelier-transformer transform')]
  out.push(`Total tasks: ${tasks.length}`)
  out.push('')
  for (const t of tasks) {
    out.push(`## ${t.task_id}`)
    out.push(`- title: ${t.title}`)
    out.push(`- goal: ${t.goal}`)
    out.push(`- status: ${t.status}`)
    out.push(`- allowed_files (${t.allowed_files.length}):`)
    for (const f of t.allowed_files.slice(0, 50)) out.push(`  - \`${f}\``)
    if (t.allowed_files.length > 50) out.push(`  - ... ${t.allowed_files.length - 50} more`)
    out.push(`- forbidden_files: ${t.forbidden_files.length}`)
    out.push(`- acceptance_criteria:`)
    for (const c of t.acceptance_criteria) out.push(`  - ${c}`)
    if (t.risk_notes.length > 0) {
      out.push(`- risk_notes:`)
      for (const r of t.risk_notes) out.push(`  - ${r}`)
    }
    out.push('')
  }
  return out.join('\n')
}

export async function renderTestContractsView(): Promise<string> {
  const contracts = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
  const out: string[] = [header('TEST_CONTRACTS', 'atelier-transformer test-contract:derive')]
  out.push(`Total contracts: ${contracts.length}`)
  out.push('')
  for (const c of contracts) {
    out.push(`## ${c.test_contract_id}`)
    out.push(`- task: \`${c.task_id}\``)
    out.push(`- framework: ${c.test_framework}`)
    out.push(`- command: \`${c.command}\``)
    out.push(`- target_files: ${c.target_files.length}`)
    out.push(`- test_files: ${c.test_files.length}`)
    out.push(`- status: ${c.status}`)
    out.push('')
  }
  return out.join('\n')
}

export async function renderRecommendationsView(): Promise<string> {
  const recs = await readNdjson<TransformRecommendation>(TRANSFORMER_PATHS.recommendations)
  const out: string[] = [header('TRANSFORM_RECOMMENDATIONS', 'atelier-transformer recommend')]
  out.push(`Total recommendations: ${recs.length}`)
  out.push('')
  for (const r of recs.slice(0, 50)) {
    out.push(`- (${r.recommendation_type}) from \`${r.source_object_id}\`: ${r.reason.slice(0, 80)}`)
  }
  if (recs.length > 50) out.push(`_... ${recs.length - 50} more_`)
  out.push('')
  return out.join('\n')
}

export async function renderAll(): Promise<{ files: string[] }> {
  await mkdir(path.dirname(TRANSFORMER_PATHS.viewImplementationTasks), { recursive: true })
  await mkdir(TRANSFORMER_PATHS.packetsDir, { recursive: true })
  const tasks = await renderImplementationTasksView()
  const contracts = await renderTestContractsView()
  const recs = await renderRecommendationsView()
  await writeText(TRANSFORMER_PATHS.viewImplementationTasks, tasks)
  await writeText(TRANSFORMER_PATHS.viewTestContracts, contracts)
  await writeText(TRANSFORMER_PATHS.viewTransformRecommendations, recs)
  return {
    files: [
      TRANSFORMER_PATHS.viewImplementationTasks,
      TRANSFORMER_PATHS.viewTestContracts,
      TRANSFORMER_PATHS.viewTransformRecommendations,
    ],
  }
}

export type ValidationIssue = {
  severity: 'P0' | 'P1' | 'P2'
  code: string
  message: string
  affected_record?: string
  recommended_next_action?: string
}

export async function validateTransformer(): Promise<{ issues: ValidationIssue[]; warnings: string[]; stats: unknown }> {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []
  const tasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const contracts = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
  const boundaries = await readNdjson<EditBoundary>(TRANSFORMER_PATHS.editBoundaries)
  const templates = await readNdjson<PacketTemplate>(TRANSFORMER_PATHS.packetTemplates)
  const recs = await readNdjson<TransformRecommendation>(TRANSFORMER_PATHS.recommendations)

  for (const t of tasks) {
    if (t.allowed_files.length === 0) {
      issues.push({ severity: 'P0', code: 'E_TASK_NO_ALLOWED', message: `task ${t.task_id} has empty allowed_files`, affected_record: t.id })
    }
    if (t.forbidden_files.length === 0) {
      issues.push({ severity: 'P0', code: 'E_TASK_NO_FORBIDDEN', message: `task ${t.task_id} has no forbidden_files`, affected_record: t.id })
    }
    if (t.acceptance_criteria.length === 0) {
      issues.push({ severity: 'P0', code: 'E_TASK_NO_ACCEPTANCE', message: `task ${t.task_id} has no acceptance_criteria`, affected_record: t.id })
    }
    if (t.allowed_files.some((f) => f.startsWith('product-specs/') || f.startsWith('harness/knowledge/product-specs/') || f.startsWith('harness/atelier-design-docs/'))) {
      issues.push({ severity: 'P0', code: 'E_TASK_PRODUCT_SPEC', message: `task ${t.task_id} allows editing product specs`, affected_record: t.id })
    }
  }
  for (const c of contracts) {
    if (!c.command || c.command.trim() === '') {
      issues.push({ severity: 'P0', code: 'E_TEST_NO_COMMAND', message: `test contract ${c.test_contract_id} has no command`, affected_record: c.id })
    }
  }
  for (const t of templates) {
    if (t.test_contract_ids.length === 0) {
      issues.push({ severity: 'P1', code: 'E_PACKET_NO_TESTS', message: `packet template ${t.id} has no test contracts`, affected_record: t.id, recommended_next_action: 'derive a test contract first' })
    }
  }
  for (const r of recs) {
    if (!r.source_object_id) {
      issues.push({ severity: 'P1', code: 'E_REC_NO_SOURCE', message: `recommendation ${r.id} has no source_object_id`, affected_record: r.id })
    }
  }
  // View freshness
  for (const vf of [
    TRANSFORMER_PATHS.viewImplementationTasks,
    TRANSFORMER_PATHS.viewTestContracts,
    TRANSFORMER_PATHS.viewTransformRecommendations,
  ]) {
    try {
      const text = await readFile(vf, 'utf8')
      if (!text.includes('GENERATED FILE. DO NOT EDIT DIRECTLY.')) {
        issues.push({ severity: 'P1', code: 'E_VIEW_STALE_MARKER', message: `view ${vf} missing marker`, affected_record: vf })
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        warnings.push(`view ${vf} missing; run \`bun run render\``)
      }
    }
  }
  void boundaries
  return { issues, warnings, stats: { tasks: tasks.length, contracts: contracts.length, boundaries: boundaries.length, templates: templates.length, recs: recs.length } }
}
