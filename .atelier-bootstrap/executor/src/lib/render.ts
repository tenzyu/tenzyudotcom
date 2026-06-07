/**
 * Executor rendering and validation.
 */
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { writeText, readJson } from '../../../lib/src/json.ts'
import {
  type Blocker,
  type EvidenceRecord,
  type ExecutionPacket,
  type SubagentHandoff,
  type TestContract,
  EXECUTOR_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { listPackets, reducePacketsToCurrent, getDuplicatePacketStatuses } from './packet.ts'
import {
  listEvidence,
  listEvidenceIncludingFixtures,
  validateHandoffFile,
  hasRuntimeProof,
  evidenceRuntimeProofKind,
  commandCorrespondsToContract,
  isTestContractEmpty,
  evidenceSatisfiesTestContract,
} from './evidence.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'

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

async function readLedger(): Promise<Array<Record<string, unknown>>> {
  if (!existsSync(EXECUTOR_PATHS.ledger)) return []
  const text = await readFile(EXECUTOR_PATHS.ledger, 'utf8')
  return text
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l) as Record<string, unknown>)
}

export async function renderExecutionFrontier(): Promise<string> {
  const packets = await listPackets()
  const out: string[] = [header('EXECUTION_FRONTIER', 'atelier-executor')]
  out.push(`Total packets: ${packets.length}`)
  out.push('')
  for (const p of packets) {
    out.push(`## ${p.id}`)
    out.push(`- task: \`${p.task_id}\``)
    out.push(`- status: ${p.status}`)
    out.push(`- allowed_files: ${p.allowed_files.length}`)
    out.push(`- forbidden_files: ${p.forbidden_files.length}`)
    out.push(`- test_contracts: ${p.test_contract_ids.length}`)
    out.push('')
  }
  return out.join('\n')
}

export async function renderEvidenceLedger(): Promise<string> {
  const evidence = await listEvidence()
  const ledger = await readLedger()
  const out: string[] = [header('EVIDENCE_LEDGER', 'atelier-executor')]
  out.push(`Total evidence records: ${evidence.length}`)
  out.push(`Total ledger events: ${ledger.length}`)
  out.push('')
  for (const e of evidence.slice(0, 50)) {
    out.push(`## ${e.evidence_id}`)
    out.push(`- packet: \`${e.packet_id}\``)
    out.push(`- gate: \`${e.gate_id ?? '(none)'}\``)
    out.push(`- status: ${e.status}`)
    out.push(`- command: \`${e.command ?? '(no command)'}\``)
    out.push(`- raw_output: \`${e.raw_output_ref ?? '(none)'}\``)
    out.push('')
  }
  if (evidence.length > 50) out.push(`_... ${evidence.length - 50} more_\n`)
  out.push('## Recent ledger events')
  for (const evt of ledger.slice(-20).reverse()) {
    out.push(`- (${evt['event_type']}) ${evt['subject_id']} status=${evt['status'] ?? ''}`)
  }
  out.push('')
  return out.join('\n')
}

export async function renderBlockers(): Promise<string> {
  const blockerDir = EXECUTOR_PATHS.blockersDir
  if (!existsSync(blockerDir)) {
    return header('BLOCKERS', 'atelier-executor') + 'No blockers.\n'
  }
  const fs = await import('node:fs/promises')
  const files = await fs.readdir(blockerDir)
  const out: string[] = [header('BLOCKERS', 'atelier-executor')]
  out.push(`Total blockers: ${files.length}`)
  out.push('')
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    const text = await readFile(path.join(blockerDir, f), 'utf8')
    const b = JSON.parse(text) as Blocker
    out.push(`## ${b.blocker_id}`)
    out.push(`- packet: \`${b.packet_id}\``)
    out.push(`- task: \`${b.task_id}\``)
    out.push(`- severity: ${b.severity}`)
    out.push(`- reason: ${b.reason}`)
    out.push(`- next_action: ${b.recommended_next_action}`)
    out.push('')
  }
  return out.join('\n')
}

