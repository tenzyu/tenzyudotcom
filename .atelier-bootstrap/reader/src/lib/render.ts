/**
 * Reader rendering and validation.
 *
 * Render produces the human-readable Markdown views for the reader's
 * objects. Validate checks every contract obligation.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson, fileExists } from '../../../lib/src/ndjson.ts'
import {
  type RelationProposal,
  READER_PATHS,
} from '../../../lib/src/index.ts'
import { writeText } from '../../../lib/src/json.ts'
import {
  isDefaultExcludedPath,
  loadCurrentReaderIndex,
  validateAcceptedRelationAgainstCurrentIndex,
  validateProposalAgainstCurrentIndex,
  validateSourceAnchorIds,
  validateSourceRefs,
  type ReaderAcceptedRelation,
  type ReaderAttentionSet,
  type ReaderKnowledgeObject,
  type ReaderSemanticClaim,
} from './relation-safety.ts'

const GENERATED_MARKER = '<!-- GENERATED FILE. DO NOT EDIT DIRECTLY. -->'

function header(title: string, source: string): string {
  return [
    GENERATED_MARKER,
    `# ${title}`,
    '',
    `Source: \`${source}\``,
    `Generated: ${new Date().toISOString()}`,
    '',
  ].join('\n')
}

async function readProjectBriefMarkdown(): Promise<string> {
  try {
    const text = await readFile(READER_PATHS.projectBrief, 'utf8')
    return text
  } catch {
    return '_no project brief yet_'
  }
}

export async function renderProjectBriefView(): Promise<string> {
  const yaml = await readProjectBriefMarkdown()
  const out: string[] = [header('PROJECT_BRIEF', 'atelier-reader sample')]
  out.push('## Project brief (YAML)')
  out.push('```yaml')
  out.push(yaml)
  out.push('```')
  out.push('')
  return out.join('\n')
}

export async function renderAttentionSetsView(): Promise<string> {
  const sets = await readNdjson<ReaderAttentionSet>(READER_PATHS.attention)
  const out: string[] = [header('ATTENTION_SETS', 'atelier-reader attention')]
  out.push(`Total sets: ${sets.length}`)
  out.push('')
  for (const s of sets) {
    out.push(`## ${s.id}`)
    out.push(`- task: ${s.task}`)
    out.push(`- reason: ${s.reason}`)
    out.push(`- selected: ${s.selected_object_ids.length}`)
    out.push(`- selected anchors: ${(s.selected_anchor_ids ?? []).length}`)
    out.push(`- gap_status: ${s.gap_status}`)
    out.push(`- budget: ${s.budget.target_tokens} target / ${s.budget.max_tokens} max`)
    if (s.selected_source_refs.length > 0) {
      out.push('- selected source_refs:')
      for (const r of s.selected_source_refs.slice(0, 10)) {
        out.push(`  - \`${r.path}\``)
      }
      if (s.selected_source_refs.length > 10) {
        out.push(`  - ... ${s.selected_source_refs.length - 10} more`)
      }
    }
    out.push('')
  }
  return out.join('\n')
}

export async function renderKnowledgeView(): Promise<string> {
  const knowledge = await readNdjson<ReaderKnowledgeObject>(READER_PATHS.knowledge)
  const semantics = await readNdjson<ReaderSemanticClaim>(READER_PATHS.semantics)
  const out: string[] = [header('KNOWLEDGE_OBJECTS', 'atelier-reader deep-read')]
  out.push(`## Knowledge objects: ${knowledge.length}`)
  for (const k of knowledge.slice(0, 50)) {
    out.push(`### ${k.title}`)
    out.push(`- id: \`${k.id}\``)
    out.push(`- knowledge_type: ${k.knowledge_type}`)
    out.push(`- confidence: ${k.confidence}`)
    out.push(`- affordances: ${k.affordances.join(', ')}`)
    out.push(`- summary: ${k.summary}`)
    if (k.source_refs.length > 0) {
      out.push(`- source_refs:`)
      for (const r of k.source_refs) out.push(`  - \`${r.path}\``)
    }
    if ((k.source_anchor_ids ?? []).length > 0) {
      out.push(`- source_anchor_ids: ${(k.source_anchor_ids ?? []).join(', ')}`)
    }
    out.push('')
  }
  if (knowledge.length > 50) out.push(`_... ${knowledge.length - 50} more_\n`)
  out.push(`## Semantic claims: ${semantics.length}`)
  for (const s of semantics.slice(0, 50)) {
    out.push(`- (${s.claim_type}) ${s.text}`)
  }
  if (semantics.length > 50) out.push(`_... ${semantics.length - 50} more_`)
  out.push('')
  return out.join('\n')
}

/**
 * Render a Markdown view summarising reader relation proposals.
 *
 * Views are not truth. The view lists counts by kind and a small
 * sample of proposals.
 */
