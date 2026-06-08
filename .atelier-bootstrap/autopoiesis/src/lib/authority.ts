/**
 * Atelier Autopoiesis — authority resolver.
 *
 * The resolver is the runtime function that, given a `(class, scope)`
 * pair, decides which `SemanticNode` record wins authority for that
 * scope. It is the single source of truth for "what is true right now
 * for this scope?" in the autopoiesis control plane.
 *
 * The resolver is policy-only — it does NOT mutate the source
 * `SemanticNode` index. It MAY append a new `ConflictRecord` to
 * `.atelier/v0/autopoiesis/conflicts.ndjson` when two candidates
 * overlap in `authority_scope` and have non-equal claims. The
 * ConflictRecord is durable; subsequent resolver calls observe it
 * and re-emit the same `conflicts[]` payload.
 *
 * Authority precedence (the 11-class table) is the single source of
 * truth. The defaults are:
 *
 *   product_spec            100
 *   adr                      90
 *   runtime_evidence         80
 *   test_contract            70
 *   current_implementation   60
 *   review_finding           50
 *   permission_rule          40
 *   risk_policy              30
 *   handoff                  20
 *   llm_proposal             10
 *   generated_view            0  (NEVER wins)
 *
 * The precedence table is written on first run to
 * `.atelier/v0/autopoiesis/authority-rules.ndjson` by `seedDefaults()`.
 * Re-running `seedDefaults()` is a no-op when the file already
 * contains the canonical 11 default rules.
 */
import { createHash } from 'node:crypto'
import path from 'node:path'
import { atelierV0Root } from '../../../lib/src/paths.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from './store.ts'
import { AUTOPOIESIS_PATHS } from './paths.ts'
import type {
  AuthorityRule,
  AuthorityScope,
  ConflictRecord,
  LifecycleState,
  SemanticNode,
  SourceAnchorRef,
} from './records.ts'

/* -------------------------------------------------------------------------- */
/*                            Authority classes                               */
/* -------------------------------------------------------------------------- */

/**
 * The canonical 11 authority classes. The names are stable; the
 * precedence table maps each class to an integer. Producers MAY add
 * custom classes via additional `AuthorityRule` records, but the 11
 * defaults are seeded on first run and may not be deleted.
 */
export type AuthorityClass =
  | 'product_spec'
  | 'adr'
  | 'runtime_evidence'
  | 'test_contract'
  | 'current_implementation'
  | 'review_finding'
  | 'permission_rule'
  | 'risk_policy'
  | 'handoff'
  | 'llm_proposal'
  | 'generated_view'

export const AUTHORITY_CLASSES: ReadonlyArray<AuthorityClass> = [
  'product_spec',
  'adr',
  'runtime_evidence',
  'test_contract',
  'current_implementation',
  'review_finding',
  'permission_rule',
  'risk_policy',
  'handoff',
  'llm_proposal',
  'generated_view',
] as const

/**
 * The 11-class precedence table. Higher = stronger.
 *
 * `generated_view` is pinned at 0 so that the resolver can never
 * promote a generated view over an authoritative record. The
 * resolver's `resolveAuthority()` actively filters out
 * `generated_view` candidates from the winner set; the precedence is
 * a defense-in-depth value that the validator uses for
 * cross-consistency checks.
 */
export const DEFAULT_PRECEDENCE: ReadonlyMap<AuthorityClass, number> = new Map<
  AuthorityClass,
  number
>([
  ['product_spec', 100],
  ['adr', 90],
  ['runtime_evidence', 80],
  ['test_contract', 70],
  ['current_implementation', 60],
  ['review_finding', 50],
  ['permission_rule', 40],
  ['risk_policy', 30],
  ['handoff', 20],
  ['llm_proposal', 10],
  ['generated_view', 0],
])

/* -------------------------------------------------------------------------- */
/*                              Result types                                  */
/* -------------------------------------------------------------------------- */

export type ResolutionCandidate = {
  id: string
  authority_class: AuthorityClass | 'unknown'
  precedence: number
  /** Set to true when this candidate's effective class precedence
   *  disagrees with the canonical DEFAULT_PRECEDENCE. The flag is
   *  surfaced in the chain payload and in the CLI's warnings
   *  array so operators can detect a user-edited rule. */
  disagrees_with_default?: boolean
  reason?: 'stale_anchor' | 'generated_view'
  lifecycle_state?: LifecycleState
}

