/**
 * Atelier Autopoiesis — C8 self-improvement evaluator.
 *
 * `runEvaluate()` is the runtime that converts validator defects
 * into `AutopoiesisFinding` records, groups them by capability,
 * and appends the result to
 * `.atelier/v0/autopoiesis/findings.ndjson`.
 *
 * The function is read-only on the autopoiesis ledgers (no
 * validators are weakened, no records are promoted). The
 * evaluator's job is to:
 *
 *   1. Call `validateAutopoiesis()` and convert each
 *      `AutopoiesisDefect` into an `AutopoiesisFinding` with
 *      the matching `capability_id` derived from the defect
 *      code prefix. The CODE_TO_CAPABILITY table is the single
 *      source of truth.
 *   2. Call `resolveAll()` and emit a finding when any
 *      resolution reports a newly created conflict or
 *      `disagrees_with_default: true` on the on-disk rule.
 *   3. Build a deterministic `finding_id`
 *      (`finding:<capability>:<code>:<sha256(reason)[:8]>`) so
 *      re-runs are idempotent.
 *   4. Persist findings to disk via `appendNdjsonAutopoiesis`
 *      (the appender is itself idempotent — duplicate
 *      `finding_id`s are detected and skipped).
 *   5. Write `evaluator-state.json` with `last_evaluated_at`
 *      and the count of new findings, so the `closeTask` gate
 *      can decide whether the latest evaluate result is fresh
 *      enough to allow a task to close.
 *   6. Return an `EvaluateResult` with `status: "pass"` when
 *      no open P0/P1 finding exists, otherwise `"fail"`.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { resolveAll } from './authority.ts'
import { AUTOPOIESIS_PATHS } from './paths.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesisTolerant } from './store.ts'
import { validateAutopoiesis, type AutopoiesisDefect } from './validate.ts'
import type { AutopoiesisFinding } from './records.ts'

/* -------------------------------------------------------------------------- */
/*                                Public types                                */
/* -------------------------------------------------------------------------- */

export type AutopoiesisCapabilityId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8'

export type EvaluateStats = {
  semantic_nodes: number
  authority_rules: number
  control_packets: number
  materialization_proposals: number
  findings: number
  open_p0: number
  open_p1: number
}

export type EvaluateResult = {
  schema: 'atelier.evaluate-result/v1'
  evaluated_at: string
  goal_ref: string
  status: 'pass' | 'fail'
  stats: EvaluateStats
  findings: AutopoiesisFinding[]
  commands_run: string[]
}

export type RunEvaluateOptions = {
  goalRef: string
  capabilityFilter?: AutopoiesisCapabilityId
}

/* -------------------------------------------------------------------------- */
/*                            Defect → capability                             */
/* -------------------------------------------------------------------------- */

/**
 * Map an autopoiesis defect code to the capability whose
 * negative control the defect breaks. The mapping is the
 * single source of truth — the validator itself does not know
 * about capabilities, so the evaluator does the binding.
 *
 * Anything that does not match a known prefix is bucketed into
 * C8 (self-improvement): a defect the existing code base does
 * not yet know about.
 */
export const CODE_TO_CAPABILITY: ReadonlyMap<string, AutopoiesisCapabilityId> = new Map<
  string,
  AutopoiesisCapabilityId
