/**
 * `atelier:autopoiesis:work-order` command.
 *
 * Calls `compileWorkOrders()` and emits the resulting
 * `AutopoiesisWorkOrder` list as compact JSON.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/work-order.ts [--capability <C1..C8>]
 */
import { compileWorkOrders } from '../lib/work-order.ts'
import type { AutopoiesisCapabilityId } from '../lib/evaluator.ts'

export async function runWorkOrderCommand(argv: readonly string[]): Promise<number> {
  const capability = parseCapability(argv)
  const orders = await compileWorkOrders(
    capability ? { capabilityFilter: capability } : {},
  )
  process.stdout.write(JSON.stringify(orders, null, 2) + '\n')
  return 0
}

function parseCapability(argv: readonly string[]): AutopoiesisCapabilityId | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--capability') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) return v as AutopoiesisCapabilityId
    } else if (a && a.startsWith('--capability=')) {
      return a.slice('--capability='.length) as AutopoiesisCapabilityId
    }
  }
  return undefined
}

if (import.meta.main) {
  runWorkOrderCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
