import { runExecutableFixtureContract } from "../executable-fixture-contract"

export const fixtureResult = runExecutableFixtureContract("policy_decision_hard_block_v1")

if (import.meta.main) {
  console.log(JSON.stringify(fixtureResult, null, 2))
  if (fixtureResult.status !== "passed") {
    process.exitCode = 1
  }
}
