/**
 * Atelier Autopoiesis — Staleness detector.
 *
 * Implements C7: "stale/supersede/invalidate detection must be an
 * active scan with persisted StalenessRecord."
 *
 * `runStaleDetect()` walks the on-disk semantic-nodes ledger and
 * the on-disk source-anchors index, finds every node whose
 * source_anchor has a non-fresh status (stale | invalid | archived
 * | quarantined), and appends a deterministic StalenessRecord to
 * `.atelier/v0/autopoiesis/staleness-records.ndjson` for each new
 * finding. The detector is idempotent on the deterministic
 * StalenessRecord id (`staleness:<nodeId>:<anchorId>`), so repeated
 * invocations are no-ops once the ledger is warm.
 *
 * The implementation deliberately mirrors `detectConflicts()` in
 * `lib/authority.ts` so that the C3 conflicts detector and the C7
 * stale detector share the same scan model: read live state, run a
 * pure function over the in-memory index, persist only brand-new
 * findings, return a machine-readable result envelope.
 *
 * The detector is tolerant of missing files: a missing
 * `semantic-nodes.ndjson` or `source-anchors.ndjson` is treated
 * as "nothing to scan", not as an error. This matches the
 * read-tolerance of `lib/store.ts::readNdjsonAutopoiesis` and
 * `lib/query.ts::loadSourceAnchors`.
 */
import path from 'node:path'
import { atelierV0Root } from '../../../lib/src/paths.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from './store.ts'
import { autopoiesisPaths } from './paths.ts'
import type { SemanticNode, StalenessRecord } from './records.ts'

/* -------------------------------------------------------------------------- */
/*                               Local types                                  */
/* -------------------------------------------------------------------------- */

/**
 * Minimal anchor row shape used by the detector. Mirrors the
 * `AnchorRow` type in `lib/query.ts`. The relation-kernel anchor
 * index writes anchors with a `status` field that is one of
 *   'fresh' | 'stale' | 'conflicted' | 'invalid' | 'archived' | 'quarantined'.
 * The detector only cares about the `id` and `status` fields.
 */
type AnchorRow = { id: string; status: string }

/**
 * The four anchor statuses that the detector treats as
 * "stale-triggering". Mirrors the `STALE_STATUSES` set in
 * `lib/authority.ts` (which is module-private). The local
 * declaration is intentional: keeping the rule near the detector
 * lets future maintainers evolve the staleness taxonomy without
 * having to touch the authority module.
 */
const STALE_TRIGGER_STATUSES: ReadonlySet<string> = new Set<string>([
  'stale',
  'invalid',
  'archived',
  'quarantined',
])

/* -------------------------------------------------------------------------- */
/*                              Index loaders                                 */
/* -------------------------------------------------------------------------- */

/**
 * Load the live source-anchors index and build a
 * `Map<anchor_id, AnchorRow>`. Tolerant: a missing
 * `source-anchors.ndjson` returns an empty map.
 */
async function loadAnchorIndex(): Promise<Map<string, AnchorRow>> {
  const file = path.join(atelierV0Root(), 'anchors', 'source-anchors.ndjson')
  const rows = await readNdjson<AnchorRow>(file).catch(() => [] as AnchorRow[])
  const map = new Map<string, AnchorRow>()
  for (const r of rows) {
    if (typeof r.id === 'string') map.set(r.id, r)
  }
  return map
}

/* -------------------------------------------------------------------------- */
/*                              Pure helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Build the deterministic StalenessRecord id for a (node, anchor)
 * pair. The id format is `staleness:<nodeId>:<anchorId>` so the
 * detector is naturally idempotent on this tuple: a re-scan that
 * re-detects the same staleness will see the same id and refuse
 * to append a duplicate record.
 */
export function deterministicStalenessId(
  nodeId: string,
  anchorId: string,
): string {
  return `staleness:${nodeId}:${anchorId}`
}

/**
 * Walk a SemanticNode and return one StalenessRecord per
 * source_anchor that the live anchor index reports as stale /
 * invalid / archived / quarantined. Returns `[]` when the node
 * has no anchors in the index, or when every anchor is fresh.
 *
 * The function is pure: it does not read from disk and does not
 * mutate state. It is exported (in addition to being used by
 * `runStaleDetect`) so that tests can pin the contract
 * independently of the file-system adapters.
 */
