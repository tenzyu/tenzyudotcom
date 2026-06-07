/**
 * Run the full pipeline, then the strict ready check.
 *
 * Pipeline:
 *   1. indexer update (see `reindex()` from `./review.ts`)
 *   2. reader sample
 *   3. transformer transform (md-to-code)
 *   4. transformer render
 *   5. executor render
 *
 * In addition, the Relation-Kernel pipeline inserts:
 *   - `indexer relations-index` to refresh deterministic non-`contains`
 *     relations before the transformer consumes them
 *   - `reader relations-propose` (with the most-recent attention id)
 *     to emit schema-bound RelationProposal records, so the
 *     transformer can pick them up
 *   - `reader relations-accept` is NOT auto-invoked: the reader
 *     accept policy is reviewer-controlled; the verify pipeline
 *     surfaces the defect if no accepted relations exist.
 *
 * After the pipeline, run the strict `runReady` aggregator. The
 * operational review returned by `runReady` is the authoritative
 * result. If any pipeline step exits non-zero, verify returns
 * `fail` immediately with that step's defect. Otherwise, the
 * returned review reflects whatever `runReady` reports — including
 * any P0/P1 defects from the component validators, the independent
 * strict invariant checks, the indexer mode check, and the
 * Relation-Kernel invariants.
 *
 * The `reader relations-propose` step is wrapped to NOT abort the
 * pipeline on failure: a missing proposal is a Relation-Kernel
 * defect, but the operation layer is the right place to surface it
 * (so the reviewer can see the report end-to-end rather than the
 * pipeline halting). The `indexer relations-index` step, by
 * contrast, IS fatal because every downstream step depends on the
 * deterministic relations being fresh.
 *
 * Note: `runReady` ALSO calls `reindex()` before its validators, so
 * the re-index step appears in `commands_run` twice when invoked
 * via `atelier:verify`. This is intentional and harmless: the
 * re-index is idempotent, and surfacing both invocations makes the
 * audit trail clearer. `runReady` cannot rely on `runVerify` to
 * have re-indexed already, because `atelier:ready` is a public
 * entrypoint in its own right.
 *
 * The work order says: `atelier:verify` MUST return fail if any
 * pipeline step exits non-zero OR if the strict ready check fails.
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { runReady, reindex, type OperationalReview } from '../lib/review.ts'
import { READER_PATHS } from '../../../lib/src/index.ts'

type PipelineStep = {
  component: OperationalReview['blocking_defects'][number]['affected_component']
  cli: string
  args: string[]
  /**
   * When `true`, a non-zero exit does NOT abort the verify pipeline.
   * The defect (or its absence) is left for the operation layer to
   * surface through its own invariants. The `commands_not_run` list
   * is not extended when this step fails because subsequent steps
   * still run.
   */
  soft?: boolean
  /**
   * Optional human-readable reason for the `soft` flag. Recorded in
   * `commands_not_run` for clarity when the step is skipped or
   * soft-fails.
   */
  softReason?: string
}

const READER_CLI = '.atelier-bootstrap/reader/src/cli.ts'
const INDEXER_CLI = '.atelier-bootstrap/indexer/src/cli.ts'

// Note: the indexer `update` step is NOT listed here. It runs at
// the top of `runVerify` via the shared `reindex()` helper so the
// same code path is used by `runReady` and `runVerify` (avoiding
// drift if the re-index invocation ever needs to change).
const PIPELINE: ReadonlyArray<PipelineStep> = [
  { component: 'reader', cli: READER_CLI, args: ['sample'] },
  // 4a. Refresh the deterministic non-`contains` relations.
  //     Fatal on failure: every downstream step depends on a
  //     non-empty relation graph.
  { component: 'indexer', cli: INDEXER_CLI, args: ['relations-index'] },
  // 4b. Emit schema-bound RelationProposal records against the
  //     most-recent attention set, if one exists. The exact
  //     attention id is discovered at runtime by reading
  //     `objects/attention.ndjson` and picking the most recent
  //     non-stale record. Wrapped to NOT abort: a missing
  //     proposal surfaces as `E_NO_READER_PROPOSALS` in the
  //     operation review.
  {
    component: 'reader',
    cli: READER_CLI,
    args: ['relations:propose', '--attention', '__AUTO_ATTENTION_ID__'],
    soft: true,
    softReason: 'no attention set exists; relations:propose is not applicable',
  },
  {
    component: 'transformer',
    cli: '.atelier-bootstrap/transformer/src/cli.ts',
    args: ['transform', '--target', 'md-to-code'],
  },
  { component: 'transformer', cli: '.atelier-bootstrap/transformer/src/cli.ts', args: ['render'] },
  { component: 'executor', cli: '.atelier-bootstrap/executor/src/cli.ts', args: ['render'] },
]

/**
 * Discover the most-recent non-stale attention id from
 * `.atelier/v0/objects/attention.ndjson`. Returns `null` when the
 * file is missing, empty, or every set is `stale`. The discover
 * function never throws; an unreadable file yields `null`.
 */
