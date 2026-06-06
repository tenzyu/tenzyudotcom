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
}

export async function emitRecommendations(): Promise<TransformRecommendation[]> {
  const result = await emitRecommendationsDetailed()
  return result.recommendations
}

export async function emitRecommendationsDetailed(): Promise<EmitRecommendationsResult> {
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  const seen = new Map<string, TransformRecommendation>()
  const dupCounts = new Map<string, number>()
  let rawPairCount = 0
  for (const k of knowledge) {
    for (const a of k.affordances) {
      if (a === 'context') continue
      if (!ALLOWED_AFFORDANCES.has(a as TransformRecommendation['recommendation_type'])) continue
      const recType = a as TransformRecommendation['recommendation_type']
      const key = `${k.id}|${recType}`
      rawPairCount += 1
      const next = (dupCounts.get(key) ?? 0) + 1
      dupCounts.set(key, next)
      if (seen.has(key)) continue
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
        reason: k.summary,
        proposed_output_kind: proposedOutputKind(recType),
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
  return { recommendations, duplicates, raw_pair_count: rawPairCount }
}