export type ResolvedAuthority = {
  class: AuthorityClass
  scope: string
  winner_id: string | null
  winner_precedence: number | null
  candidate_ids: string[]
  candidates: ResolutionCandidate[]
  conflicts: ConflictRecord[]
  chain: AuthorityRule[]
}

export type ResolverOptions = {
  /**
   * When `true`, write new `ConflictRecord` nodes for any (class,
   * scope) where two non-stale candidates disagree. The default is
   * `true`. The CLI passes `false` for `--read-only` queries that
   * must not touch disk.
   */
  persist_conflicts?: boolean
  /**
   * Pre-loaded semantic-nodes. When omitted, the resolver reads
   * the index from disk. Tests use this to inject fixture nodes.
   */
  semanticNodes?: SemanticNode[]
  /**
   * Pre-loaded source anchors. Same pattern as `semanticNodes`.
   */
  sourceAnchors?: ReadonlyMap<string, { id: string; status: string }>
}

/* -------------------------------------------------------------------------- */
/*                          Source-anchor lookup                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                          Defaults: seed on first run                       */
/* -------------------------------------------------------------------------- */

/**
 * Map a `SemanticNode.kind` to its canonical authority class.
 *
 * The mapping is a closed switch: every `SemanticNodeKind` resolves
 * to exactly one authority class. New kinds MUST be added here AND
 * to `AUTHORITY_CLASSES` (or remapped to an existing class) before
 * any `SemanticNode` of that kind can win authority.
 */
function kindToAuthorityClass(kind: SemanticNode['kind']): AuthorityClass | 'unknown' {
  switch (kind) {
    case 'requirement':
      return 'product_spec'
    case 'decision':
      return 'adr'
    case 'invariant':
      return 'risk_policy'
    case 'test_contract':
      return 'test_contract'
    case 'review_finding':
      return 'review_finding'
    case 'handoff':
      return 'handoff'
    case 'implementation_task':
      return 'current_implementation'
    case 'permission_rule':
      return 'permission_rule'
    case 'check_result':
      return 'runtime_evidence'
    case 'materialization_proposal':
      return 'llm_proposal'
    case 'conflict':
      return 'review_finding'
    case 'staleness_record':
      return 'runtime_evidence'
    case 'source_unit':
      return 'current_implementation'
    case 'source_anchor':
      return 'current_implementation'
    default:
      return 'unknown'
  }
}

/**
 * Seed the 11 default `AuthorityRule` records on first run. The
 * function is idempotent: when the file already contains a rule
 * with the same `id`, the rule is skipped. The function returns the
 * total number of rules appended (0 on a no-op).
 *
 * The default rules are written with:
 *   - id:    `rule:<class>` (deterministic)
 *   - applies_to: [class]
 *   - precedence: from `DEFAULT_PRECEDENCE`
 *   - scope: { kind: 'global' }
 *   - conflict_policy: 'expose' (always surface conflicts; the
 *     resolver does not silently pick winners)
 */
export async function seedDefaults(): Promise<{ appended: number; total: number }> {
  const existing = await readNdjsonAutopoiesis<AuthorityRule>(AUTOPOIESIS_PATHS.authorityRules)
  const existingIds = new Set(existing.map((r) => r.id))
  let appended = 0
  const createdAt = new Date().toISOString()
  for (const cls of AUTHORITY_CLASSES) {
    const id = `rule:${cls}`
    if (existingIds.has(id)) continue
    const rule: AuthorityRule = {
      schema: 'atelier.authority-rule/v1',
      id,
      applies_to: [cls],
      precedence: DEFAULT_PRECEDENCE.get(cls) ?? 0,
      scope: { kind: 'global' },
      conflict_policy: 'expose',
      created_at: createdAt,
    }
    await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.authorityRules, rule)
    appended += 1
  }
  const final = await readNdjsonAutopoiesis<AuthorityRule>(AUTOPOIESIS_PATHS.authorityRules)
  return { appended, total: final.length }
}

