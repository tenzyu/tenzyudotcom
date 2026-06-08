/**
 * `atelier:packet:validate` command.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/packet-validate.ts -- --packet <id>
 *
 * Reads the ControlPacket from
 * `.atelier/v0/autopoiesis/control-packets.ndjson` and emits a
 * JSON defect report. Exits 0 when the packet is valid; 1 on
 * any defect.
 */
import { validateControlPacket } from '../lib/packet-validate.ts'
import { ok, fail, printResult } from '../../../lib/src/index.ts'

export async function runPacketValidateCommand(argv: readonly string[]): Promise<number> {
  const opts = parseArgs(argv)
  if (!opts.packet) {
    process.stderr.write('atelier:packet:validate: --packet <id> is required\n')
    return 2
  }
  const r = await validateControlPacket(opts.packet)
  if (r.ok) {
    const result = ok('autopoiesis', 'packet:validate', r, { warnings: r.warnings })
    printResult(result)
    return 0
  }
  const result = fail('autopoiesis', 'packet:validate', r.defects, r, {
    warnings: r.warnings,
  })
  printResult(result)
  return 1
}

function parseArgs(argv: readonly string[]): { packet: string | undefined } {
  let packet: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--packet') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        packet = v
        i++
      }
    } else if (a && a.startsWith('--packet=')) {
      packet = a.slice('--packet='.length)
    }
  }
  return { packet }
}

if (import.meta.main) {
  runPacketValidateCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
