/**
 * Implementation task derivation.
 *
 * Derives `ImplementationTask` records from:
 *
 *   1. The reader's `attention.ndjson` (one task per attention set), and
 *   2. The indexer's `source.ndjson` entries that live under
 *      `harness/atelier-design-docs/**` (one design-doc task).
 *
 * A task whose `source_refs` include any path under
 * `harness/atelier-design-docs/**` is treated as operational. Any other
 * task is marked as a fixture (toy sample). The operation verifier
 * ignores `fixture` tasks when deciding operational pass.
 *
 * For the v0 build, each attention set produces exactly one task. The
 * design-doc task is derived directly from the indexer source units so
 * the transform pipeline does not depend on the reader having run.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type AttentionSet,
  type ImplementationTask,
  type KnowledgeObject,
  type SemanticClaim,
  type SourceRef,
  type SourceUnit,
  INDEXER_PATHS,
  READER_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'

const PRODUCT_SPEC_PREFIXES = ['product-specs/', 'harness/knowledge/product-specs/']
const DESIGN_DOC_PREFIX = 'harness/atelier-design-docs/'
const DEFAULT_FORBIDDEN_FILES = [
  'product-specs/**',
  'harness/knowledge/product-specs/**',
  'harness/atelier-design-docs/**',
  'product/**',
]

function nowIso(): string {
  return new Date().toISOString()
}

function isProductSpec(path: string): boolean {
  return PRODUCT_SPEC_PREFIXES.some((p) => path.startsWith(p))
}

function isDesignDocPath(path: string): boolean {
  return path.startsWith(DESIGN_DOC_PREFIX)
}

function sourceRefHasDesignDoc(refs: ReadonlyArray<SourceRef>): boolean {
  return refs.some((r) => isDesignDocPath(r.path))
}

/**
 * Build the `allowed_files` / `forbidden_files` for a task derived
 * from an attention set. Spec prefixes and the design-doc tree are
 * always forbidden; design-doc source refs are NOT allowed because
 * the design docs are read-only.
 */
function deriveAttentionAllowedFiles(att: AttentionSet): { allowed: string[]; forbidden: string[] } {
  const allowed = new Set<string>()
  for (const r of att.selected_source_refs) {
    if (isProductSpec(r.path)) continue
    if (isDesignDocPath(r.path)) continue
    allowed.add(r.path)
  }
  // Always allow writing the test fixtures the executor will use.
  allowed.add('.atelier-bootstrap/tests/fixtures/')
  return { allowed: [...allowed].sort(), forbidden: [...DEFAULT_FORBIDDEN_FILES] }
}

function deriveAcceptanceCriteria(att: AttentionSet): string[] {
  return [
    `task ${att.id} produced changes only inside allowed_files`,
    'test command from packet TestContract returns exit code 0',
    'evidence record references raw command output',
    'no edits to product specs',
  ]
}

function deriveRiskNotes(att: AttentionSet, knowledge: KnowledgeObject[]): string[] {
  const notes: string[] = []
  if (att.gap_status !== 'sufficient') {
    notes.push('attention set is not sufficient; review knowledge objects before execution')
  }
  if (knowledge.some((k) => k.knowledge_type === 'risk_note')) {
    notes.push('reader flagged a risk note; consider mitigation')
  }
  return notes
}

/**
 * Pure builder for an attention-derived task. Does not write to disk.
 * The caller decides whether to mark the task as a fixture.
 */
export function buildAttentionTask(
  att: AttentionSet,
  knowledge: KnowledgeObject[],
): ImplementationTask {
  const { allowed, forbidden } = deriveAttentionAllowedFiles(att)
  if (allowed.length === 0) {
    throw new Error('cannot derive task: empty allowed_files (would block executor)')
  }
  const taskId = deterministicId('task', att.id)
  const task: ImplementationTask = {
    id: taskId,
    kind: 'implementation_task',
    version: '1',
    title: `task: ${att.task}`,
    body_ref: TRANSFORMER_PATHS.implementationTasks,
    source_object_ids: att.selected_object_ids,
    source_refs: att.selected_source_refs,
    required_knowledge_object_ids: knowledge
      .filter((k) => att.selected_source_refs.some((sr) => sr.path === k.source_refs[0]?.path))
      .map((k) => k.id),
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: 'ready',
    affordances: ['packet-constraint', 'test-candidate', 'docs-candidate'],
    created_at: nowIso(),
    task_id: taskId,
    goal: att.task,
    allowed_files: allowed,
    forbidden_files: forbidden,
    acceptance_criteria: deriveAcceptanceCriteria(att),
    risk_notes: deriveRiskNotes(att, knowledge),
  }
  // An attention-set task that does not reference any design-doc
  // source unit is a fixture (toy example). Mark it explicitly so the
  // operation verifier can identify and exclude it.
  if (!sourceRefHasDesignDoc(task.source_refs)) {
    task.fixture = true
    task.tags = ['fixture']
  }
  return task
}