/* -------------------------------------------------------------------------- */
/*                              Scope matching                                */
/* -------------------------------------------------------------------------- */

function stripGlobSuffix(pattern: string): string {
  if (pattern.endsWith('/**')) return pattern.slice(0, -3)
  if (pattern.endsWith('/*')) return pattern.slice(0, -2)
  return pattern
}

/**
 * Decide whether a `SemanticNode.authority_scope` covers the
 * given query scope. A `global` scope covers anything. A `path`
 * scope covers the scope when the query scope is a child of the
 * pattern (after stripping `/**`). A `kind` scope covers the
 * query when the `node_kind` matches. A `task` scope covers the
 * query when the `task_id` matches.
 */
export function scopeCovers(authority: AuthorityScope, query: string): boolean {
  if (authority.kind === 'global') return true
  if (authority.kind === 'path' && authority.pattern) {
    const stripped = stripGlobSuffix(authority.pattern)
    if (query === stripped) return true
    if (query.startsWith(stripped + '/')) return true
    return false
  }
  if (authority.kind === 'task' && authority.task_id) {
    return query === authority.task_id
  }
  if (authority.kind === 'kind' && authority.node_kind) {
    return query === authority.node_kind
  }
  return false
}

/* -------------------------------------------------------------------------- */
/*                          Source-anchor freshness                           */
/* -------------------------------------------------------------------------- */

const STALE_STATUSES: ReadonlySet<string> = new Set<string>([
  'stale',
  'invalid',
  'archived',
  'quarantined',
])

/**
 * Return the effective status of a `SemanticNode` based on its
 * `source_anchors`. The status is the most-pessimistic of the
 * statuses reported by the live relation-kernel anchor index:
 *
 *   - any anchor with status ∈ {stale, invalid, archived, quarantined} → 'stale'
 *   - all anchors with status 'fresh' (or unknown)                 → 'fresh'
 *
 * The SemanticNode's local `source_anchors[i].status` field is
 * treated as a STALE-BY-DEFAULT hint: when the relation-kernel
 * anchor is not present in the index, the local status is used.
 */
export function withStalenessFilter(
  node: SemanticNode,
  anchorIndex: ReadonlyMap<string, { id: string; status: string }>,
): 'fresh' | 'stale' {
  const anchors = node.source_anchors ?? []
  if (anchors.length === 0) return 'stale'
  for (const a of anchors) {
    if (typeof a.anchor_id !== 'string') return 'stale'
    const live = anchorIndex.get(a.anchor_id)
    const status = (live?.status ?? a.status ?? 'fresh') as string
    if (STALE_STATUSES.has(status)) return 'stale'
  }
  return 'fresh'
}

/* -------------------------------------------------------------------------- */
/*                          Conflict detection                                */
/* -------------------------------------------------------------------------- */

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Two records have non-equal claims when at least one of the
 * following is true:
 *
 *   - the records have different `text` fields (the textual claim
 *     the record makes) — compared after whitespace normalisation;
 *   - the records have different `value` fields (the structured
 *     value the record asserts);
 *   - the records' authority_scopes overlap in pattern but the
 *     records live in the same scope intersection (this is the
 *     `scope_intersection` conflict path).
 *
 * The function is conservative: if the records have any claim-
 * bearing field that differs, the claims are non-equal.
 */
function claimsDiffer(a: SemanticNode, b: SemanticNode): boolean {
  // Text claim.
  const aText = typeof a['text'] === 'string' ? (a['text'] as string) : ''
  const bText = typeof b['text'] === 'string' ? (b['text'] as string) : ''
  if (aText && bText && normalize(aText) !== normalize(bText)) return true
  // Value claim (deep-equal on primitive values).
  const aVal = a['value']
  const bVal = b['value']
  if (aVal !== undefined && bVal !== undefined) {
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      if (normalize(aVal) !== normalize(bVal)) return true
    } else if (JSON.stringify(aVal) !== JSON.stringify(bVal)) {
      return true
    }
  }
  return false
}

/**
 * Decide whether two records overlap in authority_scope. Two
 * scopes overlap when one is `global` or, for same-kind scopes,
 * the patterns / ids intersect in the conservative sense.
 */
