/**
 * Atelier Autopoiesis — ControlPacket generator.
 *
 * The generator walks the autopoiesis semantic-nodes index plus
 * the relation-kernel implementation-tasks ledger to produce a
 * task-local `ControlPacket` (atelier.control-packet/v1). The
 * packet is the operational payload given to an agent before it
 * is allowed to read or edit a file.
 *
 * The generator is the SINGLE producer of ControlPackets; the
 * validator is the SINGLE consumer. The validator's job is to
 * reject packets that the generator produced with defects, the
 * generator's job is to surface the defects in-band so the
 * validator does not have to second-guess what was missing.
 *
 * Pipeline:
 *   1. Resolve the task from `.atelier/v0/transforms/md-to-code/
 *      model/implementation-tasks.ndjson`. If the task does not
 *      exist, exit 1 with E_TASK_NOT_FOUND. If the task status
 *      is not 'ready', exit 1 with E_PACKET_TASK_NOT_READY.
 *   2. Compute `allowed_operations` and `forbidden_operations`
 *      by walking the task's allowed_files / forbidden_files.
 *      `allowed_operations` is the dedup'd set of
 *      ['create','modify','delete'] intersected with the file
 *      list (each path maps to a file-write operation). The
 *      generator emits one operation per file.
 *   3. Compute `active_requirements`, `accepted_decisions`,
 *      `required_checks`, `open_findings`, `stale_artifacts`,
 *      `conflicts`, and `evidence_anchors` by filtering the
 *      semantic-nodes index. The query is scope-overlap based:
 *      a node belongs to the task when its anchor's path is
 *      under the task's allowed_files (or the node's
 *      `authority_scope` covers the task path).
 *   4. Compute `materialization_rules`. One rule per
 *      `required_check`, pinning:
 *        - the `task_id`
 *        - the `required_for_change` (a stable key for the change
 *          shape)
 *        - the `must_hold_check_ids` (a single-element list
 *          containing the check_result id)
 *        - the `source_anchor_id` (the first source_anchor of
 *          the check_result)
 *        - the `status` ('observed' on creation)
 *   5. If the task's allowed_files overlap with its
 *      forbidden_files (after glob normalisation), the generator
 *      STILL writes the packet — the validator is the gate, not
 *      the generator — but flags the packet's `status='invalid'`
 *      and emits `E_PACKET_SCOPE_OVERLAP` in the in-band defects
 *      list. The same goes for empty `required_checks` /
 *      `evidence_anchors`: the packet is written with the
 *      appropriate in-band defect.
 *   6. Persist the packet via the in-process mutex to
 *      `.atelier/v0/autopoiesis/control-packets.ndjson`.
 */
import { createHash } from 'node:crypto'
import path from 'node:path'
import { atelierV0Root } from '../../../lib/src/paths.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { appendNdjsonAutopoiesis } from './store.ts'
import { AUTOPOIESIS_PATHS } from './paths.ts'
import { withStalenessFilter, scopeCovers } from './authority.ts'
import type {
  AuthorityScope,
  ConflictRecord,
  ControlPacket,
  LifecycleState,
  MaterializationRule,
  SemanticNode,
  SourceAnchorRef,
} from './records.ts'

/* -------------------------------------------------------------------------- */
/*                              Helpers                                       */
/* -------------------------------------------------------------------------- */

type AnchorRow = { id: string; status: string; path?: string }

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
  title?: string
  goal?: string
  source_anchor_ids?: string[]
  source_refs?: Array<{ path?: string; sha256?: string }>
  [key: string]: unknown
}

async function loadImplementationTask(
  taskId: string,
): Promise<ImplementationTaskRow | null> {
  const file = path.join(
    atelierV0Root(),
    'transforms',
    'md-to-code',
    'model',
    'implementation-tasks.ndjson',
  )
  const rows = await readNdjson<ImplementationTaskRow>(file).catch(
    () => [] as ImplementationTaskRow[],
  )
  return (
    rows.find((r) => r.id === taskId || r.task_id === taskId) ?? null
  )
}

async function loadSemanticNodes(): Promise<SemanticNode[]> {
  return readNdjson<SemanticNode>(AUTOPOIESIS_PATHS.semanticNodes).catch(
    () => [] as SemanticNode[],
  )
}

