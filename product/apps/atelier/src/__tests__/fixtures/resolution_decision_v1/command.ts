import { runExecutableFixtureContract } from "../executable-fixture-contract"

export const fixtureResult = runExecutableFixtureContract("resolution_decision_v1")

if (import.meta.main) {
  console.log(JSON.stringify(fixtureResult, null, 2))
  if (fixtureResult.status !== "passed") {
    process.exitCode = 1
  }
}
