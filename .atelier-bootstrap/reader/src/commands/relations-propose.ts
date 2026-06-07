/**
 * `atelier:relations:propose` command.
 *
 * Loads an attention set (by id, or assembles one from a task
 * description) and emits schema-bound `RelationProposal` records
 * to `.atelier/v0/objects/relation-proposals.ndjson`.
 *
 * The proposals are deterministic and traceable to source
 * anchors. The reader is NOT allowed to propose `contains`
 * relations; only non-`contains` kinds are emitted.
 */
import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { assembleAttention } from '../lib/attention.ts'
import { deriveRelationProposals } from '../lib/proposals.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { READER_PATHS } from '../../../lib/src/index.ts'
import type { AttentionSet } from '../../../lib/src/index.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runRelationsProposeCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const attentionId = readFlag(args, '--attention')
    const task = readFlag(args, '--task')
    if (!attentionId && !task) {
      throw new Error('relations:propose requires either --attention <id> or --task "<task description>"')
    }
    let resolvedAttentionId = attentionId
    if (!resolvedAttentionId) {
      const set = await assembleAttention(task!)
      resolvedAttentionId = set.id
    } else {
      // Verify the attention set exists.
      const all = await readNdjson<AttentionSet>(READER_PATHS.attention)
      if (!all.find((a) => a.id === resolvedAttentionId)) {
        throw new Error(`attention set not found: ${resolvedAttentionId}`)
      }
    }
    const out = await deriveRelationProposals(resolvedAttentionId)
    const result = ok(
      'reader',
      'relations:propose',
      {
        attention_id: out.attentionId,
        proposals_added: out.added,
        proposals_total: out.total,
        by_kind: out.byKind,
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('reader', 'relations:propose', [
      { severity: 'P0', code: 'E_RELATIONS_PROPOSE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runRelationsProposeCommand(process.argv.slice(2)).then((code) => process.exit(code))
}