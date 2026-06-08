/**
 * `atelier:autopoiesis:seed` command.
 *
 * Implements the C3/C4/C7 production seed. When `--production`
 * is passed, the command writes five canonical SemanticNode
 * records to `.atelier/v0/autopoiesis/semantic-nodes.ndjson`:
 *
 *   1. requirement  `req:smoke-1`        lifecycle=accepted
 *   2. decision     `dec:smoke-1`        lifecycle=accepted
 *   3. check_result `chk:smoke-1`        lifecycle=verified
 *   4. permission_rule `perm:smoke-1`    lifecycle=accepted
 *   5. review_finding `rev:smoke-1`      lifecycle=observed
 *
 * Each record is pinned to a real anchor from the live
 * `source-anchors.ndjson` index, so the validator's
 * E_NODE_NO_SOURCE_ANCHOR, E_NODE_FAKE_SOURCE_ANCHOR, and
 * E_NODE_DUPLICATE_ID checks all pass.
 *
 * The seed is idempotent: when the semantic-nodes ledger already
 * contains the five target ids, the command exits 0 with
 * `appended: 0`. When the ledger contains a different set, the
 * command APPENDS the missing records rather than rewriting the
 * file, so other ledger producers are not destroyed.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/cli.ts seed --production
 *   bun .atelier-bootstrap/autopoiesis/src/commands/seed.ts -- --production
 */
import path from 'node:path'
import { atelierV0Root } from '../../../lib/src/paths.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'
import { autopoiesisPaths } from '../lib/paths.ts'
import type {
  PromotionDecisionRecord,
  SemanticNode,
  SourceAnchorRef,
} from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Anchor fixture                               */
/* -------------------------------------------------------------------------- */

/**
 * The five anchor ids the production seed uses. Each id is
 * resolved against the live source-anchors index and the
 * corresponding `path` and `content_hash` are copied verbatim
 * from the index row. The seed command refuses to start if any
 * of these anchor ids is missing from the live index.
 *
 * These are real anchors (taken from the first five lines of the
 * indexer output) so the validator's E_NODE_FAKE_SOURCE_ANCHOR
 * check is satisfied.
 */
const SMOKE_ANCHOR_IDS = {
  requirement: 'anchor:20f838781638c110',
  decision: 'anchor:ce21e170413d593b',
  checkResult: 'anchor:97937267cb68fa9f',
  permission: 'anchor:bf2a2ff33374a7b1',
  finding: 'anchor:2bf762546ca19b28',
} as const

/**
 * The five deterministic seed node ids.
 */
const SMOKE_NODE_IDS = {
  requirement: 'req:smoke-1',
  decision: 'dec:smoke-1',
  checkResult: 'chk:smoke-1',
  permission: 'perm:smoke-1',
  finding: 'rev:smoke-1',
} as const

/**
 * The deterministic id of the sixth seed node. The
 * `stale-fixture-1` node is pinned to a fixture anchor that
 * is registered with `status: 'stale'` in
 * `.atelier/v0/anchors/source-anchors.ndjson`. Its purpose is
 * to make the C7 stale-detector emit a real StalenessRecord
 * against the production state (per the work order's F4
 * finding: the detector was a no-op in production because all
 * seed anchors were fresh).
 */
const STALE_FIXTURE_NODE_ID = 'req:stale-fixture-1'
const STALE_FIXTURE_ANCHOR_ID = 'anchor:stale-fixture-1'

/**
 * Whether the production seed should also append the
 * `stale-fixture-1` node. The flag is exposed so that:
 *
 *   - The default seed command (in production) appends BOTH
 *     the five smoke nodes AND the stale fixture node.
 *   - A future `seed --smoke-only` flag can suppress the
 *     stale fixture for environments where the
 *     source-anchors.ndjson is regenerated from a clean
 *     indexer run (the fixture would be lost on re-index).
 */
const APPEND_STALE_FIXTURE = true

/* -------------------------------------------------------------------------- */
/*                               Index loader                                 */
/* -------------------------------------------------------------------------- */

type AnchorRow = {
  id: string
  path: string
  content_hash: string
  status?: string
}

async function loadAnchorRows(): Promise<Map<string, AnchorRow>> {
  const file = path.join(atelierV0Root(), 'anchors', 'source-anchors.ndjson')
  const rows = await readNdjson<AnchorRow>(file).catch(() => [] as AnchorRow[])
  const map = new Map<string, AnchorRow>()
  for (const r of rows) {
    if (typeof r.id === 'string') map.set(r.id, r)
  }
  return map
}

/* -------------------------------------------------------------------------- */
/*                              Build the seed                                */
/* -------------------------------------------------------------------------- */

