/**
 * Operation tests.
 *
 * Strategy: build a fixture under a temp dir, then call the
 * operation-layer helpers directly (not as a subprocess) with
 * `process.cwd()` set to the fixture root. The helpers use
 * `process.cwd()` to resolve `.atelier/v0/...`, so the test
 * controls which fixture is read.
 *
 * This avoids the subprocess-coupling problem where `runReady`
 * also re-runs the indexer update step against the fixture root
 * (which would fail for a fixture that doesn't have its own
 * `.atelier-bootstrap/` tooling). The individual helpers
 * (`checkRelationKernelInvariants`, `checkEvidenceInvariant`,
 * `checkPacketLifecycleInvariant`, etc.) don't shell out to the
 * indexer, so they can be tested in isolation.
 *
 * The helpers are exported from `../lib/review.ts` for testing
 * only; they are not part of the public command surface.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import { rm, mkdir, writeFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import {
  checkRelationKernelInvariants,
  checkAttentionInvariant,
  checkImplementationTaskInvariant,
  checkEvidenceInvariant,
  checkPacketLifecycleInvariant,
  type Defect,
} from '../lib/review.ts'

const REPO_ROOT = path.resolve(process.cwd())
const ORIGINAL_CWD = process.cwd()

/**
 * Build a fixture directory with a minimal valid Relation-Kernel
 * state. The fixture is intentionally tiny — one file, one anchor,
 * one `defines` edge, one `inferred` proposal, one ready task with
 * `source_relation_ids.length > 0`, one ready test contract with
 * `source_relation_ids.length > 0`, one `passed`+proven evidence
 * record, and one `completed` packet.
 */
