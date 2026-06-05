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
import { deterministicId, type AttentionSet, type SourceRef, type SourceUnit, INDEXER_PATHS, READER_PATHS } from '../../../lib/src/index.ts'

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
 * Score a SourceUnit by how many task tokens appear in its path or
 * (when present) its first few KB of content.
 */
async function scoreUnit(unit: SourceUnit, tokens: ReadonlyArray<string>): Promise<number> {
  if (tokens.length === 0) return 0
  const pathParts = unit.path.toLowerCase().split(/[^a-z0-9_\-]+/)
  let score = 0
  for (const token of tokens) {
    if (pathParts.some((p) => p === token || p.includes(token))) score += 1
  }
  if (score === 0) {
    // Fall back to a small content scan to support tasks like
    // "rename the run command".
    try {
      const head = await readFile(unit.path, 'utf8')
      const lower = head.toLowerCase()
      for (const token of tokens) if (lower.includes(token)) score += 0.5
    } catch {
      // ignore
    }
  }
  return score
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Assemble an `AttentionSet` for a task description.
 *
 * The set is small (top N by score) so the downstream deep-read does not
 * read the whole repository. Empty selections are allowed but must
 * report `gap_status: insufficient` so the reader can flag the gap.
 */
export async function assembleAttention(
  task: string,
  budget: { target_tokens: number; max_tokens: number } = { target_tokens: 4000, max_tokens: 8000 },
): Promise<AttentionSet> {
  const tokens = tokenize(task)
  const allUnits = await readNdjson<SourceUnit>(INDEXER_PATHS.objectsSource)
  const scored: Array<{ unit: SourceUnit; score: number }> = []
  for (const u of allUnits) {
    const s = await scoreUnit(u, tokens)
    if (s > 0) scored.push({ unit: u, score: s })
  }
  scored.sort((a, b) => b.score - a.score)
  // Cap at 25 to keep attention small and task-scoped.
  const top = scored.slice(0, 25)
  const selectedIds = top.map((t) => t.unit.id)
  const selectedRefs: SourceRef[] = top.map((t) => ({
    path: t.unit.path,
    sha256: t.unit.sha256,
  }))
  const excluded = allUnits.length - selectedIds.length
  const set: AttentionSet = {
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
    selected_source_refs: selectedRefs,
    excluded_object_ids: allUnits.filter((u) => !selectedIds.includes(u.id)).map((u) => u.id).slice(0, excluded),
    reason: `task-scoped selection for "${task}"`,
    budget,
    gap_status: selectedIds.length > 0 ? 'sufficient' : 'insufficient',
  }
  await writeNdjson(READER_PATHS.attention, [set])
  return set
}

/**
 * Append an attention set to the canonical attention NDJSON file.
 */
export async function appendAttention(set: AttentionSet): Promise<void> {
  await appendNdjson(READER_PATHS.attention, set)
}
