/**
 * Atelier Autopoiesis — runtime query surface.
 *
 * The query runtime is the user-facing entry point for the
 * autopoiesis control plane. The CLI exposes 9 query kinds:
 *
 *   active-requirements    requirement records that are
 *                          accepted/verified AND whose source
 *                          anchors are all fresh
 *   accepted-decisions     decision records that are
 *                          accepted/verified
 *   required-checks        check_result records that are
 *                          passed AND backed by an evidence_proof
 *                          (command + raw_output_ref)
 *   permissions            permission_rule records that are
 *                          accepted/verified
 *   open-findings          review_finding records that are
 *                          proposed/accepted AND status='open'
 *   stale                  records whose source_anchor is not
 *                          fresh OR whose lifecycle is in
 *                          {superseded, invalidated, archived,
 *                          quarantined}
 *   conflicts              every ConflictRecord in the conflict
 *                          ledger
 *   evidence               check_result records
 *                          (MaterializationProposal.diff_refs and
 *                          EvidenceRecord.evidence_id are reserved
 *                          for v1)
 *   recommend              the next blocking task
 *                          (ImplementationTask with
 *                          status='blocked' or 'ready', sorted
 *                          by blocker count) plus its required
 *                          checks and active conflicts
 *
 * Every query excludes records with `lifecycle_state` in
 * {proposed, observed, inferred} by default. The
 * `--include-non-accepted` flag relaxes that filter for
 * debugging.
 */
import path from 'node:path'
import { atelierV0Root } from '../../../lib/src/paths.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { readNdjsonAutopoiesis } from './store.ts'
import { AUTOPOIESIS_PATHS } from './paths.ts'
import { withStalenessFilter, scopeCovers, scopeFromQueryString, pathOfScope } from './authority.ts'
import type {
  AuthorityScope,
  ConflictRecord,
  LifecycleState,
  SemanticNode,
  SourceAnchorRef,
} from './records.ts'

/* -------------------------------------------------------------------------- */
/*                              Query kinds                                   */
/* -------------------------------------------------------------------------- */

export const QUERY_KINDS = [
  'active-requirements',
  'accepted-decisions',
  'required-checks',
  'permissions',
  'open-findings',
  'stale',
  'conflicts',
  'evidence',
  'recommend',
] as const

export type QueryKind = (typeof QUERY_KINDS)[number]

export function isQueryKind(value: unknown): value is QueryKind {
  return typeof value === 'string' && (QUERY_KINDS as ReadonlyArray<string>).includes(value)
}

export type QueryOptions = {
  task?: string
  scope?: string
  include_non_accepted?: boolean
  /**
   * WO2.1-RT-3 — when `true`, the `conflicts` query includes
   * ConflictRecord records whose `conflict_policy === 'ignore'`.
   * The default is `false` so the query agrees with the
   * resolver's conflict_policy filter: `ignore` records are
   * suppressed from both views. The CLI exposes this as the
   * `--include-ignored` flag for diagnostic use only.
   */
  include_ignored?: boolean
}

/* -------------------------------------------------------------------------- */
/*                              Index loaders                                 */
/* -------------------------------------------------------------------------- */

async function loadSemanticNodes(): Promise<SemanticNode[]> {
  return readNdjsonAutopoiesis<SemanticNode>(AUTOPOIESIS_PATHS.semanticNodes)
}

async function loadConflicts(): Promise<ConflictRecord[]> {
  return readNdjsonAutopoiesis<ConflictRecord>(AUTOPOIESIS_PATHS.conflictRecords)
}

type AnchorRow = { id: string; status: string }

async function loadSourceAnchors(): Promise<Map<string, AnchorRow>> {
  const file = path.join(atelierV0Root(), 'anchors', 'source-anchors.ndjson')
  const rows = await readNdjson<AnchorRow>(file).catch(() => [] as AnchorRow[])
  const map = new Map<string, AnchorRow>()
  for (const r of rows) {
    if (typeof r.id === 'string') map.set(r.id, r)
  }
  return map
}

