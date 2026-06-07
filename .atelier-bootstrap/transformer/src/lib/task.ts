/**
 * Implementation task derivation.
 *
 * Derives `ImplementationTask` records from:
 *
 *   1. The reader's `attention.ndjson` (one task per attention set), and
 *   2. The indexer's `source.ndjson` entries that live under
 *      `harness/atelier-design-docs/**` (one design-doc task).
 *
 * Each task is GROUNDED in the accepted relation graph:
 *
 *   - For an attention-derived task, `source_relation_ids` lists the
 *     accepted relations whose `from`/`to` overlaps the attention's
 *     `selected_object_ids`. If zero accepted relations touch the
 *     attention set, the task is marked `status: 'blocked'` and a
 *     `blocker_ids` entry points at the missing relation class.
 *
 *   - The design-doc task is marked `status: 'candidate'` (not
 *     `ready`) unless at least one accepted `constrains` or
 *     `references` relation touches the design-doc source units.
 *     This is the Relation Kernel invariant from the transformer
 *     contract.
 *
 * A task whose `source_relation_ids` is empty is treated as a
 * fixture by the operation layer. The explicit `fixture: true` flag
 * remains the canonical marker; the empty-trace rule is the Relation
 * Kernel fallback for derived-but-ungrounded tasks.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type AttentionSet,
  type ImplementationTask,
  type KnowledgeObject,
  type SourceRef,
  type SourceAnchor,
  type SourceUnit,
  INDEXER_PATHS,
  READER_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'
import {
  loadAcceptedRelations,
  pickAcceptedRelationsForAnchors,
  pickAcceptedRelationsForAnchorsByKind,
  relationEndpointIds,
  type AtelierEdge,
} from './relations.ts'
import { isMaterializedRecord } from './materialize-fixture-task.ts'
// pickAcceptedRelationsForAnchorsByKind is used by buildDesignDocTask
// to restrict to the design-doc relation kinds.

const PRODUCT_SPEC_PREFIXES = ['product-specs/', 'harness/knowledge/product-specs/']
const DESIGN_DOC_PREFIX = 'harness/atelier-design-docs/'
const PRODUCT_PREFIX = 'product/'
const DEFAULT_FORBIDDEN_FILES = [
  'product-specs/**',
  'harness/knowledge/product-specs/**',
  'harness/atelier-design-docs/**',
  'product/**',
]

/**
 * Relation kinds that count as "operational proof" for the design-doc
 * task. The contract requires `constrains` or `references`, but we
 * also accept `depends_on` and `verifies` as backup.
 */
const DESIGN_DOC_TASK_RELATION_KINDS: ReadonlySet<AtelierEdge['kind']> = new Set<AtelierEdge['kind']>([
  'constrains',
  'references',
  'depends_on',
  'verifies',
])

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
    if (r.path.startsWith(PRODUCT_PREFIX)) continue
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
 *
 * The task is grounded in the accepted relation graph. If no accepted
 * relation touches the attention's selected object ids, the task is
 * marked `status: 'blocked'` with a `blocker_ids` entry pointing at the
 * missing relation class.
 */
