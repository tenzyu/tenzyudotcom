import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../../')
const REGISTRY_PATH = path.join(
  REPO_ROOT,
  'harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-2026-06-04.yaml',
)
const GATE_REGISTRY_PATH = path.join(
  REPO_ROOT,
  'harness/knowledge/implementation-control/atelier/views/VALIDATION_GATE_REGISTRY.md',
)
const MATRIX_PATH = path.join(
  REPO_ROOT,
  'harness/knowledge/product-specs/atelier/CONTRACT_TEST_MATRIX.md',
)
const STRUCTURED_GATES_PATH = path.join(
  REPO_ROOT,
  'harness/knowledge/implementation-control/atelier/state/gates/structured-gates-2026-06-04.yaml',
)

type Row = {
  fixture_id: string
  command_file: string
  input_path: string
  expected_path: string
  negative_case_id: string | null
  gate_id: string
  status: 'executable' | 'pending_command_implementation' | 'oracle_gap'
  provenance: string
  last_verified_at: string
}

type Registry = {
  schema: string
  registry_id: string
  fixtures: Row[]
  vocabulary: { status: string[]; closed_gate_id_pattern: string }
}

function loadRegistry(): Registry {
  const text = readFileSync(REGISTRY_PATH, 'utf8')
  return parse(text) as Registry
}

function loadGateIdsFromTable(): Set<string> {
  const text = readFileSync(GATE_REGISTRY_PATH, 'utf8')
  const matches = text.matchAll(/\|\s*(VG-\d+[A-Z]?)\s*\|/g)
  return new Set(Array.from(matches, (m) => m[1]))
}

function loadGateIdsFromStructuredRecord(): Set<string> {
  const text = readFileSync(STRUCTURED_GATES_PATH, 'utf8')
  const matches = text.matchAll(/gate_id:\s*(VG-\d+[A-Z]?)/g)
  return new Set(Array.from(matches, (m) => m[1]))
}

describe('fixture alias consistency (VG-045)', () => {
  const registry = loadRegistry()
  const tableGateIds = loadGateIdsFromTable()
  const structuredGateIds = loadGateIdsFromStructuredRecord()
  const allKnownGateIds = new Set<string>([...tableGateIds, ...structuredGateIds])
  const matrixText = readFileSync(MATRIX_PATH, 'utf8')

  test('registry is parseable and has the expected schema fields', () => {
    expect(registry.schema).toBe('atelier.fixture-alias-registry/v1')
    expect(typeof registry.registry_id).toBe('string')
    expect(Array.isArray(registry.fixtures)).toBe(true)
    expect(registry.vocabulary.status).toContain('executable')
    expect(registry.vocabulary.status).toContain('pending_command_implementation')
    expect(registry.vocabulary.status).toContain('oracle_gap')
  })

  test('every fixture_id is unique', () => {
    const ids = registry.fixtures.map((r) => r.fixture_id)
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id)
      seen.add(id)
    }
    expect(duplicates).toEqual([])
    expect(seen.size).toBe(registry.fixtures.length)
  })

  test('every row has the required fields with non-empty values', () => {
    const requiredFields: (keyof Row)[] = [
      'fixture_id',
      'command_file',
      'input_path',
      'expected_path',
      'gate_id',
      'status',
      'provenance',
      'last_verified_at',
    ]
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      for (const field of requiredFields) {
        const value = row[field]
        if (value === undefined || value === null || value === '') {
          offenders.push(`${row.fixture_id ?? '<missing-id>'}.${String(field)}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('every status is in the closed vocabulary', () => {
    const allowed = new Set(registry.vocabulary.status)
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      if (!allowed.has(row.status)) {
        offenders.push(`${row.fixture_id}: ${row.status}`)
      }
    }
    expect(offenders).toEqual([])
  })

  test('every command_file path exists on disk OR the row is pending/oracle_gap', () => {
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      const isPending = row.status === 'pending_command_implementation'
      const isOracleGap = row.status === 'oracle_gap'
      if (isPending || isOracleGap) continue
      const abs = path.isAbsolute(row.command_file)
        ? row.command_file
        : path.join(REPO_ROOT, row.command_file)
      if (!existsSync(abs)) {
        offenders.push(`${row.fixture_id}: ${row.command_file}`)
      }
    }
    expect(offenders).toEqual([])
  })

  test('every input_path and expected_path exists on disk OR the row is pending/oracle_gap', () => {
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      const isPending = row.status === 'pending_command_implementation'
      const isOracleGap = row.status === 'oracle_gap'
      if (isPending || isOracleGap) continue
      for (const field of ['input_path', 'expected_path'] as const) {
        const abs = path.isAbsolute(row[field])
          ? row[field]
          : path.join(REPO_ROOT, row[field])
        if (!existsSync(abs)) {
          offenders.push(`${row.fixture_id}.${field}: ${row[field]}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('every gate_id references a real VG-NNN in the gate table or structured record', () => {
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      if (!allKnownGateIds.has(row.gate_id)) {
        offenders.push(`${row.fixture_id}: ${row.gate_id}`)
      }
    }
    expect(offenders).toEqual([])
  })

  test('every gate_id matches the closed pattern VG-<digits>[<letter>]', () => {
    const pattern = new RegExp(registry.vocabulary.closed_gate_id_pattern)
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      if (!pattern.test(row.gate_id)) {
        offenders.push(`${row.fixture_id}: ${row.gate_id}`)
      }
    }
    expect(offenders).toEqual([])
  })

  test('every non-null negative_case_id references a real negative case in the matrix', () => {
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      if (row.negative_case_id === null) continue
      if (!matrixText.includes(row.negative_case_id)) {
        offenders.push(`${row.fixture_id}: ${row.negative_case_id}`)
      }
    }
    expect(offenders).toEqual([])
  })

  test('no pending_command_implementation row remains in executable readiness state', () => {
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      if (row.status === 'pending_command_implementation') {
        offenders.push(row.fixture_id)
      }
    }
    expect(offenders).toEqual([])
  })

  test('every executable row has its command_file, input_path, and expected_path on disk', () => {
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      if (row.status !== 'executable') continue
      for (const field of ['command_file', 'input_path', 'expected_path'] as const) {
        const abs = path.isAbsolute(row[field])
          ? row[field]
          : path.join(REPO_ROOT, row[field])
        if (!existsSync(abs)) {
          offenders.push(`${row.fixture_id}.${field}: ${row[field]}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('every fixture_id appears as a code-safe token (no slashes, no spaces in path-derived ids)', () => {
    const offenders: string[] = []
    for (const row of registry.fixtures) {
      if (row.fixture_id.includes(' ')) {
        offenders.push(row.fixture_id)
      }
    }
    expect(offenders).toEqual([])
  })
})