>([
  // C1 — semantic nodes and their structural properties.
  ['E_NODE_NO_SOURCE_ANCHOR', 'C1'],
  ['E_NODE_FAKE_SOURCE_ANCHOR', 'C1'],
  ['E_NODE_DUPLICATE_ID', 'C1'],
  ['E_NODE_INVALID_KIND', 'C1'],
  ['E_NODE_INVALID_LIFECYCLE', 'C1'],
  ['E_NODE_MISSING_REQUIRED', 'C1'],
  ['E_HANDOFF_NODE_NO_CHECK_RESULT', 'C1'],
  // C2 — promotion / lifecycle policy.
  ['E_PROMOTION_LLM_DIRECT_ACCEPT', 'C2'],
  ['E_PROMOTION_MISSING_EVIDENCE', 'C2'],
  ['E_PROMOTION_MISSING_OWNER', 'C2'],
  ['E_PROMOTION_MISSING_SCOPE', 'C2'],
  ['E_TRANSITION_ILLEGAL', 'C2'],
  // C3 — authority resolver, precedence, and conflict detection.
  ['E_AUTHORITY_DEFAULT_DISAGREES', 'C3'],
  ['E_CONFLICT_NO_OVERLAP', 'C3'],
  ['E_CONFLICT_FAKE_CLAIMANT', 'C3'],
  ['E_NODE_PRECEDENCE_OVERRIDE', 'C3'],
  // C4 — graph edges and typed graph integrity.
  ['E_EDGE_INVALID', 'C4'],
  ['E_EDGE_DANGLING', 'C4'],
  // C5 — control packets.
  ['E_PACKET_SCOPE_OVERLAP', 'C5'],
  ['E_PACKET_OP_OVERLAP', 'C5'],
  ['E_PACKET_MISSING_CHECKS', 'C5'],
  ['E_PACKET_MISSING_EVIDENCE', 'C5'],
  ['E_PACKET_STALE_ANCHOR', 'C5'],
  ['E_PACKET_CHECK_NOT_PASSED', 'C5'],
  ['E_PACKET_MATERIALIZATION_FAKE_ANCHOR', 'C5'],
  ['E_PACKET_MATERIALIZATION_FAKE_CHECK', 'C5'],
  ['E_PACKET_TASK_NOT_READY', 'C5'],
  // C6 — materialization gate.
  ['E_MATERIALIZE_MISSING_PROMOTION', 'C6'],
  ['E_MATERIALIZE_REQUIREMENT_NOT_ACCEPTED', 'C6'],
  ['E_MATERIALIZE_DECISION_SUPERSEDED', 'C6'],
  ['E_MATERIALIZE_CHECK_NOT_PASSED', 'C6'],
  ['E_MATERIALIZE_DIFF_OUT_OF_SCOPE', 'C6'],
  ['E_MATERIALIZE_SCOPE_OVERLAP', 'C6'],
  ['E_CLOSE_NO_VALIDATED_PROPOSAL', 'C6'],
  // C7 — staleness / freshness.
  ['E_STALE_PREMATURE', 'C7'],
  ['E_STALE_FAKE_SUBJECT', 'C7'],
])

export function capabilityForCode(code: string): AutopoiesisCapabilityId {
  // C8 catch-all. A defect that is not in the table is, by
  // definition, an unknown code — the evaluator cannot know
  // which capability owns the negative control. C8 is the
  // generic self-improvement bucket; the work-order compiler
  // routes the finding to C8 with a "triage" objective.
  if (CODE_TO_CAPABILITY.has(code)) return CODE_TO_CAPABILITY.get(code) as AutopoiesisCapabilityId
  // Prefix-based fallback so the C1/C2/C3/C4/etc. grouping is
  // preserved even when a brand-new code is added that does
  // not yet appear in the table.
  if (code.startsWith('E_NODE_')) return 'C1'
  if (code.startsWith('E_PROMOTION_') || code.startsWith('E_TRANSITION_')) return 'C2'
  if (code.startsWith('E_AUTHORITY_') || code.startsWith('E_CONFLICT_')) return 'C3'
  if (code.startsWith('E_EDGE_')) return 'C4'
  if (code.startsWith('E_PACKET_')) return 'C5'
  if (code.startsWith('E_MATERIALIZE_') || code.startsWith('E_CLOSE_')) return 'C6'
  if (code.startsWith('E_STALE_')) return 'C7'
  return 'C8'
}

/* -------------------------------------------------------------------------- */
/*                            Finding construction                            */
/* -------------------------------------------------------------------------- */

function deterministicFindingId(
  capabilityId: AutopoiesisCapabilityId,
  code: string,
  reason: string,
): string {
  const hash = createHash('sha256').update(reason, 'utf8').digest('hex').slice(0, 8)
  return `finding:${capabilityId}:${code}:${hash}`
}

function defectToFinding(
  defect: AutopoiesisDefect,
  createdAt: string,
): AutopoiesisFinding {
  const capabilityId = capabilityForCode(defect.code)
  const finding: AutopoiesisFinding = {
    schema: 'atelier.autopoiesis-finding/v1',
    finding_id: deterministicFindingId(capabilityId, defect.code, defect.message),
    severity: defect.severity,
    capability_id: capabilityId,
    code: defect.code,
    reason: defect.message,
    required_repair: defect.recommended_next_action ?? 'Repair the defect; re-run the evaluator.',
    status: 'open',
    proof_required: [
      `evaluator:next_run:no_open_p0_for_capability=${capabilityId}`,
      `validate:autopoiesis:issues=0`,
    ],
    created_at: createdAt,
  }
  if (defect.affected_record !== undefined) finding.affected_record = defect.affected_record
  return finding
}