export async function renderRelationProposalsView(): Promise<string> {
  const proposals = await readNdjson<RelationProposal>(READER_PATHS.relationProposals)
  const acceptedEdges = (await fileExists(READER_PATHS.readerAcceptedRelations))
    ? await readNdjson<ReaderAcceptedRelation>(READER_PATHS.readerAcceptedRelations)
    : []
  const byKind: Record<string, { total: number; proposed: number; accepted: number; rejected: number; stale: number }> = {}
  for (const p of proposals) {
    const k = p.proposed_relation.kind
    if (!byKind[k]) byKind[k] = { total: 0, proposed: 0, accepted: 0, rejected: 0, stale: 0 }
    byKind[k].total += 1
    if (p.status === 'proposed') byKind[k].proposed += 1
    else if (p.status === 'accepted') byKind[k].accepted += 1
    else if (p.status === 'rejected') byKind[k].rejected += 1
    else if (p.status === 'stale') byKind[k].stale += 1
  }
  const out: string[] = [header('RELATION_PROPOSALS', 'atelier-reader relations:propose')]
  out.push(`## Total proposals: ${proposals.length}`)
  out.push(`## Accepted edges: ${acceptedEdges.length}`)
  out.push('')
  out.push('### Counts by kind')
  out.push('')
  out.push('| kind | total | proposed | accepted | rejected | stale |')
  out.push('| --- | ---: | ---: | ---: | ---: | ---: |')
  const kindNames = Object.keys(byKind).sort()
  for (const k of kindNames) {
    const row = byKind[k]!
    out.push(`| ${k} | ${row.total} | ${row.proposed} | ${row.accepted} | ${row.rejected} | ${row.stale} |`)
  }
  if (kindNames.length === 0) {
    out.push('| _none_ | 0 | 0 | 0 | 0 | 0 |')
  }
  out.push('')
  out.push('### Sample proposals (first 20)')
  for (const p of proposals.slice(0, 20)) {
    out.push(
      `- ${p.status} ${p.proposed_relation.kind} (${p.confidence}): ${p.proposed_relation.from} -> ${p.proposed_relation.to}`,
    )
  }
  if (proposals.length > 20) out.push(`_... ${proposals.length - 20} more_`)
  out.push('')
  return out.join('\n')
}

export async function renderAll(): Promise<{ files: string[] }> {
  await mkdir(path.dirname(READER_PATHS.projectBriefView), { recursive: true })
  const brief = await renderProjectBriefView()
  const att = await renderAttentionSetsView()
  const ko = await renderKnowledgeView()
  const rp = await renderRelationProposalsView()
  await writeText(READER_PATHS.projectBriefView, brief)
  await writeText(READER_PATHS.attentionView, att)
  await writeText(READER_PATHS.knowledgeView, ko)
  await writeText(READER_PATHS.relationProposalsView, rp)
  return {
    files: [
      READER_PATHS.projectBriefView,
      READER_PATHS.attentionView,
      READER_PATHS.knowledgeView,
      READER_PATHS.relationProposalsView,
    ],
  }
}

export type ValidationIssue = {
  severity: 'P0' | 'P1' | 'P2'
  code: string
  message: string
  affected_record?: string
  recommended_next_action?: string
}