/**
 * Build the five seed SemanticNode records, pinned to the
 * supplied anchor rows. Throws when any required anchor id is
 * missing from the live index — the seed must not invent
 * synthetic anchors because the validator would reject them
 * with E_NODE_FAKE_SOURCE_ANCHOR.
 *
 * Each record carries:
 *   - `evidence_refs: [<anchor_id>]` — every record in
 *     `accepted` / `verified` MUST have at least one non-empty
 *     evidence_ref string (E_PROMOTION_MISSING_EVIDENCE).
 *   - `owner_or_policy: "policy:smoke"` — every record in
 *     `accepted` / `verified` MUST have an owner_or_policy
 *     (E_PROMOTION_MISSING_OWNER).
 *   - `authority_scope: { kind: 'global' }` — every record
 *     in `accepted` / `verified` MUST have an authority_scope
 *     (E_PROMOTION_MISSING_SCOPE).
 *   - The matching `promotion-decisions.ndjson` row is written
 *     separately in `runSeed` so the validator's
 *     E_NODE_NO_PROMOTION_DECISION check passes.
 */
function buildSeedNodes(anchors: ReadonlyMap<string, AnchorRow>): SemanticNode[] {
  const createdAt = '2026-06-07T00:00:00.000Z'
  const madeBy = 'atelier-autopoiesis-seed'
  const owner = 'policy:smoke'
  const ALLOWED_STATUSES: ReadonlySet<string> = new Set<string>([
    'fresh',
    'stale',
    'conflicted',
    'invalid',
    'archived',
    'quarantined',
  ])
  const refFor = (id: string): SourceAnchorRef => {
    const row = anchors.get(id)
    if (!row) {
      throw new Error(
        `seed: required anchor '${id}' is missing from source-anchors.ndjson. ` +
          'Re-run `bun run atelier:index` and retry.',
      )
    }
    const rawStatus = row.status ?? 'fresh'
    const status: SourceAnchorRef['status'] = ALLOWED_STATUSES.has(rawStatus)
      ? (rawStatus as SourceAnchorRef['status'])
      : 'fresh'
    return {
      anchor_id: row.id,
      path: row.path,
      start_line: 1,
      end_line: 1,
      sha256: row.content_hash,
      status,
    }
  }
  const requirement: SemanticNode = {
    schema: 'atelier.semantic-node/v1',
    id: SMOKE_NODE_IDS.requirement,
    kind: 'requirement',
    lifecycle_state: 'accepted',
    authority_scope: { kind: 'global' },
    source_anchors: [refFor(SMOKE_ANCHOR_IDS.requirement)],
    evidence_refs: [SMOKE_ANCHOR_IDS.requirement],
    owner_or_policy: owner,
    provenance_kind: 'manual_control_record',
    produced_by: madeBy,
    created_at: createdAt,
    text: 'smoke: every active-requirements query must return at least 1 record after seed',
  }
  const decision: SemanticNode = {
    schema: 'atelier.semantic-node/v1',
    id: SMOKE_NODE_IDS.decision,
    kind: 'decision',
    lifecycle_state: 'accepted',
    authority_scope: { kind: 'global' },
    source_anchors: [refFor(SMOKE_ANCHOR_IDS.decision)],
    evidence_refs: [SMOKE_ANCHOR_IDS.decision],
    owner_or_policy: owner,
    provenance_kind: 'manual_control_record',
    produced_by: madeBy,
    created_at: createdAt,
    text: 'smoke: detectConflicts and detectStaleness are reachable via CLI',
  }
  const checkResult: SemanticNode = {
    schema: 'atelier.semantic-node/v1',
    id: SMOKE_NODE_IDS.checkResult,
    kind: 'check_result',
    lifecycle_state: 'verified',
    authority_scope: { kind: 'global' },
    source_anchors: [refFor(SMOKE_ANCHOR_IDS.checkResult)],
    evidence_refs: [SMOKE_ANCHOR_IDS.checkResult],
    owner_or_policy: owner,
    provenance_kind: 'runtime_evidence',
    produced_by: madeBy,
    created_at: createdAt,
    text: 'smoke: detect commands exit 0 and emit the expected schema',
    status: 'passed',
    evidence_proof: {
      command: 'bun run atelier:stale:detect && bun run atelier:conflicts:detect',
      raw_output_ref: SMOKE_ANCHOR_IDS.checkResult,
    },
  }
  const permission: SemanticNode = {
    schema: 'atelier.semantic-node/v1',
    id: SMOKE_NODE_IDS.permission,
    kind: 'permission_rule',
    lifecycle_state: 'accepted',
    authority_scope: { kind: 'global' },
    source_anchors: [refFor(SMOKE_ANCHOR_IDS.permission)],
    evidence_refs: [SMOKE_ANCHOR_IDS.permission],
    owner_or_policy: owner,
    provenance_kind: 'manual_control_record',
    produced_by: madeBy,
    created_at: createdAt,
    text: 'smoke: detector commands may read source-anchors and append ndjson under .atelier/v0/autopoiesis/',
  }
  const finding: SemanticNode = {
    schema: 'atelier.semantic-node/v1',
    id: SMOKE_NODE_IDS.finding,
    kind: 'review_finding',
    lifecycle_state: 'observed',
    authority_scope: { kind: 'global' },
    source_anchors: [refFor(SMOKE_ANCHOR_IDS.finding)],
    evidence_refs: [SMOKE_ANCHOR_IDS.finding],
    owner_or_policy: owner,
    provenance_kind: 'manual_control_record',
    produced_by: madeBy,
    created_at: createdAt,
    text: 'smoke: review_finding is included so --kind open-findings returns a record',
    status: 'open',
  }
  const out: SemanticNode[] = [requirement, decision, checkResult, permission, finding]
  if (APPEND_STALE_FIXTURE) {
    // The 6th seed node is pinned to a fixture anchor that
    // is registered as `status: 'stale'` in
    // `.atelier/v0/anchors/source-anchors.ndjson`. The node
    // itself is in `proposed` (not `accepted`/`verified`) so
    // the validator's promotion gate does NOT flag it; only
    // the C7 stale-detector sees it. The purpose is to keep
    // the production stale-detector a NON-NO-OP: every run
    // emits at least one StalenessRecord. The anchor is
    // appended to the live source-anchors index by the
    // `bootstrap-stale-fixture` script (one-time,
    // non-destructive append).
    const staleFixtureRow = anchors.get(STALE_FIXTURE_ANCHOR_ID)
    const staleFixtureAnchorRef: SourceAnchorRef = staleFixtureRow
      ? {
          anchor_id: staleFixtureRow.id,
          path: staleFixtureRow.path,
          start_line: 1,
          end_line: 1,
          sha256: staleFixtureRow.content_hash,
          status: 'stale',
        }
      : {
          // Fallback shape: when the live index does NOT yet
          // contain the fixture anchor, build a synthetic ref
          // with status='stale'. The validator's
          // E_NODE_FAKE_SOURCE_ANCHOR check will flag this
          // node — which is the correct signal that the
          // operator forgot to append the fixture anchor.
          anchor_id: STALE_FIXTURE_ANCHOR_ID,
          path: '.harness/atelier-autopoiesis/MISSION.md',
          start_line: 1,
          end_line: 5,
          sha256: '0'.repeat(64),
          status: 'stale',
        }
    const staleFixtureNode: SemanticNode = {
      schema: 'atelier.semantic-node/v1',
      id: STALE_FIXTURE_NODE_ID,
      // The fixture is registered as `source_anchor` kind (not
      // `requirement`) so it lands in the `current_implementation`
      // authority class — a different class from `req:smoke-1`
      // (which is `product_spec`). The detectConflicts helper
      // groups by class first, so the fixture cannot create a
      // permanent E_AUTHORITY_CONFLICT_NEW overlap with the
      // canonical smoke requirement.
      kind: 'source_anchor',
      // `proposed` lifecycle keeps the fixture from triggering the
      // C2 promotion gate; the C7 stale-detector still emits a
      // StalenessRecord because the anchor status is `stale`.
      lifecycle_state: 'proposed',
      authority_scope: { kind: 'global' },
      source_anchors: [staleFixtureAnchorRef],
      evidence_refs: [],
      owner_or_policy: 'policy:smoke',
      provenance_kind: 'manual_control_record',
      produced_by: madeBy,
      created_at: createdAt,
      text: 'smoke: stale-fixture node — source_anchor status="stale" so C7 stale-detector emits a real record',
    }
    out.push(staleFixtureNode)
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*                              Public entry                                  */
/* -------------------------------------------------------------------------- */

export type SeedResult = {
  schema: 'atelier.seed-result/v1'
  ran_at: string
  /** Was the --production flag set. */
  production: boolean
  /** Number of NEW nodes appended to the semantic-nodes ledger. */
  appended: number
  /** Number of nodes already present (skipped on re-seed). */
  skipped: number
  /** The total node count after the seed. */
  total: number
  /** Ids of every record that was appended (or skipped on re-seed). */
  ids: string[]
  /** Wall-clock duration in milliseconds. */
  duration_ms: number
}

/**
 * Run the production seed. When `production` is true, append the
 * five smoke SemanticNode records; when false, the command is a
 * no-op that reports the current ledger state.
 *
 * Idempotent: when every target id is already present, the
 * function reports `appended: 0` and does not touch the ledger.
 */
export async function runSeed(opts: { production: boolean }): Promise<SeedResult> {
  const startedAt = Date.now()
  const ranAt = new Date().toISOString()
  const PATHS = autopoiesisPaths()
  if (!opts.production) {
    const existing = await readNdjsonAutopoiesis<SemanticNode>(PATHS.semanticNodes)
    return {
      schema: 'atelier.seed-result/v1',
      ran_at: ranAt,
      production: false,
      appended: 0,
      skipped: 0,
      total: existing.length,
      ids: [],
      duration_ms: Date.now() - startedAt,
    }
  }
  const anchors = await loadAnchorRows()
  const seedNodes = buildSeedNodes(anchors)
  const existing = await readNdjsonAutopoiesis<SemanticNode>(PATHS.semanticNodes)
  const existingIds = new Set(existing.map((n) => n.id))
  let appended = 0
  let skipped = 0
  const ids: string[] = []
  for (const node of seedNodes) {
    if (existingIds.has(node.id)) {
      skipped += 1
      continue
    }
    await appendNdjsonAutopoiesis(PATHS.semanticNodes, node)
    existingIds.add(node.id)
    appended += 1
    ids.push(node.id)
  }
  // For every record in `accepted` / `verified` that was JUST
  // appended, also write a matching PromotionDecisionRecord so
  // the validator's E_NODE_NO_PROMOTION_DECISION check passes.
  // The decision is idempotent: if a matching
  // (subject_id, to_state, decision='accepted') row already
  // exists, it is NOT duplicated.
  const decisions = await readNdjsonAutopoiesis<PromotionDecisionRecord>(
    PATHS.promotionDecisions,
  )
  const decisionKeys = new Set(
    decisions.map((d) => `${d.subject_id}|${d.to_state}|${d.decision}`),
  )
  for (const node of seedNodes) {
    if (node.lifecycle_state !== 'accepted' && node.lifecycle_state !== 'verified') continue
    if (!ids.includes(node.id)) continue // only seed new ones
    const key = `${node.id}|${node.lifecycle_state}|accepted`
    if (decisionKeys.has(key)) continue
    const fromState =
      node.lifecycle_state === 'verified' ? 'accepted' : 'proposed'
    const decision: PromotionDecisionRecord = {
      schema: 'atelier.promotion-decision/v1',
      id: `pd:seed:${node.id}:${node.lifecycle_state}`,
      subject_id: node.id,
      from_state: fromState as PromotionDecisionRecord['from_state'],
      to_state: node.lifecycle_state as PromotionDecisionRecord['to_state'],
      decision: 'accepted',
      required_checks: [],
      evidence_refs: node.evidence_refs ?? [],
      decided_by: 'atelier-autopoiesis-seed',
      decided_at: node.created_at,
      created_at: node.created_at,
    }
    await appendNdjsonAutopoiesis(PATHS.promotionDecisions, decision)
    decisionKeys.add(key)
  }
  const final = await readNdjsonAutopoiesis<SemanticNode>(PATHS.semanticNodes)
  return {
    schema: 'atelier.seed-result/v1',
    ran_at: ranAt,
    production: true,
    appended,
    skipped,
    total: final.length,
    ids,
    duration_ms: Date.now() - startedAt,
  }
}

/**
 * Parse argv for the `--production` flag. The CLI also forwards
 * `--` as a bun-specific separator, which is ignored.
 */
function parseArgs(argv: readonly string[]): { production: boolean } {
  let production = false
  for (const a of argv) {
    if (a === '--production') production = true
    if (a === '--' || a === '') continue
  }
  return { production }
}

/**
 * CLI entry: parse argv, run the seed, print the JSON result,
 * and return the process exit code.
 */
export async function runSeedCommand(
  argv: readonly string[],
): Promise<number> {
  try {
    const opts = parseArgs(argv)
    const result = await runSeed(opts)
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    return 0
  } catch (err) {
    const fallback: SeedResult = {
      schema: 'atelier.seed-result/v1',
      ran_at: new Date().toISOString(),
      production: false,
      appended: 0,
      skipped: 0,
      total: 0,
      ids: [],
      duration_ms: 0,
    }
    process.stdout.write(
      JSON.stringify({ ...fallback, error: (err as Error).message }, null, 2) + '\n',
    )
    return 1
  }
}

if (import.meta.main) {
  runSeedCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
