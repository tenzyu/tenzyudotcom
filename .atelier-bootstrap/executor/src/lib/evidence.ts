/**
 * Evidence and handoff management.
 *
 * The executor is the only component that produces evidence. Evidence
 * is runtime fact: command output, file hash, test result, validated
 * handoff, or diff reference.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { readNdjson, writeNdjson, appendNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  randomId,
  type Blocker,
  type EvidenceRecord,
  type ExecutionPacket,
  type SubagentHandoff,
  EXECUTOR_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { listPackets, getPacket, appendLedgerEvent } from './packet.ts'

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Persist raw command output to disk and return the path.
 */
export async function writeRawOutput(name: string, body: string): Promise<string> {
  await mkdir(EXECUTOR_PATHS.evidenceDir, { recursive: true })
  const path = `${EXECUTOR_PATHS.evidenceDir}/${name}.txt`
  await writeFile(path, body, 'utf8')
  return path
}

export async function listEvidence(): Promise<EvidenceRecord[]> {
  const dir = EXECUTOR_PATHS.evidenceDir
  if (!existsSync(dir)) return []
  const fs = await import('node:fs/promises')
  const files = await fs.readdir(dir)
  const records: EvidenceRecord[] = []
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    const text = await readFile(`${dir}/${f}`, 'utf8')
    records.push(JSON.parse(text) as EvidenceRecord)
  }
  return records
}

export async function saveEvidence(record: EvidenceRecord): Promise<void> {
  await mkdir(EXECUTOR_PATHS.evidenceDir, { recursive: true })
  const path = `${EXECUTOR_PATHS.evidenceDir}/${record.evidence_id}.json`
  await writeFile(path, JSON.stringify(record, null, 2), 'utf8')
}

/**
 * Run the test command from the packet's test contracts and record
 * evidence. This function DOES NOT write product code. It only runs
 * the test command and captures the output.
 */
export async function runTestCommand(packetId: string): Promise<EvidenceRecord> {
  const packet = await getPacket(packetId)
  if (!packet) throw new Error(`packet not found: ${packetId}`)
  const tests = await readNdjson<{ test_contract_id: string; task_id: string; command: string }>(TRANSFORMER_PATHS.testContracts)
  const test = tests.find((t) => packet.test_contract_ids.includes(t.test_contract_id))
  if (!test) throw new Error(`no test contract for packet: ${packetId}`)
  await appendLedgerEvent({
    schema: 'atelier.run-ledger-event/v1',
    event_id: randomId('evt'),
    created_at: nowIso(),
    event_type: 'packet_started',
    subject_id: packet.id,
    refs: [test.test_contract_id],
  })
  let stdout = ''
  let exitCode = 0
  try {
    const proc = Bun.spawnSync(['bash', '-lc', test.command], {
      cwd: process.cwd(),
      env: process.env,
    })
    stdout = proc.stdout.toString() + (proc.stderr ? `\n[stderr]\n${proc.stderr.toString()}` : '')
    exitCode = proc.exitCode
  } catch (err) {
    stdout = `[spawn-error] ${(err as Error).message}`
    exitCode = 1
  }
  const rawPath = await writeRawOutput(`${packet.id}-test-${Date.now()}`, stdout)
  const record: EvidenceRecord = {
    id: deterministicId('evi', `${packet.id}:${test.test_contract_id}:${Date.now()}`),
    kind: 'evidence_record',
    version: '1',
    title: `test_run for ${packet.id}`,
    source_refs: [],
    produced_by: 'executor',
    provenance_kind: 'runtime_evidence',
    confidence: 'fact',
    status: exitCode === 0 ? 'passed' : 'failed',
    affordances: ['context', 'review-candidate'],
    created_at: nowIso(),
    evidence_id: deterministicId('evi', `${packet.id}:${test.test_contract_id}`),
    packet_id: packet.id,
    gate_id: test.test_contract_id,
    command: test.command,
    raw_output_ref: rawPath,
  }
  await saveEvidence(record)
  await appendLedgerEvent({
    schema: 'atelier.run-ledger-event/v1',
    event_id: randomId('evt'),
    created_at: nowIso(),
    event_type: 'test_run',
    subject_id: packet.id,
    refs: [record.evidence_id, rawPath],
    status: record.status,
  })
  await appendLedgerEvent({
    schema: 'atelier.run-ledger-event/v1',
    event_id: randomId('evt'),
    created_at: nowIso(),
    event_type: 'evidence_recorded',
    subject_id: packet.id,
    refs: [record.evidence_id],
  })
  return record
}

