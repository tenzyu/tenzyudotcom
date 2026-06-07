/**
 * Deterministic KnowledgeObject and SemanticClaim materialization.
 *
 * The reader may not always have an LLM available. The Relation
 * Kernel must still pass when no LLM is reachable. This module is
 * the deterministic fallback: it derives schema-bound
 * `KnowledgeObject` and `SemanticClaim` records directly from the
 * indexer's `SourceAnchor`s and the attention set's
 * `selected_source_refs`.
 *
 * The materialised records are *not* LLM extractions: they carry
 * `provenance_kind: 'deterministic_fact'` and `confidence: 'inferred'`.
 * The reader validator accepts this combination (it rejects only
 * `confidence: 'fact'` from a non-indexer producer).
 *
 * Output mapping (deterministic):
 *
 *   path-based heuristic                knowledge_type          claim_type
 *   ---------------------------------   ---------------------   -----------
 *   markdown / docs / config files      repo_convention         definition
 *   TypeScript / JS / other code        framework_constraint    invariant
 *
 * The records are appended to:
 *   - `.atelier/v0/objects/knowledge.ndjson`
 *   - `.atelier/v0/objects/semantics.ndjson`
 *
 * Re-running `materializeObjectsForAttention` is idempotent: records
 * are keyed by their deterministic id (a hash of the attention id,
 * the path, and the per-kind discriminator), so duplicates are
 * dropped on a re-run.
 */
import path from 'node:path'
import {
  deterministicId,
  type AttentionSet,
  READER_PATHS,
} from '../../../lib/src/index.ts'
import { appendNdjson, readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  anchorIdsForSourceRef,
  isDefaultExcludedPath,
  loadCurrentReaderIndex,
  validateSourceRefs,
  type ReaderKnowledgeObject,
  type ReaderSemanticClaim,
} from './relation-safety.ts'

/**
 * Set of extensions that we treat as "code". These get
 * `framework_constraint` knowledge_type and `invariant` claim_type.
 */
const CODE_EXTENSIONS = new Set<string>([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.rs',
  '.go',
  '.rb',
  '.java',
  '.kt',
  '.swift',
  '.c',
  '.cc',
  '.cpp',
  '.h',
  '.hpp',
  '.cs',
])

/**
 * Per-source-ref materialisation result.
 */
type RefMaterialization = {
  ref: import('../../../lib/src/index.ts').SourceRef
  knowledge: ReaderKnowledgeObject
  semantic: ReaderSemanticClaim
  skipped: false
} | {
  ref: import('../../../lib/src/index.ts').SourceRef
  reason: string
  skipped: true
}

function nowIso(): string {
  return new Date().toISOString()
}

function isCodePath(relpath: string): boolean {
  const ext = path.extname(relpath).toLowerCase()
  return CODE_EXTENSIONS.has(ext)
}

/**
 * Build a single `KnowledgeObject` from a source ref. The path-based
 * heuristic chooses between `repo_convention` (markdown / config)
 * and `framework_constraint` (code). The record carries
 * `provenance_kind: 'deterministic_fact'` and
 * `confidence: 'inferred'`.
 */
function buildKnowledgeObjectForRef(
  attention: AttentionSet,
  ref: import('../../../lib/src/index.ts').SourceRef,
  anchorIds: ReadonlyArray<string>,
): ReaderKnowledgeObject {
  const knowledgeType = isCodePath(ref.path) ? 'framework_constraint' : 'repo_convention'
  const id = deterministicId('ko', `materialize:${attention.id}:${ref.path}:${knowledgeType}`)
  return {
    id,
    kind: 'knowledge_object',
    version: '1',
    title: `${knowledgeType === 'framework_constraint' ? 'Framework constraint' : 'Repo convention'}: ${ref.path}`,
    summary: `Deterministic record materialised from attention set ${attention.id} for ${ref.path}. attention task: ${attention.task}`,
    body_ref: ref.path,
    source_refs: [ref],
    source_anchor_ids: [...anchorIds],
    produced_by: 'reader',
    provenance_kind: 'deterministic_fact',
    confidence: 'inferred',
    status: 'fresh',
    affordances: ['context', 'packet-constraint', 'review-candidate'],
    created_at: nowIso(),
    knowledge_type: knowledgeType,
  }
}

/**
 * Build a single `SemanticClaim` from a source ref. Code paths get
 * `invariant`, documentation paths get `definition`.
 */