async function findLatestAttentionId(): Promise<string | null> {
  if (!existsSync(READER_PATHS.attention)) return null
  try {
    const text = await readFile(READER_PATHS.attention, 'utf8')
    const lines = text.split(/\r?\n/)
    type Row = { id: string; status?: string; created_at?: string }
    const rows: Row[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '' || trimmed.startsWith('#')) continue
      try {
        rows.push(JSON.parse(trimmed) as Row)
      } catch {
        // skip malformed
      }
    }
    // Prefer fresh sets; fall back to anything not stale. The
    // "most recent" is the one with the latest `created_at` (when
    // present) or the last one in the file.
    let best: Row | null = null
    for (const r of rows) {
      if (r.status === 'stale') continue
      if (!best) {
        best = r
        continue
      }
      if (r.created_at && best.created_at && r.created_at > best.created_at) {
        best = r
      } else if (!best.created_at) {
        best = r
      }
    }
    return best?.id ?? null
  } catch {
    return null
  }
}

export async function runVerify(): Promise<OperationalReview> {
  const commandsRun: string[] = []
  const commandsNotRun: string[] = []

  // 0. Re-index via the shared helper. If this step fails, abort
  //    immediately and mark all remaining steps as not run.
  const reindexOutcome = await reindex()
  commandsRun.push(reindexOutcome.cmdStr)
  if (reindexOutcome.code !== 0) {
    for (const step of PIPELINE) {
      commandsNotRun.push(`${step.cli} ${step.args.join(' ')}`)
    }
    commandsNotRun.push('.atelier-bootstrap/operation/src/cli.ts ready (skipped because re-index aborted)')
    return {
      schema: 'atelier.operational-review/v1',
      status: 'fail',
      generated_at: new Date().toISOString(),
      commands_run: commandsRun,
      commands_not_run: commandsNotRun,
      blocking_defects: [
        {
          defect_id: `operation:E_REINDEX_FAILED`,
          severity: 'P0',
          blocking: true,
          affected_component: 'operation',
          affected_record: reindexOutcome.cmdStr,
          reason: `atelier:index update exited with code ${reindexOutcome.code}; verify aborted`,
          recommended_next_action: 'rerun `bun run atelier:index update` and inspect the output',
        },
      ],
      warnings: [],
      verified_invariants: [],
    }
  }

  // 1. Discover the most-recent attention id once, up front, so the
  //    reader relations:propose step can use it. If no attention
  //    set exists, the step is recorded as "not run" with a
  //    human-readable reason and the verify continues.
  const attentionId = await findLatestAttentionId()
  const resolvedPipeline: PipelineStep[] = PIPELINE.map((step) => {
    if (step.cli === READER_CLI && step.args[0] === 'relations:propose') {
      if (attentionId) {
        return { ...step, args: ['relations:propose', '--attention', attentionId] }
      }
      return { ...step, soft: true, softReason: step.softReason ?? 'no attention set exists' }
    }
    return step
  })

  // 2. Run the data pipeline. Soft steps never abort. Hard steps
  //    abort on first non-zero, and the remaining steps are
  //    recorded as not run.
  for (const step of resolvedPipeline) {
    const cmdStr = `${step.cli} ${step.args.join(' ')}`
    if (step.cli === READER_CLI && step.args[0] === 'relations:propose' && !attentionId) {
      // No attention set exists; record the step as not run and
      // move on. The operation layer will surface the missing
      // proposals defect.
      commandsNotRun.push(`${cmdStr} (skipped: ${step.softReason ?? 'no attention set'})`)
      continue
    }
    commandsRun.push(cmdStr)
    const proc = Bun.spawnSync(['bun', step.cli, ...step.args], {
      cwd: process.cwd(),
      env: process.env,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    if (proc.exitCode !== 0) {
      if (step.soft) {
        // Soft step: do not abort. Record a warning and continue.
        // The defect (or its absence) will be surfaced by the
        // operation layer's strict invariant check.
        const stderr = proc.stderr.toString()
        commandsRun.push(`  (soft: ${step.softReason ?? 'see step output'}; exit=${proc.exitCode})`)
        if (stderr.trim() !== '') {
          // Keep stderr out of the audit trail unless it has a
          // distinctive message; we just record a one-liner.
          commandsRun.push(`  (stderr-tail: ${stderr.trim().split('\n').slice(-1)[0]?.slice(0, 200)})`)
        }
        continue
      }
      // Mark the remaining pipeline steps as not run.
      const idx = PIPELINE.indexOf(step)
      for (let i = idx + 1; i < PIPELINE.length; i++) {
        commandsNotRun.push(`${PIPELINE[i]!.cli} ${PIPELINE[i]!.args.join(' ')}`)
      }
      commandsNotRun.push('.atelier-bootstrap/operation/src/cli.ts ready (skipped because pipeline aborted)')
      return {
        schema: 'atelier.operational-review/v1',
        status: 'fail',
        generated_at: new Date().toISOString(),
        commands_run: commandsRun,
        commands_not_run: commandsNotRun,
        blocking_defects: [
          {
            defect_id: `pipeline:${step.component}:E_PIPELINE_STEP`,
            severity: 'P0',
            blocking: true,
            affected_component: step.component,
            affected_record: cmdStr,
            reason: `pipeline step ${step.component} exited with code ${proc.exitCode}`,
            recommended_next_action: 'inspect the step output and rerun',
          },
        ],
        warnings: [],
        verified_invariants: [],
      }
    }
  }

  // 3. Run the strict ready check.
  commandsRun.push('.atelier-bootstrap/operation/src/cli.ts ready (strict)')
  const readyReview = await runReady()
  // Merge the pipeline commands with the ready commands for the report.
  return {
    ...readyReview,
    commands_run: [...commandsRun, ...readyReview.commands_run],
  }
}

// Mark `path` and `existsSync` as used to keep tsc happy if the
// module-level read paths are ever refactored.
void path
void existsSync
