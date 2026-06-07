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
import {
  loadAcceptedRelationsDetailed,
  readerAcceptedRelationsPath,
  relationEndpointIds,
  type AtelierEdge,
} from './relations.ts'

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

function relationTraceOf(t: ImplementationTask): string[] {
  return Array.isArray(t.source_relation_ids) ? t.source_relation_ids : []
}

function contractRelationTraceOf(c: TestContract): string[] {
  return Array.isArray(c.source_relation_ids) ? c.source_relation_ids : []
}

function templateRelationTraceOf(t: PacketTemplate): string[] {
  return Array.isArray(t.source_relation_ids) ? t.source_relation_ids : []
}

function sourceAnchorTraceOf(record: unknown): string[] {
  const obj = record as {
    source_anchor_ids?: unknown
    required_anchor_ids?: unknown
  }
  const out = new Set<string>()
  if (Array.isArray(obj.source_anchor_ids)) {
    for (const id of obj.source_anchor_ids) if (typeof id === 'string' && id.length > 0) out.add(id)
  }
  if (Array.isArray(obj.required_anchor_ids)) {
    for (const id of obj.required_anchor_ids) if (typeof id === 'string' && id.length > 0) out.add(id)
  }
  return [...out].sort()
}

function evidenceRequirementsOf(record: unknown): string[] {
  const req = (record as { evidence_requirements?: unknown }).evidence_requirements
  if (!Array.isArray(req)) return []
  return req.filter((x): x is string => typeof x === 'string' && x.length > 0)
}

function forbiddenWritableTarget(filePath: string): boolean {
  return (
    filePath === 'product-specs/**' ||
    filePath === 'harness/knowledge/product-specs/**' ||
    filePath === 'harness/atelier-design-docs/**' ||
    filePath.startsWith('product-specs/') ||
    filePath.startsWith('harness/knowledge/product-specs/') ||
    filePath.startsWith('harness/atelier-design-docs/')
  )
}

function patternPrefix(pattern: string): string | null {
  return pattern.endsWith('/**') ? pattern.slice(0, -2) : null
}

function pathPatternsOverlap(a: string, b: string): boolean {
  if (a === b) return true
  const aPrefix = patternPrefix(a)
  const bPrefix = patternPrefix(b)
  if (aPrefix && bPrefix) return aPrefix.startsWith(bPrefix) || bPrefix.startsWith(aPrefix)
  if (aPrefix) return b.startsWith(aPrefix)
  if (bPrefix) return a.startsWith(bPrefix)
  return false
}

function findBoundaryOverlap(
  allowedFiles: ReadonlyArray<string>,
  forbiddenFiles: ReadonlyArray<string>,
): string | null {
  for (const allowed of allowedFiles) {
    for (const forbidden of forbiddenFiles) {
      if (pathPatternsOverlap(allowed, forbidden)) return `${allowed} overlaps ${forbidden}`
    }
  }
  return null
}

async function fileExistsRelative(filePath: string): Promise<boolean> {
  if (filePath.includes('*')) return false
  try {
    await readFile(path.resolve(process.cwd(), filePath), 'utf8')
    return true
  } catch {
    return false
  }
}

function invalidTraceMessage(
  id: string,
  invalidAcceptedMessages: ReadonlyMap<string, string>,
): string {
  const detail = invalidAcceptedMessages.get(id)
  return detail ? `${id} (${detail})` : `${id} (not accepted, current, and endpoint-resolved)`
}

function relationEndpointsForTrace(
  trace: ReadonlyArray<string>,
  relationById: ReadonlyMap<string, AtelierEdge>,
): string[] {
  const relations: AtelierEdge[] = []
  for (const id of trace) {
    const rel = relationById.get(id)
    if (rel) relations.push(rel)
  }
  return relationEndpointIds(relations)
}

