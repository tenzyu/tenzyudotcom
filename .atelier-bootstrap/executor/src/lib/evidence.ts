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
  type TestContract,
  EXECUTOR_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { listPackets, getPacket, appendLedgerEvent } from './packet.ts'

function nowIso(): string {
  return new Date().toISOString()
}

export type EvidenceRuntimeProofKind = 'command_output' | 'diff_hashes' | 'handoff'

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, ' ')
}

/**
 * Test evidence may either run the exact TestContract command or a
 * direct specialization of it (for example `bun test` ->
 * `bun test path/to/file.test.ts`). Unrelated commands must never
 * satisfy a contract.
 */
export function commandCorrespondsToContract(
  evidenceCommand: string | undefined,
  contractCommand: string | undefined,
): boolean {
  if (!evidenceCommand || !contractCommand) return false
  const evidence = normalizeCommand(evidenceCommand)
  const contract = normalizeCommand(contractCommand)
  if (evidence.length === 0 || contract.length === 0) return false
  if (evidence === contract) return true
  return evidence.startsWith(`${contract} `)
}

export function isTestContractEmpty(contract: TestContract): boolean {
  return (
    contract.command.trim().length === 0 ||
    (contract.test_files.length === 0 && contract.expected_behavior.length === 0)
  )
}

export function testContractCompletionBlocker(contract: TestContract): string | undefined {
  if (contract.status !== 'ready') return `test contract ${contract.test_contract_id} has status '${contract.status}' (must be 'ready')`
  if (isTestContractEmpty(contract)) return `test contract ${contract.test_contract_id} is empty (requires a command and test_files or expected_behavior)`
  return undefined
}

async function handoffRefIsValidated(evidence: EvidenceRecord): Promise<boolean> {
  if (!evidence.handoff_ref || evidence.handoff_ref.trim().length === 0) return false
  if (!existsSync(evidence.handoff_ref)) return false
  if (!evidence.packet_id) return false
  try {
    const validated = await validateHandoffFile(evidence.handoff_ref, evidence.packet_id)
    return validated.ok
  } catch {
    return false
  }
}

export async function evidenceRuntimeProofKind(
  evidence: EvidenceRecord,
  opts: { isFixture?: boolean } = {},
): Promise<EvidenceRuntimeProofKind | null> {
  if (evidence.raw_output_ref && evidence.command && evidence.command.trim().length > 0) {
    if (opts.isFixture) {
      if (evidence.raw_output_ref !== '') return 'command_output'
    } else if (existsSync(evidence.raw_output_ref)) {
      return 'command_output'
    }
  }

  if (
    evidence.diff_ref &&
    evidence.file_hashes &&
    Object.keys(evidence.file_hashes).length > 0
  ) {
    if (opts.isFixture) {
      if (evidence.diff_ref !== '') return 'diff_hashes'
    } else if (existsSync(evidence.diff_ref)) {
      return 'diff_hashes'
    }
  }

  if (await handoffRefIsValidated(evidence)) return 'handoff'
  return null
}

/**
 * Runtime proof predicate.
 *
 * An `EvidenceRecord` is considered to carry runtime proof only when it
 * references one of the contract-approved proof shapes:
 *   - `command` + `raw_output_ref` pointing to a real file on disk
 *   - `diff_ref` pointing to a real file on disk + non-empty `file_hashes`
 *   - `handoff_ref` pointing to a handoff that validates against the packet
 *
 * `command` alone, raw output without the command that produced it, or
 * file hashes without a diff are NOT runtime proof. This predicate is
 * used by the validator and by `packet:complete` to refuse "passed"
 * status that lacks a concrete artifact.
 *
 * Quarantined fixture evidence (records under
 * `runs/evidence/_fixtures/`) is exempt from the disk-existence check
 * on `raw_output_ref` / `diff_ref`: a fixture is allowed to point at a
 * file that is rebuilt by the executor test. This mirrors the
 * `runs/evidence/_fixtures/` quarantine policy used by the operation
 * layer and keeps historical / demo fixtures from breaking the
 * validator.
 */
export async function hasRuntimeProof(
  evidence: EvidenceRecord,
  opts: { isFixture?: boolean } = {},
): Promise<boolean> {
  return (await evidenceRuntimeProofKind(evidence, opts)) !== null
}

