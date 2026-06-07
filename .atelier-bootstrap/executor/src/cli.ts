/**
 * `atelier-executor` CLI.
 */
import { runPacketCreateCommand } from './commands/packet-create.ts'
import { runPacketContextCommand } from './commands/packet-context.ts'
import { runPacketRunCommand } from './commands/packet-run.ts'
import { runTestRunCommand } from './commands/test-run.ts'
import { runExecutorRunCommand } from './commands/executor-run.ts'
import { runEvidenceAddCommand } from './commands/evidence-add.ts'
import { runEvidenceQuarantineCommand } from './commands/evidence-quarantine.ts'
import { runHandoffValidateCommand } from './commands/handoff-validate.ts'
import { runPacketCompleteCommand } from './commands/packet-complete.ts'
import { runPacketRejectCommand } from './commands/packet-reject.ts'
import { runPacketDowngradeCommand } from './commands/packet-downgrade.ts'
import { runPacketBlockCommand } from './commands/packet-block.ts'
import { runExecutionReadyCommand } from './commands/execution-ready.ts'
import { runRenderCommand } from './commands/render.ts'
import { runValidateCommand } from './commands/validate.ts'
import { runMigrateCommand } from './commands/migrate.ts'
import { runTestContractPromoteCommand } from './commands/test-contract-promote.ts'

function usage(): string {
  return [
    'Usage: atelier-executor <command> [flags]',
    '',
    'Commands:',
    '  packet:create --task <id>                 Create an ExecutionPacket',
    '  packet:context --packet <id>              Generate packet context',
    '  packet:run --packet <id>                  Run the test command, record evidence',
    '  executor:run --packet <id>                Run the test command, capture raw output, record evidence (does NOT mark the packet complete)',
    '  test:run --packet <id>                    Run the test command and append to ledger',
    '  evidence:add --packet <id> --gate <id> --status <status> Add an evidence record',
    '    [--command <cmd>] [--raw-output-ref <path>] [--diff-ref <path>] [--file-hashes <json>]',
    '  evidence:quarantine --evidence <evi:id>   Move a top-level passed-but-broken evidence file to _fixtures/',
    '  evidence:quarantine --all                 Quarantine every quarantine-eligible top-level record',
    '  handoff:validate --file <path> --packet <id>  Validate a handoff JSON',
    '  packet:complete --packet <id>             Mark a packet completed (requires evidence)',
    '  packet:reject --packet <id>               Reject a packet (status=rejected)',
    '  packet:downgrade --packet <id> --status rejected|blocked  Downgrade a packet to rejected|blocked',
    '  packet:block --packet <id> --severity <P0|P1|P2> --reason <text> Block a packet',
    '  test-contract:promote --test-contract <id>  Promote a TestContract to ready (optionally: --command, --test-file, --target-file)',
    '  execution:ready                           Report execution readiness',
    '  migrate                                   One-shot: normalize packets.ndjson (dedupe by id, last-write-wins)',
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
    case 'executor:run':
      return runExecutorRunCommand(rest)
    case 'test:run':
      return runTestRunCommand(rest)
    case 'evidence:add':
      return runEvidenceAddCommand(rest)
    case 'evidence:quarantine':
      return runEvidenceQuarantineCommand(rest)
    case 'handoff:validate':
      return runHandoffValidateCommand(rest)
    case 'packet:complete':
      return runPacketCompleteCommand(rest)
    case 'packet:reject':
      return runPacketRejectCommand(rest)
    case 'packet:downgrade':
      return runPacketDowngradeCommand(rest)
    case 'packet:block':
      return runPacketBlockCommand(rest)
    case 'test-contract:promote':
      return runTestContractPromoteCommand(rest)
    case 'execution:ready':
      return runExecutionReadyCommand()
    case 'migrate':
      return runMigrateCommand()
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
