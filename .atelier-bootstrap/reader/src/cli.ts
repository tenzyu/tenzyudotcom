/**
 * `atelier-reader` CLI.
 */
import { runSampleCommand } from './commands/sample.ts'
import { runBriefCommand } from './commands/brief.ts'
import { runAttentionCommand } from './commands/attention.ts'
import { runDeepReadCommand } from './commands/deep-read.ts'
import { runLlmJobsCommand } from './commands/llm-jobs.ts'
import { runLlmAcceptCommand } from './commands/llm-accept.ts'
import { runRenderCommand } from './commands/render.ts'
import { runValidateCommand } from './commands/validate.ts'

function usage(): string {
  return [
    'Usage: atelier-reader <command> [flags]',
    '',
    'Commands:',
    '  sample                    Run cheap semantic sampling, write project brief',
    '  brief                     Re-render project brief view',
    '  attention --task "<task>" Assemble an attention set for a task',
    '  deep-read --attention <id> Emit and accept deep-read proposals',
    '  llm:jobs --kind <kind> [--attention <id>] Emit a reader LLM job envelope',
    '  llm:accept --input <path> Validate and accept a JSONL of proposals',
    '  render                    Generate views/objects/** Markdown',
    '  validate                  Validate reader outputs',
  ].join('\n')
}

export async function runCli(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stderr.write(usage() + '\n')
    return 0
  }
  switch (command) {
    case 'sample':
      return runSampleCommand()
    case 'brief':
      return runBriefCommand()
    case 'attention':
      return runAttentionCommand(rest)
    case 'deep-read':
      return runDeepReadCommand(rest)
    case 'llm:jobs':
      return runLlmJobsCommand(rest)
    case 'llm:accept':
      return runLlmAcceptCommand(rest)
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
