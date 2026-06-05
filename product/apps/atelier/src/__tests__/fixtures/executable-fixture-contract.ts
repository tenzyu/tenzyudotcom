import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

type FixtureRecord = {
  fixture_id: string
  command_file: string
  input_path: string
  expected_path: string
  status: string
}

type FixtureDocument = {
  fixtures: FixtureRecord[]
}

export type ExecutableFixtureContractResult = {
  fixture_id: string
  status: 'passed' | 'failed'
  failures: string[]
}

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../../..')
const CANONICAL_FIXTURES =
  'harness/knowledge/implementation-control/atelier/canonical/fixtures.yaml'
const REGISTRY_FIXTURES =
  'harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-2026-06-04.yaml'
const FIXTURE_COMMAND_ROOT = 'product/apps/atelier/src/__tests__/fixtures/'

function repoPath(relativePath: string): string {
  return path.join(REPO_ROOT, relativePath)
}

function readFixtureDocument(relativePath: string): FixtureDocument {
  return parse(readFileSync(repoPath(relativePath), 'utf8')) as FixtureDocument
}

function findFixture(fixtures: FixtureRecord[], fixtureId: string): FixtureRecord | undefined {
  return fixtures.find((fixture) => fixture.fixture_id === fixtureId)
}

function assertExistingPath(
  failures: string[],
  fixtureId: string,
  fieldName: keyof Pick<FixtureRecord, 'command_file' | 'input_path' | 'expected_path'>,
  value: string,
): void {
  if (!existsSync(repoPath(value))) {
    failures.push(`${fixtureId}.${fieldName} missing: ${value}`)
  }
}

export function executableFixtureIds(): string[] {
  const canonical = readFixtureDocument(CANONICAL_FIXTURES)
  return canonical.fixtures
    .filter((fixture) => fixture.command_file.startsWith(FIXTURE_COMMAND_ROOT))
    .map((fixture) => fixture.fixture_id)
    .sort()
}

export function runExecutableFixtureContract(
  fixtureId: string,
): ExecutableFixtureContractResult {
  const failures: string[] = []
  const canonical = readFixtureDocument(CANONICAL_FIXTURES)
  const registry = readFixtureDocument(REGISTRY_FIXTURES)
  const canonicalFixture = findFixture(canonical.fixtures, fixtureId)
  const registryFixture = findFixture(registry.fixtures, fixtureId)

  if (!canonicalFixture) {
    failures.push(`${fixtureId} missing from canonical fixtures`)
  }
  if (!registryFixture) {
    failures.push(`${fixtureId} missing from fixture alias registry`)
  }

  for (const fixture of [canonicalFixture, registryFixture]) {
    if (!fixture) continue
    if (fixture.status !== 'executable') {
      failures.push(`${fixture.fixture_id} status is ${fixture.status}, expected executable`)
    }
    assertExistingPath(failures, fixture.fixture_id, 'command_file', fixture.command_file)
    assertExistingPath(failures, fixture.fixture_id, 'input_path', fixture.input_path)
    assertExistingPath(failures, fixture.fixture_id, 'expected_path', fixture.expected_path)
    if (
      fixture.command_file.startsWith(FIXTURE_COMMAND_ROOT) &&
      !fixture.command_file.includes(`/${fixture.fixture_id}/command.ts`)
    ) {
      failures.push(`${fixture.fixture_id}.command_file does not match fixture id`)
    }
  }

  if (canonicalFixture?.command_file && existsSync(repoPath(canonicalFixture.command_file))) {
    const commandText = readFileSync(repoPath(canonicalFixture.command_file), 'utf8')
    if (commandText.includes('fixture_not_yet_implemented')) {
      failures.push(`${fixtureId} command still contains placeholder throw`)
    }
  }

  return {
    fixture_id: fixtureId,
    status: failures.length === 0 ? 'passed' : 'failed',
    failures,
  }
}