export async function renderImplementationTasksView(): Promise<string> {
  const tasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const acceptedDetailed = await loadAcceptedRelationsDetailed()
  const accepted = acceptedDetailed.relations
  const acceptedIds = new Set(accepted.map((e) => e.id))
  const out: string[] = [header('IMPLEMENTATION_TASKS', 'atelier-transformer transform')]
  out.push(`Total tasks: ${tasks.length}`)
  out.push(
    `Design-doc tasks: ${tasks.filter((t) => t.source_refs.some((r) => isDesignDocPath(r.path))).length}`,
  )
  out.push(`Fixture tasks: ${tasks.filter(isFixtureTask).length}`)
  out.push(
    `Tasks with relation trace: ${tasks.filter((t) => relationTraceOf(t).length > 0).length}`,
  )
  out.push('')
  for (const t of tasks) {
    const trace = relationTraceOf(t)
    out.push(`## ${t.task_id}`)
    out.push(`- title: ${t.title}`)
    out.push(`- goal: ${t.goal}`)
    out.push(`- status: ${t.status}`)
    out.push(`- fixture: ${t.fixture === true}`)
    if (t.tags && t.tags.length > 0) out.push(`- tags: ${t.tags.join(', ')}`)
    out.push(
      `- source_relation_ids (${trace.length}): ${trace.length > 0 ? trace.map((id) => `\`${id}\``).join(', ') : '_none_'}`,
    )
    // Show which accepted relations from the file were used.
    const grounded = trace.filter((id) => acceptedIds.has(id))
    out.push(
      `- source_relation_ids grounded in accepted-relation file: ${grounded.length}`,
    )
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
    if (Array.isArray(t.blocker_ids) && t.blocker_ids.length > 0) {
      out.push(`- blocker_ids: ${t.blocker_ids.join(', ')}`)
    }
    out.push('')
  }
  out.push('## Accepted relations used as input')
  if (accepted.length === 0) {
    out.push('_No accepted relations were available for this transform run._')
    out.push('')
  } else {
    for (const e of accepted.slice(0, 50)) {
      out.push(`- \`${e.id}\` (${e.kind}): ${e.from} -> ${e.to}`)
    }
    if (accepted.length > 50) out.push(`_... ${accepted.length - 50} more_`)
    out.push('')
  }
  return out.join('\n')
}