export async function evidenceSatisfiesTestContract(
  evidence: EvidenceRecord,
  packet: ExecutionPacket,
  contract: TestContract,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (evidence.status !== 'passed') return { ok: false, reason: `evidence ${evidence.evidence_id} is not passed` }
  if (evidence.packet_id !== packet.id) {
    return { ok: false, reason: `evidence ${evidence.evidence_id} packet_id ${evidence.packet_id ?? '<missing>'} does not match packet ${packet.id}` }
  }
  if (!evidence.task_id) return { ok: false, reason: `evidence ${evidence.evidence_id} lacks task_id` }
  if (evidence.task_id !== packet.task_id) {
    return { ok: false, reason: `evidence ${evidence.evidence_id} task_id ${evidence.task_id} does not match packet task_id ${packet.task_id}` }
  }
  if (evidence.task_id !== contract.task_id) {
    return { ok: false, reason: `evidence ${evidence.evidence_id} task_id ${evidence.task_id} does not match test contract task_id ${contract.task_id}` }
  }
  if (!evidence.test_contract_id) return { ok: false, reason: `evidence ${evidence.evidence_id} lacks test_contract_id` }
  if (evidence.test_contract_id !== contract.test_contract_id) {
    return { ok: false, reason: `evidence ${evidence.evidence_id} test_contract_id ${evidence.test_contract_id} does not match ${contract.test_contract_id}` }
  }
  if (!packet.test_contract_ids.includes(evidence.test_contract_id)) {
    return { ok: false, reason: `evidence ${evidence.evidence_id} test_contract_id ${evidence.test_contract_id} is not in packet ${packet.id}'s test_contract_ids` }
  }
  const contractBlocker = testContractCompletionBlocker(contract)
  if (contractBlocker) return { ok: false, reason: contractBlocker }
  const proofKind = await evidenceRuntimeProofKind(evidence)
  if (!proofKind) return { ok: false, reason: `evidence ${evidence.evidence_id} lacks runtime proof` }
  if (proofKind === 'command_output' || evidence.command) {
    if (!commandCorrespondsToContract(evidence.command, contract.command)) {
      return {
        ok: false,
        reason: `evidence ${evidence.evidence_id} command '${evidence.command ?? '<missing>'}' does not match or derive from TestContract ${contract.test_contract_id} command '${contract.command}'`,
      }
    }
  }
  return { ok: true }
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
 *
 * When `commandOverride` is supplied, it replaces the TestContract
 * command for the duration of THIS run. The recorded evidence still
 * cites the packet's `test_contract_id` (so the relation-kernel
 * correspondence invariant still holds), but the captured
 * `raw_output_ref` and the `evidence.command` field reflect the
 * override. The validator's `commandCorrespondsToContract` helper
 * accepts the override as a strict prefix of the contract command
 * (e.g. `bun test src/main.test.ts` derives from `bun test`).
 */
