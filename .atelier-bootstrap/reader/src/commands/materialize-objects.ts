/**
 * `atelier:reader:materialize-objects` command.
 *
 * Deterministically materialises `KnowledgeObject` and
 * `SemanticClaim` records for an attention set. The reader does
 * not need an LLM to do this: the records are derived directly
 * from the indexer's `SourceAnchor`s and the attention set's
 * `selected_source_refs`.
 *
 * Materialised records carry:
 *   - `produced_by: 'reader'`
 *   - `provenance_kind: 'deterministic_fact'`
 *   - `confidence: 'inferred'`
 *   - non-empty `source_refs`
 *   - non-empty `source_anchor_ids` (where anchors exist for the
 *     source path)
 *   - knowledge_type in {`repo_convention`, `framework_constraint`}
 *   - claim_type in {`definition`, `invariant`}
 *
 * Usage:
 *   bun run atelier:reader:materialize-objects -- --attention <id>
 *   bun run atelier:reader:materialize-objects -- --latest
 */
import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { findLatestAttentionId, materializeObjectsForAttention } from '../lib/materialize-objects.ts'

function readFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runMaterializeObjectsCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const attentionId = readFlag(args, '--attention')
    const useLatest = args.includes('--latest')
    if (!attentionId && !useLatest) {
      throw new Error('materialize-objects requires --attention <id> or --latest')
    }
    let resolvedAttentionId = attentionId
    if (!resolvedAttentionId) {
      const latest = await findLatestAttentionId()
      if (!latest) {
        throw new Error('no attention set found; run `atelier:attention --task "<task>"` first')
      }
      resolvedAttentionId = latest
    }
    const out = await materializeObjectsForAttention(resolvedAttentionId)
    const result = ok(
      'reader',
      'materialize-objects',
      {
        attention_id: out.attentionId,
        knowledge_added: out.knowledgeAdded,
        semantics_added: out.semanticsAdded,
        knowledge_total: out.knowledgeTotal,
        semantics_total: out.semanticsTotal,
        skipped: out.skipped,
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'materialize-objects', [
      { severity: 'P0', code: 'E_MATERIALIZE_OBJECTS', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runMaterializeObjectsCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
