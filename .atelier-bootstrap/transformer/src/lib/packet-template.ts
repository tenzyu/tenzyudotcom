/**
 * Packet template derivation.
 *
 * Given a task, build a `PacketTemplate` that aggregates the source
 * refs, required object ids, allowed/forbidden files, and the test
 * contract ids the executor will need.
 *
 * Each template inherits the parent task's `source_relation_ids` and
 * sets a `search_policy`:
 *
 *   - `none`            — design-doc task: file scope is fully known
 *   - `bounded`         — attention-derived task: search the
 *                          attention's selected source refs only
 *   - `explicit_approval` — fallback: task is `candidate`/blocked,
 *                          require user sign-off before any search
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type ImplementationTask,
  type PacketTemplate,
  type TestContract,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { isMaterializedRecord } from './materialize-fixture-task.ts'

function nowIso(): string {
  return new Date().toISOString()
}

function isDesignDocTask(task: ImplementationTask): boolean {
  return (
    Array.isArray(task.tags) && task.tags.includes('design-doc-task')
  )
}

function isCandidateTask(task: ImplementationTask): boolean {
  return task.status === 'candidate' || task.status === 'blocked'
}

type PacketTemplateWithTrace = PacketTemplate & {
  source_anchor_ids: string[]
  required_anchor_ids: string[]
  required_relation_ids: string[]
}

function pickSearchPolicy(task: ImplementationTask): PacketTemplate['search_policy'] {
  if (isDesignDocTask(task)) return 'none'
  if (isCandidateTask(task)) return 'explicit_approval'
  return 'bounded'
}

/**
 * Pure builder for a packet template. The caller decides whether to
 * write the result to disk.
 */
export function buildPacketTemplate(
  task: ImplementationTask,
  testsForTask: ReadonlyArray<TestContract>,
): PacketTemplate {
  const id = deterministicId('pt', task.task_id)
  const testIds = testsForTask.map((t) => t.test_contract_id)
  const readyTestIds = testsForTask
    .filter((t) => t.status === 'ready')
    .map((t) => t.test_contract_id)
  const sourceRelationIds = (task.source_relation_ids ?? []).slice()
  const sourceAnchorIds = (task.source_anchor_ids ?? []).slice()
  const evidenceExpectations = sourceRelationIds.length > 0
    ? [
        'test_run evidence record with raw command output',
        'file_hashes for files_changed',
        'handoff.json conforming to atelier.subagent-handoff/v1',
      ]
    : []
  const status: PacketTemplate['status'] =
    task.status === 'ready' &&
    readyTestIds.length > 0 &&
    sourceRelationIds.length > 0 &&
    sourceAnchorIds.length > 0 &&
    evidenceExpectations.length > 0
      ? 'ready'
      : task.status === 'blocked'
        ? 'blocked'
        : 'candidate'
  const template: PacketTemplateWithTrace = {
    id,
    kind: 'packet_template',
    version: '1',
    title: `packet template for ${task.task_id}`,
    body_ref: TRANSFORMER_PATHS.packetTemplates,
    source_refs: task.source_refs,
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status,
    affordances: ['packet-constraint', 'review-candidate'],
    created_at: nowIso(),
    task_id: task.task_id,
    required_source_refs: task.source_refs,
    required_object_ids: task.source_object_ids,
    source_relation_ids: sourceRelationIds,
    source_anchor_ids: sourceAnchorIds,
    required_anchor_ids: sourceAnchorIds,
    required_relation_ids: sourceRelationIds,
    allowed_files: task.allowed_files,
    forbidden_files: task.forbidden_files,
    test_contract_ids: testIds,
    evidence_expectations: evidenceExpectations,
    search_policy: pickSearchPolicy(task),
    subagent_contract: 'atelier.subagent-handoff/v1',
  }
  return template
}

/**
 * Derive a single packet template for a task and overwrite the
 * packet-templates file. Used by the `packet:template --task <id>` CLI.
 */
export async function derivePacketTemplate(task: ImplementationTask): Promise<PacketTemplate> {
  const tests = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
  const testsForTask = tests.filter((t) => t.task_id === task.task_id)
  const template = buildPacketTemplate(task, testsForTask)
  await writeNdjson(TRANSFORMER_PATHS.packetTemplates, [template])
  return template
}

/**
 * Derive packet templates for every task using the in-memory test
 * contracts and write the merged list to disk in a single write. Used
 * by the `transform --target md-to-code` command.
 *
 * Materialized templates (those whose parent task is a
 * `tags: ['materialized']` record produced by `create-fixture-task`)
 * are preserved across re-runs. Newly derived templates are merged
 * in; the materialized ones stay.
 */
export async function deriveAllPacketTemplates(
  tasks: ReadonlyArray<ImplementationTask>,
  testContracts: ReadonlyArray<TestContract>,
): Promise<PacketTemplate[]> {
  // Build a set of task_ids that are materialized.
  const materializedTaskIds = new Set(
    tasks.filter(isMaterializedRecord).map((t) => t.task_id),
  )
  // Read existing templates and preserve the ones whose task_id is
  // in `materializedTaskIds`. Idempotent: when there is no existing
  // record, nothing is preserved.
  const existingTemplates = await readNdjsonSafe<PacketTemplate>(TRANSFORMER_PATHS.packetTemplates)
  const preservedTemplates = existingTemplates.filter((t) => materializedTaskIds.has(t.task_id))
  const out: PacketTemplate[] = preservedTemplates.slice()
  // Build per-task templates for non-materialized tasks only.
  for (const t of tasks) {
    if (materializedTaskIds.has(t.task_id)) continue
    const testsForTask = testContracts.filter((c) => c.task_id === t.task_id)
    out.push(buildPacketTemplate(t, testsForTask))
  }
  await writeNdjson(TRANSFORMER_PATHS.packetTemplates, out)
  return out
}

async function readNdjsonSafe<T>(filePath: string): Promise<T[]> {
  try {
    return await readNdjson<T>(filePath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}