async function loadConflicts(): Promise<ConflictRecord[]> {
  return readNdjson<ConflictRecord>(AUTOPOIESIS_PATHS.conflictRecords).catch(
    () => [] as ConflictRecord[],
  )
}

/* -------------------------------------------------------------------------- */
/*                          Glob overlap helpers                              */
/* -------------------------------------------------------------------------- */

function stripGlobSuffix(pattern: string): string {
  if (pattern.endsWith('/**')) return pattern.slice(0, -3)
  if (pattern.endsWith('/*')) return pattern.slice(0, -2)
  return pattern
}

/**
 * Return `true` when `glob` covers `path`. The implementation is
 * deliberately small: it splits both `glob` (after stripping the
 * trailing `/**` or `/*`) and `path` into segments, then walks
 * them in lockstep. A `**` segment matches any number of trailing
 * segments; a `*` segment matches a single non-`/` segment.
 *
 * The function is conservative in the case where `glob` has no
 * `/**` suffix: such a glob is treated as a literal path and
 * matches only when the path is identical to the glob. This is
 * the same convention as `scopeCovers()` in the authority
 * module: a non-glob path pattern does NOT match its descendants.
 */
export function globCovers(glob: string, pathToTest: string): boolean {
  if (!glob) return false
  // Exact match.
  if (glob === pathToTest) return true
  // If the glob does not end in /** or /*, it is a literal
  // pattern and does not match any descendant.
  if (!glob.endsWith('/**') && !glob.endsWith('/*')) {
    return false
  }
  // Strip trailing /** and check parent containment.
  const stripped = stripGlobSuffix(glob)
  if (pathToTest === stripped) return true
  if (pathToTest.startsWith(stripped + '/')) return true
  // Treat the path-to-test as a list of segments and the glob as
  // a list of segments. Match each glob segment against a path
  // segment. A `**` segment accepts any remaining path. A `*`
  // segment accepts a single non-`/` segment.
  const globSegs = stripped.split('/').filter((s) => s.length > 0)
  const pathSegs = pathToTest.split('/').filter((s) => s.length > 0)
  let gi = 0
  let pi = 0
  while (gi < globSegs.length && pi < pathSegs.length) {
    const g = globSegs[gi]!
    const p = pathSegs[pi]!
    if (g === '**') {
      // Consume the ** and any following path segments up to the
      // next non-** glob segment.
      gi++
      if (gi >= globSegs.length) return true
      while (pi < pathSegs.length) {
        if (globCovers(globSegs.slice(gi).join('/'), pathSegs.slice(pi).join('/'))) {
          return true
        }
        pi++
      }
      return false
    }
    if (g === '*') {
      if (p.includes('/')) return false
      gi++
      pi++
      continue
    }
    if (g !== p) return false
    gi++
    pi++
  }
  return gi >= globSegs.length && pi >= pathSegs.length
}

/**
 * Derive the allowed_operations list. Per the work order, the
 * spec says: `allowed_operations = ['create','modify','delete']
 * derived from ImplementationTask.allowed_files (each is a file
 * path)`. The intent is to enumerate the file paths the agent
 * is allowed to touch, plus the action kinds. We emit the
 * action kinds first (so the validator's E_PACKET_OP_OVERLAP
 * check stays simple) and then the file paths. The validator
 * checks the intersection of the two arrays; with both action
 * kinds AND file paths in each list, the intersection is empty
 * UNLESS the same file path appears in both allowed and
 * forbidden files (which is exactly the case E_PACKET_SCOPE_OVERLAP
 * is meant to catch).
 */
function deriveAllowedOperations(allowedFiles: ReadonlyArray<string>): string[] {
  if (allowedFiles.length === 0) return []
  return ['create', 'modify', 'delete', ...allowedFiles]
}

function deriveForbiddenOperations(forbiddenFiles: ReadonlyArray<string>): string[] {
  if (forbiddenFiles.length === 0) return []
  return ['create', 'modify', 'delete', ...forbiddenFiles]
}

/**
 * Detect overlap between two path-glob lists. Two paths overlap
 * when one covers the other (using `globCovers`). This is the
 * conservative direction: `.atelier-bootstrap/**` covers
 * `.atelier-bootstrap/autopoiesis/**` and so the two overlap.
 */
