/**
 * `atelier-transformer` CLI.
 */
import { runTransformCommand } from './commands/transform.ts'
import { runTaskDeriveCommand } from './commands/task-derive.ts'
import { runTestContractDeriveCommand } from './commands/test-contract-derive.ts'
import { runPacketTemplateCommand } from './commands/packet-template.ts'
import { runRecommendCommand } from './commands/recommend.ts'
import { runRenderCommand } from './commands/render.ts'
import { runValidateCommand } from './commands/validate.ts'

function usage(): string {
  return [
    'Usage: atelier-transformer <command> [flags]',
    '',
    'Commands:',
    '  transform --target md-to-code            Run the full transform pipeline',
    '  task:derive --attention <id>             Derive a single task',
    '  test-contract:derive --task <id>         Derive a test contract',
    '  packet:template --task <id>              Build a packet template',
    '  recommend                                Emit transform recommendations',
    '  render                                   Render transform views',
    '  validate                                 Validate transform outputs',
  ].join('\n')
}

export async function runCli(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stderr.write(usage() + '\n')
    return 0
  }
  switch (command) {
    case 'transform':
      return runTransformCommand(rest)
    case 'task:derive':
      return runTaskDeriveCommand(rest)
    case 'test-contract:derive':
      return runTestContractDeriveCommand(rest)
    case 'packet:template':
      return runPacketTemplateCommand(rest)
    case 'recommend':
      return runRecommendCommand()
    case 'render':
      return runRenderCommand()
    case 'validate':
      return runValidateCommand()
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${usage()}\n`)
      return 1
  }
}

if (import.meta.main) {
  runCli(process.argv.slice(2)).then((code) => process.exit(code))
}
