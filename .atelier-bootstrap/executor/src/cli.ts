/**
 * `atelier-executor` CLI.
 */
import { runPacketCreateCommand } from './commands/packet-create.ts'
import { runPacketContextCommand } from './commands/packet-context.ts'
import { runPacketRunCommand } from './commands/packet-run.ts'
import { runTestRunCommand } from './commands/test-run.ts'
import { runEvidenceAddCommand } from './commands/evidence-add.ts'
import { runHandoffValidateCommand } from './commands/handoff-validate.ts'
import { runPacketCompleteCommand } from './commands/packet-complete.ts'
import { runPacketRejectCommand } from './commands/packet-reject.ts'
import { runPacketBlockCommand } from './commands/packet-block.ts'
import { runExecutionReadyCommand } from './commands/execution-ready.ts'
import { runRenderCommand } from './commands/render.ts'
import { runValidateCommand } from './commands/validate.ts'

function usage(): string {
  return [
    'Usage: atelier-executor <command> [flags]',
    '',
    'Commands:',
    '  packet:create --task <id>                 Create an ExecutionPacket',
    '  packet:context --packet <id>              Generate packet context',
    '  packet:run --packet <id>                  Run the test command, record evidence',
    '  test:run --packet <id>                    Run the test command and append to ledger',
    '  evidence:add --packet <id> --gate <id> --status <status> Add an evidence record',
    '  handoff:validate --file <path> --packet <id>  Validate a handoff JSON',
    '  packet:complete --packet <id>             Mark a packet completed (requires evidence)',
    '  packet:reject --packet <id>               Reject a packet',
    '  packet:block --packet <id> --severity <P0|P1|P2> --reason <text> Block a packet',
    '  execution:ready                           Report execution readiness',
    '  render                                    Generate views/runs/** Markdown',
    '  validate                                  Validate executor outputs',
  ].join('\n')
}

export async function runCli(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stderr.write(usage() + '\n')
    return 0
  }
  switch (command) {
    case 'packet:create':
      return runPacketCreateCommand(rest)
    case 'packet:context':
      return runPacketContextCommand(rest)
    case 'packet:run':
      return runPacketRunCommand(rest)
    case 'test:run':
      return runTestRunCommand(rest)
    case 'evidence:add':
      return runEvidenceAddCommand(rest)
    case 'handoff:validate':
      return runHandoffValidateCommand(rest)
    case 'packet:complete':
      return runPacketCompleteCommand(rest)
    case 'packet:reject':
      return runPacketRejectCommand(rest)
    case 'packet:block':
      return runPacketBlockCommand(rest)
    case 'execution:ready':
      return runExecutionReadyCommand()
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