function authoritiesOverlap(a: AuthorityScope, b: AuthorityScope): boolean {
  if (a.kind === 'global' || b.kind === 'global') return true
  if (a.kind === b.kind) {
    if (a.kind === 'path' && a.pattern && b.pattern) {
      if (a.pattern === b.pattern) return true
      const aS = stripGlobSuffix(a.pattern)
      const bS = stripGlobSuffix(b.pattern)
      if (aS === bS) return true
      const shorter = aS.length <= bS.length ? aS : bS
      const longer = aS.length <= bS.length ? bS : aS
      if (longer.startsWith(shorter + '/') || shorter.startsWith(longer + '/')) {
        return true
      }
      return false
    }
    if (a.kind === 'task' && a.task_id && b.task_id) return a.task_id === b.task_id
    if (a.kind === 'kind' && a.node_kind && b.node_kind) return a.node_kind === b.node_kind
  }
  return false
}

/**
 * Compute a deterministic conflict id from a sorted list of
 * claimants. The id is `conflict:<sha256-of-claimants[:8]>`.
 */
export function deterministicConflictId(claimantIds: ReadonlyArray<string>): string {
  const sorted = [...claimantIds].sort()
  const hash = createHash('sha256').update(sorted.join('|'), 'utf8').digest('hex').slice(0, 12)
  return `conflict:${hash}`
}

/**
 * Walk every candidate pair and emit a `ConflictRecord` whenever
 *   - both candidates are non-stale
 *   - both candidates share the same authority class
 *   - their authority_scopes overlap
 *   - their claims differ (or both have authority_scope that
 *     overlap with the same path intersection)
 *
 * Existing conflict ids (in `existingConflicts`) are NOT re-emitted;
 * the resolver only writes brand-new conflict records.
 *
 * The function returns the list of NEW conflict records it would
 * append. Callers decide whether to persist.
 */
export function detectConflicts(
  candidates: ReadonlyArray<SemanticNode>,
  existingConflicts: ReadonlyArray<ConflictRecord>,
): ConflictRecord[] {
  const seen = new Set(existingConflicts.map((c) => c.id))
  const emitted: ConflictRecord[] = []
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i]
      const b = candidates[j]
      if (!a || !b) continue
      // Same authority class only — the precedence table resolves
      // across classes; only intra-class overlaps are conflicts.
      if (kindToAuthorityClass(a.kind) !== kindToAuthorityClass(b.kind)) continue
      if (a.lifecycle_state === 'archived' || b.lifecycle_state === 'archived') continue
      if (
        a.lifecycle_state === 'superseded' ||
        b.lifecycle_state === 'superseded' ||
        a.lifecycle_state === 'invalidated' ||
        b.lifecycle_state === 'invalidated'
      ) {
        continue
      }
      if (!authoritiesOverlap(a.authority_scope, b.authority_scope)) continue
      if (!claimsDiffer(a, b)) continue
      const id = deterministicConflictId([a.id, b.id])
      if (seen.has(id)) continue
      seen.add(id)
      const detectedAt = new Date().toISOString()
      emitted.push({
        schema: 'atelier.conflict-record/v1',
        id,
        scope: a.authority_scope,
        claimants: [
          { record_id: a.id, record_kind: a.kind, authority: DEFAULT_PRECEDENCE.get(kindToAuthorityClass(a.kind) as AuthorityClass) ?? 0 },
          { record_id: b.id, record_kind: b.kind, authority: DEFAULT_PRECEDENCE.get(kindToAuthorityClass(b.kind) as AuthorityClass) ?? 0 },
        ],
        conflict_kind: 'overlap',
        resolution: 'unresolved',
        conflict_policy: 'expose',
        detected_at: detectedAt,
        created_at: detectedAt,
      })
    }
  }
  return emitted
}

/* -------------------------------------------------------------------------- */
/*                              resolveAuthority                              */
/* -------------------------------------------------------------------------- */

function chainForClass(rules: ReadonlyArray<AuthorityRule>, cls: AuthorityClass): AuthorityRule[] {
  return rules.filter((r) => (r.applies_to ?? []).includes(cls))
}