type ImplementationTaskRow = {
  id: string
  task_id?: string
  status?: string
  allowed_files?: string[]
  forbidden_files?: string[]
  blocker_ids?: string[]
  title?: string
  goal?: string
  required_knowledge_object_ids?: string[]
  source_object_ids?: string[]
  source_anchor_ids?: string[]
  source_relation_ids?: string[]
  source_refs?: Array<{ path?: string }>
  acceptance_criteria?: string[]
  risk_notes?: string[]
  tags?: string[]
  fixture?: boolean
  [key: string]: unknown
}

async function loadImplementationTasks(): Promise<ImplementationTaskRow[]> {
  const file = path.join(
    atelierV0Root(),
    'transforms',
    'md-to-code',
    'model',
    'implementation-tasks.ndjson',
  )
  return readNdjson<ImplementationTaskRow>(file).catch(() => [] as ImplementationTaskRow[])
}

/* -------------------------------------------------------------------------- */
/*                              Helpers                                       */
/* -------------------------------------------------------------------------- */

const ACCEPTED_STATES: ReadonlySet<LifecycleState> = new Set<LifecycleState>(['accepted', 'verified'])
const STALE_LIFECYCLE_STATES: ReadonlySet<LifecycleState> = new Set<LifecycleState>([
  'superseded',
  'invalidated',
  'archived',
  'quarantined',
])
const NON_ACCEPTED_STATES: ReadonlySet<LifecycleState> = new Set<LifecycleState>([
  'proposed',
  'observed',
  'inferred',
])

function anchorPath(node: SemanticNode): string | undefined {
  const a = node.source_anchors?.[0]
  return a?.path
}

function nodeMatchesQueryScope(node: SemanticNode, queryScope: string | undefined): boolean {
  if (!queryScope || queryScope === '.' || queryScope === '') return true
  return scopeCovers(node.authority_scope, queryScope)
}

function nodeAnchorPathMatchesQueryScope(
  node: SemanticNode,
  queryScope: string | undefined,
): boolean {
  if (!queryScope || queryScope === '.' || queryScope === '') return true
  const ap = anchorPath(node)
  if (!ap) return false
  if (ap === queryScope) return true
  if (ap.startsWith(queryScope + '/')) return true
  if (queryScope.startsWith(ap + '/')) return true
  return false
}

function taskScopeMatches(task: ImplementationTaskRow, queryScope: string | undefined): boolean {
  if (!queryScope || queryScope === '.' || queryScope === '') return true
  const allowed = task.allowed_files ?? []
  for (const f of allowed) {
    if (f === queryScope) return true
    if (f.startsWith(queryScope + '/')) return true
    if (queryScope.startsWith(f + '/')) return true
  }
  return false
}

/* -------------------------------------------------------------------------- */
/*                          Individual query kinds                            */
/* -------------------------------------------------------------------------- */

function filterByLifecycle(
  node: SemanticNode,
  opts: { include_non_accepted: boolean },
): boolean {
  if (opts.include_non_accepted) return true
  return !NON_ACCEPTED_STATES.has(node.lifecycle_state)
}

async function activeRequirements(
  opts: QueryOptions & { include_non_accepted: boolean; anchors: Map<string, AnchorRow> },
): Promise<SemanticNode[]> {
  const nodes = await loadSemanticNodes()
  const out: SemanticNode[] = []
  for (const n of nodes) {
    if (n.kind !== 'requirement') continue
    if (!filterByLifecycle(n, opts)) continue
    if (!ACCEPTED_STATES.has(n.lifecycle_state) && !opts.include_non_accepted) continue
    if (withStalenessFilter(n, opts.anchors) !== 'fresh') continue
    if (opts.scope && !nodeAnchorPathMatchesQueryScope(n, opts.scope)) continue
    if (opts.task) {
      // Coarse filter: a task only matches when the node's first
      // anchor is under the task's allowed_files. We do not have
      // a strict task→node join in v0; the caller passes --task
      // and gets the nodes whose source_anchor is in the task's
      // allowed_files.
      if (!nodeAnchorPathMatchesQueryScope(n, opts.task)) continue
    }
    out.push(n)
  }
  return out
}

