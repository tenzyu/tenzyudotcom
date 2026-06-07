/**
 * `atelier:executor:run` command.
 *
 * The executor's "run" entry point: spawn the test command from the
 * packet's TestContract (or an override supplied via `--command`),
 * capture the raw stdout+stderr to a real file under
 * `.atelier/v0/runs/evidence/`, and persist an `EvidenceRecord` for
 * it. This is the live-runtime counterpart to `atelier:evidence:add`
 * (which can be used to record pre-captured or fixture evidence).
 *
 * Differences from `atelier:packet:run` and `atelier:test:run`:
 *
 *   - `atelier:packet:run` runs the test AND flips the packet to
 *     `completed` if the test passes. That coupling is convenient for
 *     a tight lifecycle but couples the runtime-evidence step to the
 *     lifecycle step, which makes the strict test-contract
 *     correspondence invariant harder to satisfy (the evidence has to
 *     land before the packet is marked complete).
 *
 *   - `atelier:test:run` records a `test_run` ledger event but does
 *     NOT persist an `EvidenceRecord` (the ledger is the only
 *     artifact). That is useful for `atelier:verify` audit trails,
 *     but it leaves no on-disk evidence for the operation layer's
 *     `checkEvidenceInvariant` to read.
 *
 *   - `atelier:executor:run` records runtime evidence only. The
 *     lifecycle transition is the caller's responsibility (the
 *     `atelier:packet:complete` command). This split lets the
 *     executor workstream drive a four-step end-to-end lifecycle:
 *       1. `atelier:packet:create`     -> active packet
 *       2. `atelier:executor:run`      -> captured raw output + evidence
 *       3. `atelier:evidence:add`      -> schema-bound evidence record
 *                                          (with command/raw_output_ref
 *                                          and test_contract_id)
 *       4. `atelier:packet:complete`   -> completed packet
 *     and lets the relation-kernel pass audit each step from raw
 *     state.
 *
 * The command accepts an optional `--command <cmd>` override. When
 * the override is supplied, it replaces the TestContract command for
 * the duration of this run; this is what `bun test
 * path/to/specific.test.ts` does, and it is supported by the
 * `commandCorrespondsToContract` helper in `../lib/evidence.ts`
 * (which treats `evidence.command` as a specialization of
 * `contract.command` when it is a strict prefix).
 */
import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { runTestCommand } from '../lib/evidence.ts'
import { getPacket } from '../lib/packet.ts'

function readFlag(args: readonly string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export async function runExecutorRunCommand(argv: readonly string[]): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const args = [...argv]
    const packetId = readFlag(args, '--packet')
    if (!packetId) throw new Error('executor:run requires --packet <id>')
    const packet = await getPacket(packetId)
    if (!packet) throw new Error(`packet not found: ${packetId}`)
    const commandOverride = readFlag(args, '--command')
    // Run the test. `runTestCommand` records a complete
    // `EvidenceRecord` and writes raw stdout+stderr to a real file
    // under `.atelier/v0/runs/evidence/`. The caller can then use
    // the `evidence.raw_output_ref` value as the `--raw-output-ref`
    // for `atelier:evidence:add` (e.g. when the TestContract command
    // has been specialised to a single file).
    //
    // When `--command` is supplied, it replaces the TestContract
    // command for the duration of THIS run only. The recorded
    // `evidence.command` will reflect the override (not the
    // contract's command), and the validator's
    // `commandCorrespondsToContract` check accepts the override as
    // a strict prefix specialisation of the contract command.
    const evidence = await runTestCommand(packetId, { commandOverride })
    const result = ok('executor', 'executor:run', {
      packet_id: packetId,
      evidence_id: evidence.evidence_id,
      evidence_status: evidence.status,
      raw_output_ref: evidence.raw_output_ref,
      test_contract_id: evidence.test_contract_id,
      command: evidence.command,
    }, { startedAt })
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('executor', 'executor:run', [
      { severity: 'P0', code: 'E_EXECUTOR_RUN', message: (err as Error).message },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runExecutorRunCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
