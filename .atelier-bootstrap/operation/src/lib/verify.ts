/**
 * Run the full pipeline: scan -> index -> reader -> transformer -> executor.
 */
import { runReady, type OperationalReview } from '../lib/review.ts'

const PIPELINE: Array<{ component: string; cli: string; args: string[] }> = [
  { component: 'indexer', cli: '.atelier-bootstrap/indexer/src/cli.ts', args: ['update'] },
  { component: 'reader', cli: '.atelier-bootstrap/reader/src/cli.ts', args: ['sample'] },
  { component: 'transformer', cli: '.atelier-bootstrap/transformer/src/cli.ts', args: ['transform', '--target', 'md-to-code'] },
  { component: 'transformer', cli: '.atelier-bootstrap/transformer/src/cli.ts', args: ['render'] },
  { component: 'executor', cli: '.atelier-bootstrap/executor/src/cli.ts', args: ['render'] },
  { component: 'operation', cli: '.atelier-bootstrap/operation/src/cli.ts', args: ['ready'] },
]

export async function runVerify(): Promise<OperationalReview> {
  // Re-run each pipeline step (its output JSON is not consumed here;
  // we just need them to actually run).
  for (const step of PIPELINE) {
    const proc = Bun.spawnSync(['bun', step.cli, ...step.args], {
      cwd: process.cwd(),
      env: process.env,
    })
    if (proc.exitCode !== 0) {
      return {
        schema: 'atelier.operational-review/v1',
        status: 'fail',
        generated_at: new Date().toISOString(),
        commands_run: PIPELINE.slice(0, PIPELINE.indexOf(step) + 1).map((s) => `${s.cli} ${s.args.join(' ')}`),
        commands_not_run: PIPELINE.slice(PIPELINE.indexOf(step) + 1).map((s) => `${s.cli} ${s.args.join(' ')}`),
        blocking_defects: [{
          defect_id: `pipeline:${step.component}:E_PIPELINE_STEP`,
          severity: 'P0',
          blocking: true,
          affected_component: step.component as OperationalReview['blocking_defects'][number]['affected_component'],
          affected_record: `${step.cli} ${step.args.join(' ')}`,
          reason: `pipeline step ${step.component} exited with code ${proc.exitCode}`,
          recommended_next_action: 'inspect the step output and rerun',
        }],
        warnings: [],
        verified_invariants: [],
      }
    }
  }
  return runReady()
}