async function acceptedDecisions(
  opts: QueryOptions & { include_non_accepted: boolean },
): Promise<SemanticNode[]> {
  const nodes = await loadSemanticNodes()
  const out: SemanticNode[] = []
  for (const n of nodes) {
    if (n.kind !== 'decision') continue
    if (!filterByLifecycle(n, opts)) continue
    if (!ACCEPTED_STATES.has(n.lifecycle_state) && !opts.include_non_accepted) continue
    if (opts.scope && !nodeAnchorPathMatchesQueryScope(n, opts.scope)) continue
    out.push(n)
  }
  return out
}

async function requiredChecks(opts: QueryOptions & { include_non_accepted: boolean }): Promise<SemanticNode[]> {
  const nodes = await loadSemanticNodes()
  const out: SemanticNode[] = []
  for (const n of nodes) {
    if (n.kind !== 'check_result') continue
    if (!filterByLifecycle(n, opts)) continue
    if (!ACCEPTED_STATES.has(n.lifecycle_state) && !opts.include_non_accepted) continue
    // status='passed'
    const status = n['status']
    if (status !== 'passed' && !opts.include_non_accepted) continue
    // evidence_proof with command + raw_output_ref
    const proof = n['evidence_proof']
    if (
      !opts.include_non_accepted &&
      (!proof ||
        typeof proof !== 'object' ||
        typeof (proof as Record<string, unknown>)['command'] !== 'string' ||
        typeof (proof as Record<string, unknown>)['raw_output_ref'] !== 'string')
    ) {
      continue
    }
    if (opts.scope && !nodeAnchorPathMatchesQueryScope(n, opts.scope)) continue
    out.push(n)
  }
  return out
}

async function permissions(
  opts: QueryOptions & { include_non_accepted: boolean },
): Promise<SemanticNode[]> {
  const nodes = await loadSemanticNodes()
  const out: SemanticNode[] = []
  for (const n of nodes) {
    if (n.kind !== 'permission_rule') continue
    if (!filterByLifecycle(n, opts)) continue
    if (!ACCEPTED_STATES.has(n.lifecycle_state) && !opts.include_non_accepted) continue
    if (opts.scope && !nodeAnchorPathMatchesQueryScope(n, opts.scope)) continue
    out.push(n)
  }
  return out
}

async function openFindings(
  opts: QueryOptions & { include_non_accepted: boolean },
): Promise<SemanticNode[]> {
  const nodes = await loadSemanticNodes()
  const out: SemanticNode[] = []
  for (const n of nodes) {
    if (n.kind !== 'review_finding') continue
    // open-findings explicitly allows proposed AND accepted review
    // findings (per the work order); do NOT apply the global
    // non-accepted lifecycle filter here.
    if (n.lifecycle_state !== 'proposed' && n.lifecycle_state !== 'accepted') continue
    const status = n['status']
    if (status !== 'open' && !opts.include_non_accepted) continue
    if (opts.scope && !nodeAnchorPathMatchesQueryScope(n, opts.scope)) continue
    out.push(n)
  }
  return out
}

async function stale(
  opts: QueryOptions & { include_non_accepted: boolean; anchors: Map<string, AnchorRow> },
): Promise<SemanticNode[]> {
  const nodes = await loadSemanticNodes()
  const out: SemanticNode[] = []
  for (const n of nodes) {
    if (!filterByLifecycle(n, opts)) continue
    const status = withStalenessFilter(n, opts.anchors)
    const isStaleLifecycle = STALE_LIFECYCLE_STATES.has(n.lifecycle_state)
    if (status === 'stale' || isStaleLifecycle) {
      if (opts.scope && !nodeAnchorPathMatchesQueryScope(n, opts.scope)) continue
      out.push(n)
    }
  }
  return out
}

