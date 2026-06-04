import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  checkConflicts,
  loadInFlightPackets,
  runConflictCheck,
  type CandidatePacket,
  type InFlightPacket,
} from '../core/parallel-conflict-checker'

const TEMP_ROOT = mkdtempSync(path.join(tmpdir(), 'parallel-conflict-checker-'))

function writeInFlight(packets: InFlightPacket[]): string {
  const filePath = path.join(TEMP_ROOT, 'in-flight.yaml')
  const payload = {
    schema: 'atelier.in-flight-packets/v1',
    file_id: 'in-flight-2026-06-04',
    in_flight_packets: packets,
  }
  writeFileSync(filePath, JSON.stringify(payload, null, 2))
  return filePath
}

function candidate(overrides: Partial<CandidatePacket> = {}): CandidatePacket {
  return {
    packet_id: 'at-cand-001',
    allowed_files: [],
    forbidden_roots: [],
    fixture_families: [],
    command_surfaces: [],
    generated_state_paths: [],
    durable_evidence_paths: [],
    ...overrides,
  }
}

function inflight(pkt: Partial<InFlightPacket> & Pick<InFlightPacket, 'packet_id'>): InFlightPacket {
  return {
    packet_id: pkt.packet_id,
    dispatch_time: pkt.dispatch_time ?? '2026-06-04T00:00:00Z',
    allowed_files: pkt.allowed_files ?? [],
    forbidden_roots: pkt.forbidden_roots ?? [],
    fixture_families: pkt.fixture_families ?? [],
    command_surfaces: pkt.command_surfaces ?? [],
    generated_state_paths: pkt.generated_state_paths ?? [],
    durable_evidence_paths: pkt.durable_evidence_paths ?? [],
  }
}

beforeEach(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
  require('node:fs').mkdirSync(TEMP_ROOT, { recursive: true })
})

afterEach(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
})