export async function renderTestContractsView(): Promise<string> {
  const contracts = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
  const out: string[] = [header('TEST_CONTRACTS', 'atelier-transformer test-contract:derive')]
  out.push(`Total contracts: ${contracts.length}`)
  out.push(
    `Contracts with relation trace: ${contracts.filter((c) => contractRelationTraceOf(c).length > 0).length}`,
  )
  out.push('')
  for (const c of contracts) {
    const trace = contractRelationTraceOf(c)
    out.push(`## ${c.test_contract_id}`)
    out.push(`- task: \`${c.task_id}\``)
    out.push(`- framework: ${c.test_framework}`)
    out.push(`- command: \`${c.command}\``)
    out.push(`- target_files: ${c.target_files.length}`)
    out.push(`- test_files: ${c.test_files.length}`)
    out.push(`- status: ${c.status}`)
    out.push(
      `- source_relation_ids (${trace.length}): ${trace.length > 0 ? trace.map((id) => `\`${id}\``).join(', ') : '_none_'}`,
    )
    out.push('')
  }
  return out.join('\n')
}

export async function renderRecommendationsView(): Promise<string> {
  const recs = await readNdjson<TransformRecommendation>(TRANSFORMER_PATHS.recommendations)
  const out: string[] = [header('TRANSFORM_RECOMMENDATIONS', 'atelier-transformer recommend')]
  out.push(`Total recommendations: ${recs.length}`)
  out.push(
    `Recommendations with relation trace: ${recs.filter((r) => (r.source_relation_ids?.length ?? 0) > 0).length}`,
  )
  out.push('')
  for (const r of recs.slice(0, 50)) {
    const relationPart =
      r.source_relation_ids && r.source_relation_ids.length > 0
        ? ` (edges: ${r.source_relation_ids.map((id) => `\`${id}\``).join(', ')})`
        : ' (ungrounded)'
    out.push(`- (${r.recommendation_type}) from \`${r.source_object_id}\`${relationPart}: ${r.reason.slice(0, 120)}`)
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
  accepted_relations: number
  /**
   * Tasks whose `source_relation_ids` is non-empty.
   */
  tasks_with_relation_trace: number
  /**
   * Test contracts whose `source_relation_ids` is non-empty.
   */
  contracts_with_relation_trace: number
  /**
   * Packet templates whose `source_relation_ids` is non-empty.
   */
  templates_with_relation_trace: number
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
  const acceptedDetailed = await loadAcceptedRelationsDetailed()
  const accepted = acceptedDetailed.relations
  const acceptedIds = new Set(accepted.map((e) => e.id))
  const acceptedById = new Map(accepted.map((e) => [e.id, e]))
  const invalidAcceptedMessages = new Map(
    acceptedDetailed.invalid.map((e) => [e.id, e.message] as const),
  )
  const taskByTaskId = new Map(tasks.map((t) => [t.task_id, t]))

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
    if (t.allowed_files.some((f) => forbiddenWritableTarget(f))) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_PRODUCT_SPEC',
        message: `task ${t.task_id} allows editing product specs or design docs`,
        affected_record: t.id,
      })
    }
    const taskOverlap = findBoundaryOverlap(t.allowed_files, t.forbidden_files)
    if (taskOverlap) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_BOUNDARY_OVERLAP',
        message: `task ${t.task_id} has overlapping allowed_files/forbidden_files: ${taskOverlap}`,
        affected_record: t.id,
        recommended_next_action: 'derive a non-overlapping edit boundary from accepted constraining relations',
      })
    }
    // === Relation Kernel invariants ===
    const trace = relationTraceOf(t)
    const anchorTrace = sourceAnchorTraceOf(t)
    if (t.status === 'ready' && isFixtureTask(t)) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_FIXTURE_READY',
        message: `fixture task ${t.task_id} is marked ready; toy/sample tasks cannot satisfy transformer readiness`,
        affected_record: t.id,
        recommended_next_action: 'downgrade fixture-derived tasks to candidate or derive an operational task from accepted design-doc relations',
      })
    }
    if (t.status === 'ready' && anchorTrace.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_NO_ANCHOR_TRACE',
        message: `task ${t.task_id} is ready but has no source_anchor_ids trace`,
        affected_record: t.id,
        recommended_next_action:
          'preserve source anchors from the accepted relation endpoints when building the task',
      })
    }
    if (t.status === 'ready' && trace.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_TASK_NO_RELATION_TRACE',
        message: `task ${t.task_id} is ready but has no source_relation_ids trace`,
        affected_record: t.id,
        recommended_next_action:
          'accept at least one non-contains relation that grounds the task, or downgrade the task to candidate',
      })
    }
    if (t.status === 'ready') {
      for (const id of trace) {
        if (!acceptedIds.has(id)) {
          issues.push({
            severity: 'P0',
            code: 'E_TASK_RELATION_TRACE_INVALID',
            message: `task ${t.task_id} is ready but cites invalid relation ${invalidTraceMessage(id, invalidAcceptedMessages)}`,
            affected_record: t.id,
            recommended_next_action:
              'regenerate the transform after relation validation; stale/unresolved accepted relations cannot make tasks ready',
          })
        }
      }
      const endpointIds = relationEndpointsForTrace(trace, acceptedById)
      if (endpointIds.length > 0 && !endpointIds.some((id) => anchorTrace.includes(id))) {
        issues.push({
          severity: 'P0',
          code: 'E_TASK_ANCHOR_TRACE_UNGROUNDED',
          message: `task ${t.task_id} does not preserve endpoints from its accepted relation trace`,
          affected_record: t.id,
          recommended_next_action: 'include accepted relation endpoint ids in source_anchor_ids',
        })
      }
    }
    // Reject duplicate relation ids in source_relation_ids.
    if (trace.length > 0) {
      const seenRel = new Set<string>()
      for (const id of trace) {
        if (seenRel.has(id)) {
          issues.push({
            severity: 'P1',
            code: 'E_RELATION_DUPLICATE',
            message: `task ${t.task_id} has duplicate relation id ${id} in source_relation_ids`,
            affected_record: t.id,
            recommended_next_action: 'dedupe source_relation_ids at emit time',
          })
        }
        seenRel.add(id)
      }
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

  // === E_DESIGN_DOC_TASK_BLOCKED (P1, informational) ===
  // The design-doc task must NOT be `ready` if no accepted relation
  // traces touch the design-doc units. This is a P1 informational
  // check; the operation layer has the strict gate.
  for (const t of tasks) {
    const isDesignDoc =
      Array.isArray(t.tags) && t.tags.includes('design-doc-task')
    if (!isDesignDoc) continue
    const trace = relationTraceOf(t)
    if (trace.length === 0 && t.status === 'ready') {
      issues.push({
        severity: 'P1',
        code: 'E_DESIGN_DOC_TASK_BLOCKED',
        message: `design-doc task ${t.task_id} is ready but has no accepted-relation trace`,
        affected_record: t.id,
        recommended_next_action:
          'accept at least one constrains/references relation that touches the design-doc source units',
      })
    } else if (trace.length === 0) {
      warnings.push(
        `design-doc task ${t.task_id} is not ready because no accepted relation trace touches the design-doc source units`,
      )
    }
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
    const trace = contractRelationTraceOf(c)
    const anchorTrace = sourceAnchorTraceOf(c)
    const evidenceRequirements = evidenceRequirementsOf(c)
    const parentTask = taskByTaskId.get(c.task_id)
    if (c.status === 'ready' && (!parentTask || parentTask.status !== 'ready' || isFixtureTask(parentTask))) {
      issues.push({
        severity: 'P0',
        code: 'E_CONTRACT_PARENT_NOT_READY',
        message: `test contract ${c.test_contract_id} is ready but its parent task is missing, not ready, or fixture-only`,
        affected_record: c.id,
        recommended_next_action: 'only mark contracts ready for non-fixture ready tasks',
      })
    }
    // === E_READY_TASK_BLOCKED_CONTRACT (P0) ===
    // The fail-closed Relation Kernel invariant: a `ready` task MUST
    // have a `ready` TestContract with non-empty `target_files` and
    // non-empty `test_files`. If the contract is `blocked`, the
    // parent task is also blocked. If a `ready` task still has a
    // `blocked` (or empty) contract on disk, the transform
    // propagation has been bypassed — the validator must fail.
    // The check also fails when `c.status === 'candidate'` with
    // empty `test_files`/`target_files` because that contract
    // cannot satisfy a `ready` task either.
    if (parentTask?.status === 'ready' && (c.status !== 'ready' || c.test_files.length === 0 || c.target_files.length === 0)) {
      issues.push({
        severity: 'P0',
        code: 'E_READY_TASK_BLOCKED_CONTRACT',
        message: `task ${parentTask.task_id} is ready but its test contract ${c.test_contract_id} is ${c.status} (test_files=${c.test_files.length}, target_files=${c.target_files.length}); a ready task must have a ready TestContract with non-empty test_files and target_files`,
        affected_record: parentTask.id,
        recommended_next_action:
          're-run bun run atelier:transform:md-to-code so the fail-closed ready/contract propagation downgrades the parent task to blocked, or add a verifies/references relation that grounds the contract',
      })
    }
    if (c.status === 'ready' && anchorTrace.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_CONTRACT_NO_ANCHOR_TRACE',
        message: `test contract ${c.test_contract_id} is ready but has no source_anchor_ids trace`,
        affected_record: c.id,
        recommended_next_action: 'inherit source anchors from the parent task and verifying relations',
      })
    }
    if (c.status === 'ready' && trace.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_CONTRACT_NO_RELATION_TRACE',
        message: `test contract ${c.test_contract_id} is ready but has no source_relation_ids trace`,
        affected_record: c.id,
        recommended_next_action:
          'accept at least one verifies/references relation that points at the contract target files',
      })
    }
    if (c.status === 'ready') {
      if (c.target_files.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_TEST_NO_TARGET_FILES',
          message: `ready test contract ${c.test_contract_id} has empty target_files`,
          affected_record: c.id,
        })
      }
      if (c.test_files.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_TEST_NO_TEST_FILES',
          message: `ready test contract ${c.test_contract_id} has empty test_files`,
          affected_record: c.id,
        })
      }
      if (evidenceRequirements.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_TEST_NO_EVIDENCE_REQUIREMENTS',
          message: `ready test contract ${c.test_contract_id} has no evidence_requirements`,
          affected_record: c.id,
          recommended_next_action: 'emit command_output/raw_output_ref/diff_ref/file_hashes/validated_handoff requirements',
        })
      }
      for (const testFile of c.test_files) {
        if (!(await fileExistsRelative(testFile))) {
          issues.push({
            severity: 'P0',
            code: 'E_TEST_FILE_MISSING',
            message: `ready test contract ${c.test_contract_id} references nonexistent test file ${testFile}`,
            affected_record: c.id,
            recommended_next_action: 'only mark a TestContract ready when every test_files entry exists',
          })
        }
      }
      for (const id of trace) {
        if (!acceptedIds.has(id)) {
          issues.push({
            severity: 'P0',
            code: 'E_CONTRACT_RELATION_TRACE_INVALID',
            message: `test contract ${c.test_contract_id} is ready but cites invalid relation ${invalidTraceMessage(id, invalidAcceptedMessages)}`,
            affected_record: c.id,
            recommended_next_action: 'regenerate contracts from current endpoint-resolved accepted relations',
          })
        }
      }
      const endpointIds = relationEndpointsForTrace(trace, acceptedById)
      if (endpointIds.length > 0 && !endpointIds.some((id) => anchorTrace.includes(id))) {
        issues.push({
          severity: 'P0',
          code: 'E_CONTRACT_ANCHOR_TRACE_UNGROUNDED',
          message: `test contract ${c.test_contract_id} does not preserve endpoints from its accepted relation trace`,
          affected_record: c.id,
          recommended_next_action: 'include accepted relation endpoint ids in source_anchor_ids',
        })
      }
    }
    if (trace.length > 0) {
      const seenRel = new Set<string>()
      for (const id of trace) {
        if (seenRel.has(id)) {
          issues.push({
            severity: 'P1',
            code: 'E_RELATION_DUPLICATE',
            message: `test contract ${c.test_contract_id} has duplicate relation id ${id}`,
            affected_record: c.id,
          })
        }
        seenRel.add(id)
      }
    }
  }

  // === Edit boundaries ===
  for (const b of boundaries) {
    const overlap = findBoundaryOverlap(b.allowed_files, b.forbidden_files)
    if (overlap) {
      issues.push({
        severity: 'P0',
        code: 'E_BOUNDARY_OVERLAP',
        message: `edit boundary ${b.id} has overlapping allowed_files/forbidden_files: ${overlap}`,
        affected_record: b.id,
      })
    }
    if (b.allowed_files.some((f) => forbiddenWritableTarget(f))) {
      issues.push({
        severity: 'P0',
        code: 'E_BOUNDARY_FORBIDDEN_WRITABLE_TARGET',
        message: `edit boundary ${b.id} allows writing design docs or product specs`,
        affected_record: b.id,
      })
    }
    const parentTask = taskByTaskId.get(b.task_id)
    const trace = Array.isArray(b.source_relation_ids) ? b.source_relation_ids : []
    const anchorTrace = sourceAnchorTraceOf(b)
    if (parentTask?.status === 'ready') {
      if (trace.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_BOUNDARY_NO_RELATION_TRACE',
          message: `edit boundary ${b.id} belongs to ready task ${b.task_id} but has no source_relation_ids trace`,
          affected_record: b.id,
        })
      }
      if (anchorTrace.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_BOUNDARY_NO_ANCHOR_TRACE',
          message: `edit boundary ${b.id} belongs to ready task ${b.task_id} but has no source_anchor_ids trace`,
          affected_record: b.id,
        })
      }
      for (const id of trace) {
        if (!acceptedIds.has(id)) {
          issues.push({
            severity: 'P0',
            code: 'E_BOUNDARY_RELATION_TRACE_INVALID',
            message: `edit boundary ${b.id} cites invalid relation ${invalidTraceMessage(id, invalidAcceptedMessages)}`,
            affected_record: b.id,
          })
        }
      }
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
    // E_TEMPLATE_BROAD_SEARCH: search_policy must NOT be missing.
    // (The type system enforces it on new templates; we keep this as
    // a runtime safety net for legacy persisted files.)
    if (!t.search_policy) {
      issues.push({
        severity: 'P0',
        code: 'E_TEMPLATE_BROAD_SEARCH',
        message: `packet template ${t.id} has missing search_policy; default 'none' assumed`,
        affected_record: t.id,
        recommended_next_action: 'regenerate packet templates with the upgraded transformer',
      })
    }
    const templateOverlap = findBoundaryOverlap(t.allowed_files, t.forbidden_files)
    if (templateOverlap) {
      issues.push({
        severity: 'P0',
        code: 'E_TEMPLATE_BOUNDARY_OVERLAP',
        message: `packet template ${t.id} has overlapping allowed_files/forbidden_files: ${templateOverlap}`,
        affected_record: t.id,
      })
    }
    if (t.allowed_files.some((f) => forbiddenWritableTarget(f))) {
      issues.push({
        severity: 'P0',
        code: 'E_TEMPLATE_FORBIDDEN_WRITABLE_TARGET',
        message: `packet template ${t.id} allows writing design docs or product specs`,
        affected_record: t.id,
      })
    }
    // E_TEMPLATE_NO_RELATION_TRACE: every template with
    // evidence_expectations must have a relation trace.
    const trace = templateRelationTraceOf(t)
    const anchorTrace = sourceAnchorTraceOf(t)
    if (t.evidence_expectations.length > 0 && trace.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_TEMPLATE_NO_RELATION_TRACE',
        message: `packet template ${t.id} has evidence_expectations but no source_relation_ids trace`,
        affected_record: t.id,
        recommended_next_action:
          'inherit the parent task source_relation_ids when building the packet template',
      })
    }
    if (t.status === 'ready') {
      if (anchorTrace.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_TEMPLATE_NO_ANCHOR_TRACE',
          message: `packet template ${t.id} is ready but has no source_anchor_ids/required_anchor_ids trace`,
          affected_record: t.id,
          recommended_next_action: 'inherit required anchors from the parent task source_anchor_ids',
        })
      }
      if (trace.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_TEMPLATE_READY_NO_RELATION_TRACE',
          message: `packet template ${t.id} is ready but has no source_relation_ids trace`,
          affected_record: t.id,
        })
      }
      if (t.evidence_expectations.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_TEMPLATE_NO_EVIDENCE_EXPECTATIONS',
          message: `packet template ${t.id} is ready but has no evidence_expectations`,
          affected_record: t.id,
        })
      }
      if (t.search_policy === 'explicit_approval') {
        issues.push({
          severity: 'P0',
          code: 'E_TEMPLATE_BROAD_SEARCH',
          message: `packet template ${t.id} is ready but requires explicit_approval search`,
          affected_record: t.id,
          recommended_next_action: 'ready templates must have search_policy none or bounded with explicit file scope',
        })
      }
      const readyContractIds = new Set(
        contracts.filter((c) => c.status === 'ready').map((c) => c.test_contract_id),
      )
      if (!t.test_contract_ids.some((id) => readyContractIds.has(id))) {
        issues.push({
          severity: 'P0',
          code: 'E_TEMPLATE_NO_READY_TEST_CONTRACT',
          message: `packet template ${t.id} is ready but does not reference a ready TestContract`,
          affected_record: t.id,
        })
      }
      for (const id of trace) {
        if (!acceptedIds.has(id)) {
          issues.push({
            severity: 'P0',
            code: 'E_TEMPLATE_RELATION_TRACE_INVALID',
            message: `packet template ${t.id} is ready but cites invalid relation ${invalidTraceMessage(id, invalidAcceptedMessages)}`,
            affected_record: t.id,
            recommended_next_action: 'regenerate templates from current endpoint-resolved accepted relations',
          })
        }
      }
      const endpointIds = relationEndpointsForTrace(trace, acceptedById)
      if (endpointIds.length > 0 && !endpointIds.some((id) => anchorTrace.includes(id))) {
        issues.push({
          severity: 'P0',
          code: 'E_TEMPLATE_ANCHOR_TRACE_UNGROUNDED',
          message: `packet template ${t.id} does not preserve endpoints from its accepted relation trace`,
          affected_record: t.id,
          recommended_next_action: 'include accepted relation endpoint ids in required_anchor_ids/source_anchor_ids',
        })
      }
    }
    if (trace.length > 0) {
      const seenRel = new Set<string>()
      for (const id of trace) {
        if (seenRel.has(id)) {
          issues.push({
            severity: 'P1',
            code: 'E_RELATION_DUPLICATE',
            message: `packet template ${t.id} has duplicate relation id ${id}`,
            affected_record: t.id,
          })
        }
        seenRel.add(id)
      }
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
    const trace = Array.isArray(r.source_relation_ids) ? r.source_relation_ids : []
    // E_RELATION_CITATION: reason must cite an accepted edge id.
    if (!r.reason || trace.length === 0 || !trace.some((id) => r.reason.includes(id))) {
      issues.push({
        severity: 'P1',
        code: 'E_REC_NO_RELATION_CITATION',
        message: `recommendation ${r.id} does not cite one of its source_relation_ids in its reason`,
        affected_record: r.id,
        recommended_next_action:
          'rewrite recommend.ts to include the accepted relation id in the reason',
      })
    }
    for (const id of trace) {
      if (!acceptedIds.has(id)) {
        issues.push({
          severity: 'P1',
          code: 'E_REC_RELATION_TRACE_INVALID',
          message: `recommendation ${r.id} cites invalid relation ${invalidTraceMessage(id, invalidAcceptedMessages)}`,
          affected_record: r.id,
          recommended_next_action: 'emit recommendations only from current endpoint-resolved accepted relations',
        })
      }
    }
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

  // === Reader-accepted-relations file presence ===
  try {
    await readFile(readerAcceptedRelationsPath(), 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      warnings.push(
        `${readerAcceptedRelationsPath()} missing; no accepted relations will be used for the transform`,
      )
    }
  }

  // Surface acceptance ratio: how many grounded relation ids are real.
  let groundedTrace = 0
  for (const t of tasks) {
    for (const id of relationTraceOf(t)) {
      if (acceptedIds.has(id)) groundedTrace += 1
    }
  }
  if (groundedTrace > 0) {
    warnings.push(`${groundedTrace} source_relation_ids entries are present in the accepted-relation file`)
  }
  if (acceptedDetailed.invalid.length > 0) {
    warnings.push(
      `${acceptedDetailed.invalid.length} accepted relation row(s) were ignored because they are stale, unresolved, duplicate, or not an accepted kind`,
    )
  }
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
      accepted_relations: accepted.length,
      tasks_with_relation_trace: tasks.filter((t) => relationTraceOf(t).length > 0).length,
      contracts_with_relation_trace: contracts.filter((c) => contractRelationTraceOf(c).length > 0).length,
      templates_with_relation_trace: templates.filter((t) => templateRelationTraceOf(t).length > 0).length,
    },
  }
}
