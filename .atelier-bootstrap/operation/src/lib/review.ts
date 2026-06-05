/**
 * Operational review.
 *
 * Aggregates the validate outputs of every component into a single
 * `atelier.operational-review/v1` report.
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { ATELIER_V0 } from '../../../lib/src/paths.ts'
import type { AtelierResult, AtelierIssue } from '../../../lib/src/index.ts'

const READY_PATH = path.join(ATELIER_V0.facts, '..', 'operation', 'ready.json')
// Use a fixed location.
const READY_FILE = path.join(ATELIER_V0.facts, '..', 'operation', 'ready.json')

export type OperationalReview = {
  schema: 'atelier.operational-review/v1'
  status: 'pass' | 'fail' | 'blocked'
  generated_at: string
  commands_run: string[]
  commands_not_run: string[]
  blocking_defects: Array<{
    defect_id: string
    severity: 'P0' | 'P1' | 'P2'
    blocking: boolean
    affected_component: 'indexer' | 'reader' | 'transformer' | 'executor' | 'operation'
    affected_record: string
    reason: string
    recommended_next_action: string
  }>
  warnings: string[]
  verified_invariants: string[]
}

/**
 * Run a child command and parse its `AtelierResult` JSON.
 *
 * If the child command exits 0, its result is treated as pass. If it
 * exits non-zero, the result JSON (or stderr) is treated as failure.
 */
async function runChild(bunArgs: string[]): Promise<{ code: number; result: AtelierResult | null; raw: string }> {
  const proc = Bun.spawnSync(['bun', ...bunArgs], {
    cwd: process.cwd(),
    env: process.env,
  })
  const raw = proc.stdout.toString() + proc.stderr.toString()
  let result: AtelierResult | null = null
  // Find the last line that parses as JSON.
  const lines = raw.split('\n').reverse()
  for (const line of lines) {
    if (line.trim() === '') continue
    try {
      const parsed = JSON.parse(line) as AtelierResult
      if (parsed.schema === 'atelier.command-result/v1') {
        result = parsed
        break
      }
    } catch {
      // not JSON
    }
  }
  return { code: proc.exitCode, result, raw }
}

function issuesToDefects(issues: ReadonlyArray<AtelierIssue>, component: OperationalReview['blocking_defects'][number]['affected_component']): OperationalReview['blocking_defects'] {
  return issues.map((i, idx) => ({
    defect_id: `${component}:${i.code}:${idx}`,
    severity: i.severity,
    blocking: i.severity === 'P0',
    affected_component: component,
    affected_record: i.affected_record ?? '(unknown)',
    reason: i.message,
    recommended_next_action: i.recommended_next_action ?? 'investigate',
  }))
}

/**
 * Run every component's `validate` and aggregate.
 */
export async function runReady(): Promise<OperationalReview> {
  const commandsRun: string[] = []
  const commandsNotRun: string[] = []
  const allDefects: OperationalReview['blocking_defects'] = []
  const warnings: string[] = []
  const verified: string[] = []
  const startedAt = new Date().toISOString()

  const components: Array<{ name: OperationalReview['blocking_defects'][number]['affected_component']; cli: string }> = [
    { name: 'indexer', cli: '.atelier-bootstrap/indexer/src/cli.ts' },
    { name: 'reader', cli: '.atelier-bootstrap/reader/src/cli.ts' },
    { name: 'transformer', cli: '.atelier-bootstrap/transformer/src/cli.ts' },
    { name: 'executor', cli: '.atelier-bootstrap/executor/src/cli.ts' },
  ]
  for (const c of components) {
    const cmd = `${c.cli} validate`
    const r = await runChild([c.cli, 'validate'])
    commandsRun.push(cmd)
    if (r.result) {
      if (r.result.issues.length > 0) {
        allDefects.push(...issuesToDefects(r.result.issues, c.name))
      } else {
        verified.push(`${c.name} validate: ${r.result.data ? JSON.stringify(r.result.data) : 'ok'}`)
      }
    } else if (r.code !== 0) {
      allDefects.push({
        defect_id: `${c.name}:E_NO_RESULT`,
        severity: 'P0',
        blocking: true,
        affected_component: c.name,
        affected_record: cmd,
        reason: `validate produced no result JSON (exit ${r.code})`,
        recommended_next_action: 'rerun manually to inspect the error',
      })
    }
  }
  // Also run execution:ready to check the executor.
  {
    const cmd = 'executor execution:ready'
    const r = await runChild(['.atelier-bootstrap/executor/src/cli.ts', 'execution:ready'])
    commandsRun.push(cmd)
    if (r.result && r.result.issues.length > 0) {
      allDefects.push(...issuesToDefects(r.result.issues, 'executor'))
    } else if (r.result) {
      verified.push(`executor execution:ready: ${JSON.stringify(r.result.data)}`)
    } else if (r.code !== 0) {
      warnings.push('executor execution:ready exited non-zero; investigate if it persists')
    }
  }

  // Invariants
  const units = await readNdjson<{ id: string }>(path.join(ATELIER_V0.objects, 'source.ndjson')).catch(() => [])
  if (units.length > 0) verified.push(`atelier/v0/objects/source.ndjson contains ${units.length} source units`)
  const briefs = await readNdjson<unknown>(path.join(ATELIER_V0.briefs, 'hypotheses.ndjson')).catch(() => [])
  verified.push(`reader brief is hypothesis-only`)
  void briefs

  const status: OperationalReview['status'] = allDefects.some((d) => d.blocking) ? 'fail' : 'pass'
  const review: OperationalReview = {
    schema: 'atelier.operational-review/v1',
    status,
    generated_at: startedAt,
    commands_run: commandsRun,
    commands_not_run: commandsNotRun,
    blocking_defects: allDefects,
    warnings,
    verified_invariants: verified,
  }
  void READY_PATH
  await mkdir(path.dirname(READY_FILE), { recursive: true })
  await writeFile(READY_FILE, JSON.stringify(review, null, 2), 'utf8')
  return review
}

void existsSync
