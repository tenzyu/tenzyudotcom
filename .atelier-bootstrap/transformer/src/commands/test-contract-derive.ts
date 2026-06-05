import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { listTasks } from '../lib/contracts.ts'
import { deriveTestContract } from '../lib/contracts.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runTestContractDeriveCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const taskId = readFlag([...argv], '--task')
    if (!taskId) throw new Error('test-contract:derive requires --task <id>')
    const tasks = await listTasks()
    const task = tasks.find((t) => t.task_id === taskId)
    if (!task) throw new Error(`task not found: ${taskId}`)
    const contract = await deriveTestContract(task)
    const result = ok('transformer', 'test-contract:derive', { contract_id: contract.test_contract_id, status: contract.status }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('transformer', 'test-contract:derive', [
      { severity: 'P0', code: 'E_TC_DERIVE', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runTestContractDeriveCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
