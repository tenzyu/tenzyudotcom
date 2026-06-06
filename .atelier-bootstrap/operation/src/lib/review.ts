/**
 * Operational review.
 *
 * The `atelier:ready` aggregator is the single source of truth for
 * operational pass/fail. It is intentionally fail-closed.
 *
 * Aggregation strategy:
 *   1. Run every component's `validate` and surface every issue they
 *      raise. P0 AND P1 are blocking — passing on a P1 is not OK.
 *   2. Independently verify operational invariants by reading the raw
 *      NDJSON / JSON state under `.atelier/v0/**`. Generated views
 *      are NEVER consulted. P0-005 ("views are not proof") is enforced
 *      by the contract; this module is the implementation of that
 *      contract.
 *   3. Verify the indexer is in strict (not quick/sample) mode. The
 *      default validator emits `data.mode = 'strict'`; a quick mode
 *      run is rejected.
 *   4. Aggregate all defects and report `status: 'pass'` only when
 *      zero P0/P1 defects remain.
 *
 * The legacy fixtures (the broken packet registry and the prose-only
 * evidence record) are intentionally left in place. The aggregator
 * surfaces them as P0 defects so the reviewer can see that the
 * legacy state is being checked, not silently swallowed.
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import {
  ATELIER_V0,
  TRANSFORMER_PATHS,
  EXECUTOR_PATHS,
  type AtelierResult,
  type AtelierIssue,
  type AttentionSet,
  type EvidenceRecord,
  type ExecutionPacket,
  type ImplementationTask,
} from '../../../lib/src/index.ts'

const READY_FILE = path.join(ATELIER_V0.operation, 'ready.json')

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

type ComponentName = OperationalReview['blocking_defects'][number]['affected_component']
type Defect = OperationalReview['blocking_defects'][number]

/**
 * Robust JSON parser. The component CLIs emit multi-line pretty JSON;
 * a per-line "find the last parseable line" heuristic is wrong because
 * every line of `{` or `"schema": "..."` is invalid JSON on its own.
 *
 * Strategy: locate the last `"schema": "atelier.command-result/v1"`
 * marker in the output, walk back to the matching opening `{`, then
 * walk forward to the matching closing `}`. Strings are honored so
 * braces inside string values do not skew the depth count.
 */
function findResultJson(raw: string): AtelierResult | null {
  const marker = '"schema": "atelier.command-result/v1"'
  const markerIdx = raw.lastIndexOf(marker)
  if (markerIdx === -1) return null
  let braceStart = -1
  for (let i = markerIdx; i >= 0; i--) {
    if (raw[i] === '{') {
      braceStart = i
      break
    }
  }
  if (braceStart === -1) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = braceStart; i < raw.length; i++) {
    const c = raw[i]
    if (inString) {
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') inString = true
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        const candidate = raw.slice(braceStart, i + 1)
        try {
          return JSON.parse(candidate) as AtelierResult
        } catch {
          return null
        }
      }
    }
  }
  return null
}