async function evidence(
  opts: QueryOptions & { include_non_accepted: boolean },
): Promise<SemanticNode[]> {
  const nodes = await loadSemanticNodes()
  const out: SemanticNode[] = []
  for (const n of nodes) {
    if (n.kind !== 'check_result') continue
    // evidence in v0 includes every check_result regardless of
    // lifecycle state (per the work order); do NOT apply the
    // global non-accepted filter here.
    if (opts.scope && !nodeAnchorPathMatchesQueryScope(n, opts.scope)) continue
    out.push(n)
  }
  return out
}

async function recommend(
  opts: QueryOptions & { include_non_accepted: boolean; anchors: Map<string, AnchorRow> },
): Promise<{
  task: ImplementationTaskRow | null
  required_checks: SemanticNode[]
  conflicts: ConflictRecord[]
  candidates: ImplementationTaskRow[]
}> {
  const tasks = await loadImplementationTasks()
  const nodes = await loadSemanticNodes()
  const conflicts = await loadConflicts()

  // Sort blocked/ready tasks by blocker count (descending).
  const eligible = tasks
    .filter((t) => t.status === 'blocked' || t.status === 'ready')
    .filter((t) => !opts.task || t.id === opts.task || t.task_id === opts.task)
    .filter((t) => taskScopeMatches(t, opts.scope))
    .sort((a, b) => (b.blocker_ids?.length ?? 0) - (a.blocker_ids?.length ?? 0))

  const top = eligible[0] ?? null
  if (!top) {
    return { task: null, required_checks: [], conflicts: [], candidates: eligible }
  }

  // Required checks for the task: every accepted/verified
  // check_result whose source_anchor is under the task's
  // allowed_files.
  const allowed = top.allowed_files ?? []
  const requiredChecks: SemanticNode[] = []
  for (const n of nodes) {
    if (n.kind !== 'check_result') continue
    if (!ACCEPTED_STATES.has(n.lifecycle_state)) continue
    const ap = anchorPath(n)
    if (!ap) continue
    const underTask = allowed.some(
      (f) => ap === f || ap.startsWith(f + '/') || f.startsWith(ap + '/'),
    )
    if (!underTask) continue
    requiredChecks.push(n)
  }

  // Active conflicts that reference the task by id.
  const activeConflicts = conflicts.filter((c) => {
    const ids = (c.claimants ?? []).map((cl) => cl.record_id)
    return ids.includes(top.id) || ids.includes(top.task_id ?? '')
  })

  return { task: top, required_checks: requiredChecks, conflicts: activeConflicts, candidates: eligible }
}

/* -------------------------------------------------------------------------- */
/*                              query()                                       */
/* -------------------------------------------------------------------------- */

export type QueryResult =
  | {
      schema: 'atelier.query-result/v1'
      kind: 'recommend'
      task?: string
      scope?: string
      include_non_accepted: boolean
      records: SemanticNode[]
      task_payload: ImplementationTaskRow | null
      required_checks: SemanticNode[]
      conflicts: ConflictRecord[]
      candidates: ImplementationTaskRow[]
      authority_chain: string[]
      warnings: string[]
      generated_at: string
    }
  | {
      schema: 'atelier.query-result/v1'
      kind: 'conflicts'
      task?: string
      scope?: string
      include_non_accepted: boolean
      /** WO2.1-RT-3 — when `true`, the result set includes
       *  ConflictRecord records whose `conflict_policy === 'ignore'`. */
      include_ignored: boolean
      records: ConflictRecord[]
      authority_chain: string[]
      warnings: string[]
      generated_at: string
    }
  | {
      schema: 'atelier.query-result/v1'
      kind: Exclude<QueryKind, 'recommend' | 'conflicts'>
      task?: string
      scope?: string
      include_non_accepted: boolean
      records: SemanticNode[]
      authority_chain: string[]
      warnings: string[]
      generated_at: string
    }

/**
 * Run a query against the autopoiesis control plane.
 *
 * Returns a `QueryResult` whose shape is `atelier.query-result/v1`.
 * The `records` field is the principal payload. For the
 * `recommend` kind, the result also carries `task_payload`,
 * `required_checks`, `conflicts`, and `candidates`. For the
 * `conflicts` kind, the `records` field is `ConflictRecord[]`
 * (not `SemanticNode[]`).
 */
