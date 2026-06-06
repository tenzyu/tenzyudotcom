/**
 * Packet creation and lifecycle.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  randomId,
  type ExecutionPacket,
  type ImplementationTask,
  type PacketTemplate,
  type TestContract,
  type SubagentHandoff,
  EXECUTOR_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { PACKETS_REGISTRY } from './paths.ts'

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Create a fresh `ExecutionPacket` from a `PacketTemplate`.
 *
 * The packet references the task, the test contracts, and the allowed
 * files. The packet is `active` immediately. A `packet_created` event
 * is appended to the run ledger.
 */
export async function createPacketFromTask(taskId: string): Promise<ExecutionPacket> {
  const tasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const task = tasks.find((t) => t.task_id === taskId)
  if (!task) throw new Error(`task not found: ${taskId}`)
  if (task.status === 'stale') throw new Error(`task is stale: ${taskId}`)
  if (task.allowed_files.length === 0) throw new Error(`task has no allowed_files: ${taskId}`)
  const templates = await readNdjson<PacketTemplate>(TRANSFORMER_PATHS.packetTemplates)
  const template = templates.find((t) => t.task_id === taskId)
  if (!template) throw new Error(`packet template not found: ${taskId}`)
  const tests = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
  const testIds = tests.filter((t) => t.task_id === taskId).map((t) => t.test_contract_id)
  if (testIds.length === 0) throw new Error(`no test contracts for task: ${taskId}`)
  const id = deterministicId('pkt', taskId)
  const packet: ExecutionPacket = {
    id,
    kind: 'execution_packet',
    version: '1',
    title: `packet for ${taskId}`,
    body_ref: PACKETS_REGISTRY,
    source_refs: task.source_refs,
    produced_by: 'executor',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: 'active',
    affordances: ['packet-constraint'],
    created_at: nowIso(),
    packet_id: id,
    task_id: taskId,
    required_source_refs: task.source_refs,
    required_object_ids: task.source_object_ids,
    allowed_files: task.allowed_files,
    forbidden_files: task.forbidden_files,
    test_contract_ids: testIds,
    evidence_expectations: template.evidence_expectations,
    handoff_schema: 'atelier.subagent-handoff/v1',
  }
  // Persist the packet and append a ledger event.
  await mkdir(EXECUTOR_PATHS.handoffsDir, { recursive: true })
  let existing: ExecutionPacket[] = []
  if (existsSync(PACKETS_REGISTRY)) {
    existing = await readNdjson<ExecutionPacket>(PACKETS_REGISTRY)
  }
  existing.push(packet)
  await writeNdjson(PACKETS_REGISTRY, existing)
  await appendLedgerEvent({
    schema: 'atelier.run-ledger-event/v1',
    event_id: randomId('evt'),
    created_at: nowIso(),
    event_type: 'packet_created',
    subject_id: packet.id,
    refs: [taskId],
  })
  return packet
}

export async function listPackets(): Promise<ExecutionPacket[]> {
  if (!existsSync(PACKETS_REGISTRY)) return []
  return readNdjson<ExecutionPacket>(PACKETS_REGISTRY)
}

/**
 * Reduce a raw list of packets to the current state per id.
 *
 * If the same packet id appears multiple times (e.g. a packet was
 * re-created, or status was updated without replacing the prior record),
 * the most recent record — by `created_at` — wins. The reducer is
 * deterministic and pure: it does not touch the filesystem.
 */
export function reducePacketsToCurrent(packets: ExecutionPacket[]): ExecutionPacket[] {
  const byId = new Map<string, ExecutionPacket>()
  for (const p of packets) {
    const existing = byId.get(p.id)
    if (!existing || p.created_at > existing.created_at) {
      byId.set(p.id, p)
    }
  }
  return Array.from(byId.values())
}

/**
 * Find packet ids that appear more than once with conflicting
 * lifecycle statuses.
 *
 * This is used by the validator to flag duplicate/conflicting state
 * (P0-004 in REVIEW-LATEST.md). A packet id that appears twice with
 * the SAME status is a duplicate but not a conflict; the reducer
 * collapses it. A packet id that appears twice with DIFFERENT statuses
 * is a lifecycle conflict and must fail readiness.
 */