/* -------------------------------------------------------------------------- */
/*                            Append + dedup                                   */
/* -------------------------------------------------------------------------- */

async function readExistingFindingIds(): Promise<Set<string>> {
  const { records, lineErrors } = await readNdjsonAutopoiesisTolerant<AutopoiesisFinding>(
    AUTOPOIESIS_PATHS.findings,
  )
  if (lineErrors.length > 0) {
    // Surface corrupt-line errors via stderr but do not abort;
    // the evaluator's tolerance policy is to record findings
    // for any unparseable line and continue.
    process.stderr.write(
      `[evaluator] ${lineErrors.length} corrupt line(s) in ${AUTOPOIESIS_PATHS.findings}; skipping them.\n`,
    )
  }
  return new Set(records.map((r) => r.finding_id).filter((x): x is string => typeof x === 'string'))
}

async function persistFinding(finding: AutopoiesisFinding): Promise<boolean> {
  const existing = await readExistingFindingIds()
  if (existing.has(finding.finding_id)) return false
  await appendNdjsonAutopoiesis<AutopoiesisFinding>(AUTOPOIESIS_PATHS.findings, finding)
  return true
}

/* -------------------------------------------------------------------------- */
/*                          Findings reconciliation                            */
/* -------------------------------------------------------------------------- */

/**
 * A defect key is the tuple `(code, affected_record)` that
 * uniquely identifies a defect the evaluator is currently
 * detecting. The set of current defect keys is computed from
 * the validator's issues plus the resolver's newly-created
 * conflicts. A finding is "still open" iff its defect key is in
 * the current set; otherwise it is reconciled to
 * `status: 'verified'` (a brand-new record with a `:closed:<ts>`
 * id suffix is appended, so the audit trail is preserved).
 */
export type DefectKey = string

export function defectKey(code: string, affectedRecord: string | undefined): DefectKey {
  return `${code}::${affectedRecord ?? '<none>'}`
}

export type ReconcileResult = {
  closed: AutopoiesisFinding[]
  reOpened: AutopoiesisFinding[]
}

/**
 * Reconcile the findings ledger against the current defect set.
 *
 * The function is the self-healing heart of the C8 self-improvement
 * loop: a finding whose defect key is no longer in the current
 * defect set is transitioned to `status: 'verified'` by appending
 * a new line with a `:closed:<ts>` id suffix. Conversely, a
 * previously-closed finding whose defect key re-appears in the
 * current defect set is re-opened by appending a new line with
 * `status: 'open'` and a `:reopened:<ts>` id suffix.
 *
 * The original records are NEVER mutated: the audit trail is
 * append-only, and the latest record for any `defect_key` is the
 * source of truth (read by `runEvaluate` when counting open
 * findings).
 *
 * The function returns the lists of findings it closed and
 * re-opened, so the caller can include them in the result
 * envelope and so tests can assert the transition.
 */
