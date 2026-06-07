/**
 * `atelier:transform:create-fixture-task` command.
 *
 * Materializes a non-fixture `ImplementationTask`, a `TestContract`,
 * an `EditBoundary`, and a `PacketTemplate` from a real testable
 * surface in the repo (a `.ts` file with a `.test.ts` sibling known
 * to the indexer). The materializer writes a single `verifies`
 * accepted relation to the reader-owned accepted-relations file so
 * the derived `TestContract` carries a verifying relation in its
 * `source_relation_ids` trace.
 *
 * The produced records carry `tags: ['materialized']` so the
 * transform pipeline's merge logic preserves them across
 * `transform --target md-to-code` runs.
 */
import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { materializeFixtureTask } from '../lib/materialize-fixture-task.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runCreateFixtureTaskCommand(
  argv: readonly string[],
): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const fixture = readFlag([...argv], '--fixture') ?? ''
    const taskId = readFlag([...argv], '--task-id') ?? ''
    const materialized = await materializeFixtureTask({ fixture, taskId })
    if (!materialized.ok) {
      const result = fail<unknown>(
        'transformer',
        'create-fixture-task',
        [{ severity: 'P0', code: materialized.error.code, message: materialized.error.message }],
        undefined,
        { startedAt },
      )
      printResult(result)
      return 1
    }
    const { task, contract, boundary, template, edge, context } = materialized.result
    const result = ok(
      'transformer',
      'create-fixture-task',
      {
        task_id: task.task_id,
        contract_id: contract.test_contract_id,
        contract_status: contract.status,
        boundary_id: boundary.id,
        template_id: template.id,
        verifying_edge_id: edge.id,
        test_sibling: context.testSibling,
        test_sibling_known: context.testSiblingKnown,
        fixture: context.fixture,
        forbidden_files: task.forbidden_files,
        target_files: contract.target_files,
        test_files: contract.test_files,
        source_relation_ids: task.source_relation_ids,
        template_search_policy: template.search_policy,
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('transformer', 'create-fixture-task', [
      { severity: 'P0', code: 'E_MATERIALIZE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runCreateFixtureTaskCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