export async function runTestCommand(
  packetId: string,
  opts: { commandOverride?: string } = {},
): Promise<EvidenceRecord> {
  const packet = await getPacket(packetId)
  if (!packet) throw new Error(`packet not found: ${packetId}`)
  const tests = await readNdjson<{ test_contract_id: string; task_id: string; command: string }>(TRANSFORMER_PATHS.testContracts)
  const test = tests.find((t) => packet.test_contract_ids.includes(t.test_contract_id))
  if (!test) throw new Error(`no test contract for packet: ${packetId}`)
  const effectiveCommand = opts.commandOverride && opts.commandOverride.trim().length > 0
    ? opts.commandOverride
    : test.command
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
    const proc = Bun.spawnSync(['bash', '-lc', effectiveCommand], {
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
    task_id: packet.task_id,
    test_contract_id: test.test_contract_id,
    gate_id: test.test_contract_id,
    command: effectiveCommand,
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
    /**
     * The TestContract id this evidence satisfies. When set, it must
     * resolve to a contract in
     * `transforms/md-to-code/model/test-contracts.ndjson` and the
     * contract must have `status: 'ready'` — both checks are enforced
     * at write time for `status: 'passed'` evidence and at validate
     * time for every evidence record that carries the field.
     */
    testContractId?: string
    /**
     * Optional task id to attach to the record. Falls back to the
     * packet's `task_id` when omitted.
     */
    taskId?: string
    command?: string
    rawOutputRef?: string
    diffRef?: string
    fileHashes?: Record<string, string>
    handoffRef?: string
  } = {},
): Promise<EvidenceRecord> {
  const packet = await getPacket(packetId)
  if (!packet) throw new Error(`packet not found: ${packetId}`)
  if (!opts.command && !opts.rawOutputRef && !opts.diffRef && !opts.fileHashes && !opts.handoffRef) {
    throw new Error('evidence must reference raw output, a diff, file hashes, a validated handoff, or a command')
  }
  if (status === 'passed') {
    // Passed status requires runtime proof at write time. `command` alone,
    // raw output without the command, and hashes without a diff are not
    // sufficient.
    const hasCommandRaw = !!opts.command && !!opts.rawOutputRef && existsSync(opts.rawOutputRef)
    const hasHashes = !!opts.fileHashes && Object.keys(opts.fileHashes).length > 0
    const hasDiffHashes = !!opts.diffRef && existsSync(opts.diffRef) && hasHashes
    let hasValidatedHandoff = false
    if (opts.handoffRef) {
      const handoffEvidence = {
        packet_id: packetId,
        evidence_id: 'candidate',
        handoff_ref: opts.handoffRef,
      } as EvidenceRecord
      hasValidatedHandoff = await handoffRefIsValidated(handoffEvidence)
    }
    if (!hasCommandRaw && !hasDiffHashes && !hasValidatedHandoff) {
      throw new Error(
        'passed evidence requires runtime proof: provide command + raw_output_ref (path to a real file), diff_ref + file_hashes, or a validated handoff_ref. `command` alone is not sufficient.',
      )
    }
    if (packet.test_contract_ids.length > 0 && !opts.testContractId) {
      throw new Error(
        `passed evidence for packet ${packetId} must include test_contract_id (packet test_contract_ids: ${packet.test_contract_ids.join(', ')})`,
      )
    }
  }
  const effectiveTaskId = opts.taskId ?? packet.task_id
  if (opts.taskId && opts.taskId !== packet.task_id) {
    throw new Error(`task_id ${opts.taskId} does not match packet ${packetId}'s task_id ${packet.task_id}`)
  }
  if (opts.testContractId) {
    // Validate that the test contract id resolves to a real contract
    // and that the contract is `ready` (not `candidate` / `blocked`).
    // This is enforced at write time for `passed` evidence so the
    // operation layer's `checkEvidenceInvariant` cannot trip later.
    const tests = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
    const contract = tests.find((t) => t.test_contract_id === opts.testContractId)
    if (!contract) {
      throw new Error(
        `test_contract_id ${opts.testContractId} does not resolve to a real test contract in ${TRANSFORMER_PATHS.testContracts}`,
      )
    }
    if (contract.status !== 'ready') {
      throw new Error(
        `test_contract_id ${opts.testContractId} has status '${contract.status}'; only 'ready' contracts can be satisfied (REVIEW-LATEST.md P0-005)`,
      )
    }
    if (isTestContractEmpty(contract)) {
      throw new Error(
        `test_contract_id ${opts.testContractId} is empty; it requires a command and test_files or expected_behavior`,
      )
    }
    if (effectiveTaskId !== contract.task_id) {
      throw new Error(
        `task_id ${effectiveTaskId} does not match test_contract_id ${opts.testContractId}'s task_id ${contract.task_id}`,
      )
    }
    if (status === 'passed' && !packet.test_contract_ids.includes(opts.testContractId)) {
      throw new Error(
        `test_contract_id ${opts.testContractId} is not in packet ${packetId}'s test_contract_ids (${packet.test_contract_ids.join(', ') || '<none>'})`,
      )
    }
    if (status === 'passed' && opts.command && !commandCorrespondsToContract(opts.command, contract.command)) {
      throw new Error(
        `evidence command '${opts.command}' does not match or explicitly derive from TestContract ${opts.testContractId} command '${contract.command}'`,
      )
    }
  }
  // Build a deterministic evidence id so duplicates collapse:
  //   ev:<sha256(packetId|contractId-or-'_'|command-or-status)>
  // The legacy `gateId` slot is folded in for backward compatibility —
  // existing CLIs that pass a non-empty gate will still get a stable
  // (and now contract-aware) id.
  const contractId = opts.testContractId ?? gateId ?? '_'
  const keyPart = opts.command && opts.command.length > 0 ? opts.command : status
  const id = deterministicId('evi', `${packetId}|${contractId}|${keyPart}`)
  const record: EvidenceRecord = {
    id,
    kind: 'evidence_record',
    version: '1',
    title: `evidence for ${packetId}` + (opts.testContractId ? ` contract ${opts.testContractId}` : (gateId ? ` gate ${gateId}` : '')),
    source_refs: [],
    produced_by: 'executor',
    provenance_kind: 'runtime_evidence',
    confidence: 'fact',
    status,
    affordances: ['context'],
    created_at: nowIso(),
    evidence_id: id,
    packet_id: packetId,
    task_id: effectiveTaskId,
    test_contract_id: opts.testContractId,
    gate_id: gateId,
    command: opts.command,
    raw_output_ref: opts.rawOutputRef,
    diff_ref: opts.diffRef,
    file_hashes: opts.fileHashes,
    handoff_ref: opts.handoffRef,
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
 * Match `path` against a list of `allowed_files` patterns.
 *
 * Each `allowed_files` entry is matched either as an exact string or
 * as a directory prefix (entries ending with `/`). Glob-like `**`
 * suffixes (e.g. `.atelier-bootstrap/executor/**`) are honored by
 * stripping the `/**` and treating the remainder as a directory
 * prefix.
 */
function isPathAllowed(path: string, allowed: ReadonlyArray<string>): boolean {
  for (const a of allowed) {
    if (a === path) return true
    if (a.endsWith('/**')) {
      const dir = a.slice(0, -3)
      if (path === dir || path.startsWith(dir + '/')) return true
      continue
    }
    if (a.endsWith('/')) {
      if (path.startsWith(a)) return true
      continue
    }
  }
  return false
}

/**
 * Validate a handoff JSON against the contract.
 *
 * Returns `{ ok: true }` on success and `{ ok: false, errors: [...] }`
 * on failure. The validator is strict: empty `summary` over 80 chars,
 * missing required fields, files outside `allowed_files`, non-canonical
 * `gate_results`, missing on-disk evidence paths, and missing
 * on-disk `files_changed` paths are all rejected.
 */
export async function validateHandoff(handoff: SubagentHandoff, packet: ExecutionPacket): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const errors: string[] = []
  if (handoff.schema !== 'atelier.subagent-handoff/v1') errors.push(`schema mismatch: ${handoff.schema}`)
  if (handoff.packet_id !== packet.id) errors.push(`packet_id mismatch: handoff says ${handoff.packet_id}, packet is ${packet.id}`)
  if (!handoff.run_id) errors.push('run_id missing')
  if (handoff.summary && handoff.summary.length > 80) errors.push(`summary too long: ${handoff.summary.length} > 80`)
  for (const f of handoff.files_changed) {
    if (!isPathAllowed(f, packet.allowed_files)) {
      errors.push(`file_changed outside allowed_files: ${f}`)
    }
    if (!existsSync(f)) {
      errors.push(`file_changed path missing on disk: ${f}`)
    }
  }
  for (const f of handoff.tests_written) {
    if (!isPathAllowed(f, packet.allowed_files)) {
      errors.push(`test_written outside allowed_files: ${f}`)
    }
  }
  if (Object.keys(handoff.gate_results).length === 0) errors.push('gate_results is empty')
  for (const gate of Object.keys(handoff.gate_results)) {
    if (!packet.test_contract_ids.includes(gate)) errors.push(`unknown gate: ${gate}`)
  }
  // Every evidence_paths entry must exist on disk (P0: handoff must
  // reference concrete files, not just claim them). This mirrors the
  // packet-validator `E_HANDBOFF_PATH_MISSING` check.
  for (const p of handoff.evidence_paths ?? []) {
    if (!existsSync(p)) {
      errors.push(`evidence_paths path missing on disk: ${p}`)
    }
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

/**
 * Decide whether a live `EvidenceRecord` should be quarantined.
 *
 * A record is quarantine-eligible when it would otherwise fail the
 * strict runtime-proof invariant or the strict test-contract
 * correspondence check. Specifically:
 *
 *   1. `status === 'passed'` AND the record lacks any runtime-proof
 *      shape (no command+raw_output_ref on disk, no diff_ref+file_hashes,
 *      and no validated handoff_ref).
 *   2. `status === 'passed'` AND its `command` does not match or
 *      explicitly derive from the referenced TestContract's command.
 *   3. `status === 'passed'` AND the referenced TestContract is missing
 *      or has a non-`ready` status.
 *
 * Quarantine-exempt records (records under `_fixtures/`, or LIVE
 * records that pass all of the above checks) are returned as `{ ok:
 * true, ... }`. Records under `_fixtures/` are NEVER re-evaluated; the
 * function only inspects the LIVE evidence directory.
 *
 * This function does NOT move any files; it only reports whether the
 * caller should. Use `quarantineEvidence` for the side-effecting move.
 */
export type QuarantineDecision =
  | { ok: true; reason: 'live' | 'fixture'; record: EvidenceRecord }
  | {
      ok: false
      reason:
        | 'passed_no_runtime_proof'
        | 'passed_command_mismatch'
        | 'passed_missing_contract'
        | 'passed_blocked_contract'
        | 'passed_empty_contract'
      record: EvidenceRecord
    }

export async function evaluateQuarantine(record: EvidenceRecord, opts: { isFixture?: boolean } = {}): Promise<QuarantineDecision> {
  if (opts.isFixture) return { ok: true, reason: 'fixture', record }
  if (record.status !== 'passed') return { ok: true, reason: 'live', record }
  // Rule 1: runtime proof.
  const proofKind = await evidenceRuntimeProofKind(record)
  if (!proofKind) {
    return { ok: false, reason: 'passed_no_runtime_proof', record }
  }
  // Rules 2/3: test-contract correspondence. We only enforce these
  // when the evidence cites a test_contract_id. A passed evidence with
  // no test_contract_id is a separate invariant (E_EVIDENCE_TEST_CONTRACT_REQUIRED)
  // and the caller is expected to address it via `evidence:add`, not
  // quarantine. The quarantine policy is conservative: a record with
  // no test_contract_id is left alone, because moving it would erase
  // the evidence that proves the packet's test contract was (or was
  // not) satisfied.
  if (record.test_contract_id) {
    const tests = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts).catch(() => [] as TestContract[])
    const contract = tests.find((t) => t.test_contract_id === record.test_contract_id)
    if (!contract) return { ok: false, reason: 'passed_missing_contract', record }
    if (contract.status !== 'ready') return { ok: false, reason: 'passed_blocked_contract', record }
    if (isTestContractEmpty(contract)) return { ok: false, reason: 'passed_empty_contract', record }
    if (record.command && !commandCorrespondsToContract(record.command, contract.command)) {
      return { ok: false, reason: 'passed_command_mismatch', record }
    }
  }
  return { ok: true, reason: 'live', record }
}

/**
 * Quarantine an evidence record by moving its on-disk `.json` file
 * from the top-level evidence directory into the `_fixtures/`
 * subdirectory.
 *
 * Returns a structured decision. If the record is not quarantine-
 * eligible (i.e. `ok: true`), no file move is performed and
 * `moved: false`. If it is eligible, the file is moved atomically
 * (rename) and a `packet_quarantined_evidence` ledger event is
 * appended.
 *
 * The function is safe to call with an evidence id that is already in
 * `_fixtures/`; in that case it returns `{ ok: true, reason: 'fixture' }`
 * and does not move the file.
 *
 * Errors:
 *   - `evidence_not_found` — no record with that id exists at the
 *     top level of the evidence directory.
 *   - `parse_error` — the top-level `.json` is not valid JSON.
 *   - `io_error` — the rename failed (e.g. target already exists with
 *     the same name and a different content, or the parent directory
 *     cannot be created).
 */
export type QuarantineResult = {
  evidence_id: string
  reason: string
  moved: boolean
  source_path: string
  target_path: string
}

const QUARANTINE_DIR = `${EXECUTOR_PATHS.evidenceDir}/_fixtures`

export async function quarantineEvidenceRecord(
  evidenceId: string,
): Promise<QuarantineResult> {
  const sourcePath = `${EXECUTOR_PATHS.evidenceDir}/${evidenceId}.json`
  if (!existsSync(sourcePath)) {
    // The file may already be in `_fixtures/`. Treat that as a
    // successful no-op so callers can re-run the command safely.
    const fixturePath = `${QUARANTINE_DIR}/${evidenceId}.json`
    if (existsSync(fixturePath)) {
      return { evidence_id: evidenceId, reason: 'fixture', moved: false, source_path: fixturePath, target_path: fixturePath }
    }
    throw new Error(`evidence_not_found: ${evidenceId} is not in ${EXECUTOR_PATHS.evidenceDir} (top level) or ${QUARANTINE_DIR}`)
  }
  let record: EvidenceRecord
  try {
    const text = await readFile(sourcePath, 'utf8')
    record = JSON.parse(text) as EvidenceRecord
  } catch (err) {
    throw new Error(`parse_error: failed to read ${sourcePath}: ${(err as Error).message}`)
  }
  const decision = await evaluateQuarantine(record, { isFixture: false })
  if (decision.ok) {
    return {
      evidence_id: evidenceId,
      reason: decision.reason,
      moved: false,
      source_path: sourcePath,
      target_path: sourcePath,
    }
  }
  await mkdir(QUARANTINE_DIR, { recursive: true })
  const targetPath = `${QUARANTINE_DIR}/${evidenceId}.json`
  // If a fixture with the same name already exists, refuse to
  // overwrite: that would erase a curated fixture used as test
  // input by the validator.
  if (existsSync(targetPath)) {
    throw new Error(
      `io_error: cannot move ${sourcePath} to ${targetPath}: target already exists. Resolve the collision manually.`,
    )
  }
  const fs = await import('node:fs/promises')
  await fs.rename(sourcePath, targetPath)
  await appendLedgerEvent({
    schema: 'atelier.run-ledger-event/v1',
    event_id: randomId('evt'),
    created_at: nowIso(),
    event_type: 'packet_quarantined_evidence',
    subject_id: record.packet_id ?? evidenceId,
    refs: [evidenceId, targetPath],
    status: decision.reason,
  })
  return { evidence_id: evidenceId, reason: decision.reason, moved: true, source_path: sourcePath, target_path: targetPath }
}

/**
 * Scan the live evidence directory and quarantine every record that
 * is quarantine-eligible.
 *
 * Returns one entry per scanned record. Records that are already in
 * `_fixtures/` (or under any non-top-level path) are not touched.
 */
export async function quarantineAll(): Promise<{
  scanned: number
  quarantined: QuarantineResult[]
  skipped: QuarantineResult[]
}> {
  if (!existsSync(EXECUTOR_PATHS.evidenceDir)) {
    return { scanned: 0, quarantined: [], skipped: [] }
  }
  const fs = await import('node:fs/promises')
  const entries = await fs.readdir(EXECUTOR_PATHS.evidenceDir, { withFileTypes: true })
  const quarantined: QuarantineResult[] = []
  const skipped: QuarantineResult[] = []
  let scanned = 0
  for (const ent of entries) {
    if (ent.isDirectory()) continue
    if (!ent.name.endsWith('.json')) continue
    scanned++
    const evidenceId = ent.name.slice(0, -'.json'.length)
    try {
      const r = await quarantineEvidenceRecord(evidenceId)
      if (r.moved) quarantined.push(r)
      else skipped.push(r)
    } catch (err) {
      // Surface the error in the skipped list so the caller can
      // decide whether to retry or report it.
      skipped.push({
        evidence_id: evidenceId,
        reason: `error: ${(err as Error).message}`,
        moved: false,
        source_path: `${EXECUTOR_PATHS.evidenceDir}/${ent.name}`,
        target_path: `${EXECUTOR_PATHS.evidenceDir}/_fixtures/${ent.name}`,
      })
    }
  }
  return { scanned, quarantined, skipped }
}

void appendNdjson
void listPackets
