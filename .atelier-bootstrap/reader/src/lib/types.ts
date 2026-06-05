/**
 * Reader-specific type definitions.
 *
 * These types are derived from the contract documents and use the shared
 * `AtelierObjectBase` shape.
 */
import type { SourceRef } from '../../../lib/src/index.ts'

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