/**
 * Build a `Map<className, AuthorityRule>` for the on-disk rule
 * ledger, indexing each rule by the first entry of its
 * `applies_to` array. The index is read-once per call to
 * `resolveAuthority()` and is consumed by the
 * `effectiveClassPrecedence()` helper below.
 *
 * The function tolerates duplicate rules (a user can add a
 * second rule for the same class); when duplicates are present
 * the first one wins for precedence selection. The chain payload
 * still surfaces every applicable rule, so the user can detect
 * the duplicate.
 */
function buildRuleIndex(rules: ReadonlyArray<AuthorityRule>): Map<string, AuthorityRule> {
  const m = new Map<string, AuthorityRule>()
  for (const r of rules) {
    const key = (r.applies_to ?? [])[0]
    if (typeof key !== 'string') continue
    if (!m.has(key)) m.set(key, r)
  }
  return m
}

/**
 * Compute the effective class precedence for a (class, scope)
 * query. The precedence is read from the on-disk AuthorityRule
 * when one is present; otherwise the canonical
 * `DEFAULT_PRECEDENCE` value is used. The return value also
 * carries a `disagrees_with_default` flag that the resolver
 * attaches to the chain payload.
 *
 * The function is the SINGLE source of truth for the class
 * precedence at resolution time. The resolver's winner-pick loop
 * MUST NOT read any per-record `precedence` field; doing so would
 * reintroduce WO2.1-RT-1 (per-record precedence override).
 */
function effectiveClassPrecedence(
  cls: AuthorityClass,
  rulesByClass: ReadonlyMap<string, AuthorityRule>,
): { precedence: number; disagrees_with_default: boolean; source: 'rule' | 'default' } {
  const defaultPrecedence = DEFAULT_PRECEDENCE.get(cls) ?? 0
  const rule = rulesByClass.get(cls)
  if (!rule) {
    return { precedence: defaultPrecedence, disagrees_with_default: false, source: 'default' }
  }
  const rulePrecedence = rule.precedence
  if (typeof rulePrecedence !== 'number' || Number.isNaN(rulePrecedence)) {
    return { precedence: defaultPrecedence, disagrees_with_default: false, source: 'default' }
  }
  return {
    precedence: rulePrecedence,
    disagrees_with_default: rulePrecedence !== defaultPrecedence,
    source: 'rule',
  }
}

function pathOfScope(authority: AuthorityScope): string {
  if (authority.kind === 'path' && authority.pattern) return authority.pattern
  if (authority.kind === 'task' && authority.task_id) return `task:${authority.task_id}`
  if (authority.kind === 'kind' && authority.node_kind) return `kind:${authority.node_kind}`
  return 'global'
}

export { pathOfScope }

function scopeFromQueryString(scope: string): AuthorityScope {
  // A query scope of `.` is treated as `global` (the entire repo).
  // Anything else is treated as a path pattern.
  if (scope === '.' || scope === '' || scope === 'global') return { kind: 'global' }
  return { kind: 'path', pattern: scope }
}

export { scopeFromQueryString }

/**
 * Resolve the winning record for a (class, scope) query.
 *
 * The function returns a `ResolvedAuthority` payload that includes:
 *   - the chain of `AuthorityRule` records that apply to the class;
 *   - the list of candidate `SemanticNode` ids, with reasons for
 *     excluded candidates (stale anchor, generated_view);
 *   - the list of `ConflictRecord` records for the scope (from
 *     disk; freshly detected conflicts are appended when
 *     `persist_conflicts` is true);
 *   - the winning record id and its precedence, or `null` when no
 *     candidate wins (no candidates, all stale, or class is
 *     `generated_view`).
 *
 * The function never mutates the source `SemanticNode` index; it
 * may append a new `ConflictRecord` to the conflict ledger.
 *
 * Precedence source-of-truth (WO2.1-RT-1, WO2.1-RT-2):
 *   - The resolver does NOT read `node.precedence` from any
 *     SemanticNode. Per-record precedence overrides are
 *     forbidden; the validator rejects the field at
 *     `E_NODE_PRECEDENCE_OVERRIDE` time.
 *   - The class precedence comes from the on-disk AuthorityRule
 *     (`rule:<class>`) when one is present, with
 *     `DEFAULT_PRECEDENCE.get(cls)` as the fallback. Editing the
 *     on-disk rule's `precedence` is the only way to change the
 *     class precedence at resolution time.
 *   - The chain payload annotates each applicable rule with
 *     `disagrees_with_default: boolean` so the CLI can surface a
 *     warning when the on-disk rule disagrees with the canonical
 *     default.
 */
