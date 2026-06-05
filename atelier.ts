#!/usr/bin/env bun
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dir)

type Dispatch = {
  matches: string[]
  script: string
  forwardArgs?: (args: string[]) => string[]
}

const DISPATCHES: Dispatch[] = [
  { matches: ['index'], script: 'indexer/src/cli.ts', forwardArgs: (a) => ['update', ...a] },
  { matches: ['index:scan'], script: 'indexer/src/cli.ts', forwardArgs: (a) => ['scan', ...a] },
  { matches: ['index:render'], script: 'indexer/src/cli.ts', forwardArgs: (a) => ['render', ...a] },
  { matches: ['index:validate'], script: 'indexer/src/cli.ts', forwardArgs: (a) => ['validate', ...a] },
  { matches: ['index:update'], script: 'indexer/src/cli.ts', forwardArgs: (a) => ['update', ...a] },
  { matches: ['affected'], script: 'indexer/src/cli.ts', forwardArgs: (a) => ['affected', ...a] },
  { matches: ['sample'], script: 'reader/src/cli.ts', forwardArgs: (a) => ['sample', ...a] },
  { matches: ['reader:brief'], script: 'reader/src/cli.ts', forwardArgs: (a) => ['brief', ...a] },
  { matches: ['reader:render'], script: 'reader/src/cli.ts', forwardArgs: (a) => ['render', ...a] },
  { matches: ['reader:validate'], script: 'reader/src/cli.ts', forwardArgs: (a) => ['validate', ...a] },
  { matches: ['attention'], script: 'reader/src/cli.ts', forwardArgs: (a) => ['attention', ...a] },
  { matches: ['deep-read'], script: 'reader/src/cli.ts', forwardArgs: (a) => ['deep-read', ...a] },
  { matches: ['llm:jobs'], script: 'reader/src/cli.ts', forwardArgs: (a) => ['llm:jobs', ...a] },
  { matches: ['llm:accept'], script: 'reader/src/cli.ts', forwardArgs: (a) => ['llm:accept', ...a] },
  { matches: ['transform:md-to-code'], script: 'transformer/src/cli.ts', forwardArgs: (a) => ['transform', '--target', 'md-to-code', ...a] },
  { matches: ['transform:validate'], script: 'transformer/src/cli.ts', forwardArgs: (a) => ['validate', ...a] },
  { matches: ['transform:render'], script: 'transformer/src/cli.ts', forwardArgs: (a) => ['render', ...a] },
  { matches: ['task:derive'], script: 'transformer/src/cli.ts', forwardArgs: (a) => ['task:derive', ...a] },
  { matches: ['test-contract:derive'], script: 'transformer/src/cli.ts', forwardArgs: (a) => ['test-contract:derive', ...a] },
  { matches: ['packet:template'], script: 'transformer/src/cli.ts', forwardArgs: (a) => ['packet:template', ...a] },
  { matches: ['recommend'], script: 'transformer/src/cli.ts', forwardArgs: (a) => ['recommend', ...a] },
  { matches: ['packet:create'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['packet:create', ...a] },
  { matches: ['packet:context'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['packet:context', ...a] },
  { matches: ['packet:run'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['packet:run', ...a] },
  { matches: ['packet:complete'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['packet:complete', ...a] },
  { matches: ['packet:reject'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['packet:reject', ...a] },
  { matches: ['packet:block'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['packet:block', ...a] },
  { matches: ['test:run'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['test:run', ...a] },
  { matches: ['evidence:add'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['evidence:add', ...a] },
  { matches: ['handoff:validate'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['handoff:validate', ...a] },
  { matches: ['execution:ready'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['execution:ready', ...a] },
  { matches: ['executor:validate'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['validate', ...a] },
  { matches: ['executor:render'], script: 'executor/src/cli.ts', forwardArgs: (a) => ['render', ...a] },
  { matches: ['ready'], script: 'operation/src/cli.ts', forwardArgs: (a) => ['ready', ...a] },
  { matches: ['verify'], script: 'operation/src/cli.ts', forwardArgs: (a) => ['verify', ...a] },
  { matches: ['render'], script: 'operation/src/cli.ts', forwardArgs: (a) => ['render', ...a] },
]

const BOOTSTRAP_DIR = path.join(REPO_ROOT, '.atelier-bootstrap')

function usage(): string {
  return [
    'Atelier v0 root-level adapter.',
    '',
    'Usage: bun ./atelier <command> [args]',
    '',
    'Commands:',
    '  index / index:update    Run atelier-indexer update',
    '  index:scan              Run atelier-indexer scan',
    '  index:render            Run atelier-indexer render',
    '  index:validate          Run atelier-indexer validate',
    '  affected                Run atelier-indexer affected',
    '  sample                  Run atelier-reader sample',
    '  reader:brief            Run atelier-reader brief',
    '  reader:render           Run atelier-reader render',
    '  reader:validate         Run atelier-reader validate',
    '  attention --task ...    Run atelier-reader attention',
    '  deep-read --attention <id>  Run atelier-reader deep-read',
    '  llm:jobs --kind <kind>  Run atelier-reader llm:jobs',
    '  llm:accept --input <path>  Run atelier-reader llm:accept',
    '  transform:md-to-code    Run atelier-transformer transform',
    '  transform:validate      Run atelier-transformer validate',
    '  transform:render        Run atelier-transformer render',
    '  task:derive --attention <id>  Run atelier-transformer task:derive',
    '  test-contract:derive --task <id>  Run atelier-transformer test-contract:derive',
    '  packet:template --task <id>  Run atelier-transformer packet:template',
    '  recommend               Run atelier-transformer recommend',
    '  packet:create --task <id>  Run atelier-executor packet:create',
    '  packet:context --packet <id>  Run atelier-executor packet:context',
    '  packet:run --packet <id>  Run atelier-executor packet:run',
    '  test:run --packet <id>  Run atelier-executor test:run',
    '  evidence:add --packet <id> --gate <id> --status <status>  Run atelier-executor evidence:add',
    '  handoff:validate --file <path> --packet <id>  Run atelier-executor handoff:validate',
    '  packet:complete --packet <id>  Run atelier-executor packet:complete',
    '  packet:reject --packet <id>  Run atelier-executor packet:reject',
    '  packet:block --packet <id> --severity <P0|P1|P2> --reason <text>  Run atelier-executor packet:block',
    '  execution:ready         Run atelier-executor execution:ready',
    '  executor:validate       Run atelier-executor validate',
    '  executor:render         Run atelier-executor render',
    '  ready                   Run atelier-operation ready',
    '  verify                  Run atelier-operation verify',
    '  render                  Run atelier-operation render',
    '  help                    Show this message',
  ].join('\n')
}

function findDispatch(command: string): Dispatch | undefined {
  for (const d of DISPATCHES) {
    if (d.matches.includes(command)) return d
  }
  return undefined
}

function main(argv: readonly string[]): number {
  const [command, ...rest] = argv
  if (!command) {
    process.stderr.write(usage() + '\n')
    return 0
  }
  if (command === 'help' || command === '--help' || command === '-h') {
    process.stderr.write(usage() + '\n')
    return 0
  }
  const dispatch = findDispatch(command)
  if (!dispatch) {
    process.stderr.write('Unknown command: ' + command + '\n\n' + usage() + '\n')
    return 1
  }
  const bunArgs: string[] = []
  bunArgs.push(path.join(BOOTSTRAP_DIR, dispatch.script))
  if (dispatch.forwardArgs) {
    bunArgs.push(...dispatch.forwardArgs(rest))
  } else {
    bunArgs.push(...rest)
  }
  const proc = spawnSync('bun', bunArgs, { cwd: REPO_ROOT, stdio: 'inherit' })
  return proc.status ?? 1
}

const exitCode = main(process.argv.slice(2))
process.exit(exitCode)