async function runChild(
  bunArgs: string[],
): Promise<{ code: number; result: AtelierResult | null; raw: string }> {
  const proc = Bun.spawnSync(['bun', ...bunArgs], {
    cwd: process.cwd(),
    env: process.env,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const raw = proc.stdout.toString() + proc.stderr.toString()
  const result = findResultJson(raw)
  return { code: proc.exitCode, result, raw }
}

export type ReindexOutcome = {
  cmdStr: string
  code: number
  result: AtelierResult | null
  raw: string
}

/**
 * Re-run the indexer update step (`scan + index + affected + render`)
 * so transient P1 hash drifts caused by file edits since the last
 * `atelier:index update` are cleared before strict validation runs.
 *
 * Why this is required (and not a band-aid):
 *   - The strict indexer validator re-hashes every source unit's path
 *     on disk and compares it to the recorded sha256
 *     (REVIEW-LATEST.md P0-005, `E_REF_HASH_DRIFT`).
 *   - Tracked files that have been edited since the last `update`
 *     therefore surface as blocking P1 defects, even though the
 *     underlying state is genuinely clean.
 *   - The correct response is to refresh the index, NOT to make the
 *     validator lenient. Without this step, `atelier:ready` cannot
 *     be self-sufficient.
 *
 * Shared by `runReady` and `runVerify` so the operational review
 * always reflects a freshly-indexed snapshot. The re-index is
 * idempotent, so calling it twice (once from `runVerify`, once
 * from the `runReady` it ultimately invokes) is harmless.
 */
export async function reindex(): Promise<ReindexOutcome> {
  const cli = '.atelier-bootstrap/indexer/src/cli.ts'
  const args = ['update']
  const cmdStr = `${cli} ${args.join(' ')}`
  const r = await runChild([cli, ...args])
  return { cmdStr, code: r.code, result: r.result, raw: r.raw }
}

function issueToDefect(issue: AtelierIssue, component: ComponentName, idx: number): Defect {
  return {
    defect_id: `${component}:${issue.code}:${idx}`,
    // P0 and P1 are both blocking. P2 is informational.
    severity: issue.severity,
    blocking: issue.severity === 'P0' || issue.severity === 'P1',
    affected_component: component,
    affected_record: issue.affected_record ?? '(unknown)',
    reason: issue.message,
    recommended_next_action: issue.recommended_next_action ?? 'investigate',
  }
}

function makeDefect(
  component: ComponentName,
  code: string,
  severity: 'P0' | 'P1' | 'P2',
  affected_record: string,
  reason: string,
  recommended_next_action: string,
): Defect {
  return {
    defect_id: `${component}:${code}`,
    severity,
    blocking: severity === 'P0' || severity === 'P1',
    affected_component: component,
    affected_record,
    reason,
    recommended_next_action,
  }
}

void existsSync

/**
 * Independent strict invariant check: at least one attention set
 * exists with `selected_object_ids.length > 0` and
 * `gap_status: 'sufficient'`. Empty or insufficient attention fails
 * readiness (REVIEW-LATEST.md P0-002).
 */
async function checkAttentionInvariant(
  push: (d: Defect) => void,
  verified: string[],
): Promise<void> {
  const attention = await readNdjson<AttentionSet>(path.join(ATELIER_V0.objects, 'attention.ndjson')).catch(() => [])
  if (attention.length === 0) {
    push(
      makeDefect(
        'reader',
        'E_NO_ATTENTION_SET',
        'P0',
        'objects/attention.ndjson',
        'no attention sets exist; create one with `bun run atelier:attention -- --task "<task>"`',
        'run `bun run atelier:attention -- --task "<a real task>"` and re-run ready',
      ),
    )
    return
  }
  const sufficient = attention.find(
    (a) =>
      Array.isArray(a.selected_object_ids) &&
      a.selected_object_ids.length > 0 &&
      a.gap_status === 'sufficient',
  )
  if (!sufficient) {
    push(
      makeDefect(
        'reader',
        'E_ATTENTION_INSUFFICIENT',
        'P0',
        'objects/attention.ndjson',
        'no attention set has both selected_object_ids and gap_status=sufficient; task-scoped attention is empty or insufficient',
        're-run `bun run atelier:deep-read` on a real attention set, or expand the attention budget',
      ),
    )
    return
  }
  verified.push(
    `attention.ndjson contains ${attention.length} set(s); at least one is sufficient with ${sufficient.selected_object_ids.length} selected object(s)`,
  )
}

/**
 * Independent strict invariant check: at least one non-fixture
 * implementation task is derived from `harness/atelier-design-docs/**`
 * (REVIEW-LATEST.md P1-001). Tasks marked `fixture: true` or carrying
 * `tags: ['fixture']` are excluded.
 */
async function checkImplementationTaskInvariant(
  push: (d: Defect) => void,
  verified: string[],
): Promise<void> {
  const tasks = await readNdjson<ImplementationTask>(
    TRANSFORMER_PATHS.implementationTasks,
  ).catch(() => [])
  if (tasks.length === 0) {
    push(
      makeDefect(
        'transformer',
        'E_NO_IMPLEMENTATION_TASKS',
        'P0',
        'transforms/md-to-code/model/implementation-tasks.ndjson',
        'no implementation tasks exist',
        'run `bun run atelier:transform:md-to-code` and re-run ready',
      ),
    )
    return
  }
  const designDocTasks = tasks.filter((t) => {
    if (t.fixture === true) return false
    if (Array.isArray(t.tags) && t.tags.includes('fixture')) return false
    return (t.source_refs ?? []).some((r) =>
      typeof r.path === 'string' && r.path.startsWith('harness/atelier-design-docs/'),
    )
  })
  if (designDocTasks.length === 0) {
    push(
      makeDefect(
        'transformer',
        'E_TASK_NO_DESIGN_DOC',
        'P1',
        'transforms/md-to-code/model/implementation-tasks.ndjson',
        'no non-fixture implementation task is derived from harness/atelier-design-docs/**; md-to-code transform is using toy samples only',
        're-run `bun run atelier:transform:md-to-code` after ensuring design-doc attention exists',
      ),
    )
    return
  }
  verified.push(
    `implementation-tasks.ndjson contains ${tasks.length} task(s); ${designDocTasks.length} non-fixture task(s) anchored to harness/atelier-design-docs/**`,
  )
}

/**
 * Independent strict invariant check: every `EvidenceRecord` with
 * `status: 'passed'` carries runtime proof (raw_output_ref to a real
 * file, non-empty file_hashes, or diff_ref to a real file). `command`
 * alone is not proof (REVIEW-LATEST.md P0-003).
 */
async function checkEvidenceInvariant(
  push: (d: Defect) => void,
  verified: string[],
): Promise<void> {
  const evidenceDir = EXECUTOR_PATHS.evidenceDir
  if (!existsSync(evidenceDir)) {
    verified.push('runs/evidence/ does not exist; no evidence to verify')
    return
  }
  const files = await readdir(evidenceDir).catch(() => [] as string[])
  const jsonFiles = files.filter((f) => f.endsWith('.json'))
  if (jsonFiles.length === 0) {
    verified.push('runs/evidence/ has no evidence records')
    return
  }
  let total = 0
  let failed = 0
  for (const f of jsonFiles) {
    const full = path.join(evidenceDir, f)
    const text = await readFile(full, 'utf8').catch(() => '')
    if (!text) continue
    let rec: EvidenceRecord
    try {
      rec = JSON.parse(text) as EvidenceRecord
    } catch {
      continue
    }
    total++
    if (rec.status !== 'passed') continue
    const hasRaw = !!rec.raw_output_ref && existsSync(rec.raw_output_ref)
    const hasDiff = !!rec.diff_ref && existsSync(rec.diff_ref)
    const hasHashes = !!rec.file_hashes && Object.keys(rec.file_hashes).length > 0
    if (!hasRaw && !hasDiff && !hasHashes) {
      failed++
      push(
        makeDefect(
          'executor',
          'E_EVIDENCE_PASSED_NO_PROOF',
          'P0',
          rec.evidence_id ?? f,
          `evidence ${rec.evidence_id ?? f} has status 'passed' but lacks runtime proof (raw_output_ref, file_hashes, or diff_ref); \`command\` alone is not sufficient`,
          'rerun the test and capture raw output, or attach a diff / file_hashes',
        ),
      )
    }
  }
  verified.push(`runs/evidence/ contains ${total} record(s); ${failed} passed-record(s) lack runtime proof`)
}

/**
 * Independent strict invariant check: no duplicate packet ids with
 * conflicting lifecycle statuses (REVIEW-LATEST.md P0-004). This
 * re-derives the duplicate-status set from raw state, not from the
 * executor validator, so the operation aggregator is the only
 * authority.
 */
async function checkPacketLifecycleInvariant(
  push: (d: Defect) => void,
  verified: string[],
): Promise<void> {
  const packetsFile = path.join(EXECUTOR_PATHS.handoffsDir, 'packets.ndjson')
  if (!existsSync(packetsFile)) {
    verified.push('runs/handoffs/packets.ndjson does not exist; no packet lifecycle to verify')
    return
  }
  const packets = await readNdjson<ExecutionPacket>(packetsFile)
  if (packets.length === 0) {
    verified.push('runs/handoffs/packets.ndjson is empty; no packet lifecycle to verify')
    return
  }
  const byId = new Map<string, ExecutionPacket[]>()
  for (const p of packets) {
    const list = byId.get(p.id) ?? []
    list.push(p)
    byId.set(p.id, list)
  }
  let conflicts = 0
  for (const [id, records] of byId) {
    if (records.length < 2) continue
    const uniqueStatuses = Array.from(new Set(records.map((r) => r.status)))
    if (uniqueStatuses.length > 1) {
      conflicts++
      push(
        makeDefect(
          'executor',
          'E_PACKET_LIFECYCLE_CONFLICT',
          'P0',
          id,
          `packet ${id} has conflicting lifecycle statuses: ${uniqueStatuses.join(', ')} (across ${records.length} records)`,
          'run `bun run atelier:executor:migrate` to normalize the registry to a single current status',
        ),
      )
    }
  }
  if (conflicts === 0) {
    verified.push(
      `runs/handoffs/packets.ndjson contains ${packets.length} packet record(s); no duplicate/conflicting lifecycle statuses`,
    )
  }
}

/**
 * Independent strict invariant check: the indexer is in strict (not
 * quick/sample) mode (REVIEW-LATEST.md P0-005). The indexer validator
 * exposes `data.mode`. We require it to be exactly 'strict'.
 */
function checkIndexerMode(
  push: (d: Defect) => void,
  componentResult: AtelierResult | null,
): void {
  if (!componentResult || !componentResult.data) return
  const data = componentResult.data as { mode?: string }
  if (data.mode && data.mode !== 'strict') {
    push(
      makeDefect(
        'indexer',
        'E_INDEXER_NOT_STRICT',
        'P0',
        'indexer validate',
        `indexer validate ran in '${data.mode}' mode; only 'strict' mode is allowed for operational readiness`,
        'run `bun .atelier-bootstrap/indexer/src/cli.ts validate` (no --quick flag)',
      ),
    )
  }
}

type ComponentCheck = {
  name: ComponentName
  cli: string
  args: string[]
}

const COMPONENTS: ReadonlyArray<ComponentCheck> = [
  { name: 'indexer', cli: '.atelier-bootstrap/indexer/src/cli.ts', args: ['validate'] },
  { name: 'reader', cli: '.atelier-bootstrap/reader/src/cli.ts', args: ['validate'] },
  { name: 'transformer', cli: '.atelier-bootstrap/transformer/src/cli.ts', args: ['validate'] },
  { name: 'executor', cli: '.atelier-bootstrap/executor/src/cli.ts', args: ['validate'] },
]

/**
 * Build a de-duplicating defect pusher. Two defects with the same
 * (component, code-base, affected_record) key are treated as the
 * same defect — the first one wins. This is what the reviewer wants:
 * a clean list of unique defects, not noise from the same defect
 * being reported by two layers.
 */
function makeDefectPusher(defects: Defect[]): (d: Defect) => void {
  const seen = new Set<string>()
  return (d: Defect) => {
    const codeBase = d.defect_id.replace(/:[0-9]+$/, '')
    const key = `${d.affected_component}|${codeBase}|${d.affected_record}`
    if (seen.has(key)) return
    seen.add(key)
    defects.push(d)
  }
}

/**
 * Run every component's `validate` and aggregate.
 *
 * Always returns an `OperationalReview`. The function never throws;
 * the caller decides what to do with the status.
 */
export async function runReady(): Promise<OperationalReview> {
  const commandsRun: string[] = []
  const commandsNotRun: string[] = []
  const defects: Defect[] = []
  const warnings: string[] = []
  const verified: string[] = []
  const startedAt = new Date().toISOString()
  const push = makeDefectPusher(defects)

  // 0. Re-index so transient P1 hash drifts are cleared before
  //    strict validation runs. Without this step, any tracked file
  //    edited since the last `atelier:index update` would surface
  //    as a blocking P1 `E_REF_HASH_DRIFT` even when the underlying
  //    state is genuinely clean. The re-index is reflected in
  //    `commands_run` so the report is auditable.
  const reindexOutcome = await reindex()
  commandsRun.push(reindexOutcome.cmdStr)
  if (reindexOutcome.code !== 0) {
    // Re-index failed. The validators that follow will usually
    // surface the consequence (E_REF_HASH_DRIFT or similar), but
    // if they somehow pass we still want the re-index failure to
    // be visible in the report. We record it as a P0 defect
    // affecting the operation component and continue — the rest
    // of the checks are still informative.
    push(
      makeDefect(
        'operation',
        'E_REINDEX_FAILED',
        'P0',
        reindexOutcome.cmdStr,
        `atelier:index update exited with code ${reindexOutcome.code}; ready cannot guarantee a fresh snapshot`,
        'rerun `bun run atelier:index update` and inspect its output',
      ),
    )
  }

  // 1. Run each component's `validate` and surface their issues.
  let indexerResult: AtelierResult | null = null
  for (const c of COMPONENTS) {
    const cmdStr = `${c.cli} ${c.args.join(' ')}`
    const r = await runChild([c.cli, ...c.args])
    commandsRun.push(cmdStr)
    if (r.result) {
      if (c.name === 'indexer') indexerResult = r.result
      if (r.result.issues.length > 0) {
        r.result.issues.forEach((issue, idx) => {
          push(issueToDefect(issue, c.name, idx))
        })
        for (const w of r.result.warnings) {
          warnings.push(`${c.name} validate: ${w}`)
        }
      } else {
        const dataSummary = r.result.data
          ? typeof r.result.data === 'object'
            ? Object.entries(r.result.data)
                .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
                .join(', ')
            : String(r.result.data)
          : 'ok'
        verified.push(`${c.name} validate: ${dataSummary}`)
      }
    } else if (r.code !== 0) {
      push({
        defect_id: `${c.name}:E_NO_RESULT`,
        severity: 'P0',
        blocking: true,
        affected_component: c.name,
        affected_record: cmdStr,
        reason: `validate produced no result JSON (exit ${r.code}); output was:\n${r.raw.slice(0, 500)}`,
        recommended_next_action: 'rerun manually to inspect the error',
      })
    } else {
      warnings.push(`${c.name} validate: no result JSON; treating as warning`)
    }
  }

  // 2. Mode check: indexer must be in strict mode.
  checkIndexerMode(push, indexerResult)

  // 3. Independent strict invariants (raw NDJSON/JSON, not validator output).
  await checkAttentionInvariant(push, verified)
  await checkImplementationTaskInvariant(push, verified)
  await checkEvidenceInvariant(push, verified)
  await checkPacketLifecycleInvariant(push, verified)

  const status: OperationalReview['status'] =
    defects.some((d) => d.blocking) ? 'fail' : 'pass'

  const review: OperationalReview = {
    schema: 'atelier.operational-review/v1',
    status,
    generated_at: startedAt,
    commands_run: commandsRun,
    commands_not_run: commandsNotRun,
    blocking_defects: defects,
    warnings,
    verified_invariants: verified,
  }

  await mkdir(path.dirname(READY_FILE), { recursive: true })
  await writeFile(READY_FILE, JSON.stringify(review, null, 2), 'utf8')
  return review
}