describe('parallel-conflict-checker (VG-046)', () => {
  test('passes when in-flight list is empty', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-empty',
        allowed_files: ['harness/knowledge/atelier/IMPLEMENTATION_LEDGER.md'],
      }),
      [],
    )
    expect(result.status).toBe('passed')
    expect(result.conflicting_packet_ids).toEqual([])
    expect(result.reports).toEqual([])
    expect(result.inflight_packet_count).toBe(0)
  })

  test('passes when candidate allowed_files are disjoint from in-flight allowed_files', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-disjoint',
        allowed_files: [
          'harness/knowledge/implementation-control/atelier/state/validations/disjoint-2026-06-04.md',
        ],
        forbidden_roots: ['harness/knowledge/product-specs/atelier/**'],
      }),
      [
        inflight({
          packet_id: 'at-other',
          allowed_files: [
            'product/apps/atelier/src/__tests__/some-other-test.ts',
          ],
          forbidden_roots: ['harness/knowledge/product-specs/atelier/**'],
        }),
      ],
    )
    expect(result.status).toBe('passed')
    expect(result.conflicting_packet_ids).toEqual([])
    expect(result.reports).toEqual([])
  })

  test('fails on exact allowed_files intersection', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-exact',
        allowed_files: [
          'harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md',
        ],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          allowed_files: [
            'harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md',
          ],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.conflicting_packet_ids).toEqual(['at-ctrl-other'])
    expect(result.reports).toHaveLength(1)
    expect(result.reports[0]!.conflict_kind).toBe('allowed_files')
    expect(result.reports[0]!.candidate_path).toBe(
      'harness/knowledge/implementation-control/atelier/IMPLEMENTATION_LEDGER.md',
    )
  })

  test('fails when a candidate file is under an in-flight directory glob', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-under',
        allowed_files: [
          'harness/knowledge/implementation-control/atelier/state/traceability/dag-02-join-table-2026-06-04.yaml',
        ],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          allowed_files: [
            'harness/knowledge/implementation-control/atelier/state/traceability/**',
          ],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.reports.some((r) => r.conflict_kind === 'allowed_files')).toBe(true)
  })

  test('fails when two directory globs share a parent', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-glob',
        allowed_files: ['harness/knowledge/atelier/state/traceability/**'],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          allowed_files: ['harness/knowledge/atelier/state/traceability/**'],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.reports.some((r) => r.conflict_kind === 'allowed_files')).toBe(true)
  })

  test('fails when candidate forbidden_roots include an in-flight allowed file', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-forbidden',
        forbidden_roots: [
          'harness/knowledge/implementation-control/atelier/state/packets/**',
        ],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          allowed_files: [
            'harness/knowledge/implementation-control/atelier/state/packets/at-ctrl-009.yaml',
          ],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.reports.some((r) => r.conflict_kind === 'forbidden_roots')).toBe(true)
  })

  test('fails when an in-flight forbidden_roots include a candidate allowed file', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-allowed',
        allowed_files: [
          'harness/knowledge/implementation-control/atelier/state/packets/at-cand.yaml',
        ],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          forbidden_roots: [
            'harness/knowledge/implementation-control/atelier/state/packets/**',
          ],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.reports.some((r) => r.conflict_kind === 'forbidden_roots')).toBe(true)
  })

  test('fails on fixture family conflict', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-fixture',
        fixture_families: ['artifact_graph', 'verification_record'],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          fixture_families: ['artifact_graph'],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.reports.some((r) => r.conflict_kind === 'fixture_family')).toBe(true)
  })

  test('fails on command surface conflict', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-cmd',
        command_surfaces: ['atelier run force-close', 'atelier run complete'],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          command_surfaces: ['atelier run force-close'],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.reports.some((r) => r.conflict_kind === 'command_surface')).toBe(true)
  })

  test('fails on generated_state_paths conflict', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-gen',
        generated_state_paths: ['.atelier/graph/atelier-cand.json'],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          generated_state_paths: ['.atelier/graph/atelier-cand.json'],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.reports.some((r) => r.conflict_kind === 'generated_state')).toBe(true)
  })

  test('fails on durable_evidence_paths conflict', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-durable',
        durable_evidence_paths: ['harness/knowledge/atelier/evidence/run-001.json'],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-other',
          durable_evidence_paths: ['harness/knowledge/atelier/evidence/run-001.json'],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.reports.some((r) => r.conflict_kind === 'durable_evidence')).toBe(true)
  })

  test('reports multiple conflict kinds from a single in-flight packet', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-multi',
        allowed_files: ['shared/path.ts'],
        fixture_families: ['graph_kernel'],
        command_surfaces: ['atelier graph'],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-multi',
          allowed_files: ['shared/path.ts'],
          fixture_families: ['graph_kernel'],
          command_surfaces: ['atelier graph'],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    const kinds = new Set(result.reports.map((r) => r.conflict_kind))
    expect(kinds.has('allowed_files')).toBe(true)
    expect(kinds.has('fixture_family')).toBe(true)
    expect(kinds.has('command_surface')).toBe(true)
  })

  test('aggregates conflicts across multiple in-flight packets', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-agg',
        allowed_files: ['shared/a.ts', 'shared/b.ts'],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-a',
          allowed_files: ['shared/a.ts'],
        }),
        inflight({
          packet_id: 'at-ctrl-b',
          allowed_files: ['shared/b.ts'],
        }),
      ],
    )
    expect(result.status).toBe('failed')
    expect(result.conflicting_packet_ids).toEqual(['at-ctrl-a', 'at-ctrl-b'])
    expect(result.inflight_packet_count).toBe(2)
    expect(result.reports).toHaveLength(2)
  })

  test('returns a sorted, deterministic conflicting_packet_ids list', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-sort',
        allowed_files: ['shared/x.ts'],
      }),
      [
        inflight({ packet_id: 'at-ctrl-z', allowed_files: ['shared/x.ts'] }),
        inflight({ packet_id: 'at-ctrl-a', allowed_files: ['shared/x.ts'] }),
        inflight({ packet_id: 'at-ctrl-m', allowed_files: ['shared/x.ts'] }),
      ],
    )
    expect(result.conflicting_packet_ids).toEqual([
      'at-ctrl-a',
      'at-ctrl-m',
      'at-ctrl-z',
    ])
  })

  test('loadInFlightPackets reads and parses the in-flight file', () => {
    const filePath = writeInFlight([
      inflight({
        packet_id: 'at-ctrl-A',
        allowed_files: ['product/apps/atelier/src/__tests__/A.test.ts'],
        fixture_families: ['graph_kernel'],
        command_surfaces: ['atelier scan'],
      }),
    ])
    const packets = loadInFlightPackets(filePath)
    expect(packets).toHaveLength(1)
    expect(packets[0]!.packet_id).toBe('at-ctrl-A')
    expect(packets[0]!.allowed_files).toEqual(['product/apps/atelier/src/__tests__/A.test.ts'])
    expect(packets[0]!.fixture_families).toEqual(['graph_kernel'])
    expect(packets[0]!.command_surfaces).toEqual(['atelier scan'])
  })

  test('loadInFlightPackets returns empty list for missing in_flight_packets key', () => {
    const filePath = path.join(TEMP_ROOT, 'empty.yaml')
    writeFileSync(filePath, 'schema: atelier.in-flight-packets/v1\n')
    const packets = loadInFlightPackets(filePath)
    expect(packets).toEqual([])
  })

  test('runConflictCheck integrates file load and check', () => {
    const filePath = writeInFlight([
      inflight({
        packet_id: 'at-ctrl-x',
        allowed_files: ['harness/knowledge/atelier/IMPLEMENTATION_LEDGER.md'],
      }),
    ])
    const result = runConflictCheck({
      candidate: candidate({
        packet_id: 'at-cand-int',
        allowed_files: ['harness/knowledge/atelier/IMPLEMENTATION_LEDGER.md'],
      }),
      inFlightFilePath: filePath,
    })
    expect(result.status).toBe('failed')
    expect(result.conflicting_packet_ids).toEqual(['at-ctrl-x'])
    expect(result.inflight_packet_count).toBe(1)
  })

  test('candidate with disjoint allowed_files and disjoint command surfaces passes', () => {
    const result = checkConflicts(
      candidate({
        packet_id: 'at-cand-clean',
        allowed_files: ['harness/knowledge/atelier/state/validations/clean-2026-06-04.md'],
        forbidden_roots: ['harness/knowledge/product-specs/atelier/**'],
        fixture_families: ['graph_endpoint'],
        command_surfaces: ['atelier run export'],
        generated_state_paths: ['.atelier/graph/cand-clean.json'],
        durable_evidence_paths: ['harness/knowledge/atelier/evidence/cand-clean.json'],
      }),
      [
        inflight({
          packet_id: 'at-ctrl-disjoint',
          allowed_files: ['harness/knowledge/atelier/IMPLEMENTATION_LEDGER.md'],
          forbidden_roots: ['harness/knowledge/product-specs/atelier/**'],
          fixture_families: ['artifact_graph'],
          command_surfaces: ['atelier run force-close'],
          generated_state_paths: ['.atelier/graph/other.json'],
          durable_evidence_paths: ['harness/knowledge/atelier/evidence/other.json'],
        }),
      ],
    )
    expect(result.status).toBe('passed')
    expect(result.conflicting_packet_ids).toEqual([])
  })

  test('result includes ran_at timestamp and candidate packet id', () => {
    const result = checkConflicts(candidate({ packet_id: 'at-cand-ts' }), [])
    expect(result.ran_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result.candidate_packet_id).toBe('at-cand-ts')
  })
})