export function getDuplicatePacketStatuses(
  packets: ExecutionPacket[],
): Array<{ id: string; statuses: string[]; record_count: number }> {
  const byId = new Map<string, ExecutionPacket[]>()
  for (const p of packets) {
    const list = byId.get(p.id) ?? []
    list.push(p)
    byId.set(p.id, list)
  }
  const conflicts: Array<{ id: string; statuses: string[]; record_count: number }> = []
  for (const [id, records] of byId) {
    if (records.length < 2) continue
    const uniqueStatuses = Array.from(new Set(records.map((r) => r.status)))
    if (uniqueStatuses.length > 1) {
      conflicts.push({ id, statuses: uniqueStatuses, record_count: records.length })
    }
  }
  return conflicts
}

/**
 * Read the packet registry and return the current (reduced) packet
 * for the given id, if any. Consumers should prefer this over
 * `getPacket` when they want the authoritative current state.
 */
export async function getCurrentPacket(id: string): Promise<ExecutionPacket | undefined> {
  const all = await listPackets()
  const reduced = reducePacketsToCurrent(all)
  return reduced.find((p) => p.id === id)
}

export async function getPacket(id: string): Promise<ExecutionPacket | undefined> {
  return getCurrentPacket(id)
}

export async function setPacketStatus(id: string, status: ExecutionPacket['status']): Promise<ExecutionPacket> {
  const all = await listPackets()
  const idx = all.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error(`packet not found: ${id}`)
  const next = { ...all[idx]!, status }
  all[idx] = next
  await writeNdjson(PACKETS_REGISTRY, all)
  return next
}

/**
 * One-shot migration that normalizes the packets registry.
 *
 * Reads the raw NDJSON, reduces duplicate packet ids to a single
 * current record (last-write-wins by `created_at`), and writes the
 * result back ONCE. This is the supported way to clear the legacy
 * `pkt:8d402e5e069cc51f` conflict (P0-004).
 *
 * The function is idempotent: running it on an already-normalized
 * registry is a no-op (the file is rewritten with the same content,
 * or rewritten once with deduplicated records).
 */
export async function migratePacketsRegistry(): Promise<{
  before: number
  after: number
  conflicts_resolved: string[]
  written: boolean
}> {
  const raw = await listPackets()
  const conflicts = getDuplicatePacketStatuses(raw)
  const reduced = reducePacketsToCurrent(raw)
  const conflictIds = conflicts.map((c) => c.id)
  // Write ONCE. Do not hand-edit the file twice.
  if (raw.length !== reduced.length || conflicts.length > 0) {
    await writeNdjson(PACKETS_REGISTRY, reduced)
    return {
      before: raw.length,
      after: reduced.length,
      conflicts_resolved: conflictIds,
      written: true,
    }
  }
  return {
    before: raw.length,
    after: reduced.length,
    conflicts_resolved: [],
    written: false,
  }
}

export async function packetContext(id: string): Promise<{
  packet: ExecutionPacket
  task: ImplementationTask
  tests: TestContract[]
}> {
  const packet = await getPacket(id)
  if (!packet) throw new Error(`packet not found: ${id}`)
  const tasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const task = tasks.find((t) => t.task_id === packet.task_id)
  if (!task) throw new Error(`task not found: ${packet.task_id}`)
  const tests = (await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts))
    .filter((t) => packet.test_contract_ids.includes(t.test_contract_id))
  return { packet, task, tests }
}

/**
 * Append a structured event to the run ledger.
 */
export async function appendLedgerEvent(event: {
  schema: 'atelier.run-ledger-event/v1'
  event_id: string
  created_at: string
  event_type:
    | 'packet_created'
    | 'packet_started'
    | 'test_run'
    | 'evidence_recorded'
    | 'handoff_received'
    | 'packet_completed'
    | 'packet_rejected'
    | 'packet_blocked'
  subject_id: string
  refs: string[]
  status?: string
}): Promise<void> {
  await mkdir(EXECUTOR_PATHS.handoffsDir, { recursive: true })
  const line = JSON.stringify(event) + '\n'
  // Append to the JSONL ledger.
  if (!existsSync(EXECUTOR_PATHS.ledger)) {
    await writeFile(EXECUTOR_PATHS.ledger, line, 'utf8')
  } else {
    const fs = await import('node:fs/promises')
    await fs.appendFile(EXECUTOR_PATHS.ledger, line, 'utf8')
  }
}

export async function readHandoffFile(path: string): Promise<SubagentHandoff> {
  const text = await readFile(path, 'utf8')
  const parsed = JSON.parse(text) as SubagentHandoff
  return parsed
}

void writeFile
