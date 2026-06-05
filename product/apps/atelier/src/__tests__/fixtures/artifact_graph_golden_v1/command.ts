import { runExecutableFixtureContract } from "../executable-fixture-contract"

export const fixtureResult = runExecutableFixtureContract("artifact_graph_golden_v1")

if (import.meta.main) {
  console.log(JSON.stringify(fixtureResult, null, 2))
  if (fixtureResult.status !== "passed") {
    process.exitCode = 1
  }
}