export function detectStalenessForNode(
  node: SemanticNode,
  anchorIndex: ReadonlyMap<string, AnchorRow>,
  now: () => string = () => new Date().toISOString(),
  triggerStatuses: ReadonlySet<string> = STALE_TRIGGER_STATUSES,
): StalenessRecord[] {
  const out: StalenessRecord[] = []
  for (const ref of node.source_anchors ?? []) {
    if (typeof ref.anchor_id !== 'string') continue
    const live = anchorIndex.get(ref.anchor_id)
    const status = (live?.status ?? ref.status ?? 'fresh') as string
    if (!triggerStatuses.has(status)) continue
    const detectedAt = now()
    out.push({
      schema: 'atelier.staleness-record/v1',
      id: deterministicStalenessId(node.id, ref.anchor_id),
      subject_id: node.id,
      subject_kind: node.kind,
      anchor_id: ref.anchor_id,
      previous_status: 'fresh',
      new_status: status as StalenessRecord['new_status'],
      detected_at: detectedAt,
      reason: `anchor_status=${status}`,
      created_at: detectedAt,
    })
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*                              Public entry                                  */
/* -------------------------------------------------------------------------- */

/**
 * Result envelope returned by `runStaleDetect()`. The schema tag
 * is the machine-readable contract that downstream consumers
 * (CLI, packet:create, packet:validate) key off of.
 */
export type StaleDetectResult = {
  schema: 'atelier.stale-detect-result/v1'
  ran_at: string
  /** Number of NEW StalenessRecord entries appended to the ledger. */
  detected: number
  /** The StalenessRecord list that was appended (or skipped on
   *  re-scan, when the same id already exists). */
  records: StalenessRecord[]
  /** Number of nodes scanned, for diagnostics. */
  scanned_nodes: number
  /** Number of anchors indexed, for diagnostics. */
  anchor_index_size: number
  /** Wall-clock duration in milliseconds, for the evaluator. */
  duration_ms: number
}

/**
 * Optional overrides for `runStaleDetect()`. All fields default
 * to the production behavior. The overrides are intended for
 * tests and for production-anchored smoke scans that need to
 * treat an extra anchor status (e.g. "stale-test") as a
 * staleness trigger without changing the production taxonomy.
 */
export type RunStaleDetectOptions = {
  /**
   * Anchor statuses that the detector treats as
   * "stale-triggering". The default is the production
   * STALE_TRIGGER_STATUSES set. When the override is supplied,
   * it REPLACES the default; callers that want to extend the
   * production set must pass the union.
   */
  stale_anchor_statuses?: ReadonlySet<string>
}

/**
 * Scan the semantic-nodes and source-anchors ledgers, append
 * StalenessRecord entries for every node whose source_anchor is
 * non-fresh, and return the result envelope. Idempotent on the
 * deterministic id; the second invocation reports `detected: 0`
 * if no new staleness is present.
 */
export async function runStaleDetect(
  opts: RunStaleDetectOptions = {},
): Promise<StaleDetectResult> {
  const startedAt = Date.now()
  const ranAt = new Date().toISOString()
  // Use the function form so tests that change `process.cwd()`
  // to a per-suite fixture directory read and write the fixture
  // (not the production `.atelier/v0/autopoiesis/` directory).
  const PATHS = autopoiesisPaths()
  const triggerStatuses = opts.stale_anchor_statuses ?? STALE_TRIGGER_STATUSES
  const [nodes, anchorIndex, existing] = await Promise.all([
    readNdjsonAutopoiesis<SemanticNode>(PATHS.semanticNodes),
    loadAnchorIndex(),
    readNdjsonAutopoiesis<StalenessRecord>(PATHS.stalenessRecords),
  ])
  const existingIds = new Set(existing.map((r) => r.id))
  const toAppend: StalenessRecord[] = []
  for (const node of nodes) {
    const recs = detectStalenessForNode(node, anchorIndex, undefined, triggerStatuses)
    for (const r of recs) {
      if (existingIds.has(r.id)) continue
      existingIds.add(r.id)
      toAppend.push(r)
    }
  }
  for (const r of toAppend) {
    await appendNdjsonAutopoiesis(PATHS.stalenessRecords, r)
  }
  return {
    schema: 'atelier.stale-detect-result/v1',
    ran_at: ranAt,
    detected: toAppend.length,
    records: toAppend,
    scanned_nodes: nodes.length,
    anchor_index_size: anchorIndex.size,
    duration_ms: Date.now() - startedAt,
  }
}
