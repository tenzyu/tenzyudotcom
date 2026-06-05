/**
 * Implementation task derivation.
 *
 * Given an attention set, derive one or more `ImplementationTask` records.
 *
 * The derivation is deterministic and shallow: it does not call an LLM.
 * It uses the attention set's selected source units to build a task
 * with explicit allowed_files, forbidden_files, and acceptance_criteria.
 *
 * For the v0 build, every attention set produces exactly one task. The
 * task's `title` is derived from the task string; the `goal` mirrors it.
 */
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type AttentionSet,
  type ImplementationTask,
  type KnowledgeObject,
  type SemanticClaim,
  type SourceRef,
  INDEXER_PATHS,
  READER_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/index.ts'

const PRODUCT_SPEC_PREFIXES = ['product-specs/', 'harness/knowledge/product-specs/', 'harness/atelier-design-docs/']

function nowIso(): string {
  return new Date().toISOString()
}

function isProductSpec(path: string): boolean {
  return PRODUCT_SPEC_PREFIXES.some((p) => path.startsWith(p))
}

function deriveAllowedFiles(att: AttentionSet): { allowed: string[]; forbidden: string[] } {
  const allowed = new Set<string>()
  for (const r of att.selected_source_refs) {
    if (!isProductSpec(r.path)) allowed.add(r.path)
  }
  // Always allow writing the test fixtures the executor will use.
  allowed.add('.atelier-bootstrap/tests/fixtures/')
  // Forbidden files: product specs and legacy implementation-control root.
  const forbidden = [
    'product-specs/atelier/**',
    'harness/knowledge/product-specs/atelier/**',
    'harness/atelier-design-docs/**',
  ]
  return { allowed: [...allowed].sort(), forbidden }
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
 * Derive a single `ImplementationTask` for the given attention set id.
 *
 * Writes the task to `TRANSFORMER_PATHS.implementationTasks` (NDJSON).
 */
export async function deriveTask(attentionId: string): Promise<ImplementationTask> {
  const sets = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const att = sets.find((a) => a.id === attentionId)
  if (!att) throw new Error(`attention set not found: ${attentionId}`)
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  const semantics = await readNdjson<SemanticClaim>(READER_PATHS.semantics)
  const { allowed, forbidden } = deriveAllowedFiles(att)
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
  void semantics
  // Persist (replace contents; there is one task per attention set in v0).
  await writeNdjson(TRANSFORMER_PATHS.implementationTasks, [task])
  return task
}

/**
 * Derive tasks for all attention sets. The default operation for the
 * `transform --target md-to-code` command.
 */
export async function deriveAllTasks(): Promise<ImplementationTask[]> {
  const sets = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const out: ImplementationTask[] = []
  for (const s of sets) {
    out.push(await deriveTask(s.id))
  }
  return out
}

void INDEXER_PATHS
void ({} as SourceRef)