export async function resolveAuthority(
  cls: AuthorityClass,
  scope: string,
  opts: ResolverOptions = {},
): Promise<ResolvedAuthority> {
  const persistConflicts = opts.persist_conflicts !== false
  const rules = await readNdjsonAutopoiesis<AuthorityRule>(AUTOPOIESIS_PATHS.authorityRules)
  const rulesByClass = buildRuleIndex(rules)
  const rawChain = chainForClass(rules, cls)
  // Annotate the chain with the on-disk / default disagreement.
  // The annotated chain is what the CLI surfaces; the raw chain
  // is preserved for downstream consumers that read it as-is.
  const classInfo = effectiveClassPrecedence(cls, rulesByClass)
  const classPrecedence = classInfo.precedence
  const chain = annotateChainDisagreement(rawChain, cls)

  // generated_view NEVER wins. Return early with empty candidates.
  if (cls === 'generated_view') {
    return {
      class: cls,
      scope,
      winner_id: null,
      winner_precedence: null,
      candidate_ids: [],
      candidates: [],
      conflicts: [],
      chain,
    }
  }

  // Load inputs.
  const semanticNodes =
    opts.semanticNodes ?? (await readNdjsonAutopoiesis<SemanticNode>(AUTOPOIESIS_PATHS.semanticNodes))
  const anchorIndex =
    opts.sourceAnchors ?? (await loadSourceAnchors())

  const queryScope = scopeFromQueryString(scope)

  // Filter to candidates: same authority class, scope covers the
  // query scope (or vice versa), has at least one source anchor,
  // and is not archived/superseded/invalidated.
  const queryPath = pathOfScope(queryScope)
  const candidates: SemanticNode[] = []
  for (const node of semanticNodes) {
    if (kindToAuthorityClass(node.kind) !== cls) continue
    if (node.lifecycle_state === 'archived') continue
    if (node.lifecycle_state === 'superseded') continue
    if (node.lifecycle_state === 'invalidated') continue
    // A node is a candidate for the query when either:
    //   - the query is global (any non-archived claim applies), OR
    //   - the node's authority_scope covers the query path, OR
    //   - the node's authority_scope is a path AND the query path
    //     is a parent/ancestor of the node's pattern (the node
    //     makes a claim that is a subset of the query).
    const covers = scopeCovers(node.authority_scope, queryPath)
    const inverse = scopeCovers(queryScope, pathOfScope(node.authority_scope))
    if (!covers && !inverse) continue
    candidates.push(node)
  }

  // Compute staleness.
  const freshCandidates: SemanticNode[] = []
  const allCandidateInfo: ResolutionCandidate[] = []
  for (const c of candidates) {
    const status = withStalenessFilter(c, anchorIndex)
    const id = c.id
    allCandidateInfo.push({
      id,
      authority_class: cls,
      precedence: classPrecedence,
      disagrees_with_default: classInfo.disagrees_with_default,
      lifecycle_state: c.lifecycle_state,
    })
    if (status === 'fresh') {
      freshCandidates.push(c)
    } else {
      allCandidateInfo.push({
        id,
        authority_class: cls,
        precedence: classPrecedence,
        disagrees_with_default: classInfo.disagrees_with_default,
        reason: 'stale_anchor',
        lifecycle_state: c.lifecycle_state,
      })
    }
  }

  // Detect conflicts among the fresh candidates.
  const existingConflicts = await readNdjsonAutopoiesis<ConflictRecord>(
    AUTOPOIESIS_PATHS.conflictRecords,
  )
  const freshScopedCandidates = freshCandidates.filter((c) =>
    authoritiesOverlap(c.authority_scope, queryScope),
  )
  const newConflicts = detectConflicts(freshScopedCandidates, existingConflicts)
  if (persistConflicts && newConflicts.length > 0) {
    for (const c of newConflicts) {
      await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.conflictRecords, c)
    }
  }
  // Conflicts relevant to this (class, scope) are: those whose
  // claimants share the class AND whose scope overlaps the query.
  // Per WO2.1-RT-3, conflicts with `conflict_policy === 'ignore'`
  // are excluded from the resolver's reported conflicts (the
  // operator opted to suppress them).
  const conflicts = [...existingConflicts, ...newConflicts].filter((c) => {
    if (c.conflict_policy === 'ignore') return false
    if (c.scope && !authoritiesOverlap(c.scope, queryScope)) return false
    return (c.claimants ?? []).some(
      (cl) =>
        cl.record_kind && kindToAuthorityClass(cl.record_kind as SemanticNode['kind']) === cls,
    )
  })

  // Pick the winner. The class precedence is authoritative
  // (computed once at the top of this function from the on-disk
  // rule or the DEFAULT_PRECEDENCE fallback). The loop MUST NOT
  // read `node.precedence`; the validator's E_NODE_PRECEDENCE_OVERRIDE
  // guard ensures the field cannot exist on a valid record.
  let winner: SemanticNode | null = null
  let winnerPrecedence: number | null = null
  for (const c of freshCandidates) {
    const candidatePrecedence = classPrecedence
    if (winner === null || candidatePrecedence > (winnerPrecedence ?? -Infinity)) {
      winner = c
      winnerPrecedence = candidatePrecedence
    }
  }

  // Dedupe candidate info: each id should appear at most twice
  // (once fresh, once stale). Collapse to a single entry per id,
  // preferring the stale reason when applicable.
  const dedupedCandidates: ResolutionCandidate[] = []
  const seen = new Set<string>()
  for (const info of allCandidateInfo) {
    if (seen.has(info.id)) {
      const existing = dedupedCandidates.find((d) => d.id === info.id)
      if (existing && info.reason && !existing.reason) {
        existing.reason = info.reason
      }
      continue
    }
    seen.add(info.id)
    dedupedCandidates.push(info)
  }

  return {
    class: cls,
    scope,
    winner_id: winner?.id ?? null,
    winner_precedence: winnerPrecedence,
    candidate_ids: candidates.map((c) => c.id),
    candidates: dedupedCandidates,
    conflicts,
    chain,
  }
}