function buildSemanticClaimForRef(
  attention: AttentionSet,
  ref: import('../../../lib/src/index.ts').SourceRef,
  anchorIds: ReadonlyArray<string>,
): ReaderSemanticClaim {
  const claimType = isCodePath(ref.path) ? 'invariant' : 'definition'
  const id = deterministicId('sc', `materialize:${attention.id}:${ref.path}:${claimType}`)
  const text = claimType === 'invariant'
    ? `invariant: ${ref.path} is part of the surface area for task "${attention.task}" (materialised deterministically)`
    : `definition: ${ref.path} documents the surface area for task "${attention.task}" (materialised deterministically)`
  return {
    id,
    kind: 'semantic_claim',
    version: '1',
    title: text.slice(0, 80),
    source_refs: [ref],
    source_anchor_ids: [...anchorIds],
    produced_by: 'reader',
    provenance_kind: 'deterministic_fact',
    confidence: 'inferred',
    status: 'fresh',
    affordances: ['context', 'review-candidate'],
    created_at: nowIso(),
    claim_type: claimType,
    text,
    modality: claimType === 'invariant' ? 'invariant' : 'definition',
  }
}

/**
 * Resolve the latest attention set id from the attention NDJSON
 * file. Returns `undefined` when no attention set has been written.
 */
export async function findLatestAttentionId(): Promise<string | undefined> {
  const all = await readNdjson<AttentionSet>(READER_PATHS.attention)
  if (all.length === 0) return undefined
  return all[all.length - 1]!.id
}

/**
 * Materialise deterministic KnowledgeObject and SemanticClaim records
 * for an attention set.
 *
 * The materialised records are merged into the canonical NDJSON files
 * (`knowledge.ndjson` and `semantics.ndjson`). Existing records with
 * the same id are kept; new records are appended. The function is
 * idempotent: re-running it produces the same set of records.
 */
export async function materializeObjectsForAttention(attentionId: string): Promise<{
  attentionId: string
  knowledgeAdded: number
  semanticsAdded: number
  knowledgeTotal: number
  semanticsTotal: number
  skipped: number
}> {
  const all = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const attention = all.find((a) => a.id === attentionId)
  if (!attention) {
    throw new Error(`attention set not found: ${attentionId}`)
  }
  const currentIndex = await loadCurrentReaderIndex()
  const materialised: RefMaterialization[] = []
  for (const ref of attention.selected_source_refs) {
    if (isDefaultExcludedPath(ref.path)) {
      materialised.push({ ref, reason: 'default-excluded', skipped: true })
      continue
    }
    // Validate the source ref against the current index. We
    // deliberately skip refs whose sha no longer matches the index
    // rather than writing a stale record.
    const refIssues = validateSourceRefs(currentIndex, [ref])
    if (refIssues.length > 0) {
      materialised.push({ ref, reason: `stale source_ref: ${refIssues.join('; ')}`, skipped: true })
      continue
    }
    const anchorIds = anchorIdsForSourceRef(currentIndex, ref)
    if (anchorIds.length === 0) {
      materialised.push({ ref, reason: 'no source anchors', skipped: true })
      continue
    }
    materialised.push({
      ref,
      knowledge: buildKnowledgeObjectForRef(attention, ref, anchorIds),
      semantic: buildSemanticClaimForRef(attention, ref, anchorIds),
      skipped: false,
    })
  }
  // Read existing canonical files so we can dedupe.
  const existingKnowledge = await readNdjson<ReaderKnowledgeObject>(READER_PATHS.knowledge)
  const existingSemantics = await readNdjson<ReaderSemanticClaim>(READER_PATHS.semantics)
  const knowledgeIds = new Set(existingKnowledge.map((k) => k.id))
  const semanticsIds = new Set(existingSemantics.map((s) => s.id))
  const newKnowledge: ReaderKnowledgeObject[] = []
  const newSemantics: ReaderSemanticClaim[] = []
  let skipped = 0
  for (const m of materialised) {
    if (m.skipped) {
      skipped += 1
      continue
    }
    if (!knowledgeIds.has(m.knowledge.id)) {
      knowledgeIds.add(m.knowledge.id)
      newKnowledge.push(m.knowledge)
    }
    if (!semanticsIds.has(m.semantic.id)) {
      semanticsIds.add(m.semantic.id)
      newSemantics.push(m.semantic)
    }
  }
  // Append only the new records. Re-running the command will see
  // them as already-present and add zero records.
  for (const k of newKnowledge) await appendNdjson(READER_PATHS.knowledge, k)
  for (const s of newSemantics) await appendNdjson(READER_PATHS.semantics, s)
  return {
    attentionId: attention.id,
    knowledgeAdded: newKnowledge.length,
    semanticsAdded: newSemantics.length,
    knowledgeTotal: existingKnowledge.length + newKnowledge.length,
    semanticsTotal: existingSemantics.length + newSemantics.length,
    skipped,
  }
}

/**
 * Rewrite the canonical knowledge and semantics files so they
 * contain only records materialised by this module. Used by tests
 * to ensure a deterministic snapshot. The function is destructive
 * but idempotent: a subsequent `materializeObjectsForAttention`
 * with the same attention set will reproduce the same records.
 *
 * Hidden behind a test-only export so production callers cannot
 * accidentally wipe the canonical files.
 */
export async function _resetMaterializedObjectsForTests(): Promise<void> {
  await writeNdjson(READER_PATHS.knowledge, [])
  await writeNdjson(READER_PATHS.semantics, [])
}