async function buildValidKernelFixture(root: string): Promise<void> {
  const v0 = path.join(root, '.atelier', 'v0')
  await mkdir(path.join(v0, 'anchors'), { recursive: true })
  await mkdir(path.join(v0, 'edges'), { recursive: true })
  await mkdir(path.join(v0, 'objects'), { recursive: true })
  await mkdir(path.join(v0, 'transforms', 'md-to-code', 'model'), { recursive: true })
  await mkdir(path.join(v0, 'runs', 'evidence'), { recursive: true })
  await mkdir(path.join(v0, 'runs', 'handoffs'), { recursive: true })
  await mkdir(path.join(v0, 'operation'), { recursive: true })

  // Two anchors: the second one is the endpoint of the deterministic
  // `defines` edge. The operation resolver must not learn endpoint
  // ids from edges alone; both endpoints need current indexer anchors
  // or source units.
  await writeFile(
    path.join(v0, 'anchors', 'source-anchors.ndjson'),
    [
      {
        id: 'anchor:f00',
        kind: 'file',
        path: 'README.md',
        content_hash: 'a'.repeat(64),
        selector_strategy: 'path',
        produced_by: 'indexer',
        provenance_kind: 'deterministic_fact',
        confidence: 'fact',
        status: 'fresh',
        source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
        created_at: '2026-06-06T00:00:00.000Z',
      },
      {
        id: 'anchor:f01',
        kind: 'markdown_section',
        path: 'README.md',
        start_line: 1,
        end_line: 1,
        heading_path: ['Fixture'],
        content_hash: 'b'.repeat(64),
        selector_strategy: 'heading',
        produced_by: 'indexer',
        provenance_kind: 'deterministic_fact',
        confidence: 'fact',
        status: 'fresh',
        source_refs: [{ path: 'README.md', start_line: 1, end_line: 1, sha256: 'a'.repeat(64) }],
        created_at: '2026-06-06T00:00:00.000Z',
      },
    ].map((r) => JSON.stringify(r)).join('\n') + '\n',
    'utf8',
  )

  // Two edges: a `defines` (non-contains) and a `contains`.
  await writeFile(
    path.join(v0, 'edges', 'edges.ndjson'),
    [
      {
        id: 'edge:defines:1',
        from: 'anchor:f00',
        to: 'anchor:f01',
        kind: 'defines',
        provenance_kind: 'deterministic_fact',
        source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
        confidence: 'fact',
        status: 'fresh',
        created_at: '2026-06-06T00:00:00.000Z',
      },
      {
        id: 'edge:contains:1',
        from: 'src:repo:root',
        to: 'anchor:f00',
        kind: 'contains',
        provenance_kind: 'deterministic_fact',
        source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
        confidence: 'fact',
        status: 'fresh',
        created_at: '2026-06-06T00:00:00.000Z',
      },
    ].map((r) => JSON.stringify(r)).join('\n') + '\n',
    'utf8',
  )

  // No reader-accepted-relations: the deterministic edges are
  // sufficient for the "non_contains_relations > 0" invariant.

  // One relation-proposal.
  await writeFile(
    path.join(v0, 'objects', 'relation-proposals.ndjson'),
    JSON.stringify({
      schema: 'atelier.relation-proposal/v1',
      proposal_id: 'rp:0001',
      proposed_relation: {
        from: 'anchor:f00',
        to: 'anchor:f01',
        kind: 'references',
        provenance_kind: 'llm_extracted',
        source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
        confidence: 'inferred',
        status: 'fresh',
        created_at: '2026-06-06T00:00:00.000Z',
      },
      rationale: 'minimal fixture proposal',
      source_anchor_ids: ['anchor:f00'],
      source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      confidence: 'inferred',
      status: 'proposed',
      created_at: '2026-06-06T00:00:00.000Z',
    }) + '\n',
    'utf8',
  )

  // One attention set (sufficient) for the attention invariant.
  await writeFile(
    path.join(v0, 'objects', 'attention.ndjson'),
    JSON.stringify({
      id: 'att:fixture',
      kind: 'attention_set',
      version: '1',
      title: 'fixture attention',
      source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      produced_by: 'reader',
      provenance_kind: 'llm_extracted',
      confidence: 'inferred',
      status: 'fresh',
      affordances: ['context'],
      created_at: '2026-06-06T00:00:00.000Z',
      task: 'fixture',
      selected_object_ids: ['anchor:f00'],
      selected_source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      excluded_object_ids: [],
      reason: 'fixture',
      budget: { target_tokens: 100, max_tokens: 200 },
      gap_status: 'sufficient',
    }) + '\n',
    'utf8',
  )

  // One source unit referenced by the attention (so the operation
  // layer's stale-attention check does not quarantine the set).
  await writeFile(
    path.join(v0, 'objects', 'source.ndjson'),
    JSON.stringify({
      id: 'anchor:f00',
      kind: 'source_unit',
      version: '1',
      title: 'README.md',
      source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      produced_by: 'indexer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'fresh',
      affordances: ['index'],
      created_at: '2026-06-06T00:00:00.000Z',
      unit_type: 'file',
      path: 'README.md',
      sha256: 'a'.repeat(64),
      byte_size: 1,
    }) + '\n',
    'utf8',
  )

  // One ready implementation task with `source_relation_ids.length > 0`.
  await writeFile(
    path.join(v0, 'transforms', 'md-to-code', 'model', 'implementation-tasks.ndjson'),
    JSON.stringify({
      id: 'task:fixture',
      kind: 'implementation_task',
      version: '1',
      title: 'fixture task',
      // The task's source_ref must point at a design-doc path so
      // the operation layer's `checkImplementationTaskInvariant`
      // accepts it. The fixture uses a path under
      // `harness/atelier-design-docs/` to mimic the real-repo state.
      source_refs: [
        { path: 'harness/atelier-design-docs/GOAL-OPERATIONAL-ATELIER.md', sha256: 'a'.repeat(64) },
      ],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'ready',
      affordances: ['packet-constraint'],
      created_at: '2026-06-06T00:00:00.000Z',
      task_id: 'task:fixture',
      goal: 'fixture',
      source_object_ids: ['anchor:f00'],
      source_anchor_ids: ['anchor:f00'],
      source_relation_ids: ['edge:defines:1'],
      required_knowledge_object_ids: [],
      allowed_files: ['README.md'],
      forbidden_files: [],
      acceptance_criteria: ['relation trace is present'],
      risk_notes: [],
      blocker_ids: [],
    }) + '\n',
    'utf8',
  )

  // One ready test contract with `source_relation_ids.length > 0`.
  await writeFile(
    path.join(v0, 'transforms', 'md-to-code', 'model', 'test-contracts.ndjson'),
    JSON.stringify({
      id: 'tc:fixture',
      kind: 'test_contract',
      version: '1',
      title: 'fixture test contract',
      source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'ready',
      affordances: ['test-candidate'],
      created_at: '2026-06-06T00:00:00.000Z',
      test_contract_id: 'tc:fixture',
      task_id: 'task:fixture',
      test_framework: 'bun-test',
      target_files: ['README.md'],
      test_files: ['README.test.md'],
      expected_behavior: ['command exits with code 0'],
      negative_cases: [],
      command: 'echo test',
      source_relation_ids: ['edge:defines:1'],
    }) + '\n',
    'utf8',
  )

  // One packet template (so the template's `search_policy` is set).
  await writeFile(
    path.join(v0, 'transforms', 'md-to-code', 'model', 'packet-templates.ndjson'),
    JSON.stringify({
      id: 'pt:fixture',
      kind: 'packet_template',
      version: '1',
      title: 'fixture packet template',
      source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      produced_by: 'transformer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'ready',
      affordances: ['packet-constraint'],
      created_at: '2026-06-06T00:00:00.000Z',
      task_id: 'task:fixture',
      required_source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      required_object_ids: ['anchor:f00'],
      source_relation_ids: ['edge:defines:1'],
      allowed_files: ['README.md'],
      forbidden_files: [],
      test_contract_ids: ['tc:fixture'],
      evidence_expectations: ['test_run evidence record with raw command output'],
      search_policy: 'none',
      subagent_contract: 'atelier.subagent-handoff/v1',
    }) + '\n',
    'utf8',
  )

  // One evidence record: passed, with a real raw_output_ref file.
  const rawOut = path.join(v0, 'runs', 'evidence', 'raw-output.txt')
  await writeFile(rawOut, 'fixture evidence output\n', 'utf8')
  await writeFile(
    path.join(v0, 'runs', 'evidence', 'evi:fixture.json'),
    JSON.stringify({
      id: 'evi:fixture',
      kind: 'evidence_record',
      version: '1',
      title: 'fixture evidence',
      source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      produced_by: 'executor',
      provenance_kind: 'runtime_evidence',
      confidence: 'fact',
      status: 'passed',
      affordances: ['context'],
      created_at: '2026-06-06T00:00:00.000Z',
      evidence_id: 'evi:fixture',
      packet_id: 'pkt:fixture',
      task_id: 'task:fixture',
      test_contract_id: 'tc:fixture',
      gate_id: 'tc:fixture',
      command: 'echo test',
      raw_output_ref: rawOut,
    }) + '\n',
    'utf8',
  )

  // One completed packet whose test_contract_ids is in the evidence.
  await writeFile(
    path.join(v0, 'runs', 'handoffs', 'packets.ndjson'),
    JSON.stringify({
      id: 'pkt:fixture',
      kind: 'execution_packet',
      version: '1',
      title: 'fixture packet',
      source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      produced_by: 'executor',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: 'completed',
      affordances: ['packet-constraint'],
      created_at: '2026-06-06T00:00:00.000Z',
      packet_id: 'pkt:fixture',
      task_id: 'task:fixture',
      required_source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
      required_object_ids: ['anchor:f00'],
      allowed_files: ['README.md'],
      forbidden_files: [],
      test_contract_ids: ['tc:fixture'],
      evidence_expectations: ['test_run evidence record with raw command output'],
      handoff_schema: 'atelier.subagent-handoff/v1',
    }) + '\n',
    'utf8',
  )

  // README.md on disk so the file existence checks pass.
  await writeFile(path.join(root, 'README.md'), '# Fixture\n', 'utf8')
}