/**
 * Annotate the chain with a `disagrees_with_default: boolean`
 * field on every rule. The annotation is a non-destructive
 * shallow copy: the original `AuthorityRule` rows are not
 * mutated. Rules whose `applies_to` does not include the class
 * still receive the annotation, but it is only meaningful for
 * the rule that actually applies.
 *
 * The `AuthorityRule` type carries a `[key: string]: unknown`
 * index signature, so the annotation is type-safe.
 */
function annotateChainDisagreement(
  chain: ReadonlyArray<AuthorityRule>,
  cls: AuthorityClass,
): AuthorityRule[] {
  const defaultPrecedence = DEFAULT_PRECEDENCE.get(cls) ?? 0
  return chain.map((r) => {
    const applies = (r.applies_to ?? []).includes(cls)
    const rulePrecedence = typeof r.precedence === 'number' ? r.precedence : defaultPrecedence
    return {
      ...r,
      applies_to_class: cls,
      disagrees_with_default: applies ? rulePrecedence !== defaultPrecedence : false,
    }
  })
}

/* -------------------------------------------------------------------------- */
/*                          Bulk resolution (resolveAll)                      */
/* -------------------------------------------------------------------------- */

/**
 * Resolve every authority class. The CLI uses this to emit the
 * `authority-resolution/v1` payload. The function does not mutate
 * the source-nodes index; it may append new `ConflictRecord`
 * records.
 */
export async function resolveAll(scope: string): Promise<{
  scope: string
  resolutions: ResolvedAuthority[]
}> {
  const results: ResolvedAuthority[] = []
  for (const cls of AUTHORITY_CLASSES) {
    const r = await resolveAuthority(cls, scope)
    results.push(r)
  }
  return { scope, resolutions: results }
}
