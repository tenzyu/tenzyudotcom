/**
 * LLM job envelope emission.
 *
 * The `llm:jobs` command writes a deterministic job envelope that an
 * external LLM runner can use to produce a JSONL of `ReaderProposal`
 * records. The job envelope includes the input object ids, the
 * required output contract, and the instructions.
 */
import { mkdir } from 'node:fs/promises'
import { writeText } from '../../../lib/src/json.ts'
import { randomId, type ReaderLlmJob, type SourceRef, READER_PATHS, INDEXER_PATHS } from '../../../lib/src/index.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import type { AttentionSet } from '../../../lib/src/index.ts'
import type { ProjectBrief } from './types.ts'

export type LlmJobKind = 'cheap-sample' | 'attention' | 'deep-read' | 'gap-review'

const CONTRACT: Record<LlmJobKind, { output: string; instructions: string }> = {
  'cheap-sample': {
    output: 'project_hypothesis',
    instructions: [
      'Emit one JSONL line per hypothesis.',
      'Each line must be {proposal_kind: "project_hypothesis", statement, confidence, evidence[]}.',
      'confidence is low|medium|high.',
      'evidence is a list of file paths.',
    ].join('\n'),
  },
  attention: {
    output: 'attention_item',
    instructions: [
      'Emit one JSONL line per attention item.',
      'Each line must be {proposal_kind: "attention_item", object_id|source_ref, reason, priority}.',
      'priority is P0|P1|P2.',
    ].join('\n'),
  },
  'deep-read': {
    output: 'knowledge_object|semantic_claim|gap',
    instructions: [
      'Emit one JSONL line per proposal.',
      'Proposals may be knowledge_object, semantic_claim, or gap.',
      'Every knowledge_object and semantic_claim MUST include source_refs.',
    ].join('\n'),
  },
  'gap-review': {
    output: 'gap',
    instructions: [
      'Emit one JSONL line per gap.',
      'Each line must be {proposal_kind: "gap", text, blocking, source_refs?}.',
    ].join('\n'),
  },
}

export async function emitLlmJob(
  kind: LlmJobKind,
  inputObjectIds: string[],
  inputSourceRefs: SourceRef[],
): Promise<ReaderLlmJob> {
  const jobId = randomId('job')
  const contract = CONTRACT[kind]
  const job: ReaderLlmJob = {
    schema: 'atelier.reader-llm-job/v1',
    job_id: jobId,
    kind,
    input_object_ids: inputObjectIds,
    input_source_refs: inputSourceRefs,
    output_contract: contract.output,
    instructions: contract.instructions,
  }
  await mkdir(READER_PATHS.llmJobsDir, { recursive: true })
  const path = `${READER_PATHS.llmJobsDir}/${jobId}.json`
  await writeText(path, JSON.stringify(job, null, 2))
  return job
}

/**
 * Convenience: emit a deep-read job for an existing attention set.
 */
export async function emitDeepReadJobForAttention(attentionId: string): Promise<ReaderLlmJob> {
  const all = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const set = all.find((a) => a.id === attentionId)
  if (!set) throw new Error(`attention set not found: ${attentionId}`)
  return emitLlmJob('deep-read', set.selected_object_ids, set.selected_source_refs)
}

/**
 * Convenience: emit a cheap-sample job anchored at the project brief.
 */
export async function emitCheapSampleJobFromBrief(brief: ProjectBrief): Promise<ReaderLlmJob> {
  const refs: SourceRef[] = brief.observed_facts.flatMap((f) => f.source_refs)
  return emitLlmJob('cheap-sample', [], refs)
}

void INDEXER_PATHS
void (async () => {})()
