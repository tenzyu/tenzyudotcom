/**
 * Atelier Autopoiesis — work-order compiler tests.
 *
 * Two grouping tests + one scope-disjointness test:
 *
 *   1. Two findings with `capability_id=C1` group into one
 *      work order with the union of their `finding_id`s.
 *   2. Findings from two capabilities (C1 + C2) produce two
 *      distinct work orders, one per capability.
 *   3. The work order's `allowed_files` and `forbidden_files`
 *      are disjoint (∩ = ∅). The compiler must NEVER emit a
 *      work order that allows the same file it forbids.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { appendNdjsonAutopoiesis, readNdjsonAutopoiesis } from '../lib/store.ts'
import { compileWorkOrders } from '../lib/work-order.ts'
import { autopoiesisPaths } from '../lib/paths.ts'
import type { AutopoiesisFinding } from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-work-order-'))
  await mkdir(path.join(FIXTURE_ROOT, '.atelier', 'v0', 'autopoiesis'), { recursive: true })
  process.chdir(FIXTURE_ROOT)
})

afterAll(async () => {
  process.chdir(ORIGINAL_CWD)
  await rm(FIXTURE_ROOT, { recursive: true, force: true })
})

beforeEach(async () => {
  // Use the function form so the rm targets the fixture cwd,
  // not the real `.atelier/v0/autopoiesis/` tree.
  const p = autopoiesisPaths()
  for (const file of [
    p.findings,
    p.workOrders,
  ]) {
    await rm(file, { force: true })
  }
})

/* -------------------------------------------------------------------------- */
/*                            Helpers                                          */
/* -------------------------------------------------------------------------- */

function finding(overrides: Partial<AutopoiesisFinding>): AutopoiesisFinding {
  return {
    schema: 'atelier.autopoiesis-finding/v1',
    finding_id: 'finding:placeholder',
    severity: 'P0',
    capability_id: 'C1',
    code: 'E_NODE_NO_SOURCE_ANCHOR',
    reason: 'placeholder',
    required_repair: 'repair',
    status: 'open',
    proof_required: ['x'],
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  }
}

async function appendFinding(f: AutopoiesisFinding): Promise<void> {
  // Function form so writes target the fixture cwd.
  await appendNdjsonAutopoiesis<AutopoiesisFinding>(autopoiesisPaths().findings, f)
}

function globCovers(pattern: string, file: string): boolean {
  if (pattern === file) return true
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3)
    return file === prefix || file.startsWith(prefix + '/')
  }
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2)
    return file.startsWith(prefix + '/')
  }
  return false
}

function disjoint(allowed: string[], forbidden: string[]): boolean {
  for (const a of allowed) {
    for (const f of forbidden) {
      if (a === f) return false
      if (globCovers(a, f) || globCovers(f, a)) return false
    }
  }
  return true
}

/* -------------------------------------------------------------------------- */
/*                            Tests                                            */
/* -------------------------------------------------------------------------- */

