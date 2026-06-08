/**
 * `atelier:packet:create` command.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/packet-create.ts -- --task <id>
 *
 * The command reads the autopoiesis semantic-nodes index plus
 * the relation-kernel implementation-tasks ledger and emits a
 * `atelier.control-packet/v1` record. The packet is appended to
 * `.atelier/v0/autopoiesis/control-packets.ndjson` and printed
 * to stdout as JSON.
 *
 * Exit codes:
 *   0  packet generated and persisted
 *   1  E_TASK_NOT_FOUND or E_PACKET_TASK_NOT_READY (in-band
 *      generator defect)
 *   2  CLI argument error
 */
import { createControlPacket } from '../lib/packet.ts'

/**
 * The literal task id used by the `--smoke` flag. It is the
 * fixture task pre-populated in
 * `.atelier/v0/transforms/md-to-code/model/implementation-tasks.ndjson`
 * so smoke commands work end-to-end against production state
 * without re-typing the long task id.
 */
export const SMOKE_TASK_ID = 'task:smoke-autopoiesis'

export async function runPacketCreateCommand(argv: readonly string[]): Promise<number> {
  const opts = parseArgs(argv)
  if (opts.smoke) {
    opts.task = SMOKE_TASK_ID
  }
  if (!opts.task) {
    process.stderr.write('atelier:packet:create: --task <id> is required (or pass --smoke)\n')
    return 2
  }
  const r = await createControlPacket(opts.task, { producedBy: 'atelier:packet:create' })
  if (!r.ok) {
    const payload = {
      schema: 'atelier.command-result/v1',
      status: 'fail' as const,
      component: 'autopoiesis',
      command: 'packet:create',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: 0,
      data: {},
      issues: [
        {
          severity: 'P0' as const,
          code: r.code,
          message: r.message,
        },
      ],
      warnings: [],
    }
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n')
    return 1
  }
  process.stdout.write(JSON.stringify(r.packet, null, 2) + '\n')
  return 0
}

function parseArgs(argv: readonly string[]): { task: string | undefined; smoke: boolean } {
  let task: string | undefined
  let smoke = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--task') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        task = v
        i++
      }
    } else if (a && a.startsWith('--task=')) {
      task = a.slice('--task='.length)
    } else if (a === '--smoke') {
      smoke = true
    }
  }
  return { task, smoke }
}

if (import.meta.main) {
  runPacketCreateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
