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
  EXECUTOR_PATHS,
} from '../../../lib/src/index.ts'
import { listPackets } from './packet.ts'
import { listEvidence, validateHandoffFile } from './evidence.ts'
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
  const evidence = await listEvidence()
  const ledger = await readLedger()

  for (const p of packets) {
    if (p.allowed_files.length === 0) {
      issues.push({ severity: 'P0', code: 'E_PACKET_NO_ALLOWED', message: `packet ${p.id} has empty allowed_files`, affected_record: p.id })
    }
    if (p.forbidden_files.length === 0) {
      issues.push({ severity: 'P0', code: 'E_PACKET_NO_FORBIDDEN', message: `packet ${p.id} has no forbidden_files`, affected_record: p.id })
    }
  }
  for (const e of evidence) {
    if (!e.command && !e.raw_output_ref) {
      issues.push({ severity: 'P0', code: 'E_EVIDENCE_NOT_RUNTIME', message: `evidence ${e.evidence_id} lacks command and raw_output_ref`, affected_record: e.evidence_id, recommended_next_action: 'rerun the test and capture the output' })
    }
  }
  // Completion requires evidence: scan ledger for completed events and ensure evidence exists.
  for (const evt of ledger) {
    if (evt['event_type'] === 'packet_completed') {
      const sid = String(evt['subject_id'])
      const has = evidence.some((e) => e.packet_id === sid)
      if (!has) {
        issues.push({ severity: 'P0', code: 'E_COMPLETE_WITHOUT_EVIDENCE', message: `packet ${sid} was completed without evidence`, affected_record: sid })
      }
    }
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
  return { issues, warnings, stats: { packets: packets.length, evidence: evidence.length, ledger_events: ledger.length } }
}
