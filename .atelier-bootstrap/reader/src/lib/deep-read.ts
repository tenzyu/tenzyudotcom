/**
 * Deep-read proposal emission.
 *
 * The reader's deep-read phase never reads every source unit. It reads
 * only the source units referenced by an `AttentionSet` and emits a
 * deterministic JSONL of `ReaderProposal` records.
 *
 * Because Atelier v0 has no bundled LLM in this build, the proposal
 * emission is done by a deterministic stub. The contract is the same
 * regardless: every line is a `ReaderProposal` with valid `source_refs`.
 * The downstream `llm:accept` command validates the same contract.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson, writeNdjson, appendNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type AttentionSet,
  type ReaderProposal,
  type SourceRef,
  READER_PATHS,
} from '../../../lib/src/index.ts'
import { mkdir } from 'node:fs/promises'
import {
  anchorIdsForSourceRef,
  anchorIdsForSourceRefs,
  isDefaultExcludedPath,
  loadCurrentReaderIndex,
  validateSourceAnchorIds,
  validateSourceRefs,
  type ReaderKnowledgeObject,
  type ReaderSemanticClaim,
} from './relation-safety.ts'

type AnchoredReaderProposal = ReaderProposal & {
  source_anchor_ids?: string[]
}

function nowIso(): string {
  return new Date().toISOString()
}

async function headOfFile(relpath: string, max = 1024): Promise<string> {
  try {
    const text = await readFile(relpath, 'utf8')
    return text.length > max ? text.slice(0, max) : text
  } catch {
    return ''
  }
}

/**
 * Emit deterministic deep-read proposals for an attention set.
 *
 * The output is a JSONL of `ReaderProposal` records. Each proposal
 * references a `SourceRef` (path + sha256). The downstream accept
 * command will validate this contract.
 */
export async function emitDeepReadProposals(attentionId: string): Promise<{
  proposalsPath: string
  proposalCount: number
}> {
  const all = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const target = all.find((a) => a.id === attentionId)
  if (!target) {
    throw new Error(`attention set not found: ${attentionId}`)
  }
  const currentIndex = await loadCurrentReaderIndex()
  const proposals: AnchoredReaderProposal[] = []
  for (const ref of target.selected_source_refs) {
    if (isDefaultExcludedPath(ref.path)) continue
    const sourceAnchorIds = anchorIdsForSourceRef(currentIndex, ref)
    if (sourceAnchorIds.length === 0) continue
    const head = await headOfFile(ref.path, 1024)
    if (head.length === 0) continue
    const lower = head.toLowerCase()
    if (lower.includes('export ') || lower.includes('function ') || lower.includes('class ')) {
      proposals.push({
        proposal_kind: 'knowledge_object',
        title: `implementation note: ${path.basename(ref.path)}`,
        summary: `module exports behaviour inferred from ${ref.path}.`,
        knowledge_type: 'implementation_note',
        source_refs: [ref],
        source_anchor_ids: sourceAnchorIds,
        affordances: ['context', 'packet-constraint', 'review-candidate'],
        confidence: 'hypothesis',
      })
    }
    if (lower.includes('must ') || lower.includes('must not ') || lower.includes('invariant:')) {
      proposals.push({
        proposal_kind: 'semantic_claim',
        claim_type: 'invariant',
        text: `invariant statement detected in ${ref.path}`,
        modality: 'must',
        source_refs: [ref],
        source_anchor_ids: sourceAnchorIds,
        confidence: 'inferred',
      })
    }
    if (lower.includes('todo') || lower.includes('fixme')) {
      proposals.push({
        proposal_kind: 'gap',
        text: `${ref.path} contains TODO/FIXME markers`,
        blocking: false,
        source_refs: [ref],
      })
    }
  }
  // Always include a semantic_claim tying the attention set to the task.
  const taskRefs = target.selected_source_refs.filter((ref) => !isDefaultExcludedPath(ref.path)).slice(0, 1)
  const taskAnchorIds = anchorIdsForSourceRefs(currentIndex, taskRefs)
  if (taskRefs.length > 0 && taskAnchorIds.length > 0) {
    proposals.push({
      proposal_kind: 'semantic_claim',
      claim_type: 'assertion',
      text: `attention set selected for task: ${target.task}`,
      source_refs: taskRefs,
      source_anchor_ids: taskAnchorIds,
      confidence: 'inferred',
    })
  }
  await mkdir(READER_PATHS.proposalsDir, { recursive: true })
  const proposalsPath = path.join(READER_PATHS.proposalsDir, `${attentionId}.ndjson`)
  await writeNdjson(proposalsPath, proposals)
  return { proposalsPath, proposalCount: proposals.length }
}

