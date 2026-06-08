/**
 * Atelier Autopoiesis — work-order compiler.
 *
 * `compileWorkOrders()` is the C8 self-improvement loop's
 * second half: it reads the latest `AutopoiesisFinding` records
 * from `.atelier/v0/autopoiesis/findings.ndjson`, groups them
 * by `capability_id`, and emits one `AutopoiesisWorkOrder` per
 * group with at least one `open` finding.
 *
 * The work orders are persisted to
 * `.atelier/v0/autopoiesis/work-orders.ndjson`. The appender
 * is idempotent on `work_order_id` so re-running the compiler
 * does not produce duplicates.
 */
import { createHash } from 'node:crypto'
import { readNdjsonAutopoiesisTolerant, appendNdjsonAutopoiesis } from './store.ts'
import { AUTOPOIESIS_PATHS } from './paths.ts'
import type {
  AutopoiesisFinding,
  AutopoiesisWorkOrder,
} from './records.ts'
import type { AutopoiesisCapabilityId } from './evaluator.ts'

/* -------------------------------------------------------------------------- */
/*                                Public types                                */
/* -------------------------------------------------------------------------- */

export type CompileWorkOrdersOptions = {
  /** When set, only emit work orders for the given capability. */
  capabilityFilter?: AutopoiesisCapabilityId
}

/* -------------------------------------------------------------------------- */
/*                            Mission + capability                            */
/* -------------------------------------------------------------------------- */

const MISSION_EXCERPT: ReadonlyArray<string> = [
  'node には lifecycle がある。observed、derived、inferred、proposed、accepted、verified、superseded、rejected、archived のような状態を持ち、状態遷移は promotion policy によって制御される。特に重要なのは、LLM が抽出・推論した artifact を即座に正史化しないことである。',
  'node 同士は typed graph として接続される。requirement は test に validated_by され、code symbol に implemented_by され、ADR に constrained_by され、review finding に challenged_by され、task に depends_on される。',
  '編集も最終的には semantic node 単位で扱われる。agent は単にファイルを変更するのではなく、どの requirement を実装し、どの finding を解消し、どの test で検証し、どの decision に制約されているかを明示した変更 proposal を作る。',
]

const CAPABILITY_EXCERPT: ReadonlyArray<string> = [
  'C2: lifecycle state machine including observed/inferred/proposed/accepted/verified/superseded/rejected/archived/quarantined; LLM output cannot reach accepted/verified directly.',
  'C8: repository-native evaluator outputting structured findings; compiler from findings to implementation/control packets; run/evidence ledger connecting defects -> packets -> patches -> checks -> decisions.',
]

/* -------------------------------------------------------------------------- */
/*                              Group + compile                                */
/* -------------------------------------------------------------------------- */

function deterministicWorkOrderId(capabilityId: string, findingIds: ReadonlyArray<string>): string {
  const sorted = [...findingIds].sort()
  const hash = createHash('sha256').update(`${capabilityId}|${sorted.join('|')}`, 'utf8')
    .digest('hex')
    .slice(0, 8)
  return `wo:autopoiesis:${capabilityId}:${hash}`
}

