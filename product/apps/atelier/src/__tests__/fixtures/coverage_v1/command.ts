import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { coverageFixtureExpected } from './expected'
import { coverageFixtureInput } from './input'

type Assertion = {
  assertion_id: string
  modality: string
  testability: string
}

type AssertionLink = {
  link_id: string
  assertion_id?: string
  dag_node_id: string
  gate_ids: string[]
  fixture_ids: string[]
  status: string
}

type DagFile = {
  nodes: { dag_node_id: string }[]
}

type GateFile = {
  records: { gate_id: string }[]
}

type FixtureFile = {
  fixtures: { fixture_id: string; status: string }[]
}

export type CoverageFixtureResult = {
  fixture_id: typeof coverageFixtureInput.fixtureId
  status: 'passed' | 'failed'
  counts: {
    executableAssertions: number
    linkedExecutableAssertions: number
    unresolvedExecutableAssertions: number
    danglingReferences: number
    legacyUnresolvedLinks: number
    requiredLinkStatusFailures: number
    requiredExecutableFixtureFailures: number
  }
  failures: string[]
}

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../../../..')

function repoPath(relativePath: string): string {
  return path.join(REPO_ROOT, relativePath)
}

function readNdjson<T>(relativePath: string): T[] {
  const text = readFileSync(repoPath(relativePath), 'utf8')
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T)
}

function readYaml<T>(relativePath: string): T {
  return parse(readFileSync(repoPath(relativePath), 'utf8')) as T
}

function pushExpectedCountFailure(
  failures: string[],
  countName: keyof typeof coverageFixtureExpected.counts,
  actual: number,
): void {
  const expected = coverageFixtureExpected.counts[countName]
  if (actual !== expected) {
    failures.push(`${String(countName)} expected ${expected}, got ${actual}`)
  }
}

export function runCoverageFixture(): CoverageFixtureResult {
  const failures: string[] = []
  const assertions = readNdjson<Assertion>(coverageFixtureInput.assertionsPath)
  const links = readNdjson<AssertionLink>(coverageFixtureInput.assertionLinksPath)
  const dag = readYaml<DagFile>(coverageFixtureInput.dagPath)
  const gates = readYaml<GateFile>(coverageFixtureInput.gatesPath)
  const fixtures = readYaml<FixtureFile>(coverageFixtureInput.fixturesPath)

  const assertionIds = new Set(assertions.map((assertion) => assertion.assertion_id))
  const dagNodeIds = new Set(dag.nodes.map((node) => node.dag_node_id))
  const gateIds = new Set(gates.records.map((gate) => gate.gate_id))
  const fixtureStatuses = new Map(
    fixtures.fixtures.map((fixture) => [fixture.fixture_id, fixture.status]),
  )
  const linksByAssertion = new Map<string, AssertionLink[]>()
  const danglingReferences: string[] = []
  const legacyUnresolvedLinks: string[] = []

  for (const link of links) {
    if (link.status === 'legacy_unresolved') {
      legacyUnresolvedLinks.push(link.link_id)
    }
    if (!link.assertion_id || !assertionIds.has(link.assertion_id)) {
      danglingReferences.push(`${link.link_id}.assertion_id`)
    } else {
      const existing = linksByAssertion.get(link.assertion_id) ?? []
      existing.push(link)
      linksByAssertion.set(link.assertion_id, existing)
    }
    if (!dagNodeIds.has(link.dag_node_id)) {
      danglingReferences.push(`${link.link_id}.dag_node_id:${link.dag_node_id}`)
    }
    if (link.gate_ids.length === 0) {
      danglingReferences.push(`${link.link_id}.gate_ids`)
    }
    for (const gateId of link.gate_ids) {
      if (!gateIds.has(gateId)) {
        danglingReferences.push(`${link.link_id}.gate_ids:${gateId}`)
      }
    }
    if (link.fixture_ids.length === 0) {
      danglingReferences.push(`${link.link_id}.fixture_ids`)
    }
    for (const fixtureId of link.fixture_ids) {
      if (
        fixtureId !== coverageFixtureInput.fixtureSentinel &&
        !fixtureStatuses.has(fixtureId)
      ) {
        danglingReferences.push(`${link.link_id}.fixture_ids:${fixtureId}`)
      }
    }
  }

  const executableAssertions = assertions.filter(
    (assertion) =>
      assertion.testability === coverageFixtureInput.executableTestability &&
      coverageFixtureInput.coveredModalities.includes(
        assertion.modality as (typeof coverageFixtureInput.coveredModalities)[number],
      ),
  )
  const unresolvedExecutableAssertions = executableAssertions
    .filter((assertion) => {
      const assertionLinks = linksByAssertion.get(assertion.assertion_id) ?? []
      return assertionLinks.every((link) => link.status === 'legacy_unresolved')
    })
    .map((assertion) => assertion.assertion_id)

  const requiredLinkStatusFailures = coverageFixtureInput.requiredLinkedLinkIds.filter(
    (linkId) => links.find((link) => link.link_id === linkId)?.status !== 'linked',
  )
  const requiredExecutableFixtureFailures =
    coverageFixtureInput.requiredExecutableFixtureIds.filter(
      (fixtureId) => fixtureStatuses.get(fixtureId) !== 'executable',
    )

  if (danglingReferences.length > 0) {
    failures.push(`dangling references: ${danglingReferences.join(', ')}`)
  }
  if (legacyUnresolvedLinks.length > 0) {
    failures.push(`legacy unresolved links: ${legacyUnresolvedLinks.join(', ')}`)
  }
  if (unresolvedExecutableAssertions.length > 0) {
    failures.push(
      `unresolved executable assertions: ${unresolvedExecutableAssertions.join(', ')}`,
    )
  }
  if (requiredLinkStatusFailures.length > 0) {
    failures.push(`required links are not linked: ${requiredLinkStatusFailures.join(', ')}`)
  }
  if (requiredExecutableFixtureFailures.length > 0) {
    failures.push(
      `required fixtures are not executable: ${requiredExecutableFixtureFailures.join(', ')}`,
    )
  }

  pushExpectedCountFailure(
    failures,
    'unresolvedExecutableAssertions',
    unresolvedExecutableAssertions.length,
  )
  pushExpectedCountFailure(failures, 'danglingReferences', danglingReferences.length)
  pushExpectedCountFailure(
    failures,
    'legacyUnresolvedLinks',
    legacyUnresolvedLinks.length,
  )
  pushExpectedCountFailure(
    failures,
    'requiredLinkStatusFailures',
    requiredLinkStatusFailures.length,
  )
  pushExpectedCountFailure(
    failures,
    'requiredExecutableFixtureFailures',
    requiredExecutableFixtureFailures.length,
  )

  return {
    fixture_id: coverageFixtureInput.fixtureId,
    status: failures.length === 0 ? 'passed' : 'failed',
    counts: {
      executableAssertions: executableAssertions.length,
      linkedExecutableAssertions:
        executableAssertions.length - unresolvedExecutableAssertions.length,
      unresolvedExecutableAssertions: unresolvedExecutableAssertions.length,
      danglingReferences: danglingReferences.length,
      legacyUnresolvedLinks: legacyUnresolvedLinks.length,
      requiredLinkStatusFailures: requiredLinkStatusFailures.length,
      requiredExecutableFixtureFailures: requiredExecutableFixtureFailures.length,
    },
    failures,
  }
}

if (import.meta.main) {
  const result = runCoverageFixture()
  console.log(JSON.stringify(result, null, 2))
  if (result.status !== coverageFixtureExpected.status) {
    process.exitCode = 1
  }
}