/**
 * Build a fixture directory with an EMPTY Relation-Kernel state
 * (no anchors, no relations, no proposals, no contracts, no
 * packets, no evidence). The directory structure is created but
 * the ndjson files are not present. This is the scaffold-only
 * state.
 */
async function buildEmptyFixture(root: string): Promise<void> {
  const v0 = path.join(root, '.atelier', 'v0')
  await mkdir(path.join(v0, 'anchors'), { recursive: true })
  await mkdir(path.join(v0, 'edges'), { recursive: true })
  await mkdir(path.join(v0, 'objects'), { recursive: true })
  await mkdir(path.join(v0, 'transforms', 'md-to-code', 'model'), { recursive: true })
  await mkdir(path.join(v0, 'runs', 'evidence'), { recursive: true })
  await mkdir(path.join(v0, 'runs', 'handoffs'), { recursive: true })
  await mkdir(path.join(v0, 'operation'), { recursive: true })
  await writeFile(path.join(root, 'README.md'), '# Empty\n', 'utf8')
}

describe('atelier-operation (in-memory helpers)', () => {
  let validRoot = ''
  let emptyRoot = ''

  beforeAll(async () => {
    validRoot = await mkdtemp(path.join(tmpdir(), 'atelier-valid-'))
    await buildValidKernelFixture(validRoot)
    emptyRoot = await mkdtemp(path.join(tmpdir(), 'atelier-empty-'))
    await buildEmptyFixture(emptyRoot)
  })

  afterAll(async () => {
    process.chdir(ORIGINAL_CWD)
    if (validRoot) await rm(validRoot, { recursive: true, force: true })
    if (emptyRoot) await rm(emptyRoot, { recursive: true, force: true })
  })

  test('empty fixture: checkRelationKernelInvariants surfaces the three new P0 defects', async () => {
    process.chdir(emptyRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkRelationKernelInvariants(push, verified)
    const ids = defects.map((d) => d.defect_id)
    // The empty fixture must surface the three new P0 defects.
    expect(ids).toContain('indexer:E_NO_SOURCE_ANCHORS')
    expect(ids).toContain('indexer:E_NO_ACCEPTED_NON_CONTAINS_RELATION')
    expect(ids).toContain('reader:E_NO_READER_PROPOSALS')
  })

  test('valid fixture: checkRelationKernelInvariants passes the new invariants', async () => {
    process.chdir(validRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkRelationKernelInvariants(push, verified)
    const ids = defects.map((d) => d.defect_id)
    // The valid fixture must not surface any of the new P0 defects.
    expect(ids).not.toContain('indexer:E_NO_SOURCE_ANCHORS')
    expect(ids).not.toContain('indexer:E_NO_ACCEPTED_NON_CONTAINS_RELATION')
    expect(ids).not.toContain('reader:E_NO_READER_PROPOSALS')
    expect(ids).not.toContain('transformer:E_TRANSFORMER_NO_RELATION_TRACE')
    // The verified_invariants block must list the kernel counts.
    expect(verified.some((v) => v.startsWith('anchors:'))).toBe(true)
    expect(verified.some((v) => v.startsWith('non_contains_relations:'))).toBe(true)
    expect(verified.some((v) => v.startsWith('reader_proposals:'))).toBe(true)
    expect(verified.some((v) => v.includes('ready_tasks_with_relation_trace:'))).toBe(true)
    expect(verified.some((v) => v.includes('ready_contracts_with_relation_trace:'))).toBe(true)
  })

  test('valid fixture: checkAttentionInvariant accepts the sufficient attention set', async () => {
    process.chdir(validRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkAttentionInvariant(push, verified)
    const ids = defects.map((d) => d.defect_id)
    expect(ids).not.toContain('reader:E_NO_ATTENTION_SET')
    expect(ids).not.toContain('reader:E_ATTENTION_INSUFFICIENT')
  })

  test('valid fixture: checkImplementationTaskInvariant accepts the ready task', async () => {
    process.chdir(validRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkImplementationTaskInvariant(push, verified)
    const ids = defects.map((d) => d.defect_id)
    expect(ids).not.toContain('transformer:E_NO_IMPLEMENTATION_TASKS')
    expect(ids).not.toContain('transformer:E_TASK_NO_DESIGN_DOC')
  })

  test('valid fixture: checkEvidenceInvariant accepts passed+proven evidence', async () => {
    process.chdir(validRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkEvidenceInvariant(push, verified)
    const ids = defects.map((d) => d.defect_id)
    // The valid fixture has a real raw_output_ref, so no
    // E_EVIDENCE_PASSED_NO_PROOF should fire.
    expect(ids).not.toContain('executor:E_EVIDENCE_PASSED_NO_PROOF')
    // The packet is completed and the evidence maps to its
    // test_contract_id, so E_PACKET_COMPLETED_NO_PROOF should
    // not fire.
    expect(ids).not.toContain('executor:E_PACKET_COMPLETED_NO_PROOF')
  })

  test('valid fixture: checkPacketLifecycleInvariant has no duplicate-status conflicts', async () => {
    process.chdir(validRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkPacketLifecycleInvariant(push, verified)
    const ids = defects.map((d) => d.defect_id)
    expect(ids).not.toContain('executor:E_PACKET_LIFECYCLE_CONFLICT')
  })

  test('regression: scaffold-only fixture (anchors file removed) produces E_NO_SOURCE_ANCHORS', async () => {
    // Build a minimal scaffold fixture and verify the relation-kernel
    // invariant catches the missing-anchors defect specifically. This
    // is a unit-level reproduction of the operation work order's
    // acceptance criterion 5.
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'atelier-scaffold-'))
    try {
      await buildValidKernelFixture(tmpRoot)
      // Remove the anchors file to simulate the "no anchors" state.
      await rm(path.join(tmpRoot, '.atelier', 'v0', 'anchors', 'source-anchors.ndjson'), {
        force: true,
      })
      process.chdir(tmpRoot)
      const defects: Defect[] = []
      const verified: string[] = []
      const push = (d: Defect) => {
        defects.push(d)
      }
      await checkRelationKernelInvariants(push, verified)
      const ids = defects.map((d) => d.defect_id)
      expect(ids).toContain('indexer:E_NO_SOURCE_ANCHORS')
    } finally {
      await rm(tmpRoot, { recursive: true, force: true })
    }
  })

  test('regression: scaffold-only fixture (no non-contains edges) produces E_NO_ACCEPTED_NON_CONTAINS_RELATION', async () => {
    // Mirror the operation work order's acceptance criterion 6.
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'atelier-no-relations-'))
    try {
      await buildValidKernelFixture(tmpRoot)
      // Replace the edges file with one that has only `contains` edges.
      await writeFile(
        path.join(tmpRoot, '.atelier', 'v0', 'edges', 'edges.ndjson'),
        JSON.stringify({
          id: 'edge:contains:1',
          from: 'src:repo:root',
          to: 'anchor:f00',
          kind: 'contains',
          provenance_kind: 'deterministic_fact',
          source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
          confidence: 'fact',
          status: 'fresh',
          created_at: '2026-06-06T00:00:00.000Z',
        }) + '\n',
        'utf8',
      )
      process.chdir(tmpRoot)
      const defects: Defect[] = []
      const verified: string[] = []
      const push = (d: Defect) => {
        defects.push(d)
      }
      await checkRelationKernelInvariants(push, verified)
      const ids = defects.map((d) => d.defect_id)
      expect(ids).toContain('indexer:E_NO_ACCEPTED_NON_CONTAINS_RELATION')
    } finally {
      await rm(tmpRoot, { recursive: true, force: true })
    }
  })

  test('regression: scaffold-only fixture (no reader proposals) produces E_NO_READER_PROPOSALS', async () => {
    // Mirror the operation work order's acceptance criterion 7.
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'atelier-no-proposals-'))
    try {
      await buildValidKernelFixture(tmpRoot)
      await rm(path.join(tmpRoot, '.atelier', 'v0', 'objects', 'relation-proposals.ndjson'), {
        force: true,
      })
      process.chdir(tmpRoot)
      const defects: Defect[] = []
      const verified: string[] = []
      const push = (d: Defect) => {
        defects.push(d)
      }
      await checkRelationKernelInvariants(push, verified)
      const ids = defects.map((d) => d.defect_id)
      expect(ids).toContain('reader:E_NO_READER_PROPOSALS')
    } finally {
      await rm(tmpRoot, { recursive: true, force: true })
    }
  })

  test('regression: accepted reader relation endpoints do not validate themselves', async () => {
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'atelier-invalid-reader-edge-'))
    try {
      await buildValidKernelFixture(tmpRoot)
      const v0 = path.join(tmpRoot, '.atelier', 'v0')
      await writeFile(
        path.join(v0, 'edges', 'reader-accepted-relations.ndjson'),
        JSON.stringify({
          id: 'edge:reader:bad-endpoint',
          from: 'anchor:f00',
          to: 'anchor:ghost',
          kind: 'references',
          provenance_kind: 'llm_extracted',
          source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
          confidence: 'inferred',
          status: 'fresh',
          created_at: '2026-06-06T00:00:00.000Z',
        }) + '\n',
        'utf8',
      )
      await writeFile(
        path.join(v0, 'objects', 'relation-proposals.ndjson'),
        JSON.stringify({
          schema: 'atelier.relation-proposal/v1',
          proposal_id: 'rp:bad-endpoint',
          proposed_relation: {
            from: 'anchor:f00',
            to: 'anchor:ghost',
            kind: 'references',
          },
          rationale: 'bad endpoint should not be rescued by accepted reader edge endpoints',
          source_anchor_ids: ['anchor:f00', 'anchor:ghost'],
          source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
          confidence: 'inferred',
          status: 'accepted',
          created_at: '2026-06-06T00:00:00.000Z',
        }) + '\n',
        'utf8',
      )
      process.chdir(tmpRoot)
      const defects: Defect[] = []
      const verified: string[] = []
      const push = (d: Defect) => {
        defects.push(d)
      }
      await checkRelationKernelInvariants(push, verified)
      const ids = defects.map((d) => d.defect_id)
      expect(ids).toContain('reader:ARK-P0-002')
      expect(ids).toContain('reader:E_READER_PROPOSAL_UNRESOLVED')
      expect(ids).toContain('reader:E_READER_PROPOSAL_SOURCE_ANCHOR_UNRESOLVED')
    } finally {
      await rm(tmpRoot, { recursive: true, force: true })
    }
  })

  test('regression: ready transformer outputs fail on stale accepted relation ids', async () => {
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'atelier-stale-transform-trace-'))
    try {
      await buildValidKernelFixture(tmpRoot)
      const v0 = path.join(tmpRoot, '.atelier', 'v0')
      await writeFile(
        path.join(v0, 'edges', 'reader-accepted-relations.ndjson'),
        JSON.stringify({
          id: 'edge:reader:stale-relation',
          from: 'anchor:f00',
          to: 'anchor:f01',
          kind: 'references',
          provenance_kind: 'llm_extracted',
          source_refs: [{ path: 'README.md', sha256: 'a'.repeat(64) }],
          confidence: 'inferred',
          status: 'stale',
          created_at: '2026-06-06T00:00:00.000Z',
        }) + '\n',
        'utf8',
      )
      await writeFile(
        path.join(v0, 'transforms', 'md-to-code', 'model', 'implementation-tasks.ndjson'),
        JSON.stringify({
          id: 'task:stale-trace',
          kind: 'implementation_task',
          status: 'ready',
          source_relation_ids: ['edge:reader:stale-relation'],
        }) + '\n',
        'utf8',
      )
      await writeFile(
        path.join(v0, 'transforms', 'md-to-code', 'model', 'test-contracts.ndjson'),
        JSON.stringify({
          id: 'tc:stale-trace',
          kind: 'test_contract',
          status: 'ready',
          source_relation_ids: ['edge:reader:stale-relation'],
        }) + '\n',
        'utf8',
      )
      process.chdir(tmpRoot)
      const defects: Defect[] = []
      const verified: string[] = []
      const push = (d: Defect) => {
        defects.push(d)
      }
      await checkRelationKernelInvariants(push, verified)
      const ids = defects.map((d) => d.defect_id)
      expect(ids).toContain('reader:ARK-P0-002')
      expect(ids).toContain('transformer:ARK-P0-004')
    } finally {
      await rm(tmpRoot, { recursive: true, force: true })
    }
  })

  test('regression: completed packet without evidence raises E_NO_COMPLETED_PACKET_WITH_PROOF', async () => {
    // Mirror the operation work order's acceptance criterion 4:
    // "1 completed packet, 0 passed+proven evidence -> E_NO_COMPLETED_PACKET_WITH_PROOF raised".
    // The valid fixture is used as the base, then the evidence record
    // is removed so the completed packet has no passed+proven
    // evidence. The new high-level defect code MUST fire in
    // addition to the per-packet E_PACKET_COMPLETED_NO_PROOF.
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'atelier-packet-no-proof-'))
    try {
      await buildValidKernelFixture(tmpRoot)
      // Remove the evidence record (and its raw output file) so the
      // completed packet has no passed+proven evidence. The packet
      // itself stays as 'completed' to exercise the new check.
      const v0 = path.join(tmpRoot, '.atelier', 'v0')
      await rm(path.join(v0, 'runs', 'evidence', 'evi:fixture.json'), { force: true })
      await rm(path.join(v0, 'runs', 'evidence', 'raw-output.txt'), { force: true })
      process.chdir(tmpRoot)
      const defects: Defect[] = []
      const verified: string[] = []
      const push = (d: Defect) => {
        defects.push(d)
      }
      await checkEvidenceInvariant(push, verified)
      const ids = defects.map((d) => d.defect_id)
      // The new high-level aggregation defect must fire.
      expect(ids).toContain('executor:E_NO_COMPLETED_PACKET_WITH_PROOF')
      // The per-packet defect must still fire (preserved by
      // the work order).
      expect(ids).toContain('executor:E_PACKET_COMPLETED_NO_PROOF')
      // No evidence is left, so E_EVIDENCE_PASSED_NO_PROOF must
      // not appear.
      expect(ids).not.toContain('executor:E_EVIDENCE_PASSED_NO_PROOF')
      // The verified summary should mention the 0/1 count.
      const summary = verified.find((v) =>
        v.includes('completed packet(s) have passed+proven evidence'),
      )
      expect(summary).toBeDefined()
      expect(summary).toContain('0/1 completed packet(s) have passed+proven evidence')
    } finally {
      await rm(tmpRoot, { recursive: true, force: true })
    }
  })

  test('regression: completed packet with evidence does NOT raise E_NO_COMPLETED_PACKET_WITH_PROOF', async () => {
    // Mirror the operation work order's acceptance criterion 4:
    // "1 completed packet, 1 passed+proven evidence -> invariant passes".
    // The valid fixture is exactly this state: 1 completed packet
    // and 1 passed+proven evidence record. The new defect MUST NOT
    // fire here.
    process.chdir(validRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkEvidenceInvariant(push, verified)
    const ids = defects.map((d) => d.defect_id)
    expect(ids).not.toContain('executor:E_NO_COMPLETED_PACKET_WITH_PROOF')
    expect(ids).not.toContain('executor:E_PACKET_COMPLETED_NO_PROOF')
    expect(ids).not.toContain('executor:E_EVIDENCE_PASSED_NO_PROOF')
    // The verified summary should report 1/1.
    const summary = verified.find((v) =>
      v.includes('completed packet(s) have passed+proven evidence'),
    )
    expect(summary).toBeDefined()
    expect(summary).toContain('1/1 completed packet(s) have passed+proven evidence')
  })

  test('regression: empty fixture (zero packets) does NOT raise E_NO_COMPLETED_PACKET_WITH_PROOF', async () => {
    // Mirror the operation work order's acceptance criterion 4:
    // "0 packets -> invariant passes (no defect)".
    // The empty fixture has the .atelier/v0/{anchors,edges,...}
    // directory tree but no NDJSON files, so there are zero
    // packets on disk. The 0/0 vacuous case is preserved: the
    // new defect MUST NOT fire. The verified summary always
    // reports the 0/0 completed-packets count.
    process.chdir(emptyRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkEvidenceInvariant(push, verified)
    const ids = defects.map((d) => d.defect_id)
    expect(ids).not.toContain('executor:E_NO_COMPLETED_PACKET_WITH_PROOF')
    expect(ids).not.toContain('executor:E_PACKET_COMPLETED_NO_PROOF')
    const summary = verified.find((v) =>
      v.includes('completed packet(s) have passed+proven evidence'),
    )
    expect(summary).toBeDefined()
    expect(summary).toContain('0/0 completed packet(s) have passed+proven evidence')
  })

  test('regression: checkRelationKernelInvariants summary shows 1/1 when one completed packet has proof', async () => {
    // Regression for the misleading-summary bug: the relation-kernel
    // summary's `completed_packets_with_proof: X/Y` line used to
    // hard-code X to 0. The fix passes the count from
    // `checkEvidenceInvariant` (which uses the same
    // `evidenceByContract` index) into the relation-kernel summary
    // so the displayed number matches the strict check.
    //
    // Valid fixture state: 1 completed packet, 1 passed+proven
    // evidence record mapped to its `test_contract_ids`. The summary
    // must therefore report `1/1`.
    process.chdir(validRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    // Run `checkEvidenceInvariant` first so the returned counts
    // reflect the real evidence-by-contract index, then thread the
    // counts into the relation-kernel summary. This mirrors what
    // `runReady` does on the live ready path.
    const counts = await checkEvidenceInvariant(push, verified)
    expect(counts.completedPacketsWithProof).toBe(1)
    expect(counts.totalCompletedPackets).toBe(1)
    await checkRelationKernelInvariants(push, verified, counts)
    const summary = verified.find((v) => v.startsWith('completed_packets_with_proof:'))
    expect(summary).toBeDefined()
    expect(summary).toContain('completed_packets_with_proof: 1/1')
    // Sanity: the displayed number must match the count returned by
    // the evidence-by-contract index (the `completedPacketsWithProof`
    // from `checkEvidenceInvariant`).
    expect(summary).toContain(`${counts.completedPacketsWithProof}/${counts.totalCompletedPackets}`)
  })

  test('regression: checkRelationKernelInvariants summary shows 0/0 when zero completed packets exist', async () => {
    // Regression for the 0/0 vacuous case: a fresh bootstrap with
    // no packets on disk must report `0/0` in the relation-kernel
    // summary, matching the count returned by
    // `checkEvidenceInvariant` against the (empty) evidence-by-contract
    // index. The pre-fix code also reported `0/0` here, but only by
    // accident (the counter was hard-coded). This test pins the
    // correct behaviour.
    process.chdir(emptyRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    const counts = await checkEvidenceInvariant(push, verified)
    expect(counts.completedPacketsWithProof).toBe(0)
    expect(counts.totalCompletedPackets).toBe(0)
    await checkRelationKernelInvariants(push, verified, counts)
    const summary = verified.find((v) => v.startsWith('completed_packets_with_proof:'))
    expect(summary).toBeDefined()
    expect(summary).toContain('completed_packets_with_proof: 0/0')
    expect(summary).toContain(`${counts.completedPacketsWithProof}/${counts.totalCompletedPackets}`)
  })

  test('regression: checkRelationKernelInvariants summary shows 0/1 when one completed packet has no proof', async () => {
    // Regression for the most-egregious case of the bug: a fixture
    // with one completed packet but no passed+proven evidence. The
    // pre-fix summary reported `0/1` only by coincidence (the
    // counter was hard-coded to 0). The fix sources the count from
    // the evidence-by-contract index, so the same 0/1 number is
    // computed deterministically and matches the strict
    // E_PACKET_COMPLETED_NO_PROOF / E_NO_COMPLETED_PACKET_WITH_PROOF
    // verdicts. This test pins that contract.
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'atelier-rk-summary-0-1-'))
    try {
      await buildValidKernelFixture(tmpRoot)
      // Remove the evidence record (and its raw output file) so the
      // completed packet has no passed+proven evidence.
      const v0 = path.join(tmpRoot, '.atelier', 'v0')
      await rm(path.join(v0, 'runs', 'evidence', 'evi:fixture.json'), { force: true })
      await rm(path.join(v0, 'runs', 'evidence', 'raw-output.txt'), { force: true })
      process.chdir(tmpRoot)
      const defects: Defect[] = []
      const verified: string[] = []
      const push = (d: Defect) => {
        defects.push(d)
      }
      const counts = await checkEvidenceInvariant(push, verified)
      // Strict check: 1 completed packet, 0 with proof.
      expect(counts.completedPacketsWithProof).toBe(0)
      expect(counts.totalCompletedPackets).toBe(1)
      const ids = defects.map((d) => d.defect_id)
      expect(ids).toContain('executor:E_NO_COMPLETED_PACKET_WITH_PROOF')
      expect(ids).toContain('executor:E_PACKET_COMPLETED_NO_PROOF')
      await checkRelationKernelInvariants(push, verified, counts)
      const summary = verified.find((v) => v.startsWith('completed_packets_with_proof:'))
      expect(summary).toBeDefined()
      // The summary must report the strict-check count: 0/1.
      expect(summary).toContain('completed_packets_with_proof: 0/1')
      expect(summary).toContain(`${counts.completedPacketsWithProof}/${counts.totalCompletedPackets}`)
    } finally {
      await rm(tmpRoot, { recursive: true, force: true })
    }
  })

  test('regression: checkRelationKernelInvariants default counts remain 0/0 when called without evidenceCounts', async () => {
    // Direct callers (and the operation tests) invoke
    // `checkRelationKernelInvariants` without the `evidenceCounts`
    // argument. The default value (`{0, 0}`) must keep that
    // pre-existing behaviour, so the function remains safe to call
    // in isolation.
    process.chdir(emptyRoot)
    const defects: Defect[] = []
    const verified: string[] = []
    const push = (d: Defect) => {
      defects.push(d)
    }
    await checkRelationKernelInvariants(push, verified)
    const summary = verified.find((v) => v.startsWith('completed_packets_with_proof:'))
    expect(summary).toBeDefined()
    expect(summary).toContain('completed_packets_with_proof: 0/0')
  })
})

// Avoid an unused-import warning for the REPO_ROOT constant; the
// fixture build/empty helpers never reference it directly, but it
// is useful for the consumer of the test file to be able to
// navigate the repo from the test source.
void REPO_ROOT
