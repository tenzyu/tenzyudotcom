/**
 * Atelier Autopoiesis — output paths.
 *
 * The autopoiesis component owns its own NDJSON files under
 * `.atelier/v0/autopoiesis/`. The component is read-only on every
 * other path under `.atelier/v0/**` and on the working tree.
 */
import path from 'node:path'
import { atelierV0Root } from '../../../lib/src/paths.ts'

/**
 * The autopoiesis output root.
 */
export function autopoiesisRoot(): string {
  return path.join(atelierV0Root(), 'autopoiesis')
}

/**
 * Return the canonical autopoiesis NDJSON paths. All paths are
 * computed from `autopoiesisRoot()` so the function form respects
 * `process.cwd()` mutations (e.g. inside tests).
 */
export function autopoiesisPaths(): {
  semanticNodes: string
  promotionDecisions: string
  stalenessRecords: string
  conflictRecords: string
  authorityRules: string
  controlPackets: string
  materializationProposals: string
  materializationReports: string
  handoffs: string
  findings: string
  workOrders: string
  evaluatorState: string
  evaluatorResult: string
} {
  const root = autopoiesisRoot()
  return {
    semanticNodes: path.join(root, 'semantic-nodes.ndjson'),
    promotionDecisions: path.join(root, 'promotion-decisions.ndjson'),
    stalenessRecords: path.join(root, 'staleness-records.ndjson'),
    conflictRecords: path.join(root, 'conflicts.ndjson'),
    authorityRules: path.join(root, 'authority-rules.ndjson'),
    controlPackets: path.join(root, 'control-packets.ndjson'),
    materializationProposals: path.join(root, 'materialization-proposals.ndjson'),
    materializationReports: path.join(root, 'materialization-reports.ndjson'),
    handoffs: path.join(root, 'handoffs.ndjson'),
    findings: path.join(root, 'findings.ndjson'),
    workOrders: path.join(root, 'work-orders.ndjson'),
    evaluatorState: path.join(root, 'evaluator-state.json'),
    evaluatorResult: path.join(root, 'evaluator-result.json'),
  }
}

/**
 * Convenience constant. Callers that need a `process.cwd()`-aware
 * resolution should call `autopoiesisPaths()` directly.
 *
 * Implemented as a `Proxy` so that every property access computes
 * a fresh path from the current `process.cwd()`. This keeps the
 * constant ergonomic AND test-safe: tests that change `cwd` to a
 * per-suite fixture dir see paths under the fixture, not the
 * real `.atelier/v0/autopoiesis/` tree.
 */
export const AUTOPOIESIS_PATHS: ReturnType<typeof autopoiesisPaths> = new Proxy(
  {} as ReturnType<typeof autopoiesisPaths>,
  {
    get(_target, key) {
      const paths = autopoiesisPaths()
      return (paths as unknown as Record<string | symbol, string>)[key as string]
    },
  },
)
