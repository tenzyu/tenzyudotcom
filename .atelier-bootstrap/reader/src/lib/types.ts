/**
 * Reader-specific type definitions.
 *
 * These types are derived from the contract documents and use the shared
 * `AtelierObjectBase` shape.
 */
import type { RelationProposal, SourceRef } from '../../../lib/src/index.ts'

export type { RelationProposal }

export type ProjectBrief = {
  schema: 'atelier.project-brief/v1'
  status: 'hypothesis'
  generated_at: string
  observed_facts: Array<{ fact: string; source_refs: SourceRef[] }>
  hypotheses: ProjectHypothesis[]
  unresolved_questions: string[]
}

export type ProjectHypothesis = {
  id: string
  statement: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
}

/**
 * The shape of an `AtelierEdge` (in `lib/src/types.ts`) for the reader's
 * purpose. The reader only ever emits a *partial* `AtelierEdge`: at
 * minimum `from`, `to`, and `kind` are required.
 */
export type ProposedRelation = {
  from: string
  to: string
  kind: RelationProposal['proposed_relation']['kind']
}
