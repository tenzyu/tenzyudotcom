/**
 * `atelier:relations:accept` command.
 *
 * Accepts a JSONL/NDJSON file of `RelationProposal` records and
 * materialises the accepted edges into a reader-owned file:
 *
 *   `.atelier/v0/edges/reader-accepted-relations.ndjson`
 *
 * ## Acceptance policy
 *
 *   - every proposal must resolve endpoints and `source_anchor_ids`
 *     against the current indexer SourceAnchors/source objects;
 *   - default-excluded paths (`.opencode`, build outputs, `.rmeta`,
 *     etc.) are rejected and never materialised as accepted truth;
 *   - `confidence: 'inferred'` proposals are accepted automatically
 *     only after the current-index checks pass. Their accepted edge is
 *     written with validated confidence and traceable anchor ids.
 *   - `confidence: 'hypothesis'` proposals are NOT auto-accepted.
 *     They are accepted only when the input record carries
 *     `manual_approval: true`. Without that flag, they stay
 *     `proposed` and a warning is emitted.
 *   - All other confidence values are treated as `hypothesis`.
 *
 * ## Fail-closed pruning on every run
 *
 * Every call to `relations:accept` REWRITES
 * `.atelier/v0/edges/reader-accepted-relations.ndjson` from scratch.
 * The new contents are:
 *
 *   1. The subset of previously-accepted edges whose endpoints still
 *      resolve against the current indexer universe
 *      (SourceUnits, SourceAnchors, deterministic SourceFacts),
 *      whose `source_anchor_ids` and `source_refs` are still
 *      current, and whose keys are not removed by a rejected
 *      proposal in this run; followed by
 *   2. The edges newly accepted from the input proposal file in
 *      this run.
 *
 * Accepted edges whose `from` or `to` no longer resolve, whose
 * `source_anchor_ids` or `source_refs` are stale, whose `kind` is
 * `contains`, or whose default-excluded path set is non-empty are
 * removed from the file and a `dropped stale accepted edge` warning
 * is emitted. The acceptance policy is fail-closed: edges are
 * dropped unless their endpoints can be proven to resolve against
 * the current indexer universe.
 *
 * The proposals file is rewritten in place with the updated
 * `status` field. The accepted-edges file is rewritten
 * idempotently: a `(from, to, kind)` tuple is accepted at most
 * once per command invocation, and previously-accepted stale
 * edges are pruned on every invocation.
 */
import { readNdjson, writeNdjson, fileExists } from '../../../lib/src/ndjson.ts'
import {
  type RelationProposal,
  READER_PATHS,
  ok,
  fail,
  printResult,
} from '../../../lib/src/index.ts'
import {
  loadCurrentReaderIndex,
  validateAcceptedRelationAgainstCurrentIndex,
  validateProposalAgainstCurrentIndex,
  type ReaderAcceptedRelation,
} from '../lib/relation-safety.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

function nowIso(): string {
  return new Date().toISOString()
}

function edgeKey(e: Pick<ReaderAcceptedRelation, 'from' | 'to' | 'kind'>): string {
  return `${e.from}|${e.to}|${e.kind}`
}

function proposalEdgeKey(p: RelationProposal): string | null {
  if (!p.proposed_relation?.from || !p.proposed_relation?.to || !p.proposed_relation?.kind) return null
  return `${p.proposed_relation.from}|${p.proposed_relation.to}|${p.proposed_relation.kind}`
}

function validationStatus(issues: ReadonlyArray<string>): 'rejected' | 'stale' {
  if (issues.some((i) => i.includes('default-excluded'))) return 'rejected'
  if (issues.some((i) => i.includes('contains') || i.includes('schema') || i.includes('confidence') || i.includes('invalid proposal status'))) return 'rejected'
  if (issues.some((i) => i.includes('missing source_anchor_ids') || i.includes('missing source_refs') || i.includes('missing endpoints'))) return 'rejected'
  return 'stale'
}

function edgeFromProposal(p: RelationProposal): ReaderAcceptedRelation {
  return {
    id: `edge:reader:${p.proposal_id}`,
    proposal_id: p.proposal_id,
    from: p.proposed_relation.from,
    to: p.proposed_relation.to,
    kind: p.proposed_relation.kind,
    provenance_kind: 'llm_extracted',
    source_refs: p.source_refs,
    source_anchor_ids: p.source_anchor_ids,
    confidence: 'validated',
    status: 'fresh',
    created_at: p.proposed_relation.created_at ?? p.created_at ?? nowIso(),
  }
}