function buildWorkOrder(
  capabilityId: AutopoiesisCapabilityId,
  findings: ReadonlyArray<AutopoiesisFinding>,
  createdAt: string,
): AutopoiesisWorkOrder {
  const findingIds = findings.map((f) => f.finding_id)
  const wo: AutopoiesisWorkOrder = {
    schema: 'atelier.autopoiesis-work-order/v1',
    work_order_id: deterministicWorkOrderId(capabilityId, findingIds),
    capability_ids: [capabilityId],
    evaluator_finding_ids: findingIds,
    objective: `Repair ${findings.length} open findings for capability ${capabilityId}.`,
    allowed_files: ['.atelier-bootstrap/**', 'package.json'],
    forbidden_files: ['harness/atelier-autopoiesis/**', '.env', '.env.*'],
    required_runtime_behavior: [
      `bun run atelier:autopoiesis:validate exits 0`,
      `bun run atelier:evaluate exits 0 with no open P0/P1 finding for ${capabilityId}`,
    ],
    required_negative_controls: [
      'An injected defect of the same kind must surface as a finding on the next run.',
    ],
    required_commands: [
      'bun run atelier:autopoiesis:validate',
      'bun run atelier:evaluate',
    ],
    acceptance_evidence: [
      `evaluator returns findings=[] on the next run for this capability_id (${capabilityId}).`,
    ],
    mission_excerpt: [...MISSION_EXCERPT],
    capability_excerpt: [...CAPABILITY_EXCERPT],
    read_surface: {
      preferred_symbols: [
        'validateAutopoiesis',
        'resolveAll',
        'transition',
        'DEFAULT_PRECEDENCE',
        'appendNdjsonAutopoiesis',
        'readNdjsonAutopoiesis',
        'closeTask',
        'AutopoiesisFinding',
        'AutopoiesisWorkOrder',
      ],
      required_file_slices: [
        '.atelier-bootstrap/autopoiesis/src/lib/records.ts',
        '.atelier-bootstrap/autopoiesis/src/lib/validate.ts (DEFECT_CODES region, lines 1-200)',
        '.atelier-bootstrap/autopoiesis/src/lib/materialize.ts (closeTask region, lines 670-732)',
        '.atelier-bootstrap/lib/src/ndjson.ts',
        '.atelier-bootstrap/autopoiesis/src/lib/store.ts',
      ],
      full_read_allowlist: [
        '.atelier-bootstrap/autopoiesis/src/lib/records.ts',
        '.atelier-bootstrap/lib/src/ndjson.ts',
        '.atelier-bootstrap/autopoiesis/src/lib/store.ts',
        '.atelier-bootstrap/autopoiesis/src/cli.ts',
      ],
      generated_state_policy: 'query_or_summary_only',
    },
    token_budget: {
      input_soft_cap: 3_000_000,
      output_soft_cap: 350_000,
      test_run_cap: 4,
      full_file_read_cap: 5,
    },
    created_at: createdAt,
  }
  return wo
}

/* -------------------------------------------------------------------------- */
/*                              Persist + dedup                                */
/* -------------------------------------------------------------------------- */

async function readExistingWorkOrderIds(): Promise<Set<string>> {
  const { records, lineErrors } = await readNdjsonAutopoiesisTolerant<AutopoiesisWorkOrder>(
    AUTOPOIESIS_PATHS.workOrders,
  )
  if (lineErrors.length > 0) {
    process.stderr.write(
      `[work-order] ${lineErrors.length} corrupt line(s) in ${AUTOPOIESIS_PATHS.workOrders}; skipping them.\n`,
    )
  }
  return new Set(
    records.map((r) => r.work_order_id).filter((x): x is string => typeof x === 'string'),
  )
}

/* -------------------------------------------------------------------------- */
/*                              compileWorkOrders                             */
/* -------------------------------------------------------------------------- */

/**
 * Compile `AutopoiesisWorkOrder` records from the latest
 * `AutopoiesisFinding` set. Returns the list of work orders
 * appended (or already present) for the run.
 */
export async function compileWorkOrders(
  opts: CompileWorkOrdersOptions = {},
): Promise<AutopoiesisWorkOrder[]> {
  const createdAt = new Date().toISOString()

  const { records, lineErrors } = await readNdjsonAutopoiesisTolerant<AutopoiesisFinding>(
    AUTOPOIESIS_PATHS.findings,
  )
  if (lineErrors.length > 0) {
    process.stderr.write(
      `[work-order] ${lineErrors.length} corrupt line(s) in ${AUTOPOIESIS_PATHS.findings}; skipping them.\n`,
    )
  }

  // Group by capability_id, only open findings.
  const groups = new Map<AutopoiesisCapabilityId, AutopoiesisFinding[]>()
  for (const f of records) {
    if (f.status !== 'open') continue
    if (opts.capabilityFilter && f.capability_id !== opts.capabilityFilter) continue
    const cap = f.capability_id
    if (!groups.has(cap)) groups.set(cap, [])
    ;(groups.get(cap) as AutopoiesisFinding[]).push(f)
  }

  const existing = await readExistingWorkOrderIds()
  const result: AutopoiesisWorkOrder[] = []
  for (const [cap, findings] of groups) {
    if (findings.length === 0) continue
    const wo = buildWorkOrder(cap, findings, createdAt)
    if (existing.has(wo.work_order_id)) {
      result.push(wo)
      continue
    }
    await appendNdjsonAutopoiesis<AutopoiesisWorkOrder>(AUTOPOIESIS_PATHS.workOrders, wo)
    existing.add(wo.work_order_id)
    result.push(wo)
  }
  return result
}