export async function reconcileFindings(
  validatorIssues: ReadonlyArray<AutopoiesisDefect>,
  conflictResults: ReadonlyArray<{
    conflict_kind: string
    class?: string
    scope?: string
    id?: string
  }>,
): Promise<ReconcileResult> {
  // 1. Build the current defect-key set.
  const currentKeys = new Set<DefectKey>()
  for (const d of validatorIssues) {
    currentKeys.add(defectKey(d.code, d.affected_record))
  }
  // Conflicts map to a synthetic E_AUTHORITY_CONFLICT_NEW defect;
  // the (code, scope) pair is the closest stable identifier we
  // can derive from the resolver's payload. The conflict_id is
  // used as the affected_record so re-runs match.
  for (const c of conflictResults) {
    const scope = c.scope ?? '<no-scope>'
    currentKeys.add(defectKey('E_AUTHORITY_CONFLICT_NEW', `conflict:${c.id ?? scope}`))
  }

  // 2. Read the on-disk findings and group by defect_key, taking
  //    the LATEST status for each defect_key as authoritative.
  const { records, lineErrors } = await readNdjsonAutopoiesisTolerant<AutopoiesisFinding>(
    AUTOPOIESIS_PATHS.findings,
  )
  if (lineErrors.length > 0) {
    process.stderr.write(
      `[reconcile] ${lineErrors.length} corrupt line(s) in ${AUTOPOIESIS_PATHS.findings}; skipping them.\n`,
    )
  }
  const latestByKey = new Map<DefectKey, AutopoiesisFinding>()
  for (const f of records) {
    if (typeof f.code !== 'string') continue
    const key = defectKey(f.code, f.affected_record)
    latestByKey.set(key, f)
  }

  // 3. Walk every known defect_key and decide what to write.
  const closed: AutopoiesisFinding[] = []
  const reOpened: AutopoiesisFinding[] = []
  const ts = Date.now()
  for (const [key, latest] of latestByKey) {
    const inCurrent = currentKeys.has(key)
    if (!inCurrent && latest.status === 'open') {
      // Defect no longer detected → close.
      const closing: AutopoiesisFinding = {
        ...latest,
        finding_id: `${latest.finding_id}:closed:${ts}`,
        status: 'verified',
        reason: `${latest.reason} (reconciled: defect no longer detected)`,
        created_at: new Date(ts).toISOString(),
      }
      await appendNdjsonAutopoiesis<AutopoiesisFinding>(AUTOPOIESIS_PATHS.findings, closing)
      closed.push(closing)
      latestByKey.set(key, closing)
    } else if (inCurrent && latest.status !== 'open') {
      // Defect re-detected after closure → re-open.
      const reopening: AutopoiesisFinding = {
        ...latest,
        finding_id: `${latest.finding_id}:reopened:${ts}`,
        status: 'open',
        reason: `${latest.reason} (reconciled: defect re-detected)`,
        created_at: new Date(ts).toISOString(),
      }
      await appendNdjsonAutopoiesis<AutopoiesisFinding>(AUTOPOIESIS_PATHS.findings, reopening)
      reOpened.push(reopening)
      latestByKey.set(key, reopening)
    }
  }
  return { closed, reOpened }
}

/* -------------------------------------------------------------------------- */
/*                          Evaluator state file                              */
/* -------------------------------------------------------------------------- */

export type EvaluatorState = {
  schema: 'atelier.evaluator-state/v1'
  last_evaluated_at: string
  last_goal_ref: string
  new_findings_count: number
  total_findings_count: number
  commands_run: string[]
}

export async function writeEvaluatorState(state: EvaluatorState): Promise<void> {
  await mkdir(path.dirname(AUTOPOIESIS_PATHS.evaluatorState), { recursive: true })
  await writeFile(AUTOPOIESIS_PATHS.evaluatorState, JSON.stringify(state, null, 2), 'utf8')
}

export async function readEvaluatorState(): Promise<EvaluatorState | undefined> {
  try {
    const text = await readFile(AUTOPOIESIS_PATHS.evaluatorState, 'utf8')
    const parsed = JSON.parse(text) as EvaluatorState
    return parsed
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw err
  }
}

/**
 * Test-only helper that seeds a synthetic evaluator-state.json
 * into the autopoiesis path. The C8 closeTask gate reads the
 * file to decide whether the most recent `runEvaluate` is fresh
 * enough; tests that want closeTask to succeed must seed the
 * file BEFORE calling closeTask.
 *
 * The helper:
 *   - writes a state with `last_evaluated_at` (default: now),
 *     `last_goal_ref` (default: harness/atelier-autopoiesis/MISSION.md),
 *     empty findings list (default) or caller-supplied findings;
 *   - creates the parent directory if missing.
 *
 * Tests that need an "open P0 finding" can pass
 * `findings: [{ severity: 'P0', status: 'open', ... }]` to
 * drive the gate's `findings.ndjson` walk into the failure
 * branch.
 */