/**
 * Pure builder for the design-doc task. Returns `undefined` if no
 * design-doc source units exist in the indexer. The caller decides
 * whether to include the result in the persisted task list.
 */
export function buildDesignDocTask(sources: ReadonlyArray<SourceUnit>): ImplementationTask | undefined {
  const designDocSources = sources.filter(
    (s) => isDesignDocPath(s.path) && (s.path.endsWith('.md') || s.path.endsWith('.mdx')),
  )
  if (designDocSources.length === 0) return undefined
  const sourceRefs: SourceRef[] = designDocSources.map((s) => ({ path: s.path, sha256: s.sha256 }))
  const taskKey = 'design-docs:harden-operational-atelier'
  const taskId = deterministicId('task', taskKey)
  return {
    id: taskId,
    kind: 'implementation_task',
    version: '1',
    title: 'task: harden operational atelier v0 from design docs',
    body_ref: TRANSFORMER_PATHS.implementationTasks,
    source_object_ids: designDocSources.map((s) => s.id),
    source_refs: sourceRefs,
    required_knowledge_object_ids: [],
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: 'ready',
    affordances: ['packet-constraint', 'test-candidate', 'docs-candidate', 'review-candidate'],
    created_at: nowIso(),
    task_id: taskId,
    goal:
      'implement the contracts in harness/atelier-design-docs/** so atelier:ready and atelier:verify pass with non-empty attention and runtime evidence',
    allowed_files: [
      '.atelier-bootstrap/indexer/**',
      '.atelier-bootstrap/reader/**',
      '.atelier-bootstrap/transformer/**',
      '.atelier-bootstrap/executor/**',
      '.atelier-bootstrap/operation/**',
      '.atelier-bootstrap/lib/**',
      '.atelier-bootstrap/tests/fixtures/**',
      '.atelier/v0/transforms/md-to-code/**',
      '.atelier/v0/views/**',
    ],
    forbidden_files: [...DEFAULT_FORBIDDEN_FILES],
    acceptance_criteria: [
      'atelier:transform:md-to-code regenerates the design-doc task from harness/atelier-design-docs/**',
      'atelier:transform:validate passes',
      'recommendations.ndjson has no duplicate (source_object_id, recommendation_type) pairs',
      'duplicates.ndjson records any pairs that were collapsed',
      'no edits to product specs or design docs',
    ],
    risk_notes: [
      'this task spans every atelier-* component; coordinate with the operation, executor, and reader workstreams',
    ],
    fixture: false,
    tags: ['design-doc-task', 'operational'],
  }
}

/**
 * Derive a single `ImplementationTask` for the given attention set id
 * and write it to the implementation-tasks file (overwrite mode).
 *
 * Used by the `task-derive --attention <id>` CLI command.
 */
export async function deriveTask(attentionId: string): Promise<ImplementationTask> {
  const sets = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const att = sets.find((a) => a.id === attentionId)
  if (!att) throw new Error(`attention set not found: ${attentionId}`)
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  const task = buildAttentionTask(att, knowledge)
  await writeNdjson(TRANSFORMER_PATHS.implementationTasks, [task])
  return task
}

/**
 * Derive tasks for all attention sets AND the design-doc task (when
 * the indexer has design-doc source units). Writes the merged list to
 * the implementation-tasks file in a single write.
 *
 * This is the default operation for `transform --target md-to-code`.
 */
export async function deriveAllTasks(): Promise<ImplementationTask[]> {
  const sets = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  const sources = await readNdjson<SourceUnit>(INDEXER_PATHS.objectsSource)
  // silence unused-warning
  void (await readNdjson<SemanticClaim>(READER_PATHS.semantics))
  const out: ImplementationTask[] = []
  for (const s of sets) {
    out.push(buildAttentionTask(s, knowledge))
  }
  const designDoc = buildDesignDocTask(sources)
  if (designDoc) out.push(designDoc)
  await writeNdjson(TRANSFORMER_PATHS.implementationTasks, out)
  return out
}

/**
 * Predicate used by the operation verifier and the render layer.
 * A task is a fixture when it is explicitly marked or carries the
 * `fixture` tag. Returns `false` when the flag/tag is absent so that
 * legacy tasks (which predate the marker) are NOT auto-classified as
 * fixtures; the transformer marks them explicitly during derivation.
 */
export function isFixtureTask(t: ImplementationTask): boolean {
  if (t.fixture === true) return true
  if (Array.isArray(t.tags) && t.tags.includes('fixture')) return true
  return false
}
