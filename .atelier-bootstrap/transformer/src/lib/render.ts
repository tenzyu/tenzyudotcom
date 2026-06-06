/**
 * Transformer rendering and validation.
 */
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { writeText } from '../../../lib/src/json.ts'
import {
  type DuplicateRecommendation,
  type EditBoundary,
  type ImplementationTask,
  type PacketTemplate,
  type SourceUnit,
  type TestContract,
  type TransformRecommendation,
  INDEXER_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { isFixtureTask } from './task.ts'

const GENERATED_MARKER = '<!-- GENERATED FILE. DO NOT EDIT DIRECTLY. -->'
const DESIGN_DOC_PREFIX = 'harness/atelier-design-docs/'

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

function isDesignDocPath(path: string): boolean {
  return path.startsWith(DESIGN_DOC_PREFIX)
}

function hasDesignDocSourceTask(tasks: ReadonlyArray<ImplementationTask>): boolean {
  return tasks.some((t) => t.source_refs.some((r) => isDesignDocPath(r.path)))
}

export async function renderImplementationTasksView(): Promise<string> {
  const tasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const out: string[] = [header('IMPLEMENTATION_TASKS', 'atelier-transformer transform')]
  out.push(`Total tasks: ${tasks.length}`)
  out.push(`Design-doc tasks: ${tasks.filter((t) => t.source_refs.some((r) => isDesignDocPath(r.path))).length}`)
  out.push(`Fixture tasks: ${tasks.filter(isFixtureTask).length}`)
  out.push('')
  for (const t of tasks) {
    out.push(`## ${t.task_id}`)
    out.push(`- title: ${t.title}`)
    out.push(`- goal: ${t.goal}`)
    out.push(`- status: ${t.status}`)
    out.push(`- fixture: ${t.fixture === true}`)
    if (t.tags && t.tags.length > 0) out.push(`- tags: ${t.tags.join(', ')}`)
    out.push(`- source_refs (${t.source_refs.length}):`)
    for (const r of t.source_refs.slice(0, 10)) out.push(`  - \`${r.path}\``)
    if (t.source_refs.length > 10) out.push(`  - ... ${t.source_refs.length - 10} more`)
    out.push(`- allowed_files (${t.allowed_files.length}):`)
    for (const f of t.allowed_files.slice(0, 20)) out.push(`  - \`${f}\``)
    if (t.allowed_files.length > 20) out.push(`  - ... ${t.allowed_files.length - 20} more`)
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

export async function renderDuplicatesView(): Promise<string> {
  const dups = await readNdjson<DuplicateRecommendation>(TRANSFORMER_PATHS.duplicates)
  const out: string[] = [header('TRANSFORM_DUPLICATES', 'atelier-transformer recommend')]
  out.push(`Total duplicate pairs: ${dups.length}`)
  out.push('')
  if (dups.length === 0) {
    out.push('_No duplicate (source_object_id, recommendation_type) pairs detected._')
    out.push('')
    return out.join('\n')
  }
  for (const d of dups) {
    out.push(`- \`${d.source_object_id}\` (${d.recommendation_type}) x${d.count} → representative: \`${d.representative_recommendation_id}\``)
  }
  out.push('')
  return out.join('\n')
}

export async function renderAll(): Promise<{ files: string[] }> {
  await mkdir(path.dirname(TRANSFORMER_PATHS.viewImplementationTasks), { recursive: true })
  await mkdir(TRANSFORMER_PATHS.packetsDir, { recursive: true })
  const tasks = await renderImplementationTasksView()
  const contracts = await renderTestContractsView()
  const recs = await renderRecommendationsView()
  const dups = await renderDuplicatesView()
  await writeText(TRANSFORMER_PATHS.viewImplementationTasks, tasks)
  await writeText(TRANSFORMER_PATHS.viewTestContracts, contracts)
  await writeText(TRANSFORMER_PATHS.viewTransformRecommendations, recs)
  await writeText(TRANSFORMER_PATHS.viewTransformDuplicates, dups)
  return {
    files: [
      TRANSFORMER_PATHS.viewImplementationTasks,
      TRANSFORMER_PATHS.viewTestContracts,
      TRANSFORMER_PATHS.viewTransformRecommendations,
      TRANSFORMER_PATHS.viewTransformDuplicates,
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

export interface ValidateTransformerStats {
  tasks: number
  contracts: number
  boundaries: number
  templates: number
  recs: number
  duplicates: number
  design_doc_tasks: number
  fixture_tasks: number
  design_doc_source_units: number
  unique_recommendation_pairs: number
}

export async function validateTransformer(): Promise<{
  issues: ValidationIssue[]
  warnings: string[]
  stats: ValidateTransformerStats
}> {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []
  const tasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const contracts = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
  const boundaries = await readNdjson<EditBoundary>(TRANSFORMER_PATHS.editBoundaries)
  const templates = await readNdjson<PacketTemplate>(TRANSFORMER_PATHS.packetTemplates)
  const recs = await readNdjson<TransformRecommendation>(TRANSFORMER_PATHS.recommendations)
  const duplicates = await readNdjson<DuplicateRecommendation>(TRANSFORMER_PATHS.duplicates)
  const sources = await readNdjson<SourceUnit>(INDEXER_PATHS.objectsSource)
  const designDocSourceUnits = sources.filter((s) => isDesignDocPath(s.path))

  // === Tasks ===
  for (const t of tasks) {
    if (t.allowed_files.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_NO_ALLOWED',
        message: `task ${t.task_id} has empty allowed_files`,
        affected_record: t.id,
      })
    }
    if (t.forbidden_files.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_NO_FORBIDDEN',
        message: `task ${t.task_id} has no forbidden_files`,
        affected_record: t.id,
      })
    }
    if (t.acceptance_criteria.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_NO_ACCEPTANCE',
        message: `task ${t.task_id} has no acceptance_criteria`,
        affected_record: t.id,
      })
    }
    if (
      t.allowed_files.some(
        (f) =>
          f.startsWith('product-specs/') ||
          f.startsWith('harness/knowledge/product-specs/') ||
          f.startsWith('harness/atelier-design-docs/'),
      )
    ) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_PRODUCT_SPEC',
        message: `task ${t.task_id} allows editing product specs or design docs`,
        affected_record: t.id,
      })
    }
  }

  // === Design-doc task requirement (P1-001) ===
  // Only enforce when the indexer actually has design-doc source units.
  // In a fixture that lacks the design-doc tree, the transform runs
  // without a design-doc task and that is acceptable.
  if (designDocSourceUnits.length > 0) {
    if (tasks.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_NONE',
        message: 'no implementation tasks produced; the transform must yield at least one task',
        recommended_next_action: 'check that deriveAllTasks succeeded and that the task file was written',
      })
    } else if (!hasDesignDocSourceTask(tasks)) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_NO_DESIGN_DOC',
        message:
          'no implementation task references a source under harness/atelier-design-docs/**; md-to-code must derive at least one task from the design docs',
        recommended_next_action:
          'ensure the indexer has scanned harness/atelier-design-docs/** and re-run bun run atelier:transform:md-to-code',
      })
    }
  } else {
    warnings.push(
      'indexer has no design-doc source units; design-doc task check skipped (fixture-like environment)',
    )
  }

  // === Test contracts ===
  for (const c of contracts) {
    if (!c.command || c.command.trim() === '') {
      issues.push({
        severity: 'P0',
        code: 'E_TEST_NO_COMMAND',
        message: `test contract ${c.test_contract_id} has no command`,
        affected_record: c.id,
      })
    }
  }

  // === Packet templates ===
  for (const t of templates) {
    if (t.test_contract_ids.length === 0) {
      issues.push({
        severity: 'P1',
        code: 'E_PACKET_NO_TESTS',
        message: `packet template ${t.id} has no test contracts`,
        affected_record: t.id,
        recommended_next_action: 'derive a test contract first',
      })
    }
  }

  // === Recommendations ===
  const pairCounts = new Map<string, number>()
  for (const r of recs) {
    if (!r.source_object_id) {
      issues.push({
        severity: 'P1',
        code: 'E_REC_NO_SOURCE',
        message: `recommendation ${r.id} has no source_object_id`,
        affected_record: r.id,
      })
    }
    const key = `${r.source_object_id}|${r.recommendation_type}`
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
  }
  // Dedupe must happen at emit time, not validate time. If duplicates
  // exist in the persisted file, that is a P0 issue.
  for (const [key, count] of pairCounts) {
    if (count > 1) {
      const [sourceObjectId, recommendationType] = key.split('|')
      issues.push({
        severity: 'P0',
        code: 'E_REC_DUPLICATE',
        message: `recommendation pair (${sourceObjectId}, ${recommendationType}) emitted ${count} times; dedupe at emit time`,
        affected_record: `${sourceObjectId}::${recommendationType}`,
        recommended_next_action: 're-run bun run atelier:transform:recommend; emit must dedupe by (source_object_id, recommendation_type)',
      })
    }
  }
  if (duplicates.length > 0) {
    warnings.push(
      `recommend deduped ${duplicates.length} duplicate pair(s); see ${path.relative(process.cwd(), TRANSFORMER_PATHS.duplicates)}`,
    )
  }

  // === View freshness ===
  for (const vf of [
    TRANSFORMER_PATHS.viewImplementationTasks,
    TRANSFORMER_PATHS.viewTestContracts,
    TRANSFORMER_PATHS.viewTransformRecommendations,
    TRANSFORMER_PATHS.viewTransformDuplicates,
  ]) {
    try {
      const text = await readFile(vf, 'utf8')
      if (!text.includes('GENERATED FILE. DO NOT EDIT DIRECTLY.')) {
        issues.push({
          severity: 'P1',
          code: 'E_VIEW_STALE_MARKER',
          message: `view ${vf} missing marker`,
          affected_record: vf,
        })
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        warnings.push(`view ${vf} missing; run \`bun run render\``)
      }
    }
  }
  void boundaries
  return {
    issues,
    warnings,
    stats: {
      tasks: tasks.length,
      contracts: contracts.length,
      boundaries: boundaries.length,
      templates: templates.length,
      recs: recs.length,
      duplicates: duplicates.length,
      design_doc_tasks: tasks.filter((t) => t.source_refs.some((r) => isDesignDocPath(r.path))).length,
      fixture_tasks: tasks.filter(isFixtureTask).length,
      design_doc_source_units: designDocSourceUnits.length,
      unique_recommendation_pairs: pairCounts.size,
    },
  }
}