export async function runRelationsAcceptCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const input = readFlag(args, '--input')
    if (!input) {
      throw new Error('relations:accept requires --input <path>')
    }
    const proposals = await readNdjson<RelationProposal>(input)
    if (proposals.length === 0) {
      throw new Error(`no proposals found in ${input}`)
    }
    const currentIndex = await loadCurrentReaderIndex()
    // Load the existing accepted-edges file to dedupe within
    // this run AND across runs. The file may be missing on the
    // first accept call.
    const existingEdges = (await fileExists(READER_PATHS.readerAcceptedRelations))
      ? await readNdjson<ReaderAcceptedRelation>(READER_PATHS.readerAcceptedRelations)
      : []
    const warnings: string[] = []
    const validExistingEdges: ReaderAcceptedRelation[] = []
    const validExistingKeys = new Set<string>()
    for (const e of existingEdges) {
      const issues = validateAcceptedRelationAgainstCurrentIndex(currentIndex, e)
      if (issues.length > 0) {
        warnings.push(`dropped stale accepted edge ${e.id}: ${issues.join('; ')}`)
        continue
      }
      const key = edgeKey(e)
      if (validExistingKeys.has(key)) {
        warnings.push(`dropped duplicate accepted edge ${e.id}: ${key}`)
        continue
      }
      validExistingKeys.add(key)
      validExistingEdges.push(e)
    }
    const existingEdgeKeys = new Set(validExistingKeys)
    const invalidKeysToRemove = new Set<string>()
    let acceptedCount = 0
    let rejectedCount = 0
    let skippedCount = 0
    let staleCount = 0
    const acceptedNow: ReaderAcceptedRelation[] = []
    const updated: RelationProposal[] = proposals.map((p) => {
      const key = proposalEdgeKey(p)
      // Hard refuse `contains` from the reader. The contract says
      // the reader is not allowed to propose `contains` and
      // therefore not allowed to accept it either.
      if (p.proposed_relation?.kind === 'contains') {
        rejectedCount += 1
        if (key) invalidKeysToRemove.add(key)
        warnings.push(
          `rejected ${p.proposal_id}: reader must not propose 'contains' (from=${p.proposed_relation.from} to=${p.proposed_relation.to})`,
        )
        return { ...p, status: 'rejected' as const }
      }
      const validationIssues = validateProposalAgainstCurrentIndex(currentIndex, p)
      if (validationIssues.length > 0) {
        const status = validationStatus(validationIssues)
        if (key) invalidKeysToRemove.add(key)
        if (status === 'stale') staleCount += 1
        else rejectedCount += 1
        warnings.push(`${status} ${p.proposal_id}: ${validationIssues.join('; ')}`)
        return { ...p, status }
      }
      if (p.status === 'stale' || p.status === 'rejected') {
        skippedCount += 1
        if (key) invalidKeysToRemove.add(key)
        warnings.push(`skipped ${p.proposal_id}: proposal status is ${p.status}`)
        return p
      }
      if (key && existingEdgeKeys.has(key)) {
        skippedCount += 1
        warnings.push(
          `skipped ${p.proposal_id}: edge already accepted (${p.proposed_relation.from} -> ${p.proposed_relation.to} ${p.proposed_relation.kind})`,
        )
        return { ...p, status: 'accepted' as const }
      }
      const isInferred = p.confidence === 'inferred'
      const isHypothesis = p.confidence === 'hypothesis'
      if (isInferred || (isHypothesis && p.manual_approval === true)) {
        const e = edgeFromProposal(p)
        const k = edgeKey(e)
        existingEdgeKeys.add(k)
        acceptedNow.push(e)
        acceptedCount += 1
        return { ...p, status: 'accepted' as const }
      }
      if (isHypothesis) {
        skippedCount += 1
        warnings.push(
          `skipped ${p.proposal_id}: hypothesis proposals require manual_approval=true`,
        )
        return p
      }
      rejectedCount += 1
      warnings.push(
        `rejected ${p.proposal_id}: unknown confidence ${p.confidence}`,
      )
      return { ...p, status: 'rejected' as const }
    })
    // Persist: rewrite the proposals file with the new statuses,
    // and rewrite accepted truth with only currently-valid accepted
    // edges plus the newly accepted records.
    await writeNdjson(input, updated)
    const keptExisting = validExistingEdges.filter((e) => !invalidKeysToRemove.has(edgeKey(e)))
    await writeNdjson(READER_PATHS.readerAcceptedRelations, [...keptExisting, ...acceptedNow])
    const result = ok(
      'reader',
      'relations:accept',
      {
        input,
        total: updated.length,
        accepted: acceptedCount,
        rejected: rejectedCount,
        stale: staleCount,
        skipped: skippedCount,
        accepted_edges_file: READER_PATHS.readerAcceptedRelations,
      },
      { startedAt, warnings },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'relations:accept', [
      { severity: 'P0', code: 'E_RELATIONS_ACCEPT', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runRelationsAcceptCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