export async function seedEvaluatorStateForTest(opts: {
  findings?: AutopoiesisFinding[]
  last_evaluated_at?: string
  last_goal_ref?: string
  total_findings_count?: number
  new_findings_count?: number
  commands_run?: string[]
}): Promise<void> {
  const state: EvaluatorState = {
    schema: 'atelier.evaluator-state/v1',
    last_evaluated_at: opts.last_evaluated_at ?? new Date().toISOString(),
    last_goal_ref: opts.last_goal_ref ?? 'harness/atelier-autopoiesis/MISSION.md',
    new_findings_count: opts.new_findings_count ?? 0,
    total_findings_count: opts.total_findings_count ?? 0,
    commands_run: opts.commands_run ?? ['seedEvaluatorStateForTest'],
  }
  await writeEvaluatorState(state)
  if (opts.findings && opts.findings.length > 0) {
    for (const f of opts.findings) {
      await appendNdjsonAutopoiesis<AutopoiesisFinding>(AUTOPOIESIS_PATHS.findings, f)
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                runEvaluate                                  */
/* -------------------------------------------------------------------------- */

/**
 * Run the autopoiesis evaluator. The function is idempotent: a
 * second invocation in the same state does not duplicate
 * findings (the appender checks `finding_id`).
 */
export async function runEvaluate(opts: RunEvaluateOptions): Promise<EvaluateResult> {
  const evaluatedAt = new Date().toISOString()
  const commandsRun: string[] = [
    'validateAutopoiesis',
    'resolveAll',
    'reconcileFindings',
    'appendNdjsonAutopoiesis(findings.ndjson)',
  ]

  // 1. Validate → defects → findings.
  const validation = await validateAutopoiesis()
  const findings: AutopoiesisFinding[] = []
  for (const d of validation.issues) {
    findings.push(defectToFinding(d, evaluatedAt))
  }

  // 2. Resolve → conflict / disagreement findings.
  const conflictSynthetics: Array<{
    conflict_kind: string
    class?: string
    scope?: string
    id?: string
  }> = []
  try {
    const resolution = await resolveAll('.')
    for (const r of resolution.resolutions) {
      for (const conflict of r.conflicts ?? []) {
        const reason =
          `AuthorityResolver detected a ${conflict.conflict_kind} conflict ` +
          `on class='${r.class}' scope='${r.scope}' (conflict_id='${conflict.id}').`
        findings.push({
          schema: 'atelier.autopoiesis-finding/v1',
          finding_id: deterministicFindingId('C3', 'E_AUTHORITY_CONFLICT_NEW', reason),
          severity: 'P0',
          capability_id: 'C3',
          code: 'E_AUTHORITY_CONFLICT_NEW',
          reason,
          required_repair: 'Resolve or waive the conflict; re-run the evaluator.',
          status: 'open',
          proof_required: ['evaluator:next_run:no_new_conflict'],
          created_at: evaluatedAt,
          affected_record: `conflict:${conflict.id ?? `${r.class}:${r.scope}`}`,
        })
        conflictSynthetics.push({
          conflict_kind: conflict.conflict_kind,
          class: r.class,
          scope: r.scope,
          id: conflict.id,
        })
      }
      for (const rule of r.chain ?? []) {
        const ann = rule as unknown as { disagrees_with_default?: boolean; applies_to_class?: string }
        if (ann.disagrees_with_default && ann.applies_to_class === r.class) {
          const reason2 =
            `On-disk AuthorityRule '${rule.id}' precedence=${rule.precedence} ` +
            `disagrees with DEFAULT_PRECEDENCE['${r.class}'] on scope='${r.scope}'.`
          findings.push({
            schema: 'atelier.autopoiesis-finding/v1',
            finding_id: deterministicFindingId('C3', 'E_AUTHORITY_DEFAULT_DISAGREES', reason2),
            severity: 'P1',
            capability_id: 'C3',
            code: 'E_AUTHORITY_DEFAULT_DISAGREES',
            reason: reason2,
            required_repair: 'Align the on-disk rule with the canonical DEFAULT_PRECEDENCE table.',
            status: 'open',
            proof_required: ['evaluator:next_run:no_disagreement'],
            created_at: evaluatedAt,
          })
        }
      }
    }
  } catch (err) {
    // The resolver failure itself is a finding (C3), not a
    // crash. The evaluator must keep running so the work-order
    // compiler can route a fix to C3.
    findings.push({
      schema: 'atelier.autopoiesis-finding/v1',
      finding_id: deterministicFindingId('C3', 'E_AUTHORITY_RESOLVE_FAILED', (err as Error).message),
      severity: 'P0',
      capability_id: 'C3',
      code: 'E_AUTHORITY_RESOLVE_FAILED',
      reason: `AuthorityResolver crashed: ${(err as Error).message}`,
      required_repair: 'Fix the resolver; re-run the evaluator.',
      status: 'open',
      proof_required: ['evaluator:next_run:resolver_returns'],
      created_at: evaluatedAt,
    })
  }

  // 3. Reconcile existing findings against the current defect
  //    set. This is the C8 self-healing step: a finding whose
  //    defect is no longer detected is transitioned to
  //    status='verified' (append-only audit trail). The result
  //    is included in the envelope so the work-order compiler
  //    can see what changed.
  const { closed, reOpened } = await reconcileFindings(validation.issues, conflictSynthetics)

  // 4. Filter the new findings: emit only those (a) whose
  //    defect_key is still in the current defect set, and (b)
  //    whose finding_id is not already on disk. This prevents
  //    a reconciled-then-reintroduced defect from re-emitting
  //    an old finding (it gets a fresh id from the validator
  //    payload when the defect is re-detected).
  const currentDefectKeys = new Set<DefectKey>()
  for (const d of validation.issues) {
    currentDefectKeys.add(defectKey(d.code, d.affected_record))
  }
  for (const c of conflictSynthetics) {
    currentDefectKeys.add(
      defectKey('E_AUTHORITY_CONFLICT_NEW', `conflict:${c.id ?? `${c.class}:${c.scope}`}`),
    )
  }
  const filtered = findings.filter((f) => currentDefectKeys.has(defectKey(f.code, f.affected_record)))

  // 5. Persist findings (idempotent on finding_id). Also
  //    applies the capability filter if requested.
  const persisted = opts.capabilityFilter
    ? filtered.filter((f) => f.capability_id === opts.capabilityFilter)
    : filtered
  const existingIds = await readExistingFindingIds()
  let persistedNew = 0
  for (const f of persisted) {
    if (existingIds.has(f.finding_id)) continue
    await appendNdjsonAutopoiesis<AutopoiesisFinding>(AUTOPOIESIS_PATHS.findings, f)
    existingIds.add(f.finding_id)
    persistedNew += 1
  }

  // 6. Compute the final stats from disk (so the count is
  //    stable across re-runs). The latest record for each
  //    defect_key is authoritative; the helper collapses the
  //    historical lines into the "current" view of each finding.
  const { records: allFindings } = await readNdjsonAutopoiesisTolerant<AutopoiesisFinding>(
    AUTOPOIESIS_PATHS.findings,
  )
  const latestByKey = new Map<DefectKey, AutopoiesisFinding>()
  for (const f of allFindings) {
    if (typeof f.code !== 'string') continue
    const key = defectKey(f.code, f.affected_record)
    latestByKey.set(key, f)
  }
  const latestList = [...latestByKey.values()]
  const openP0 = latestList.filter((f) => f.status === 'open' && f.severity === 'P0').length
  const openP1 = latestList.filter((f) => f.status === 'open' && f.severity === 'P1').length
  const allMaterializationProposals = validation.stats.materialization_proposals
  const allControlPackets = validation.stats.control_packets

  // 7. Persist evaluator state.
  const state: EvaluatorState = {
    schema: 'atelier.evaluator-state/v1',
    last_evaluated_at: evaluatedAt,
    last_goal_ref: opts.goalRef,
    new_findings_count: persistedNew,
    total_findings_count: latestList.length,
    commands_run: commandsRun,
  }
  await writeEvaluatorState(state)

  // 8. Build the result envelope. The `findings` field carries
  //    ONLY the still-open findings (the current defect set);
  //    reconciliation telemetry is available via the closed /
  //    reOpened arrays on the result envelope so the work-order
  //    compiler and the evaluator-result.json can be inspected
  //    by humans and tests.
  const result: EvaluateResult & {
    reconciliation?: { closed: number; reOpened: number }
  } = {
    schema: 'atelier.evaluate-result/v1',
    evaluated_at: evaluatedAt,
    goal_ref: opts.goalRef,
    status: openP0 + openP1 === 0 ? 'pass' : 'fail',
    stats: {
      semantic_nodes: validation.stats.semantic_nodes,
      authority_rules: validation.stats.authority_rules,
      control_packets: allControlPackets,
      materialization_proposals: allMaterializationProposals,
      findings: latestList.length,
      open_p0: openP0,
      open_p1: openP1,
    },
    findings: filtered,
    commands_run: commandsRun,
    reconciliation: { closed: closed.length, reOpened: reOpened.length },
  }
  return result
}

/**
 * Read the latest evaluator state. Used by the `closeTask` gate
 * to decide whether the most recent `runEvaluate` is fresh
 * enough to clear a task's `E_CLOSE_FINDINGS_OPEN` check.
 */
export async function readLatestEvaluatorState(): Promise<EvaluatorState | undefined> {
  return readEvaluatorState()
}
