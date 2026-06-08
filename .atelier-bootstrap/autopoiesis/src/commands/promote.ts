/**
 * `atelier:promote` command — generic lifecycle promotion gate.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/promote.ts -- \
 *     --id <node-id> --to <lifecycle_state> --evidence <ref> [--evidence <ref>...] \
 *     --owner <policy>
 *
 * Resolves the subject node from
 * `.atelier/v0/autopoiesis/semantic-nodes.ndjson`, calls the
 * global `transition()` function from `../lib/lifecycle.ts`, and
 * — on success — persists the new `lifecycle_state` AND appends
 * a `PromotionDecisionRecord` to
 * `.atelier/v0/autopoiesis/promotion-decisions.ndjson`.
 *
 * Exit codes:
 *   0  promotion accepted; record updated; PromotionDecision emitted.
 *   1  promotion rejected (one of the canonical defect codes).
 *   2  CLI argument error.
 */
import { createHash } from 'node:crypto'
import { transition } from '../lib/lifecycle.ts'
import { readNdjsonAutopoiesis, writeNdjsonAutopoiesis, appendNdjsonAutopoiesis } from '../lib/store.ts'
import { AUTOPOIESIS_PATHS } from '../lib/paths.ts'
import type { LifecycleState, PromotionDecisionRecord, SemanticNode } from '../lib/records.ts'

/**
 * Result type for `runPromoteCommand`. Mirrors the discriminated
 * union used by `transition()` so callers can pattern-match.
 */
export type PromoteResult =
  | {
      ok: true
      decision_id: string
      subject_id: string
      from_state: LifecycleState
      to_state: LifecycleState
    }
  | {
      ok: false
      code:
        | 'E_NODE_MISSING_REQUIRED'
        | 'E_TRANSITION_ILLEGAL'
        | 'E_PROMOTION_LLM_DIRECT_ACCEPT'
        | 'E_PROMOTION_MISSING_EVIDENCE'
        | 'E_PROMOTION_MISSING_OWNER'
        | 'E_PROMOTION_MISSING_SCOPE'
      message: string
    }

export async function runPromoteCommand(argv: readonly string[]): Promise<number> {
  const opts = parseArgs(argv)
  if (!opts.id) {
    process.stderr.write('atelier:promote: --id <node-id> is required\n')
    return 2
  }
  if (!opts.to) {
    process.stderr.write('atelier:promote: --to <lifecycle_state> is required\n')
    return 2
  }
  const r = await promote(opts.id, opts.to, {
    evidenceRefs: opts.evidence,
    ownerOrPolicy: opts.owner,
  })
  if (r.ok) {
    process.stdout.write(
      JSON.stringify(
        {
          schema: 'atelier.command-result/v1',
          status: 'pass',
          component: 'autopoiesis',
          command: 'promote',
          data: {
            decision_id: r.decision_id,
            subject_id: r.subject_id,
            from_state: r.from_state,
            to_state: r.to_state,
          },
          issues: [],
          warnings: [],
        },
        null,
        2,
      ) + '\n',
    )
    return 0
  }
  process.stdout.write(
    JSON.stringify(
      {
        schema: 'atelier.command-result/v1',
        status: 'fail',
        component: 'autopoiesis',
        command: 'promote',
        data: {},
        issues: [
          {
            severity: 'P0',
            code: r.code,
            message: r.message,
          },
        ],
        warnings: [],
      },
      null,
      2,
    ) + '\n',
  )
  return 1
}

export type PromoteOptions = {
  evidenceRefs?: ReadonlyArray<string>
  ownerOrPolicy?: string
  /** Pre-loaded semantic nodes (for tests). */
  semanticNodes?: SemanticNode[]
  /** When `true`, do not persist the updated node or decision. */
  persist?: boolean
  /** Override timestamp (for tests). */
  createdAt?: string
}

/**
 * Promote a SemanticNode to a new lifecycle state. This is the
 * library entry point used by tests; the CLI command wraps it.
 */
export async function promote(
  nodeId: string,
  to: LifecycleState,
  opts: PromoteOptions = {},
): Promise<PromoteResult> {
  const nodes = opts.semanticNodes ?? (await readNdjsonAutopoiesis<SemanticNode>(AUTOPOIESIS_PATHS.semanticNodes))
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) {
    return {
      ok: false,
      code: 'E_NODE_MISSING_REQUIRED',
      message: `SemanticNode '${nodeId}' not found in .atelier/v0/autopoiesis/semantic-nodes.ndjson.`,
    }
  }

  const r = transition(node.lifecycle_state, to, {
    provenance: node.provenance_kind,
    evidence_refs: opts.evidenceRefs,
    owner_or_policy: opts.ownerOrPolicy,
    authority_scope: node.authority_scope,
  })
  if (!r.ok) {
    return { ok: false, code: r.code, message: r.message }
  }

  if (opts.persist === false) {
    return {
      ok: true,
      decision_id: '<unpersisted>',
      subject_id: nodeId,
      from_state: r.from,
      to_state: r.to,
    }
  }

  const createdAt = opts.createdAt ?? new Date().toISOString()
  const decisionId = `pd:${createHash('sha256')
    .update(`promote|${nodeId}|${r.from}|${r.to}|${createdAt}`)
    .digest('hex')
    .slice(0, 16)}`

  const decision: PromotionDecisionRecord = {
    schema: 'atelier.promotion-decision/v1',
    id: decisionId,
    subject_id: nodeId,
    from_state: r.from,
    to_state: r.to,
    decision: 'accepted',
    required_checks: [],
    evidence_refs: opts.evidenceRefs ? [...opts.evidenceRefs] : [],
    decided_by: opts.ownerOrPolicy ?? 'atelier:promote',
    decided_at: createdAt,
    created_at: createdAt,
  }

  // Update the node's lifecycle_state in semantic-nodes.ndjson
  // (in-place rewrite via the in-process mutex).
  const updated = nodes.map((n) => (n.id === nodeId ? { ...n, lifecycle_state: r.to } : n))
  await writeNdjsonAutopoiesis(AUTOPOIESIS_PATHS.semanticNodes, updated)
  await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, decision)

  return {
    ok: true,
    decision_id: decisionId,
    subject_id: nodeId,
    from_state: r.from,
    to_state: r.to,
  }
}

function parseArgs(argv: readonly string[]): {
  id: string | undefined
  to: LifecycleState | undefined
  evidence: string[]
  owner: string | undefined
} {
  let id: string | undefined
  let to: LifecycleState | undefined
  const evidence: string[] = []
  let owner: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--id') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        id = v
        i++
      }
    } else if (a && a.startsWith('--id=')) {
      id = a.slice('--id='.length)
    } else if (a === '--to') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        to = v as LifecycleState
        i++
      }
    } else if (a && a.startsWith('--to=')) {
      to = a.slice('--to='.length) as LifecycleState
    } else if (a === '--evidence') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        evidence.push(v)
        i++
      }
    } else if (a && a.startsWith('--evidence=')) {
      evidence.push(a.slice('--evidence='.length))
    } else if (a === '--owner') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        owner = v
        i++
      }
    } else if (a && a.startsWith('--owner=')) {
      owner = a.slice('--owner='.length)
    }
  }
  return { id, to, evidence, owner }
}

if (import.meta.main) {
  runPromoteCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