export async function addEvidence(
  packetId: string,
  gateId: string,
  status: EvidenceRecord['status'],
  opts: { command?: string; rawOutputRef?: string } = {},
): Promise<EvidenceRecord> {
  const packet = await getPacket(packetId)
  if (!packet) throw new Error(`packet not found: ${packetId}`)
  if (!opts.command && !opts.rawOutputRef) {
    throw new Error('evidence must reference raw output or a command')
  }
  const id = deterministicId('evi', `${packetId}:${gateId}:${Date.now()}`)
  const record: EvidenceRecord = {
    id,
    kind: 'evidence_record',
    version: '1',
    title: `evidence for ${packetId} gate ${gateId}`,
    source_refs: [],
    produced_by: 'executor',
    provenance_kind: 'runtime_evidence',
    confidence: 'fact',
    status,
    affordances: ['context'],
    created_at: nowIso(),
    evidence_id: id,
    packet_id: packetId,
    gate_id: gateId,
    command: opts.command,
    raw_output_ref: opts.rawOutputRef,
  }
  await saveEvidence(record)
  await saveEvidence(record)
  await appendLedgerEvent({
    schema: 'atelier.run-ledger-event/v1',
    event_id: randomId('evt'),
    created_at: nowIso(),
    event_type: 'evidence_recorded',
    subject_id: packetId,
    refs: [id],
  })
  return record
}

/**
 * Validate a handoff JSON against the contract.
 *
 * Returns `{ ok: true }` on success and `{ ok: false, errors: [...] }`
 * on failure. The validator is strict: empty `summary` over 80 chars,
 * missing required fields, files outside `allowed_files`, and
 * non-canonical `gate_results` are all rejected.
 */
export async function validateHandoff(handoff: SubagentHandoff, packet: ExecutionPacket): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const errors: string[] = []
  if (handoff.schema !== 'atelier.subagent-handoff/v1') errors.push(`schema mismatch: ${handoff.schema}`)
  if (handoff.packet_id !== packet.id) errors.push(`packet_id mismatch: handoff says ${handoff.packet_id}, packet is ${packet.id}`)
  if (!handoff.run_id) errors.push('run_id missing')
  if (handoff.summary && handoff.summary.length > 80) errors.push(`summary too long: ${handoff.summary.length} > 80`)
  for (const f of handoff.files_changed) {
    if (!packet.allowed_files.some((a) => f === a || a.endsWith('/') && f.startsWith(a))) {
      errors.push(`file_changed outside allowed_files: ${f}`)
    }
  }
  for (const f of handoff.tests_written) {
    if (!packet.allowed_files.some((a) => f === a || a.endsWith('/') && f.startsWith(a))) {
      errors.push(`test_written outside allowed_files: ${f}`)
    }
  }
  if (Object.keys(handoff.gate_results).length === 0) errors.push('gate_results is empty')
  for (const gate of Object.keys(handoff.gate_results)) {
    if (!packet.test_contract_ids.includes(gate)) errors.push(`unknown gate: ${gate}`)
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

/**
 * Validate a handoff JSON file against the schema AND the packet.
 */
export async function validateHandoffFile(handoffPath: string, packetId: string): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const text = await readFile(handoffPath, 'utf8')
  const parsed = JSON.parse(text) as SubagentHandoff
  const packet = await getPacket(packetId)
  if (!packet) return { ok: false, errors: [`packet not found: ${packetId}`] }
  return validateHandoff(parsed, packet)
}

export async function saveHandoff(handoff: SubagentHandoff): Promise<string> {
  const id = handoff.run_id || randomId('hdf')
  const path = `${EXECUTOR_PATHS.handoffsDir}/${id}.json`
  await mkdir(EXECUTOR_PATHS.handoffsDir, { recursive: true })
  await writeFile(path, JSON.stringify(handoff, null, 2), 'utf8')
  await appendLedgerEvent({
    schema: 'atelier.run-ledger-event/v1',
    event_id: randomId('evt'),
    created_at: nowIso(),
    event_type: 'handoff_received',
    subject_id: handoff.packet_id,
    refs: [path],
  })
  return path
}

export async function recordBlocker(
  packetId: string,
  taskId: string,
  severity: Blocker['severity'],
  reason: string,
  recommendedNextAction: string,
): Promise<Blocker> {
  const id = deterministicId('blk', `${packetId}:${reason.slice(0, 32)}`)
  const blocker: Blocker = {
    id,
    kind: 'blocker',
    version: '1',
    title: reason.slice(0, 80),
    source_refs: [],
    produced_by: 'executor',
    provenance_kind: 'runtime_evidence',
    confidence: 'fact',
    status: 'open',
    affordances: ['review-candidate'],
    created_at: nowIso(),
    blocker_id: id,
    packet_id: packetId,
    task_id: taskId,
    severity,
    reason,
    recommended_next_action: recommendedNextAction,
  }
  await mkdir(EXECUTOR_PATHS.blockersDir, { recursive: true })
  await writeFile(`${EXECUTOR_PATHS.blockersDir}/${id}.json`, JSON.stringify(blocker, null, 2), 'utf8')
  await appendLedgerEvent({
    schema: 'atelier.run-ledger-event/v1',
    event_id: randomId('evt'),
    created_at: nowIso(),
    event_type: 'packet_blocked',
    subject_id: packetId,
    refs: [id],
    status: severity,
  })
  return blocker
}

void appendNdjson
void listPackets
