/**
 * `atelier-operation` CLI.
 */
import { runReadyCommand } from './commands/ready.ts'
import { runVerifyCommand } from './commands/verify.ts'
import { runRenderCommand } from './commands/render.ts'

function usage(): string {
  return [
    'Usage: atelier-operation <command>',
    '',
    'Commands:',
    '  ready    Aggregate component validate outputs into an operational review',
    '  verify   Run the full pipeline and aggregate',
    '  render   Re-render every view',
  ].join('\n')
}

export async function runCli(argv: readonly string[]): Promise<number> {
  const [command] = argv
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stderr.write(usage() + '\n')
    return 0
  }
  switch (command) {
    case 'ready':
      return runReadyCommand()
    case 'verify':
      return runVerifyCommand()
    case 'render':
      return runRenderCommand()
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${usage()}\n`)
      return 1
  }
}

if (import.meta.main) {
  runCli(process.argv.slice(2)).then((code) => process.exit(code))
}