describe('compileWorkOrders — grouping', () => {
  test('two C1 findings → one C1 work order with both finding_ids', async () => {
    await appendFinding(
      finding({
        finding_id: 'finding:C1:E_NODE_NO_SOURCE_ANCHOR:aaaaaaaa',
        capability_id: 'C1',
        code: 'E_NODE_NO_SOURCE_ANCHOR',
        reason: 'first C1 reason',
      }),
    )
    await appendFinding(
      finding({
        finding_id: 'finding:C1:E_NODE_DUPLICATE_ID:bbbbbbbb',
        capability_id: 'C1',
        code: 'E_NODE_DUPLICATE_ID',
        reason: 'second C1 reason',
      }),
    )
    const orders = await compileWorkOrders({ capabilityFilter: 'C1' })
    expect(orders.length).toBe(1)
    const wo = orders[0]!
    expect(wo.capability_ids).toEqual(['C1'])
    expect(wo.evaluator_finding_ids.sort()).toEqual([
      'finding:C1:E_NODE_DUPLICATE_ID:bbbbbbbb',
      'finding:C1:E_NODE_NO_SOURCE_ANCHOR:aaaaaaaa',
    ])
    expect(wo.objective).toContain('C1')
  })

  test('findings from two capabilities → two work orders (one per capability)', async () => {
    await appendFinding(
      finding({ finding_id: 'f:C1:a', capability_id: 'C1', reason: 'C1' }),
    )
    await appendFinding(
      finding({ finding_id: 'f:C2:b', capability_id: 'C2', reason: 'C2' }),
    )
    const orders = await compileWorkOrders()
    expect(orders.length).toBe(2)
    const byCap = new Map(orders.map((o) => [o.capability_ids[0], o]))
    expect(byCap.has('C1')).toBe(true)
    expect(byCap.has('C2')).toBe(true)
    expect(byCap.get('C1')?.evaluator_finding_ids).toEqual(['f:C1:a'])
    expect(byCap.get('C2')?.evaluator_finding_ids).toEqual(['f:C2:b'])
  })

  test('non-open findings are skipped', async () => {
    await appendFinding(finding({ finding_id: 'f:open', status: 'open' }))
    await appendFinding(finding({ finding_id: 'f:patched', status: 'patched' }))
    await appendFinding(finding({ finding_id: 'f:verified', status: 'verified' }))
    await appendFinding(finding({ finding_id: 'f:rejected', status: 'rejected' }))
    const orders = await compileWorkOrders()
    expect(orders.length).toBe(1)
    expect(orders[0]?.evaluator_finding_ids).toEqual(['f:open'])
  })

  test('work_order_id is deterministic on (capability, sorted finding_ids)', async () => {
    await appendFinding(finding({ finding_id: 'f:1', reason: 'r1' }))
    await appendFinding(finding({ finding_id: 'f:2', reason: 'r2' }))
    const a = await compileWorkOrders()
    // Wipe and re-create to ensure the same id is generated.
    await rm(autopoiesisPaths().workOrders, { force: true })
    const b = await compileWorkOrders()
    expect(a.length).toBe(1)
    expect(b.length).toBe(1)
    expect(a[0]?.work_order_id).toBe(b[0]?.work_order_id)
  })

  test('re-running the compiler is idempotent (no duplicate work_order_id)', async () => {
    await appendFinding(finding({ finding_id: 'f:idem', reason: 'r' }))
    await compileWorkOrders()
    await compileWorkOrders()
    const onDisk = await readNdjsonAutopoiesis<{ work_order_id: string }>(
      autopoiesisPaths().workOrders,
    )
    const ids = onDisk.map((r) => r.work_order_id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('compileWorkOrders — scope disjointness', () => {
  test('allowed_files ∩ forbidden_files == ∅', async () => {
    await appendFinding(finding({ finding_id: 'f:scope', reason: 'r' }))
    const orders = await compileWorkOrders()
    expect(orders.length).toBe(1)
    const wo = orders[0]!
    expect(disjoint(wo.allowed_files, wo.forbidden_files)).toBe(true)
  })

  test('forbidden_files always include the canonical harness + .env glob', async () => {
    await appendFinding(finding({ finding_id: 'f:scope2', reason: 'r2' }))
    const orders = await compileWorkOrders()
    expect(orders[0]?.forbidden_files).toContain('harness/atelier-autopoiesis/**')
    expect(orders[0]?.forbidden_files).toContain('.env')
    expect(orders[0]?.forbidden_files).toContain('.env.*')
  })

  test('allowed_files always include .atelier-bootstrap/** and package.json', async () => {
    await appendFinding(finding({ finding_id: 'f:scope3', reason: 'r3' }))
    const orders = await compileWorkOrders()
    expect(orders[0]?.allowed_files).toContain('.atelier-bootstrap/**')
    expect(orders[0]?.allowed_files).toContain('package.json')
  })
})