export async function validateReader(): Promise<{ issues: ValidationIssue[]; warnings: string[]; stats: unknown }> {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []
  const currentIndex = await loadCurrentReaderIndex()

  // 1. project brief must exist and be hypothesis-only
  let briefText: string | null = null
  try {
    briefText = await readFile(READER_PATHS.projectBrief, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      issues.push({
        severity: 'P0',
        code: 'E_BRIEF_MISSING',
        message: 'project brief is missing',
        recommended_next_action: 'run `bun run sample`',
      })
    }
  }
  if (briefText && !briefText.includes('status: hypothesis')) {
    issues.push({
      severity: 'P0',
      code: 'E_BRIEF_NOT_HYPOTHESIS',
      message: 'project brief does not declare status: hypothesis',
      affected_record: READER_PATHS.projectBrief,
    })
  }

  // 2. attention sets reference real objects
  const att = await readNdjson<ReaderAttentionSet>(READER_PATHS.attention)
  const units = currentIndex.units
  const ids = new Set(units.map((u) => u.id))
  const nonExcludedUnitCount = units.filter((u) => !isDefaultExcludedPath(u.path)).length
  for (const a of att) {
    if (a.gap_status === 'sufficient' && (
      a.selected_object_ids.length === 0 ||
      (a.selected_anchor_ids ?? []).length === 0 ||
      a.selected_source_refs.length === 0
    )) {
      issues.push({
        severity: 'P0',
        code: 'E_ATTENTION_EMPTY_SUFFICIENT',
        message: `attention set ${a.id} is marked sufficient but lacks selected objects, anchors, or source refs`,
        affected_record: a.id,
      })
    }
    for (const sid of a.selected_object_ids) {
      if (!ids.has(sid)) {
        issues.push({
          severity: 'P1',
          code: 'E_ATTENTION_MISSING_OBJECT',
          message: `attention set ${a.id} references missing object ${sid}`,
          affected_record: a.id,
        })
      }
    }
    const anchorIssues = validateSourceAnchorIds(currentIndex, a.selected_anchor_ids)
    if (a.gap_status === 'sufficient' && anchorIssues.length > 0) {
      issues.push({
        severity: 'P0',
        code: 'E_ATTENTION_ANCHORS',
        message: `attention set ${a.id} has invalid selected_anchor_ids: ${anchorIssues.join('; ')}`,
        affected_record: a.id,
      })
    }
    const refIssues = validateSourceRefs(currentIndex, a.selected_source_refs)
    if (a.gap_status === 'sufficient' && refIssues.length > 0) {
      issues.push({
        severity: 'P0',
        code: 'E_ATTENTION_SOURCE_REFS',
        message: `attention set ${a.id} has invalid selected_source_refs: ${refIssues.join('; ')}`,
        affected_record: a.id,
      })
    }
    if (a.provenance_kind !== 'llm_extracted') {
      issues.push({
        severity: 'P1',
        code: 'E_ATTENTION_PROVENANCE',
        message: `attention set ${a.id} has provenance ${a.provenance_kind} (expected llm_extracted)`,
        affected_record: a.id,
      })
    }
    // Build-artifact exclusion: no attention path may point at
    // a build artifact.
    for (const r of a.selected_source_refs) {
      if (isDefaultExcludedPath(r.path)) {
        issues.push({
          severity: 'P0',
          code: 'E_ATTENTION_BUILD_ARTIFACT',
          message: `attention set ${a.id} selected a build-artifact path: ${r.path}`,
          affected_record: a.id,
          recommended_next_action: 're-run attention with a tighter task description',
        })
      }
    }
    for (const sid of a.selected_object_ids) {
      const u = units.find((x) => x.id === sid)
      if (u && isDefaultExcludedPath(u.path)) {
        issues.push({
          severity: 'P0',
          code: 'E_ATTENTION_BUILD_ARTIFACT',
          message: `attention set ${a.id} selected a build-artifact object: ${u.path}`,
          affected_record: a.id,
          recommended_next_action: 're-run attention with a tighter task description',
        })
      }
    }
  }

  // 3. LLM-derived records carry provenance and source refs
  const knowledge = await readNdjson<ReaderKnowledgeObject>(READER_PATHS.knowledge)
  if (knowledge.length === 0) {
    issues.push({
      severity: 'P0',
      code: 'E_KNOWLEDGE_MISSING',
      message: 'reader emitted no KnowledgeObject records; run deep-read/llm:accept for an attention set',
      recommended_next_action: 'run `bun run atelier:deep-read -- --attention <id>`',
    })
  }
  for (const k of knowledge) {
    const sourceRefs = Array.isArray(k.source_refs) ? k.source_refs : []
    const sourceAnchorIds = Array.isArray(k.source_anchor_ids) ? k.source_anchor_ids : []
    if (k.kind !== 'knowledge_object') {
      issues.push({
        severity: 'P0',
        code: 'E_KNOWLEDGE_SCHEMA',
        message: `record ${k.id} is not kind=knowledge_object`,
        affected_record: k.id,
      })
    }
    // Acceptable provenance for the reader: `llm_extracted` (the
    // legacy path) OR `deterministic_fact` (the
    // `materialize-objects` path). Other provenance kinds are
    // rejected.
    if (k.provenance_kind !== 'llm_extracted' && k.provenance_kind !== 'deterministic_fact') {
      issues.push({
        severity: 'P1',
        code: 'E_KNOWLEDGE_PROVENANCE',
        message: `knowledge object ${k.id} has provenance ${k.provenance_kind} (expected llm_extracted or deterministic_fact)`,
        affected_record: k.id,
      })
    }
    if (sourceRefs.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_KNOWLEDGE_SOURCES',
        message: `knowledge object ${k.id} has no source_refs`,
        affected_record: k.id,
      })
    }
    // `confidence: 'fact'` is indexer-only. Any other producer
    // (reader, transformer, executor, operation) that emits a
    // `fact` confidence must be rejected so the validator remains
    // fail-closed against accidental producer drift. The
    // `KnowledgeObject` type already excludes `'fact'`, but the
    // check is repeated at runtime because the NDJSON file is
    // external input and may contain an over-eager producer.
    const knowledgeConfidence = k.confidence as string
    if (knowledgeConfidence === 'fact' && k.produced_by !== 'indexer') {
      issues.push({
        severity: 'P0',
        code: 'E_KNOWLEDGE_FACT_NOT_INDEXER',
        message: `knowledge object ${k.id} has confidence 'fact' but produced_by=${k.produced_by} (fact is indexer-only)`,
        affected_record: k.id,
      })
    }
    const refIssues = validateSourceRefs(currentIndex, sourceRefs)
    if (refIssues.length > 0) {
      issues.push({
        severity: 'P0',
        code: 'E_KNOWLEDGE_SOURCES_CURRENT',
        message: `knowledge object ${k.id} has invalid source_refs: ${refIssues.join('; ')}`,
        affected_record: k.id,
      })
    }
    const anchorIssues = validateSourceAnchorIds(currentIndex, sourceAnchorIds)
    if (anchorIssues.length > 0) {
      issues.push({
        severity: 'P0',
        code: 'E_KNOWLEDGE_ANCHORS',
        message: `knowledge object ${k.id} has invalid source_anchor_ids: ${anchorIssues.join('; ')}`,
        affected_record: k.id,
      })
    }
  }
  const semantics = await readNdjson<ReaderSemanticClaim>(READER_PATHS.semantics)
  if (semantics.length === 0) {
    issues.push({
      severity: 'P0',
      code: 'E_SEMANTICS_MISSING',
      message: 'reader emitted no SemanticClaim records; run deep-read/llm:accept for an attention set',
      recommended_next_action: 'run `bun run atelier:deep-read -- --attention <id>`',
    })
  }
  for (const s of semantics) {
    const sourceRefs = Array.isArray(s.source_refs) ? s.source_refs : []
    const sourceAnchorIds = Array.isArray(s.source_anchor_ids) ? s.source_anchor_ids : []
    if (s.kind !== 'semantic_claim') {
      issues.push({
        severity: 'P0',
        code: 'E_SEMANTICS_SCHEMA',
        message: `record ${s.id} is not kind=semantic_claim`,
        affected_record: s.id,
      })
    }
    if (sourceRefs.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_SEMANTICS_SOURCES',
        message: `semantic claim ${s.id} has no source_refs`,
        affected_record: s.id,
      })
    }
    // `confidence: 'fact'` is indexer-only. Any other producer
    // (reader, transformer, executor, operation) that emits a
    // `fact` confidence must be rejected.
    const semanticConfidence = s.confidence as string
    if (semanticConfidence === 'fact' && s.produced_by !== 'indexer') {
      issues.push({
        severity: 'P0',
        code: 'E_SEMANTICS_FACT_NOT_INDEXER',
        message: `semantic claim ${s.id} has confidence 'fact' but produced_by=${s.produced_by} (fact is indexer-only)`,
        affected_record: s.id,
      })
    }
    const refIssues = validateSourceRefs(currentIndex, sourceRefs)
    if (refIssues.length > 0) {
      issues.push({
        severity: 'P0',
        code: 'E_SEMANTICS_SOURCES_CURRENT',
        message: `semantic claim ${s.id} has invalid source_refs: ${refIssues.join('; ')}`,
        affected_record: s.id,
      })
    }
    const anchorIssues = validateSourceAnchorIds(currentIndex, sourceAnchorIds)
    if (anchorIssues.length > 0) {
      issues.push({
        severity: 'P0',
        code: 'E_SEMANTICS_ANCHORS',
        message: `semantic claim ${s.id} has invalid source_anchor_ids: ${anchorIssues.join('; ')}`,
        affected_record: s.id,
      })
    }
  }

  // 4. deep read must not read all source units
  if (att.length > 0) {
    for (const a of att) {
      if (nonExcludedUnitCount > 0 && a.selected_object_ids.length >= nonExcludedUnitCount) {
        issues.push({
          severity: 'P0',
          code: 'E_DEEPREAD_NOT_SCOPED',
          message: `attention set ${a.id} selected all non-excluded source units (${a.selected_object_ids.length} >= ${nonExcludedUnitCount})`,
          affected_record: a.id,
          recommended_next_action: 'tighten the attention set selection',
        })
      }
    }
  }

  // 5. views exist and have the generated marker
  for (const vf of [
    READER_PATHS.projectBriefView,
    READER_PATHS.attentionView,
    READER_PATHS.knowledgeView,
    READER_PATHS.relationProposalsView,
  ]) {
    try {
      const text = await readFile(vf, 'utf8')
      if (!text.includes('GENERATED FILE. DO NOT EDIT DIRECTLY.')) {
        issues.push({
          severity: 'P1',
          code: 'E_VIEW_STALE_MARKER',
          message: `view ${vf} missing generated marker`,
          affected_record: vf,
          recommended_next_action: 'rerun `bun run render`',
        })
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        warnings.push(`view ${vf} missing; run \`bun run render\``)
      }
    }
  }

  // 6. RelationProposal schema validation. When an attention set
  //    exists, at least one proposal must exist (P0).
  const proposals = await readNdjson<RelationProposal>(READER_PATHS.relationProposals)
  const acceptedEdges = (await fileExists(READER_PATHS.readerAcceptedRelations))
    ? await readNdjson<ReaderAcceptedRelation>(READER_PATHS.readerAcceptedRelations)
    : []
  const acceptedKey = (e: { from: string; to: string; kind: string }): string =>
    `${e.from}|${e.to}|${e.kind}`
  const acceptedKeys = new Set(acceptedEdges.map(acceptedKey))
  const sufficientAttentionSets = att.filter((a) => a.gap_status === 'sufficient' && a.selected_object_ids.length > 0)
  if (sufficientAttentionSets.length > 0 && proposals.length === 0) {
    issues.push({
      severity: 'P0',
      code: 'E_RELATION_PROPOSALS_MISSING',
      message: 'attention set exists but no relation proposals were emitted; run `bun run atelier:relations:propose`',
      recommended_next_action: 'run `bun run atelier:relations:propose`',
    })
  }
  const proposalIdSet = new Set<string>()
  const acceptedProposalKeys = new Set<string>()
  for (const p of proposals) {
    const proposalId = p.proposal_id ?? '<missing-proposal-id>'
    const proposedRelation = p.proposed_relation ?? { from: '', to: '', kind: '' }
    const sourceAnchorIds = Array.isArray(p.source_anchor_ids) ? p.source_anchor_ids : []
    const sourceRefs = Array.isArray(p.source_refs) ? p.source_refs : []
    if (proposalIdSet.has(proposalId)) {
      issues.push({
        severity: 'P1',
        code: 'E_RELATION_PROPOSAL_DUPLICATE_ID',
        message: `duplicate proposal_id: ${proposalId}`,
        affected_record: proposalId,
      })
    }
    proposalIdSet.add(proposalId)
    const validationIssues = validateProposalAgainstCurrentIndex(currentIndex, p)
    for (const validationIssue of validationIssues) {
      issues.push({
        severity: 'P0',
        code: 'E_RELATION_PROPOSAL_INVALID',
        message: `relation proposal ${proposalId} is invalid: ${validationIssue}`,
        affected_record: proposalId,
      })
    }
    if (sourceAnchorIds.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_RELATION_PROPOSAL_NO_ANCHORS',
        message: `relation proposal ${proposalId} has no source_anchor_ids`,
        affected_record: proposalId,
      })
    }
    if (sourceRefs.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_RELATION_PROPOSAL_NO_REFS',
        message: `relation proposal ${proposalId} has no source_refs`,
        affected_record: proposalId,
      })
    }
    if (!proposedRelation.from || !proposedRelation.to) {
      issues.push({
        severity: 'P0',
        code: 'E_RELATION_PROPOSAL_UNRESOLVED',
        message: `relation proposal ${proposalId} has unresolved from/to (from=${proposedRelation.from} to=${proposedRelation.to})`,
        affected_record: proposalId,
      })
    }
    if (proposedRelation.kind === 'contains') {
      issues.push({
        severity: 'P0',
        code: 'E_RELATION_PROPOSAL_CONTAINS',
        message: `reader must not propose 'contains' (proposal ${proposalId})`,
        affected_record: proposalId,
      })
    }
    // Build-artifact exclusion applies to every source ref.
    for (const r of sourceRefs) {
      if (isDefaultExcludedPath(r.path)) {
        issues.push({
          severity: 'P0',
          code: 'E_RELATION_PROPOSAL_BUILD_ARTIFACT',
          message: `relation proposal ${proposalId} cites build-artifact path: ${r.path}`,
          affected_record: proposalId,
        })
      }
    }
    // Accepted proposals must be backed by an entry in the
    // reader accepted-edges file.
    if (p.status === 'accepted') {
      const k = acceptedKey({
        from: proposedRelation.from,
        to: proposedRelation.to,
        kind: proposedRelation.kind,
      })
      if (!acceptedKeys.has(k)) {
        issues.push({
          severity: 'P0',
          code: 'E_RELATION_PROPOSAL_ACCEPTED_NOT_MATERIALISED',
          message: `relation proposal ${proposalId} is marked accepted but no edge exists at ${READER_PATHS.readerAcceptedRelations}`,
          affected_record: proposalId,
        })
      }
      acceptedProposalKeys.add(k)
    } else {
      const k = acceptedKey({
        from: proposedRelation.from,
        to: proposedRelation.to,
        kind: proposedRelation.kind,
      })
      if (acceptedKeys.has(k)) {
        issues.push({
          severity: 'P0',
          code: 'E_RELATION_PROPOSAL_NOT_ACCEPTED_MATERIALISED',
          message: `relation proposal ${proposalId} is ${p.status} but an accepted edge exists`,
          affected_record: proposalId,
        })
      }
    }
  }

  for (const edge of acceptedEdges) {
    const validationIssues = validateAcceptedRelationAgainstCurrentIndex(currentIndex, edge)
    for (const validationIssue of validationIssues) {
      issues.push({
        severity: 'P0',
        code: 'E_ACCEPTED_RELATION_INVALID',
        message: `accepted reader relation ${edge.id} is invalid: ${validationIssue}`,
        affected_record: edge.id,
      })
    }
    const k = acceptedKey(edge)
    if (!acceptedProposalKeys.has(k)) {
      issues.push({
        severity: 'P0',
        code: 'E_ACCEPTED_RELATION_NO_ACCEPTED_PROPOSAL',
        message: `accepted reader relation ${edge.id} has no matching proposal marked accepted`,
        affected_record: edge.id,
      })
    }
  }

  // 7. knowledge.json must NOT be the source of truth for an LLM. It must
  //    have source_refs and provenance (already checked).
  void writeFile

  return {
    issues,
    warnings,
    stats: {
      attention_sets: att.length,
      knowledge_objects: knowledge.length,
      semantic_claims: semantics.length,
      relation_proposals: proposals.length,
      accepted_relations: acceptedEdges.length,
      sufficient_attention_sets: sufficientAttentionSets.length,
    },
  }
}
