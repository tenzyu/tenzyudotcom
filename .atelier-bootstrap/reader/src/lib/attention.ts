/**
 * AttentionSet assembly.
 *
 * Given a task description, this module selects a small set of relevant
 * SourceUnits and SourceRefs, builds an AttentionSet object, and persists
 * it to `.atelier/v0/objects/attention.ndjson`.
 *
 * The selection is intentionally deterministic and task-scoped: it is not
 * allowed to read every source unit, and the resulting `selected_object_ids`
 * must be a strict subset of the indexer's SourceUnit set.
 */
import { readFile } from 'node:fs/promises'
import { readNdjson, writeNdjson, appendNdjson } from '../../../lib/src/ndjson.ts'
import { deterministicId, type AttentionSet, type SourceRef, type SourceUnit, READER_PATHS } from '../../../lib/src/index.ts'
import {
  anchorsForUnit,
  isDefaultExcludedPath,
  loadCurrentReaderIndex,
  sourceRefForUnit,
  type ReaderAttentionSet,
} from './relation-safety.ts'

const STOP_WORDS = new Set<string>([
  'a', 'an', 'the', 'is', 'are', 'and', 'or', 'of', 'to', 'in', 'on', 'for',
  'with', 'this', 'that', 'be', 'as', 'it', 'by', 'from', 'at', 'i', 'we',
  'you', 'they', 'he', 'she', 'do', 'does', 'did', 'have', 'has', 'had',
  'was', 'were', 'will', 'would', 'should', 'can', 'could', 'may', 'might',
  'must', 'shall', 'not', 'no', 'so', 'if', 'then', 'than', 'but', 'also',
])

/**
 * Tokenise a task description into lowercase keywords, dropping stop words.
 */
export function tokenize(task: string): string[] {
  return task
    .toLowerCase()
    .split(/[^a-z0-9_\-./]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && !STOP_WORDS.has(s))
}

/**
 * Maximum number of bytes to scan from a source file's content when
 * path-based scoring produced no matches. Capping the read keeps the
 * attention assembly bounded for large repos where individual files
 * (e.g. `bun.lock`, generated trees) may be hundreds of KB.
 */
const CONTENT_SCAN_BYTES = 4096

/**
 * Score a SourceUnit by how many task tokens appear in its path or
 * (when present) its first few KB of content.
 */
async function scoreUnit(unit: SourceUnit, tokens: ReadonlyArray<string>): Promise<number> {
  if (tokens.length === 0) return 0
  if (isDefaultExcludedPath(unit.path)) return 0
  const pathParts = unit.path.toLowerCase().split(/[^a-z0-9_\-]+/)
  let score = 0
  for (const token of tokens) {
    if (pathParts.some((p) => p === token || p.includes(token))) score += 1
  }
  if (score === 0) {
    // Fall back to a small content scan to support tasks like
    // "rename the run command". The read is capped to keep total
    // work bounded for large repos.
    try {
      const fh = await readFile(unit.path, { encoding: 'utf8', flag: 'r' })
      const head = fh.length > CONTENT_SCAN_BYTES ? fh.slice(0, CONTENT_SCAN_BYTES) : fh
      const lower = head.toLowerCase()
      for (const token of tokens) if (lower.includes(token)) score += 0.5
    } catch {
      // ignore unreadable files
    }
  }
  return score
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Cap on how many excluded object ids we materialise in the persisted
 * AttentionSet. Storing every excluded id would balloon the file for
 * large repos; the contract only requires the selected set to be
 * task-scoped.
 */
const EXCLUDED_IDS_CAP = 200

/**
 * Assemble an `AttentionSet` for a task description.
 *
 * The set is small (top N by score) so the downstream deep-read does not
 * read the whole repository. Empty selections are allowed but must
 * report `gap_status: insufficient` so the reader can flag the gap.
 *
 * The id is deterministic from the task string, so re-running the same
 * task upserts the existing record rather than producing duplicates.
 * Other attention sets in the file are preserved.
 */
export async function assembleAttention(
  task: string,
  budget: { target_tokens: number; max_tokens: number } = { target_tokens: 4000, max_tokens: 8000 },
): Promise<ReaderAttentionSet> {
  const tokens = tokenize(task)
  const currentIndex = await loadCurrentReaderIndex()
  const allUnits = currentIndex.units
  const candidateUnits = allUnits.filter((unit) => !isDefaultExcludedPath(unit.path))
  // Score all units in parallel. Each `scoreUnit` either returns a
  // path-based score (no I/O) or falls back to a small content scan;
  // running them concurrently keeps the assembly bounded by the
  // slowest file rather than the sum of all files.
  const scoredAll = await Promise.all(
    candidateUnits.map(async (unit) => ({ unit, score: await scoreUnit(unit, tokens) })),
  )
  const scored = scoredAll.filter((s) => s.score > 0)
  scored.sort((a, b) => b.score - a.score)
  // Cap at 25 to keep attention small and task-scoped.
  const top = scored.slice(0, 25)
  const selectedIds = top.map((t) => t.unit.id)
  const selectedRefs: SourceRef[] = top.map((t) => sourceRefForUnit(t.unit))
  const selectedAnchorIds = [...new Set(top.flatMap((t) => anchorsForUnit(currentIndex, t.unit).slice(0, 2).map((a) => a.id)))]
  const excludedIds = allUnits
    .filter((u) => !selectedIds.includes(u.id))
    .map((u) => u.id)
    .slice(0, EXCLUDED_IDS_CAP)
  const excludedAnchorIds = currentIndex.anchors
    .filter((a) => !selectedAnchorIds.includes(a.id))
    .map((a) => a.id)
    .slice(0, EXCLUDED_IDS_CAP)
  const hasSelected = selectedIds.length > 0 && selectedAnchorIds.length > 0
  const set: ReaderAttentionSet = {
    id: deterministicId('att', task),
    kind: 'attention_set',
    version: '1',
    title: `attention:${task.slice(0, 64)}`,
    source_refs: selectedRefs,
    produced_by: 'reader',
    provenance_kind: 'llm_extracted',
    confidence: selectedIds.length > 0 ? 'inferred' : 'hypothesis',
    status: 'fresh',
    affordances: ['context', 'packet-constraint'],
    created_at: nowIso(),
    task,
    selected_object_ids: selectedIds,
    selected_anchor_ids: selectedAnchorIds,
    selected_source_refs: selectedRefs,
    excluded_object_ids: excludedIds,
    excluded_anchor_ids: excludedAnchorIds,
    reason: `task-scoped selection for "${task}"`,
    budget,
    gap_status: hasSelected ? 'sufficient' : 'insufficient',
  }
  // Merge with existing attention sets: replace any set with the same
  // id (idempotent re-run), keep all others. The id is deterministic
  // from the task string so this is the canonical upsert path.
  const existing = await readNdjson<ReaderAttentionSet>(READER_PATHS.attention)
  const merged = [...existing.filter((a) => a.id !== set.id), set]
  await writeNdjson(READER_PATHS.attention, merged)
  return set
}

/**
 * Append an attention set to the canonical attention NDJSON file.
 */
export async function appendAttention(set: AttentionSet): Promise<void> {
  await appendNdjson(READER_PATHS.attention, set)
}
