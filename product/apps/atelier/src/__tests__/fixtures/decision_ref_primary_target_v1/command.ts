import { runExecutableFixtureContract } from "../executable-fixture-contract"

export const fixtureResult = runExecutableFixtureContract("decision_ref_primary_target_v1")

if (import.meta.main) {
  console.log(JSON.stringify(fixtureResult, null, 2))
  if (fixtureResult.status !== "passed") {
    process.exitCode = 1
  }
}