export async function query(
  kind: QueryKind,
  opts: QueryOptions = {},
): Promise<QueryResult> {
  const include_non_accepted = opts.include_non_accepted === true
  const anchors = await loadSourceAnchors()
  const baseOpts = { ...opts, include_non_accepted, anchors }
  const generated_at = new Date().toISOString()

  if (kind === 'recommend') {
    const r = await recommend(baseOpts)
    return {
      schema: 'atelier.query-result/v1',
      kind,
      task: opts.task,
      scope: opts.scope,
      include_non_accepted,
      records: r.required_checks,
      task_payload: r.task,
      required_checks: r.required_checks,
      conflicts: r.conflicts,
      candidates: r.candidates,
      authority_chain: [],
      warnings: [],
      generated_at,
    }
  }

  if (kind === 'conflicts') {
    const conflicts = await loadConflicts()
    const includeIgnored = opts.include_ignored === true
    // WO2.1-RT-3 — apply the same `conflict_policy: 'ignore'`
    // filter the resolver uses. By default the query excludes
    // `ignore` records so its output stays in sync with the
    // resolver's `conflicts[]` payload. The diagnostic
    // `--include-ignored` flag (passed as `include_ignored: true`)
    // re-includes them for audit and reconciliation work.
    const filtered = conflicts
      .filter((c) => includeIgnored || c.conflict_policy !== 'ignore')
      .filter((c) => {
        if (!opts.scope) return true
        if (!c.scope) return true
        return scopeCovers(c.scope, opts.scope as string)
      })
    const warnings: string[] = []
    if (includeIgnored) {
      const suppressed = conflicts.filter((c) => c.conflict_policy === 'ignore')
      if (suppressed.length > 0) {
        warnings.push(
          `query --kind conflicts --include-ignored: ${suppressed.length} record(s) with conflict_policy='ignore' are surfaced for diagnostic use; the resolver would still suppress them.`,
        )
      }
    }
    return {
      schema: 'atelier.query-result/v1',
      kind,
      task: opts.task,
      scope: opts.scope,
      include_non_accepted,
      include_ignored: includeIgnored,
      records: filtered,
      authority_chain: [],
      warnings,
      generated_at,
    }
  }

  let records: SemanticNode[] = []
  switch (kind) {
    case 'active-requirements':
      records = await activeRequirements(baseOpts)
      break
    case 'accepted-decisions':
      records = await acceptedDecisions(baseOpts)
      break
    case 'required-checks':
      records = await requiredChecks(baseOpts)
      break
    case 'permissions':
      records = await permissions(baseOpts)
      break
    case 'open-findings':
      records = await openFindings(baseOpts)
      break
    case 'stale':
      records = await stale(baseOpts)
      break
    case 'evidence':
      records = await evidence(baseOpts)
      break
    default:
      // Should be unreachable: the kind is checked by the CLI.
      records = []
  }

  // `--task` coarse filter: in v0, the implementation-tasks file
  // is the source of truth for task→allowed_files. The filter
  // excludes records whose anchor is not under the task's
  // allowed_files. We do not have a strict join; we accept the
  // coarse filter as documented.
  if (opts.task) {
    const tasks = await loadImplementationTasks()
    const task = tasks.find((t) => t.id === opts.task || t.task_id === opts.task)
    if (task) {
      const allowed = new Set(task.allowed_files ?? [])
      records = records.filter((n) => {
        const ap = anchorPath(n)
        if (!ap) return true
        for (const f of allowed) {
          if (ap === f || ap.startsWith(f + '/') || f.startsWith(ap + '/')) return true
        }
        return false
      })
    }
  }

  return {
    schema: 'atelier.query-result/v1',
    kind,
    task: opts.task,
    scope: opts.scope,
    include_non_accepted,
    records,
    authority_chain: [],
    warnings: [],
    generated_at,
  }
}

// Re-export scope helpers for tests and the CLI.
export { scopeFromQueryString, pathOfScope, scopeCovers, withStalenessFilter }
export type { AuthorityScope, ConflictRecord, LifecycleState, SemanticNode, SourceAnchorRef }
