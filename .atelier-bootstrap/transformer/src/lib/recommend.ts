/**
 * Transform recommendation emission.
 *
 * Recommends follow-up artifacts that should be produced from the
 * current object graph: lint candidates, test candidates, skill
 * candidates, docs candidates, packet constraints, and review candidates.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
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

export async function emitRecommendations(): Promise<TransformRecommendation[]> {
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  const out: TransformRecommendation[] = []
  for (const k of knowledge) {
    for (const a of k.affordances) {
      if (a === 'context') continue
      if (!ALLOWED_AFFORDANCES.has(a as TransformRecommendation['recommendation_type'])) continue
      const recType = a as TransformRecommendation['recommendation_type']
      out.push({
        id: deterministicId('rec', `${k.id}:${recType}`),
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
        proposed_output_kind: recType === 'test-candidate' ? 'test_contract' : recType === 'lint-candidate' ? 'lint_rule' : recType === 'skill-candidate' ? 'skill' : recType === 'docs-candidate' ? 'doc' : recType === 'packet-constraint' ? 'edit_boundary' : 'review',
      })
    }
  }
  await writeNdjson(TRANSFORMER_PATHS.recommendations, out)
  return out
}