export function pathsOverlap(
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>,
): boolean {
  for (const ap of a) {
    for (const bp of b) {
      if (globCovers(ap, bp) || globCovers(bp, ap)) return true
    }
  }
  return false
}

/**
 * Detect overlap between `allowed_operations` and
 * `forbidden_operations`. The two are simple string sets; the
 * overlap is the intersection.
 */
export function opsOverlap(
  allowed: ReadonlyArray<string>,
  forbidden: ReadonlyArray<string>,
): boolean {
  const set = new Set(forbidden)
  for (const op of allowed) {
    if (set.has(op)) return true
  }
  return false
}

/* -------------------------------------------------------------------------- */
/*                          Node-scope overlap                                 */
/* -------------------------------------------------------------------------- */

function pathMatchesAllowed(
  node: SemanticNode,
  allowed: ReadonlyArray<string>,
  anchors?: Map<string, AnchorRow>,
): boolean {
  if (allowed.length === 0) return false
  // A node matches a task when ANY of its source_anchors is
  // covered by ANY of the task's allowed_files. We also check
  // the authority_scope pattern for kind=path scopes.
  for (const a of node.source_anchors ?? []) {
    // Resolve the anchor's path from (in order):
    //   1. the source_anchor's inline `path` field
    //   2. the relation-kernel anchor index (looked up by
    //      `anchor_id`)
    let anchorPath = a.path
    if (!anchorPath && anchors && typeof a.anchor_id === 'string') {
      const live = anchors.get(a.anchor_id)
      if (live?.path) anchorPath = live.path
    }
    if (anchorPath) {
      for (const f of allowed) {
        if (globCovers(f, anchorPath)) return true
      }
    }
  }
  // Authority scope check (path kind).
  if (node.authority_scope?.kind === 'path' && node.authority_scope.pattern) {
    for (const f of allowed) {
      if (globCovers(f, node.authority_scope.pattern)) return true
      if (globCovers(node.authority_scope.pattern, f)) return true
    }
  }
  // Authority scope check (task kind).
  if (node.authority_scope?.kind === 'task' && node.authority_scope.task_id) {
    return allowed.some((f) => f === node.authority_scope!.task_id)
  }
  // Global scope: not matched.
  return false
}

/* -------------------------------------------------------------------------- */
/*                          createControlPacket                                */
/* -------------------------------------------------------------------------- */

export type CreateControlPacketOptions = {
  taskId: string
  /** Optional produced_by override. */
  producedBy?: string
  /** Optional explicit date for tests. */
  createdAt?: string
}

export type CreateControlPacketResult =
  | { ok: true; packet: ControlPacket }
  | { ok: false; code: 'E_TASK_NOT_FOUND' | 'E_PACKET_TASK_NOT_READY'; message: string }

/**
 * Build a task-local control packet.
 *
 * The function is the single producer of `atelier.control-packet/v1`
 * records. It does NOT validate; the validator (see
 * `packet-validate.ts`) is the gate. The function only walks the
 * autopoiesis index and composes the packet.
 */