export async function renderAll(): Promise<{ files: string[] }> {
  await mkdir(path.dirname(EXECUTOR_PATHS.viewExecutionFrontier), { recursive: true })
  const ef = await renderExecutionFrontier()
  const el = await renderEvidenceLedger()
  const bl = await renderBlockers()
  await writeText(EXECUTOR_PATHS.viewExecutionFrontier, ef)
  await writeText(EXECUTOR_PATHS.viewEvidenceLedger, el)
  await writeText(EXECUTOR_PATHS.viewBlockers, bl)
  return {
    files: [
      EXECUTOR_PATHS.viewExecutionFrontier,
      EXECUTOR_PATHS.viewEvidenceLedger,
      EXECUTOR_PATHS.viewBlockers,
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

export async function validateExecutor(): Promise<{ issues: ValidationIssue[]; warnings: string[]; stats: unknown }> {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []
  const packets = await listPackets()
  // LIVE evidence is subject to the strict runtime-proof invariant
  // (P0-003). It excludes `_fixtures/` quarantined evidence.
  const evidence = await listEvidence()
  // INCLUSIVE evidence is the union of live and quarantined fixtures.
  // It is used ONLY for the historical packet-completion check
  // (`E_COMPLETE_WITHOUT_EVIDENCE`) so legacy / fixture packets that
  // were completed against quarantined evidence still satisfy the
  // historical invariant. The strict runtime-proof check above
  // remains LIVE-only.
  const evidenceIncludingFixtures = await listEvidenceIncludingFixtures()
  const ledger = await readLedger()

  // Load the TestContract registry once. Used by the strict
  // test-contract-id and packet-completion correspondence checks.
  let contracts: TestContract[] = []
  if (existsSync(TRANSFORMER_PATHS.testContracts)) {
    contracts = await readNdjson<TestContract>(TRANSFORMER_PATHS.testContracts)
  }
  const contractById = new Map(contracts.map((c) => [c.test_contract_id, c]))
  const packetById = new Map(packets.map((p) => [p.id, p]))

  for (const p of packets) {
    if (p.allowed_files.length === 0) {
      issues.push({ severity: 'P0', code: 'E_PACKET_NO_ALLOWED', message: `packet ${p.id} has empty allowed_files`, affected_record: p.id })
    }
    if (p.forbidden_files.length === 0) {
      issues.push({ severity: 'P0', code: 'E_PACKET_NO_FORBIDDEN', message: `packet ${p.id} has no forbidden_files`, affected_record: p.id })
    }
  }

  // Packet lifecycle: duplicate ids with conflicting statuses must fail
  // readiness. The reducer in `packet.ts` collapses duplicates by
  // `created_at`; here we surface the conflicts that the reducer
  // would have to choose between.
  const lifecycleConflicts = getDuplicatePacketStatuses(packets)
  for (const c of lifecycleConflicts) {
    issues.push({
      severity: 'P0',
      code: 'E_PACKET_LIFECYCLE_CONFLICT',
      message: `packet ${c.id} has conflicting lifecycle statuses: ${c.statuses.join(', ')} (across ${c.record_count} records)`,
      affected_record: c.id,
      recommended_next_action: 'run `bun run atelier:executor:migrate` to normalize the registry to a single current status',
    })
  }

  // Evidence runtime proof (P0-003): `passed` evidence must use one of
  // the strict runtime-proof shapes: command + raw_output_ref,
  // diff_ref + file_hashes, or validated handoff_ref. `command` alone,
  // raw output without command, and hashes without a diff are metadata,
  // not proof.
  //
  // This check uses the LIVE evidence set (not the inclusive set) so
  // quarantined fixtures are explicitly exempt from the strict
  // runtime-proof invariant. Fixtures are quarantined precisely so
  // this check does not trip on legacy / intentionally-broken
  // records.
  //
  // Each evidence record is also checked for:
  //   - E_EVIDENCE_TEST_CONTRACT_MISSING — test_contract_id must
  //     resolve to a real, non-empty contract with status: 'ready'
  //   - E_EVIDENCE_TEST_CONTRACT_REQUIRED — passed evidence for a
  //     TestContract-bearing packet must cite test_contract_id directly
  //   - E_EVIDENCE_COMMAND_MISMATCH — command evidence must match or
  //     explicitly derive from the referenced TestContract command
  //   - E_EVIDENCE_PACKET_NOT_FOUND / E_EVIDENCE_TASK_MISMATCH —
  //     packet_id/task_id/test_contract_id must describe the same work
  let evidenceWithProof = 0
  let evidenceWithoutProof = 0
  let evidenceWithContract = 0
  let evidenceWithoutContract = 0
  for (const e of evidence) {
    const proofKind = await evidenceRuntimeProofKind(e)
    if (proofKind) evidenceWithProof++
    else evidenceWithoutProof++
    if (!proofKind) {
      const isPassed = e.status === 'passed'
      issues.push({
        severity: 'P0',
        code: isPassed ? 'E_EVIDENCE_PASSED_NO_PROOF' : 'E_EVIDENCE_NOT_RUNTIME',
        message: isPassed
          ? `evidence ${e.evidence_id} has status 'passed' but lacks runtime proof (command + raw_output_ref, diff_ref + file_hashes, or validated handoff_ref); \`command\` alone is not sufficient`
          : `evidence ${e.evidence_id} lacks runtime proof (command + raw_output_ref, diff_ref + file_hashes, or validated handoff_ref)`,
        affected_record: e.evidence_id,
        recommended_next_action: 'rerun the test and capture raw output, attach diff + file_hashes, or attach a validated handoff_ref',
      })
    }
    const owningPacket = e.packet_id ? packetById.get(e.packet_id) : undefined
    if (!e.packet_id) {
      issues.push({
        severity: 'P0',
        code: 'E_EVIDENCE_PACKET_NOT_FOUND',
        message: `evidence ${e.evidence_id} lacks packet_id`,
        affected_record: e.evidence_id,
        recommended_next_action: 're-record the evidence against a concrete packet',
      })
    } else if (!owningPacket) {
      issues.push({
        severity: 'P0',
        code: 'E_EVIDENCE_PACKET_NOT_FOUND',
        message: `evidence ${e.evidence_id} references packet_id ${e.packet_id} which is not in the packet registry`,
        affected_record: e.evidence_id,
        recommended_next_action: 'recreate the packet or remove the orphan evidence record',
      })
    }
    if (e.status === 'passed' && !e.task_id) {
      issues.push({
        severity: 'P0',
        code: 'E_EVIDENCE_TASK_MISSING',
        message: `passed evidence ${e.evidence_id} lacks task_id`,
        affected_record: e.evidence_id,
        recommended_next_action: 're-record evidence so packet_id, task_id, and test_contract_id map to the same work item',
      })
    }
    if (owningPacket && e.task_id && e.task_id !== owningPacket.task_id) {
      issues.push({
        severity: 'P0',
        code: 'E_EVIDENCE_TASK_MISMATCH',
        message: `evidence ${e.evidence_id} task_id ${e.task_id} does not match packet ${owningPacket.id} task_id ${owningPacket.task_id}`,
        affected_record: e.evidence_id,
        recommended_next_action: 're-record evidence against the packet task_id',
      })
    }
    if (e.test_contract_id) {
      const contract = contractById.get(e.test_contract_id)
      if (!contract) {
        issues.push({
          severity: 'P0',
          code: 'E_EVIDENCE_TEST_CONTRACT_MISSING',
          message: `evidence ${e.evidence_id} references test_contract_id ${e.test_contract_id} which is not in ${TRANSFORMER_PATHS.testContracts}`,
          affected_record: e.evidence_id,
          recommended_next_action: 'rerun the transform pipeline so the contract is regenerated, or fix the evidence record',
        })
      } else {
        let contractIsUsable = true
        if (contract.status !== 'ready') {
          contractIsUsable = false
          issues.push({
            severity: 'P0',
            code: 'E_EVIDENCE_TEST_CONTRACT_MISSING',
            message: `evidence ${e.evidence_id} references test_contract_id ${e.test_contract_id} which has status '${contract.status}' (must be 'ready')`,
            affected_record: e.evidence_id,
            recommended_next_action: 're-derive the test contract so it becomes ready, or remove this evidence record',
          })
        }
        if (isTestContractEmpty(contract)) {
          contractIsUsable = false
          issues.push({
            severity: 'P0',
            code: 'E_EVIDENCE_TEST_CONTRACT_EMPTY',
            message: `evidence ${e.evidence_id} references empty test_contract_id ${e.test_contract_id} (requires a command and test_files or expected_behavior)`,
            affected_record: e.evidence_id,
            recommended_next_action: 're-derive a non-empty TestContract before satisfying it',
          })
        }
        if (e.task_id && e.task_id !== contract.task_id) {
          contractIsUsable = false
          issues.push({
            severity: 'P0',
            code: 'E_EVIDENCE_TASK_MISMATCH',
            message: `evidence ${e.evidence_id} task_id ${e.task_id} does not match test_contract_id ${e.test_contract_id} task_id ${contract.task_id}`,
            affected_record: e.evidence_id,
            recommended_next_action: 're-record evidence so task_id matches the referenced TestContract',
          })
        }
        if (owningPacket && !owningPacket.test_contract_ids.includes(e.test_contract_id)) {
          contractIsUsable = false
          issues.push({
            severity: 'P0',
            code: 'E_EVIDENCE_TEST_CONTRACT_NOT_IN_PACKET',
            message: `evidence ${e.evidence_id} references test_contract_id ${e.test_contract_id} which is not in packet ${owningPacket.id}'s test_contract_ids`,
            affected_record: e.evidence_id,
            recommended_next_action: 'record evidence for a TestContract listed on the packet',
          })
        }
        if (e.status === 'passed' && e.command && !commandCorrespondsToContract(e.command, contract.command)) {
          contractIsUsable = false
          issues.push({
            severity: 'P0',
            code: 'E_EVIDENCE_COMMAND_MISMATCH',
            message: `passed evidence ${e.evidence_id} command '${e.command}' does not match or explicitly derive from TestContract ${e.test_contract_id} command '${contract.command}'`,
            affected_record: e.evidence_id,
            recommended_next_action: 'rerun the referenced TestContract command and record that command in evidence',
          })
        }
        if (contractIsUsable) evidenceWithContract++
      }
    } else {
      evidenceWithoutContract++
      if (e.status === 'passed') {
        issues.push({
          severity: 'P0',
          code: 'E_EVIDENCE_TEST_CONTRACT_REQUIRED',
          message: `passed evidence ${e.evidence_id} lacks test_contract_id and cannot satisfy a TestContract via gate_id or prose`,
          affected_record: e.evidence_id,
          recommended_next_action: 're-record evidence with --test-contract <id>',
        })
      }
    }
  }

  // Completion requires evidence with runtime proof. We work off the
  // reduced (current) packet list so a single completed packet is not
  // double-counted.
  const currentPackets = reducePacketsToCurrent(packets)
  for (const p of currentPackets) {
    if (p.status === 'completed') {
      const passed = evidence.filter((e) => e.packet_id === p.id && e.status === 'passed')
      if (passed.length === 0) {
        issues.push({
          severity: 'P0',
          code: 'E_COMPLETE_WITHOUT_EVIDENCE',
          message: `packet ${p.id} is completed but has no passed evidence`,
          affected_record: p.id,
          recommended_next_action: 'rerun the test and record evidence with status=passed',
        })
        continue
      }
      const hasProof = await Promise.all(passed.map((e) => hasRuntimeProof(e)))
      if (!hasProof.some((x) => x)) {
        issues.push({
          severity: 'P0',
          code: 'E_COMPLETE_WITHOUT_RUNTIME_PROOF',
          message: `packet ${p.id} is completed but no passed evidence carries runtime proof`,
          affected_record: p.id,
          recommended_next_action: 'attach command + raw_output_ref, diff_ref + file_hashes, or a validated handoff_ref to the evidence record',
        })
      }
      // E_PACKET_COMPLETE_WITHOUT_PROOF: a completed packet must
      // have at least one passed+proven evidence record that maps to
      // one of its `test_contract_ids` (REVIEW-LATEST.md P0-005).
      const hasMatchingProof = (
        await Promise.all(
          passed.map(async (e) => {
            const cid = e.test_contract_id
            if (!cid) return false
            if (!p.test_contract_ids.includes(cid)) return false
            const contract = contractById.get(cid)
            if (!contract) return false
            const correspondence = await evidenceSatisfiesTestContract(e, p, contract)
            return correspondence.ok
          }),
        )
      ).some((x) => x)
      if (!hasMatchingProof) {
        issues.push({
          severity: 'P0',
          code: 'E_PACKET_COMPLETE_WITHOUT_PROOF',
          message: `packet ${p.id} is completed but no passed evidence maps to one of its test_contract_ids (${p.test_contract_ids.join(', ') || '<none>'}) with runtime proof, task mapping, and TestContract command correspondence`,
          affected_record: p.id,
          recommended_next_action: 're-record evidence with --test-contract <id> for one of the packet\'s test contracts',
        })
      }
    }
  }
  // Ledger-driven completion check (covers the case where the packet
  // file is missing but a `packet_completed` event was recorded).
  //
  // This historical lookup uses the INCLUSIVE evidence set (live +
  // quarantined fixtures) so a packet whose evidence is in the
  // quarantine area still satisfies the historical completion check.
  // The strict runtime-proof invariant above remains LIVE-only.
  for (const evt of ledger) {
    if (evt['event_type'] === 'packet_completed') {
      const sid = String(evt['subject_id'])
      const has = evidenceIncludingFixtures.some((e) => e.packet_id === sid)
      if (!has) {
        issues.push({ severity: 'P0', code: 'E_COMPLETE_WITHOUT_EVIDENCE', message: `packet ${sid} was completed without evidence (ledger event)`, affected_record: sid })
      }
    }
  }
  // E_NO_COMPLETED_PACKET_WITH_PROOF (Relation-Kernel pass gate).
  //
  // This is the high-level aggregation on top of the per-packet
  // `E_PACKET_COMPLETE_WITHOUT_PROOF` check above. The Relation
  // Kernel pass requires at least one completed packet on disk to
  // be backed by passed+proven evidence. The 0/0 vacuous case (zero
  // packets on disk) is preserved so a fresh bootstrap does not
  // trip the new check; the check fires only when at least one
  // packet has been flipped to `completed` and NONE of the
  // completed packets carries runtime proof.
  //
  // The operation layer surfaces this defect as
  // `E_NO_COMPLETED_PACKET_WITH_PROOF` in
  // `checkEvidenceInvariant`; we mirror the check here so the
  // executor validator can fail readiness on its own without
  // depending on the operation layer. The defect IDs match so the
  // defect pusher in `runReady` (operation layer) deduplicates the
  // record when both layers surface it.
  const completedPackets = currentPackets.filter((p) => p.status === 'completed')
  let completedPacketsWithProofLocal = 0
  for (const p of completedPackets) {
    const candidates = evidence.filter(
      (e) =>
        e.packet_id === p.id &&
        e.status === 'passed' &&
        p.test_contract_ids.includes(e.test_contract_id ?? ''),
    )
    if (candidates.length === 0) continue
    const any = await Promise.all(candidates.map((e) => hasRuntimeProof(e)))
    if (any.some((x) => x)) completedPacketsWithProofLocal++
  }
  if (completedPackets.length > 0 && completedPacketsWithProofLocal === 0) {
    issues.push({
      severity: 'P0',
      code: 'E_NO_COMPLETED_PACKET_WITH_PROOF',
      message: `${completedPackets.length} completed packet(s) exist on disk but none has a passed+proven evidence record mapped to a test_contract_id; the relation-kernel pass requires at least one completed packet backed by runtime proof`,
      affected_record: 'runs/handoffs/packets.ndjson',
      recommended_next_action:
        "capture runtime evidence for at least one completed packet via `atelier:executor:run` + `atelier:evidence:add`",
    })
  }
  // Handoff directory validation
  const handoffDir = EXECUTOR_PATHS.handoffsDir
  if (existsSync(handoffDir)) {
    const fs = await import('node:fs/promises')
    const files = await fs.readdir(handoffDir)
    for (const f of files) {
      if (!f.endsWith('.json') || f === 'packets.ndjson') continue
      const text = await readFile(path.join(handoffDir, f), 'utf8')
      try {
        const parsed = JSON.parse(text) as SubagentHandoff
        if (parsed.schema !== 'atelier.subagent-handoff/v1') {
          issues.push({ severity: 'P0', code: 'E_HANDOFF_SCHEMA', message: `handoff ${f} has wrong schema ${parsed.schema}`, affected_record: f })
        }
        if (parsed.summary && parsed.summary.length > 80) {
          issues.push({ severity: 'P1', code: 'E_HANDOFF_SUMMARY', message: `handoff ${f} summary is too long`, affected_record: f })
        }
        if (Object.keys(parsed.gate_results).length === 0) {
          issues.push({ severity: 'P0', code: 'E_HANDOFF_GATES', message: `handoff ${f} has empty gate_results`, affected_record: f })
        }
        // E_HANDBOFF_PATH_MISSING: every entry in evidence_paths and
        // files_changed must exist on disk.
        for (const p of parsed.evidence_paths ?? []) {
          if (!existsSync(p)) {
            issues.push({
              severity: 'P0',
              code: 'E_HANDBOFF_PATH_MISSING',
              message: `handoff ${f} references evidence path that does not exist on disk: ${p}`,
              affected_record: f,
              recommended_next_action: 'rebuild the referenced evidence artifact and rerun validate',
            })
          }
        }
        for (const p of parsed.files_changed ?? []) {
          if (!existsSync(p)) {
            issues.push({
              severity: 'P0',
              code: 'E_HANDBOFF_PATH_MISSING',
              message: `handoff ${f} references files_changed path that does not exist on disk: ${p}`,
              affected_record: f,
              recommended_next_action: 'restore the file or remove it from the handoff',
            })
          }
        }
        // E_PACKET_FORBIDDEN_FILE: handoff files_changed must be in
        // the packet's allowed_files (and not covered by a glob in
        // allowed_files).
        if (parsed.packet_id) {
          const owningPacket = currentPackets.find((p) => p.id === parsed.packet_id)
          if (owningPacket) {
            for (const p of parsed.files_changed ?? []) {
              if (!isPathAllowed(p, owningPacket.allowed_files)) {
                issues.push({
                  severity: 'P0',
                  code: 'E_PACKET_FORBIDDEN_FILE',
                  message: `handoff ${f} files_changed entry ${p} is not in packet ${owningPacket.id}'s allowed_files`,
                  affected_record: f,
                  recommended_next_action: 'either narrow the packet\'s allowed_files or remove the path from the handoff',
                })
              }
            }
          }
        }
        if (parsed.packet_id) {
          const v = await validateHandoffFile(path.join(handoffDir, f), parsed.packet_id)
          if (!v.ok) {
            for (const e of v.errors) {
              issues.push({ severity: 'P0', code: 'E_HANDOFF_INVALID', message: `handoff ${f}: ${e}`, affected_record: f })
            }
          }
        }
      } catch (err) {
        issues.push({ severity: 'P0', code: 'E_HANDOFF_PARSE', message: `handoff ${f} is not valid JSON: ${(err as Error).message}`, affected_record: f })
      }
    }
  }
  // View freshness
  for (const vf of [EXECUTOR_PATHS.viewExecutionFrontier, EXECUTOR_PATHS.viewEvidenceLedger, EXECUTOR_PATHS.viewBlockers]) {
    try {
      const text = await readFile(vf, 'utf8')
      if (!text.includes('GENERATED FILE. DO NOT EDIT DIRECTLY.')) {
        issues.push({ severity: 'P1', code: 'E_VIEW_STALE_MARKER', message: `view ${vf} missing marker`, affected_record: vf })
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') warnings.push(`view ${vf} missing; run \`bun run render\``)
    }
  }
  void readJson
  void readNdjson
  return {
    issues,
    warnings,
    stats: {
      packets: packets.length,
      evidence: evidence.length,
      ledger_events: ledger.length,
      evidence_with_proof: evidenceWithProof,
      evidence_without_proof: evidenceWithoutProof,
      evidence_with_contract: evidenceWithContract,
      evidence_without_contract: evidenceWithoutContract,
    },
  }
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