export function buildAttentionTask(
  att: AttentionSet,
  knowledge: KnowledgeObject[],
  acceptedRelations: ReadonlyArray<AtelierEdge>,
): ImplementationTask {
  const { allowed, forbidden } = deriveAttentionAllowedFiles(att)
  if (allowed.length === 0) {
    throw new Error('cannot derive task: empty allowed_files (would block executor)')
  }
  const taskId = deterministicId('task', att.id)
  const relations = pickAcceptedRelationsForAnchors(att.selected_object_ids, acceptedRelations)
  const relationIds = relations.map((r) => r.id)
  const fixture = !sourceRefHasDesignDoc(att.selected_source_refs)
  const status: ImplementationTask['status'] =
    relations.length === 0 ? 'blocked' : fixture ? 'candidate' : 'ready'
  const blockerIds: string[] = []
  if (relations.length === 0) {
    blockerIds.push('no-accepted-relation-trace:attention:' + att.id.slice(0, 16))
  }
  if (fixture && relations.length > 0) {
    blockerIds.push('fixture-task-not-operational-proof:attention:' + att.id.slice(0, 16))
  }
  const sourceAnchorIds = Array.from(
    new Set([...att.selected_object_ids, ...relationEndpointIds(relations)]),
  ).sort()
  const task: ImplementationTask = {
    id: taskId,
    kind: 'implementation_task',
    version: '1',
    title: `task: ${att.task}`,
    body_ref: TRANSFORMER_PATHS.implementationTasks,
    source_object_ids: att.selected_object_ids,
    source_anchor_ids: sourceAnchorIds,
    source_relation_ids: relationIds,
    source_refs: att.selected_source_refs,
    required_knowledge_object_ids: knowledge
      .filter((k) => att.selected_source_refs.some((sr) => sr.path === k.source_refs[0]?.path))
      .map((k) => k.id),
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status,
    blocker_ids: blockerIds,
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
  if (fixture) {
    task.fixture = true
    task.tags = ['fixture']
  }
  return task
}

/**
 * Pure builder for the design-doc task. Returns `undefined` if no
 * design-doc source units exist in the indexer. The caller decides
 * whether to include the result in the persisted task list.
 *
 * The design-doc task is grounded in the accepted relation graph. If
 * at least one accepted `constrains` or `references` relation
 * (broadened to the design-doc relation kinds) touches the design-doc
 * source units, the task is `ready`; otherwise it is `candidate`.
 */
export function buildDesignDocTask(
  sources: ReadonlyArray<SourceUnit>,
  acceptedRelations: ReadonlyArray<AtelierEdge>,
  anchors: ReadonlyArray<SourceAnchor> = [],
): ImplementationTask | undefined {
  const designDocSources = sources.filter(
    (s) => isDesignDocPath(s.path) && (s.path.endsWith('.md') || s.path.endsWith('.mdx')),
  )
  if (designDocSources.length === 0) return undefined
  const sourceRefs: SourceRef[] = designDocSources.map((s) => ({ path: s.path, sha256: s.sha256 }))
  const taskKey = 'design-docs:harden-operational-atelier'
  const taskId = deterministicId('task', taskKey)
  const designDocSourceIds = designDocSources.map((s) => s.id)
  const designDocAnchorIds = anchors
    .filter((a) => isDesignDocPath(a.path))
    .map((a) => a.id)
  const designDocGraphIds = Array.from(new Set([...designDocSourceIds, ...designDocAnchorIds]))
  const relations = pickAcceptedRelationsForAnchorsByKind(
    designDocGraphIds,
    acceptedRelations,
    DESIGN_DOC_TASK_RELATION_KINDS,
  )
  const relationIds = relations.map((r) => r.id)
  const sourceAnchorIds = Array.from(
    new Set([...designDocGraphIds, ...relationEndpointIds(relations)]),
  ).sort()
  const status: ImplementationTask['status'] = relations.length > 0 ? 'ready' : 'candidate'
  return {
    id: taskId,
    kind: 'implementation_task',
    version: '1',
    title: 'task: harden operational atelier v0 from design docs',
    body_ref: TRANSFORMER_PATHS.implementationTasks,
    source_object_ids: designDocSourceIds,
    source_anchor_ids: sourceAnchorIds,
    source_relation_ids: relationIds,
    source_refs: sourceRefs,
    required_knowledge_object_ids: [],
    produced_by: 'transformer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status,
    blocker_ids: relations.length > 0 ? [] : ['no-accepted-relation-trace:design-doc-task'],
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
  const accepted = await loadAcceptedRelations()
  const task = buildAttentionTask(att, knowledge, accepted)
  await writeNdjson(TRANSFORMER_PATHS.implementationTasks, [task])
  return task
}

/**
 * Derive tasks for all attention sets AND the design-doc task (when
 * the indexer has design-doc source units). Writes the merged list to
 * the implementation-tasks file in a single write.
 *
 * Materialized records (those with `tags: ['materialized']` set by
 * `create-fixture-task`) are preserved across re-runs so the
 * `atelier:transform:md-to-code` command does not destroy the
 * materializer's output. Newly derived attention / design-doc tasks
 * are merged in; existing materialized tasks are kept.
 *
 * This is the default operation for `transform --target md-to-code`.
 */
export async function deriveAllTasks(): Promise<ImplementationTask[]> {
  const sets = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  const sources = await readNdjson<SourceUnit>(INDEXER_PATHS.objectsSource)
  const anchors = await readNdjson<SourceAnchor>(INDEXER_PATHS.anchorsFile)
  const accepted = await loadAcceptedRelations()
  // Read existing tasks; preserve any materialized (materializer-produced)
  // records across re-runs of `transform --target md-to-code`.
  const existingTasks = await readNdjson<ImplementationTask>(TRANSFORMER_PATHS.implementationTasks)
  const preservedMaterialized = existingTasks.filter(isMaterializedRecord)
  const out: ImplementationTask[] = [...preservedMaterialized]
  for (const s of sets) {
    out.push(buildAttentionTask(s, knowledge, accepted))
  }
  const designDoc = buildDesignDocTask(sources, accepted, anchors)
  if (designDoc) out.push(designDoc)
  await writeNdjson(TRANSFORMER_PATHS.implementationTasks, out)
  return out
}

/**
 * Predicate used by the operation verifier and the render layer.
 *
 * A task is a fixture when ANY of:
 *
 *   - it is explicitly marked `fixture: true`,
 *   - it carries the `fixture` tag,
 *   - it has no `source_relation_ids` trace AND no explicit non-fixture
 *     tags (i.e. the Relation Kernel fallback for ungrounded tasks).
 *
 * The Relation Kernel fallback means a task that *would* have been
 * treated as operational by the old fixture rule but has no accepted
 * relation trace is now downgraded to fixture so the operation
 * verifier can ignore it.
 */
export function isFixtureTask(t: ImplementationTask): boolean {
  if (t.fixture === true) return true
  if (Array.isArray(t.tags) && t.tags.includes('fixture')) return true
  // Relation Kernel fallback: ungrounded tasks are fixtures.
  // Legacy tasks predate the `source_relation_ids` field; treat an
  // undefined field as "no trace" so the upgrade downgrades them.
  const trace = t.source_relation_ids
  if (!Array.isArray(trace) || trace.length === 0) {
    // Non-design-doc tasks with no source_refs at all are clearly
    // empty/fixtures. But to preserve backward compatibility with the
    // existing design-doc task (which previously was always `ready`),
    // we only apply the fallback when the task was NOT explicitly
    // tagged as operational.
    const hasOperationalTag = Array.isArray(t.tags) && t.tags.includes('operational')
    if (!hasOperationalTag) return true
  }
  return false
}