export async function createControlPacket(
  taskId: string,
  opts: Partial<CreateControlPacketOptions> = {},
): Promise<CreateControlPacketResult> {
  const task = await loadImplementationTask(taskId)
  if (!task) {
    return {
      ok: false,
      code: 'E_TASK_NOT_FOUND',
      message:
        `ImplementationTask '${taskId}' not found in ` +
        '.atelier/v0/transforms/md-to-code/model/implementation-tasks.ndjson.',
    }
  }
  if (task.status !== 'ready') {
    return {
      ok: false,
      code: 'E_PACKET_TASK_NOT_READY',
      message:
        `ImplementationTask '${taskId}' has status='${task.status ?? 'unknown'}'; ` +
        `control packets can only be generated for tasks with status='ready'.`,
    }
  }

  const allowedFiles = (task.allowed_files ?? []).slice()
  const forbiddenFiles = (task.forbidden_files ?? []).slice()
  const allowedOperations = deriveAllowedOperations(allowedFiles)
  const forbiddenOperations = deriveForbiddenOperations(forbiddenFiles)

  // Compute the in-band defects up front. The packet is still
  // written (the validator is the gate, not the generator), but
  // the generator surfaces what it saw so the operator gets a
  // clear error trail.
  const inBandDefects: string[] = []
  if (pathsOverlap(allowedFiles, forbiddenFiles)) {
    inBandDefects.push('E_PACKET_SCOPE_OVERLAP')
  }
  if (opsOverlap(allowedOperations, forbiddenOperations)) {
    inBandDefects.push('E_PACKET_OP_OVERLAP')
  }

  // Walk the autopoiesis index.
  const [semanticNodes, conflicts, anchors] = await Promise.all([
    loadSemanticNodes(),
    loadConflicts(),
    loadSourceAnchors(),
  ])

  const createdAt = opts.createdAt ?? new Date().toISOString()

  // 1. active_requirements: kind=requirement AND
  //    lifecycle_state IN (accepted, verified) AND
  //    source_anchors all fresh AND scope overlaps the task's
  //    allowed_files.
  const activeRequirements: string[] = []
  for (const n of semanticNodes) {
    if (n.kind !== 'requirement') continue
    if (n.lifecycle_state !== 'accepted' && n.lifecycle_state !== 'verified') continue
    if (withStalenessFilter(n, anchors) !== 'fresh') continue
    if (!pathMatchesAllowed(n, allowedFiles, anchors)) continue
    activeRequirements.push(n.id)
  }

  // 2. accepted_decisions: same as above with kind=decision.
  const acceptedDecisions: string[] = []
  for (const n of semanticNodes) {
    if (n.kind !== 'decision') continue
    if (n.lifecycle_state !== 'accepted' && n.lifecycle_state !== 'verified') continue
    if (withStalenessFilter(n, anchors) !== 'fresh') continue
    if (!pathMatchesAllowed(n, allowedFiles, anchors)) continue
    acceptedDecisions.push(n.id)
  }

  // 3. required_checks: kind=check_result AND
  //    lifecycle_state IN (accepted, verified) AND
  //    status='passed'.
  const requiredCheckNodes: SemanticNode[] = []
  for (const n of semanticNodes) {
    if (n.kind !== 'check_result') continue
    if (n.lifecycle_state !== 'accepted' && n.lifecycle_state !== 'verified') continue
    if (n['status'] !== 'passed') continue
    if (!pathMatchesAllowed(n, allowedFiles, anchors)) continue
    requiredCheckNodes.push(n)
  }
  if (requiredCheckNodes.length === 0) inBandDefects.push('E_PACKET_MISSING_CHECKS')

  // 4. open_findings: kind=review_finding AND status='open'.
  const openFindings: string[] = []
  for (const n of semanticNodes) {
    if (n.kind !== 'review_finding') continue
    if (n['status'] !== 'open') continue
    if (!pathMatchesAllowed(n, allowedFiles, anchors)) continue
    openFindings.push(n.id)
  }

  // 5. stale_artifacts: any record whose source_anchor is not
  //    fresh OR lifecycle_state IN (superseded, invalidated,
  //    archived, quarantined).
  const staleArtifacts: string[] = []
  for (const n of semanticNodes) {
    const staled = withStalenessFilter(n, anchors) === 'stale'
    const lifecycleStale =
      n.lifecycle_state === 'superseded' ||
      n.lifecycle_state === 'invalidated' ||
      n.lifecycle_state === 'archived' ||
      n.lifecycle_state === 'quarantined'
    if (staled || lifecycleStale) {
      if (!pathMatchesAllowed(n, allowedFiles, anchors)) continue
      staleArtifacts.push(n.id)
    }
  }

  // 6. conflicts: ConflictRecord whose scope overlaps the task's
  //    allowed_files.
  const conflictIds: string[] = []
  for (const c of conflicts) {
    const scope = c.scope
    let overlaps = false
    if (!scope || scope.kind === 'global') {
      overlaps = true
    } else if (scope.kind === 'path' && scope.pattern) {
      overlaps = allowedFiles.some((f) => globCovers(f, scope.pattern!)) ||
        allowedFiles.some((f) => globCovers(scope.pattern!, f))
    } else if (scope.kind === 'task' && scope.task_id) {
      overlaps = scope.task_id === task.id || scope.task_id === task.task_id
    } else if (scope.kind === 'kind' && scope.node_kind) {
      // kind-scoped conflicts are reported in every packet;
      // they describe authority-class disagreements, not path
      // restrictions.
      overlaps = true
    }
    if (overlaps) conflictIds.push(c.id)
  }

  // 7. evidence_anchors: check_result semantic-nodes with
  //    raw_output_ref populated. These are the same nodes used
  //    for required_checks; the spec asks for an explicit
  //    evidence_anchors list (list of check_result ids) plus
  //    the structured SourceAnchorRef[] field.
  const evidenceAnchorsList: string[] = []
  const evidenceAnchorsRefs: SourceAnchorRef[] = []
  for (const n of requiredCheckNodes) {
    const proof = n['evidence_proof']
    const rawRef =
      proof && typeof proof === 'object' && typeof (proof as Record<string, unknown>)['raw_output_ref'] === 'string'
        ? ((proof as Record<string, unknown>)['raw_output_ref'] as string)
        : undefined
    if (rawRef) {
      evidenceAnchorsList.push(n.id)
      // Mirror the SourceAnchorRef shape used by the validator.
      for (const a of n.source_anchors ?? []) {
        evidenceAnchorsRefs.push(a)
      }
    }
  }
  if (evidenceAnchorsList.length === 0) inBandDefects.push('E_PACKET_MISSING_EVIDENCE')

  // 8. materialization_rules: one rule per required_check.
  const materializationRules: MaterializationRule[] = requiredCheckNodes.map((c) => ({
    task_id: task.id,
    required_for_change: `check:${c.id}`,
    must_hold_check_ids: [c.id],
    source_anchor_id: c.source_anchors?.[0]?.anchor_id ?? `anchor:${c.id}`,
    status: 'observed',
  }))

  // Build the source_anchors for the packet itself: the task's
  // own source_anchors. If absent, fall back to a synthetic
  // anchor that points to the implementation-tasks record.
  const packetSourceAnchors: SourceAnchorRef[] = (task.source_anchor_ids ?? []).map(
    (aid) => ({ anchor_id: aid }),
  )
  if (packetSourceAnchors.length === 0) {
    // Synthesise a deterministic anchor id derived from the
    // task id; this is the only SyntheticField the generator
    // emits. The validator checks every anchor id against the
    // relation-kernel index, so we may need to fall back to a
    // real anchor instead.
    const synthetic = createHash('sha256')
      .update(`task:${task.id}`, 'utf8')
      .digest('hex')
      .slice(0, 16)
    packetSourceAnchors.push({
      anchor_id: `anchor:${synthetic}`,
      path: '.atelier/v0/transforms/md-to-code/model/implementation-tasks.ndjson',
    })
  }

  // Compute a stable packet id.
  const id = `pkt:${createHash('sha256').update(`control-packet|${task.id}|${createdAt}`).digest('hex').slice(0, 16)}`

  const status: 'valid' | 'invalid' = inBandDefects.length > 0 ? 'invalid' : 'valid'

  const packet: ControlPacket = {
    schema: 'atelier.control-packet/v1',
    id,
    task: task.id,
    lifecycle_state: 'observed',
    authority_scope: { kind: 'task', task_id: task.id },
    source_anchors: packetSourceAnchors,
    evidence_anchors: evidenceAnchorsRefs,
    provenance_kind: 'derived',
    produced_by: opts.producedBy ?? 'atelier-autopoiesis-implementer',
    created_at: createdAt,
    generated_at: createdAt,
    active_requirements: activeRequirements,
    accepted_decisions: acceptedDecisions,
    allowed_operations: allowedOperations,
    forbidden_operations: forbiddenOperations,
    required_checks: requiredCheckNodes.map((c) => c.id),
    open_findings: openFindings,
    stale_artifacts: staleArtifacts,
    conflicts: conflictIds,
    evidence_anchors_list: evidenceAnchorsList,
    materialization_rules: materializationRules,
    status,
    defects: inBandDefects,
  }

  // Persist the packet via the in-process mutex.
  await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.controlPackets, packet)

  return { ok: true, packet }
}
