import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { deriveAllTasks } from '../lib/task.ts'
import { deriveAllContractsAndBoundaries } from '../lib/contracts.ts'
import { deriveAllPacketTemplates } from '../lib/packet-template.ts'
import { emitRecommendationsDetailed } from '../lib/recommend.ts'
import { loadAcceptedRelations } from '../lib/relations.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runTransformCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const target = readFlag([...argv], '--target')
    if (target !== 'md-to-code') {
      throw new Error('transform requires --target md-to-code')
    }
    // 1. Load the accepted relation graph.
    const accepted = await loadAcceptedRelations()
    // 2. Derive tasks grounded in accepted relations.
    const tasks = await deriveAllTasks()
    // 3. Derive contracts + edit boundaries; both inherit relation ids.
    //    The derivation also applies the fail-closed ready/contract
    //    propagation: any `ready` task whose contract is `blocked`
    //    or has empty `test_files` / `target_files` is downgraded
    //    to `blocked` with explicit `blocker_ids`. The downgraded
    //    tasks are returned here so downstream stages (packet
    //    template, recommend, render, validate) see the corrected
    //    state. Warnings are surfaced in the result data.
    const {
      testContracts,
      warnings: contractWarnings,
      tasks: derivedTasks,
    } = await deriveAllContractsAndBoundaries(tasks, accepted)
    // 4. Derive packet templates; each inherits relation ids and sets
    //    a search_policy. Templates are built from the (possibly
    //    downgraded) `derivedTasks` so a `blocked` task produces a
    //    `blocked` template, not a `ready` one.
    const templates = await deriveAllPacketTemplates(derivedTasks, testContracts)
    // 5. Emit recommendations; each cites an accepted relation.
    const recResult = await emitRecommendationsDetailed()
    const result = ok(
      'transformer',
      'transform',
      {
        target,
        accepted_relations: accepted.length,
        tasks: derivedTasks.length,
        tasks_ready: derivedTasks.filter((t) => t.status === 'ready').length,
        tasks_blocked: derivedTasks.filter((t) => t.status === 'blocked').length,
        tasks_downgraded_to_blocked: contractWarnings.length,
        tasks_with_relation_trace: derivedTasks.filter(
          (t) => (t.source_relation_ids?.length ?? 0) > 0,
        ).length,
        contracts: testContracts.length,
        contracts_ready: testContracts.filter((c) => c.status === 'ready').length,
        contracts_blocked: testContracts.filter((c) => c.status === 'blocked').length,
        contracts_with_relation_trace: testContracts.filter(
          (c) => (c.source_relation_ids?.length ?? 0) > 0,
        ).length,
        templates: templates.length,
        recommendations: recResult.recommendations.length,
        duplicates: recResult.duplicates.length,
        raw_recommendation_pairs: recResult.raw_pair_count,
        design_doc_tasks: derivedTasks.filter((t) =>
          t.source_refs.some((r) => r.path.startsWith('harness/atelier-design-docs/')),
        ).length,
        fixture_tasks: derivedTasks.filter(
          (t) => t.fixture === true || (t.tags ?? []).includes('fixture'),
        ).length,
        contract_warnings: contractWarnings,
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('transformer', 'transform', [
      { severity: 'P0', code: 'E_TRANSFORM', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runTransformCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