/**
 * Accept a JSONL of proposals and write accepted KnowledgeObject and
 * SemanticClaim records. Used by `atelier-reader llm:accept`.
 */
export async function acceptProposals(
  inputPath: string,
): Promise<{ knowledge: ReaderKnowledgeObject[]; semantics: ReaderSemanticClaim[] }> {
  const proposals = await readNdjson<AnchoredReaderProposal>(inputPath)
  const currentIndex = await loadCurrentReaderIndex()
  const knowledge: ReaderKnowledgeObject[] = []
  const semantics: ReaderSemanticClaim[] = []
  for (const [idx, p] of proposals.entries()) {
    if (!p || typeof p !== 'object') {
      throw new Error(`proposal ${idx} is not an object`)
    }
    if (p.proposal_kind !== 'project_hypothesis' && p.proposal_kind !== 'attention_item' && p.proposal_kind !== 'gap') {
      const refs = (p as { source_refs?: SourceRef[] }).source_refs
      if (!refs || refs.length === 0) {
        throw new Error(`proposal ${idx} missing source_refs (kind=${p.proposal_kind})`)
      }
      const refIssues = validateSourceRefs(currentIndex, refs)
      if (refIssues.length > 0) {
        throw new Error(`proposal ${idx} invalid source_refs: ${refIssues.join('; ')}`)
      }
      const proposedAnchorIds = (p as { source_anchor_ids?: string[] }).source_anchor_ids
      const sourceAnchorIds = proposedAnchorIds && proposedAnchorIds.length > 0
        ? proposedAnchorIds
        : anchorIdsForSourceRefs(currentIndex, refs)
      const anchorIssues = validateSourceAnchorIds(currentIndex, sourceAnchorIds)
      if (anchorIssues.length > 0) {
        throw new Error(`proposal ${idx} invalid source_anchor_ids: ${anchorIssues.join('; ')}`)
      }
      p.source_anchor_ids = sourceAnchorIds
    }
    const createdAt = nowIso()
    if (p.proposal_kind === 'knowledge_object') {
      const id = deterministicId('ko', `${inputPath}:${idx}:${p.title}`)
      knowledge.push({
        id,
        kind: 'knowledge_object',
        version: '1',
        title: p.title,
        summary: p.summary,
        source_refs: p.source_refs,
        source_anchor_ids: p.source_anchor_ids ?? anchorIdsForSourceRefs(currentIndex, p.source_refs),
        produced_by: 'reader',
        provenance_kind: 'llm_extracted',
        confidence: p.confidence,
        status: 'fresh',
        affordances: p.affordances,
        created_at: createdAt,
        knowledge_type: p.knowledge_type,
      })
    } else if (p.proposal_kind === 'semantic_claim') {
      const id = deterministicId('sc', `${inputPath}:${idx}:${p.text}`)
      semantics.push({
        id,
        kind: 'semantic_claim',
        version: '1',
        title: p.text.slice(0, 80),
        source_refs: p.source_refs,
        source_anchor_ids: p.source_anchor_ids ?? anchorIdsForSourceRefs(currentIndex, p.source_refs),
        produced_by: 'reader',
        provenance_kind: 'llm_extracted',
        confidence: p.confidence,
        status: 'fresh',
        affordances: ['context', 'review-candidate'],
        created_at: createdAt,
        claim_type: p.claim_type,
        text: p.text,
        modality: p.modality,
      })
    } else if (p.proposal_kind === 'attention_item') {
      // Attention items are not standalone objects; they merge into the
      // next attention set. We still require source_refs or object_id.
      if (!p.object_id && !p.source_ref) {
        throw new Error(`attention_item ${idx} missing both object_id and source_ref`)
      }
    } else if (p.proposal_kind === 'project_hypothesis') {
      // Hypotheses live in the project brief; nothing to accept here.
    } else if (p.proposal_kind === 'gap') {
      // Gaps are reported but not stored as objects in v0.
    } else {
      throw new Error(`unknown proposal_kind at index ${idx}`)
    }
  }
  // Append to canonical NDJSON files.
  for (const k of knowledge) await appendNdjson(READER_PATHS.knowledge, k)
  for (const s of semantics) await appendNdjson(READER_PATHS.semantics, s)
  return { knowledge, semantics }
}
