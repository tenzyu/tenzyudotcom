/**
 * Packet template derivation.
 *
 * Given a task, build a `PacketTemplate` that aggregates the source
 * refs, required object ids, allowed/forbidden files, and the test
 * contract ids the executor will need.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type ImplementationTask,
  type PacketTemplate,
  type TestContract,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'

function nowIso(): string {
  return new Date().toISOString()
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
  return {
    id,
    kind: 'packet_template',
    version: '1',
    title: `packet template for ${task.task_id}`,
    body_ref: TRANSFORMER_PATHS.packetTemplates,
    source_refs: task.source_refs,
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: testIds.length === 0 ? 'blocked' : 'ready',
    affordances: ['packet-constraint', 'review-candidate'],
    created_at: nowIso(),
    task_id: task.task_id,
    required_source_refs: task.source_refs,
    required_object_ids: task.source_object_ids,
    allowed_files: task.allowed_files,
    forbidden_files: task.forbidden_files,
    test_contract_ids: testIds,
    evidence_expectations: [
      'test_run evidence record with raw command output',
      'file_hashes for files_changed',
      'handoff.json conforming to atelier.subagent-handoff/v1',
    ],
    subagent_contract: 'atelier.subagent-handoff/v1',
  }
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
 */
export async function deriveAllPacketTemplates(
  tasks: ReadonlyArray<ImplementationTask>,
  testContracts: ReadonlyArray<TestContract>,
): Promise<PacketTemplate[]> {
  const out: PacketTemplate[] = []
  for (const t of tasks) {
    const testsForTask = testContracts.filter((c) => c.task_id === t.task_id)
    out.push(buildPacketTemplate(t, testsForTask))
  }
  await writeNdjson(TRANSFORMER_PATHS.packetTemplates, out)
  return out
}
