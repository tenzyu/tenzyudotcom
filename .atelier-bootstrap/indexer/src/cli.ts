/**
 * `atelier-indexer` CLI.
 *
 * Dispatches to the per-command modules and exits with the command's
 * exit code. Each command writes a JSON `AtelierResult` to stdout.
 */
import { runScanCommand } from './commands/scan.ts'
import { runIndexCommand } from './commands/index.ts'
import { runAffectedCommand } from './commands/affected.ts'
import { runUpdateCommand } from './commands/update.ts'
import { runRenderCommand } from './commands/render.ts'
import { runValidateCommand } from './commands/validate.ts'

const COMMANDS: Record<string, (argv: readonly string[]) => Promise<number>> = {
  scan: () => runScanCommand(),
  index: () => runIndexCommand(),
  affected: () => runAffectedCommand(),
  update: () => runUpdateCommand(),
  render: () => runRenderCommand(),
  // STRICT by default. Use `validate:quick` for a sample smoke test.
  validate: (argv) => runValidateCommand(argv),
  'validate:quick': (argv) => runValidateCommand(['--quick', ...argv]),
}

function usage(): string {
  return [
    'Usage: atelier-indexer <command> [flags]',
    '',
    'Commands:',
    '  scan            Walk the repository and write .atelier/v0/facts/**',
    '  index           Build SourceUnit/SourceFact/SourceEdge NDJSON and indexes',
    '  affected        Compare snapshots, mark stale, write stale.json',
    '  update          scan + index + affected + render',
    '  render          Generate views/index/** Markdown',
    '  validate        STRICT full validation of objects/edges/refs (default)',
    '  validate:quick  Sample-based smoke validation (NEVER use for operational pass)',
    '',
    'Flags:',
    '  validate --quick  Run quick sample validation (alias for validate:quick).',
  ].join('\n')
}

export async function runCli(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stderr.write(usage() + '\n')
    return 0
  }
  const fn = COMMANDS[command]
  if (!fn) {
    process.stderr.write(`Unknown command: ${command}\n\n${usage()}\n`)
    return 1
  }
  return fn(rest)
}

if (import.meta.main) {
  runCli(process.argv.slice(2)).then((code) => process.exit(code))
}
