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
 * After the pipeline, run the strict `runReady` aggregator. The
 * operational review returned by `runReady` is the authoritative
 * result. If any pipeline step exits non-zero, verify returns
 * `fail` immediately with that step's defect. Otherwise, the
 * returned review reflects whatever `runReady` reports — including
 * any P0/P1 defects from the component validators, the independent
 * strict invariant checks, and the indexer mode check.
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
import { runReady, reindex, type OperationalReview } from '../lib/review.ts'

type PipelineStep = {
  component: OperationalReview['blocking_defects'][number]['affected_component']
  cli: string
  args: string[]
}

// Note: the indexer `update` step is NOT listed here. It runs at
// the top of `runVerify` via the shared `reindex()` helper so the
// same code path is used by `runReady` and `runVerify` (avoiding
// drift if the re-index invocation ever needs to change).
const PIPELINE: ReadonlyArray<PipelineStep> = [
  { component: 'reader', cli: '.atelier-bootstrap/reader/src/cli.ts', args: ['sample'] },
  {
    component: 'transformer',
    cli: '.atelier-bootstrap/transformer/src/cli.ts',
    args: ['transform', '--target', 'md-to-code'],
  },
  { component: 'transformer', cli: '.atelier-bootstrap/transformer/src/cli.ts', args: ['render'] },
  { component: 'executor', cli: '.atelier-bootstrap/executor/src/cli.ts', args: ['render'] },
]

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

  // 1. Run the data pipeline. Abort on first non-zero.
  for (const step of PIPELINE) {
    const cmdStr = `${step.cli} ${step.args.join(' ')}`
    commandsRun.push(cmdStr)
    const proc = Bun.spawnSync(['bun', step.cli, ...step.args], {
      cwd: process.cwd(),
      env: process.env,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    if (proc.exitCode !== 0) {
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

  // 2. Run the strict ready check.
  commandsRun.push('.atelier-bootstrap/operation/src/cli.ts ready (strict)')
  const readyReview = await runReady()
  // Merge the pipeline commands with the ready commands for the report.
  return {
    ...readyReview,
    commands_run: [...commandsRun, ...readyReview.commands_run],
  }
}
