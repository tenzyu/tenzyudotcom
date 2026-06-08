/**
 * `atelier-autopoiesis` CLI.
 *
 * Dispatches to the per-command modules. The CLI is invoked from
 * `atelier.ts` (the root-level adapter) and from the `bun run
 * atelier:*` scripts in `package.json`.
 */
import { runValidateCommand } from './commands/validate.ts'
import { runLifecycleTestCommand } from './commands/lifecycle-test.ts'
import { runAuthorityResolveCommand } from './commands/authority-resolve.ts'
import { runQueryCommand } from './commands/query.ts'
import { runPacketCreateCommand } from './commands/packet-create.ts'
import { runPacketValidateCommand } from './commands/packet-validate.ts'
import { runMaterializeCreateCommand } from './commands/materialize-create.ts'
import { runMaterializeValidateCommand } from './commands/materialize-validate.ts'
import { runCloseTaskCommand } from './commands/close-task.ts'
import { runStaleDetectCommand } from './commands/stale-detect.ts'
import { runConflictsDetectCommand } from './commands/conflicts-detect.ts'
import { runSeedCommand } from './commands/seed.ts'
import { runEvaluateCommand } from './commands/evaluate.ts'
import { runFindingsCommand } from './commands/findings.ts'
import { runWorkOrderCommand } from './commands/work-order.ts'
import { runPromoteCommand } from './commands/promote.ts'

const COMMANDS: Record<string, (argv: readonly string[]) => Promise<number>> = {
  validate: () => runValidateCommand(),
  'lifecycle-test': () => runLifecycleTestCommand(),
  'authority:resolve': (argv) => runAuthorityResolveCommand(argv),
  query: (argv) => runQueryCommand(argv),
  'packet:create': (argv) => runPacketCreateCommand(argv),
  'packet:validate': (argv) => runPacketValidateCommand(argv),
  'materialize:create': (argv) => runMaterializeCreateCommand(argv),
  'materialize:validate': (argv) => runMaterializeValidateCommand(argv),
  closeTask: (argv) => runCloseTaskCommand(argv),
  'stale-detect': (argv) => runStaleDetectCommand(argv),
  'conflicts-detect': (argv) => runConflictsDetectCommand(argv),
  seed: (argv) => runSeedCommand(argv),
  evaluate: (argv) => runEvaluateCommand(argv),
  findings: (argv) => runFindingsCommand(argv),
  'work-order': (argv) => runWorkOrderCommand(argv),
  promote: (argv) => runPromoteCommand(argv),
}

function usage(): string {
  return [
    'Usage: atelier-autopoiesis <command> [args]',
    '',
    'Commands:',
    '  validate              Read every .atelier/v0/autopoiesis/*.ndjson file and emit defects (exit 0 on pass, 1 on fail).',
    '  lifecycle-test        Run the full negative-control test suite (transition table + validator).',
    '  authority:resolve [--scope <path>]  Resolve authority for every class; emits atelier.authority-resolution/v1 JSON.',
    '  query --kind <kind> [--task <id>] [--scope <path>] [--include-non-accepted]  Run a runtime query; emits atelier.query-result/v1 JSON.',
    '  packet:create --task <id>    Build a task-local ControlPacket (atelier.control-packet/v1).',
    '  packet:validate --packet <id>  Validate a ControlPacket; exits 0 on no defects, 1 on any defect.',
    '  materialize:create --task <id> --diff <ref>  Build a MaterializationProposal (atelier.materialization-proposal/v1).',
    '  materialize:validate --proposal <id>  Run the materialization gate; on success the proposal is promoted to status=validated AND lifecycle_state=accepted.',
    '  closeTask --task <id>  Close a task IF a validated MaterializationProposal exists; emits a task_closed_ack SemanticNode on success.',
    '  stale-detect  Scan the semantic-nodes ledger against the live source-anchors index; append StalenessRecord entries; emit atelier.stale-detect-result/v1 JSON.',
    '  conflicts-detect  Scan the semantic-nodes ledger for authority conflicts; append ConflictRecord entries; emit atelier.conflicts-detect-result/v1 JSON.',
    '  seed [--production]  Append the canonical smoke SemanticNode fixture (requirement/decision/check_result/permission_rule/review_finding) to the semantic-nodes ledger. Idempotent.',
    '  evaluate [--goal <ref>] [--capability <C1..C8>]  C8 self-improvement: run the evaluator, emit findings, write evaluator-result.json. Exits 0 on pass, 1 on fail.',
    '  findings [--capability <C1..C8>]  Read findings.ndjson and print matching AutopoiesisFinding records.',
    '  work-order [--capability <C1..C8>]  Compile AutopoiesisWorkOrder records from the open findings and append to work-orders.ndjson.',
    '  promote --id <node-id> --to <lifecycle_state> --evidence <ref> [--evidence <ref>...] --owner <policy>  Generic lifecycle promotion gate; calls transition() and emits a PromotionDecisionRecord.',
    '',
    'Query kinds: active-requirements, accepted-decisions, required-checks, permissions, open-findings, stale, conflicts, evidence, recommend.',
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
