/**
 * Transform recommendation emission with deterministic dedupe.
 *
 * Emits one `TransformRecommendation` per
 * `(source_object_id, recommendation_type)` pair, regardless of how
 * many times the same `KnowledgeObject` appears in the reader's
 * knowledge file. The deduped list is written to `recommendations.ndjson`
 * and the collapsed pairs (with the original occurrence count and
 * representative id) are written to `duplicates.ndjson` so the
 * operation verifier can flag noisy readers.
 *
 * Each recommendation's `reason` MUST cite at least one accepted
 * relation id. If the corresponding `KnowledgeObject` is grounded in
 * accepted relations, those ids are recorded in
 * `source_relation_ids` and the first id is cited in `reason`.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type DuplicateRecommendation,
  type KnowledgeObject,
  type TransformRecommendation,
  READER_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import { loadAcceptedRelations, pickAcceptedRelationsForAnchors } from './relations.ts'

function nowIso(): string {
  return new Date().toISOString()
}

const ALLOWED_AFFORDANCES = new Set<TransformRecommendation['recommendation_type']>([
  'lint-candidate',
  'test-candidate',
  'skill-candidate',
  'docs-candidate',
  'packet-constraint',
  'review-candidate',
])

function proposedOutputKind(recType: TransformRecommendation['recommendation_type']): string {
  switch (recType) {
    case 'test-candidate':
      return 'test_contract'
    case 'lint-candidate':
      return 'lint_rule'
    case 'skill-candidate':
      return 'skill'
    case 'docs-candidate':
      return 'doc'
    case 'packet-constraint':
      return 'edit_boundary'
    case 'review-candidate':
      return 'review'
  }
}

export interface EmitRecommendationsResult {
  recommendations: TransformRecommendation[]
  duplicates: DuplicateRecommendation[]
  /**
   * Number of raw `(source_object_id, recommendation_type)` pairs
   * the reader emitted before dedupe. Useful for the render layer
   * to report "N raw → M unique".
   */
  raw_pair_count: number
  /**
   * Number of raw pairs that were skipped because the underlying
   * knowledge object had no accepted relation trace. These pairs are
   * counted in `raw_pair_count` but do NOT produce an emitted
   * recommendation. The relation-kernel invariant requires that
   * every emitted recommendation cite an accepted relation.
   */
  ungrounded_skipped: number
}

export async function emitRecommendations(): Promise<TransformRecommendation[]> {
  const result = await emitRecommendationsDetailed()
  return result.recommendations
}

export async function emitRecommendationsDetailed(): Promise<EmitRecommendationsResult> {
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  const accepted = await loadAcceptedRelations()
  const seen = new Map<string, TransformRecommendation>()
  const dupCounts = new Map<string, number>()
  let rawPairCount = 0
  let ungroundedSkipped = 0
  for (const k of knowledge) {
    for (const a of k.affordances) {
      if (a === 'context') continue
      if (!ALLOWED_AFFORDANCES.has(a as TransformRecommendation['recommendation_type'])) continue
      const recType = a as TransformRecommendation['recommendation_type']
      const key = `${k.id}|${recType}`
      rawPairCount += 1
      // Find accepted relations that ground this knowledge object.
      // Anchor ids overlap with the knowledge object's id and the
      // source_refs it carries.
      const relatedAnchors = collectKnowledgeAnchorIds(k)
      const groundingRelations = pickAcceptedRelationsForAnchors(relatedAnchors, accepted)
      // Relation Kernel invariant: a recommendation MUST cite an
      // accepted relation. If the knowledge object is not grounded in
      // any accepted relation, we count the raw pair but do NOT emit
      // the recommendation (skipped). This is stricter than the prior
      // "ungrounded" marker and aligns with the contract.
      if (groundingRelations.length === 0) {
        ungroundedSkipped += 1
        continue
      }
      const next = (dupCounts.get(key) ?? 0) + 1
      dupCounts.set(key, next)
      if (seen.has(key)) continue
      const relationIds = groundingRelations.map((r) => r.id)
      const baseReason = k.summary
      const reason = `${baseReason} (based on edge:${relationIds[0]} ${groundingRelations[0]!.kind}: ${groundingRelations[0]!.from} -> ${groundingRelations[0]!.to})`
      seen.set(key, {
        id: deterministicId('rec', key),
        kind: 'transform_recommendation',
        version: '1',
        title: `recommendation: ${recType} from ${k.id}`,
        source_refs: k.source_refs,
        produced_by: 'transformer',
        provenance_kind: 'llm_extracted',
        confidence: k.confidence,
        status: 'proposed',
        affordances: [recType],
        created_at: nowIso(),
        source_object_id: k.id,
        recommendation_type: recType,
        reason,
        proposed_output_kind: proposedOutputKind(recType),
        source_relation_ids: relationIds,
      })
    }
  }
  const recommendations = [...seen.values()].sort((a, b) => a.id.localeCompare(b.id))
  const detectedAt = nowIso()
  const duplicates: DuplicateRecommendation[] = []
  for (const [key, count] of dupCounts) {
    if (count <= 1) continue
    const sep = key.indexOf('|')
    const sourceObjectId = key.slice(0, sep)
    const recommendationType = key.slice(sep + 1) as TransformRecommendation['recommendation_type']
    const representative = seen.get(key)
    duplicates.push({
      schema: 'atelier.duplicate-recommendation/v1',
      source_object_id: sourceObjectId,
      recommendation_type: recommendationType,
      count,
      representative_recommendation_id: representative?.id ?? '',
      detected_at: detectedAt,
    })
  }
  duplicates.sort((a, b) => a.source_object_id.localeCompare(b.source_object_id))
  await writeNdjson(TRANSFORMER_PATHS.recommendations, recommendations)
  await writeNdjson(TRANSFORMER_PATHS.duplicates, duplicates)
  return { recommendations, duplicates, raw_pair_count: rawPairCount, ungrounded_skipped: ungroundedSkipped }
}

/**
 * Anchor ids to use for matching accepted relations to a knowledge
 * object. A knowledge object's `id` is itself an anchor-like id, and
 * `source_anchor_ids` (when present) lists source anchors the reader
 * recorded. We union them so relation matching works even for legacy
 * knowledge objects that predate the field.
 */
function collectKnowledgeAnchorIds(k: KnowledgeObject): string[] {
  const out: string[] = [k.id]
  const sourceAnchorIds = (k as unknown as { source_anchor_ids?: string[] }).source_anchor_ids
  if (Array.isArray(sourceAnchorIds)) {
    for (const id of sourceAnchorIds) {
      if (typeof id === 'string' && id.length > 0) out.push(id)
    }
  }
  return out
}
