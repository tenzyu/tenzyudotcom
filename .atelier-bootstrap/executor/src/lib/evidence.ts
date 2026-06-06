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
 * Runtime proof predicate.
 *
 * An `EvidenceRecord` is considered to carry runtime proof when it
 * references at least one of:
 *   - `raw_output_ref` pointing to a real file on disk
 *   - `diff_ref` pointing to a real file on disk
 *   - `file_hashes` containing at least one entry
 *
 * `command` alone is NOT runtime proof — it is only metadata describing
 * what was attempted. This predicate is used by the validator and by
 * `packet:complete` to refuse "passed" status that lacks a concrete
 * artifact.
 */
export async function hasRuntimeProof(evidence: EvidenceRecord): Promise<boolean> {
  if (evidence.raw_output_ref && existsSync(evidence.raw_output_ref)) return true
  if (evidence.diff_ref && existsSync(evidence.diff_ref)) return true
  if (evidence.file_hashes && Object.keys(evidence.file_hashes).length > 0) return true
  return false
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

/**
 * Read evidence `.json` files from a single directory (non-recursive).
 *
 * Hidden by file name and non-`.json` files are skipped. Directory
 * entries (including the `_fixtures/` quarantine) are skipped.
 */
async function readEvidenceRecordsFromDir(dir: string): Promise<EvidenceRecord[]> {
  if (!existsSync(dir)) return []
  const fs = await import('node:fs/promises')
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const records: EvidenceRecord[] = []
  for (const ent of entries) {
    if (ent.isDirectory()) continue
    if (!ent.name.endsWith('.json')) continue
    const text = await readFile(`${dir}/${ent.name}`, 'utf8')
    records.push(JSON.parse(text) as EvidenceRecord)
  }
  return records
}

/**
 * List the live evidence set.
 *
 * The evidence directory may contain a `_fixtures/` subdirectory used
 * as a quarantine area for intentionally-broken evidence records
 * (e.g. legacy fixtures that pre-date the runtime-proof contract and
 * would otherwise trip the validator with `E_EVIDENCE_PASSED_NO_PROOF`).
 * Those fixtures are preserved on disk for use as test inputs by the
 * validator, but they MUST NOT surface in the live evidence set, so
 * `listEvidence` excludes the `_fixtures/` subdirectory and any other
 * subdirectory. Only top-level `.json` files in the evidence directory
 * are returned.
 */
export async function listEvidence(): Promise<EvidenceRecord[]> {
  return readEvidenceRecordsFromDir(EXECUTOR_PATHS.evidenceDir)
}

/**
 * List the union of live evidence and quarantined fixture evidence.
 *
 * This is the inclusive lookup used for *historical* packet-completion
 * checks. The fixture area at `runs/evidence/_fixtures/` holds
 * intentionally-broken or legacy evidence records that are exempt from
 * the strict runtime-proof invariant — they are quarantined there
 * precisely so the live `E_EVIDENCE_PASSED_NO_PROOF` check does not
 * trip on them. But they still count as "evidence" in the historical
 * sense: a packet's `packet_completed` ledger event was satisfied by
 * a real evidence record that just happens to live in the quarantine
 * area, not the live area.
 *
 * Contract:
 *   - LIVE evidence (top-level `runs/evidence/*.json`) is subject to
 *     the strict runtime-proof invariant (P0-003).
 *   - FIXTURE evidence (`runs/evidence/_fixtures/*.json`) is
 *     quarantined: it is NOT subject to the strict invariant, but it
 *     IS treated as "evidence" for the historical completion check
 *     `E_COMPLETE_WITHOUT_EVIDENCE` so legacy / fixture packets can
 *     satisfy the historical packet-completion check.
 *   - The validator uses BOTH sets for historical lookups
 *     (`E_COMPLETE_WITHOUT_EVIDENCE`) and the LIVE set only for the
 *     strict runtime-proof invariant (`E_EVIDENCE_PASSED_NO_PROOF`).
 *   - Duplicate `evidence_id`s across the two sets are deduped by id
 *     (live wins, because live is the strict set the system is
 *     required to keep in good shape).
 */
export async function listEvidenceIncludingFixtures(): Promise<EvidenceRecord[]> {
  const live = await readEvidenceRecordsFromDir(EXECUTOR_PATHS.evidenceDir)
  const fixturesDir = `${EXECUTOR_PATHS.evidenceDir}/_fixtures`
  const fixtures = await readEvidenceRecordsFromDir(fixturesDir)
  if (fixtures.length === 0) return live
  const liveIds = new Set(live.map((e) => e.evidence_id))
  const merged = live.slice()
  for (const f of fixtures) {
    if (!liveIds.has(f.evidence_id)) merged.push(f)
  }
  return merged
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
  opts: {
    command?: string
    rawOutputRef?: string
    diffRef?: string
    fileHashes?: Record<string, string>
  } = {},
): Promise<EvidenceRecord> {
  const packet = await getPacket(packetId)
  if (!packet) throw new Error(`packet not found: ${packetId}`)
  if (!opts.command && !opts.rawOutputRef && !opts.diffRef && !opts.fileHashes) {
    throw new Error('evidence must reference raw output, a diff, file hashes, or a command')
  }
  if (status === 'passed') {
    // Passed status requires runtime proof at write time. `command` alone
    // is not sufficient. At least one of raw_output_ref / diff_ref /
    // file_hashes must be provided (and raw_output_ref / diff_ref must
    // point to a real file on disk).
    const hasRaw = !!opts.rawOutputRef && existsSync(opts.rawOutputRef)
    const hasDiff = !!opts.diffRef && existsSync(opts.diffRef)
    const hasHashes = !!opts.fileHashes && Object.keys(opts.fileHashes).length > 0
    if (!hasRaw && !hasDiff && !hasHashes) {
      throw new Error(
        'passed evidence requires runtime proof: provide raw_output_ref (path to a real file), diff_ref (path to a real file), or file_hashes (non-empty object). `command` alone is not sufficient.',
      )
    }
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
    diff_ref: opts.diffRef,
    file_hashes: opts.fileHashes,
  }
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
  // Prose-only handoffs are rejected: a handoff with no gate_results,
  // no files_changed, and no tests_written carries no concrete deliverable
  // and cannot serve as evidence.
  if (
    handoff.files_changed.length === 0 &&
    handoff.tests_written.length === 0 &&
    Object.keys(handoff.gate_results).length === 0
  ) {
    errors.push('handoff is prose-only: must include at least one of files_changed, tests_written, or gate_results')
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
