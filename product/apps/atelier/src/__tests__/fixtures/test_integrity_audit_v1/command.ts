import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { testIntegrityAuditExpected } from './expected'
import { testIntegrityAuditInput } from './input'

export type TestIntegrityAuditFixtureResult = {
  fixture_id: typeof testIntegrityAuditInput.fixtureId
  status: 'passed' | 'failed'
  counts: {
    missingInputFiles: number
    forbiddenMatches: number
    missingRequiredSubstrings: number
  }
  failures: string[]
}

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../../../..')

function repoPath(relativePath: string): string {
  return path.join(REPO_ROOT, relativePath)
}

function pushExpectedCountFailure(
  failures: string[],
  countName: keyof typeof testIntegrityAuditExpected.counts,
  actual: number,
): void {
  const expected = testIntegrityAuditExpected.counts[countName]
  if (actual !== expected) {
    failures.push(`${String(countName)} expected ${expected}, got ${actual}`)
  }
}

export function runTestIntegrityAuditFixture(): TestIntegrityAuditFixtureResult {
  const failures: string[] = []
  const textByFile = new Map<string, string>()
  let missingInputFiles = 0
  let forbiddenMatches = 0
  let missingRequiredSubstrings = 0

  for (const relativeFile of testIntegrityAuditInput.repoRelativeFiles) {
    const absoluteFile = repoPath(relativeFile)
    if (!existsSync(absoluteFile)) {
      missingInputFiles += 1
      failures.push(`missing input file: ${relativeFile}`)
      continue
    }
    textByFile.set(relativeFile, readFileSync(absoluteFile, 'utf8'))
  }

  for (const forbiddenPattern of testIntegrityAuditInput.forbiddenPatterns) {
    const regex = new RegExp(forbiddenPattern.pattern, 'g')
    for (const [relativeFile, text] of textByFile.entries()) {
      const matches = Array.from(text.matchAll(regex))
      if (matches.length === 0) continue
      forbiddenMatches += matches.length
      failures.push(
        `${relativeFile} matched forbidden pattern ${forbiddenPattern.pattern}: ${forbiddenPattern.reason}`,
      )
    }
  }

  for (const requiredSubstring of testIntegrityAuditInput.requiredSubstrings) {
    const text = textByFile.get(requiredSubstring.file)
    if (!text?.includes(requiredSubstring.text)) {
      missingRequiredSubstrings += 1
      failures.push(
        `${requiredSubstring.file} missing required guard text: ${requiredSubstring.reason}`,
      )
    }
  }

  pushExpectedCountFailure(failures, 'missingInputFiles', missingInputFiles)
  pushExpectedCountFailure(failures, 'forbiddenMatches', forbiddenMatches)
  pushExpectedCountFailure(
    failures,
    'missingRequiredSubstrings',
    missingRequiredSubstrings,
  )

  return {
    fixture_id: testIntegrityAuditInput.fixtureId,
    status: failures.length === 0 ? 'passed' : 'failed',
    counts: {
      missingInputFiles,
      forbiddenMatches,
      missingRequiredSubstrings,
    },
    failures,
  }
}

if (import.meta.main) {
  const result = runTestIntegrityAuditFixture()
  console.log(JSON.stringify(result, null, 2))
  if (result.status !== testIntegrityAuditExpected.status) {
    process.exitCode = 1
  }
}
