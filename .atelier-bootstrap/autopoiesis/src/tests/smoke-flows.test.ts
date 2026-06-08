/**
 * Atelier Autopoiesis — C5/C6 smoke-flow test suite.
 *
 * The suite pins the binding acceptance evidence for the C5/C6
 * smoke flow. There are five named tests:
 *
 *   T1 (negative)  ControlPacket: allowed_operations ∩
 *                  forbidden_operations = ['create'] yields
 *                  E_PACKET_OP_OVERLAP.
 *   T2 (negative)  MaterializationProposal: an affected_decision
 *                  whose lifecycle_state='superseded' yields
 *                  E_MATERIALIZE_DECISION_SUPERSEDED.
 *   T3 (negative)  promote(): an llm_extracted record cannot
 *                  transition to 'accepted' — yields
 *                  E_PROMOTION_LLM_DIRECT_ACCEPT.
 *   T4 (negative)  promote(): missing evidence_refs on a
 *                  transition to 'accepted' yields
 *                  E_PROMOTION_MISSING_EVIDENCE.
 *   T5 (positive)  end-to-end: packet:create → packet:validate
 *                  → materialize:create → materialize:validate
 *                  all exit 0 / emit no defects.
 *
 * Tests 1, 3, and 4 use the library entry points directly. Test
 * 2 uses the disk-backed `validateProposal()` (the validator
 * reads the proposal by id from `materialization-proposals.ndjson`)
 * and threads a pre-loaded `semanticNodes` map. Test 5 uses a
 * per-test fixture: an implementation task, source anchors, a
 * check_result, a requirement, a decision, and a pre-promoted
 * proposal.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { createControlPacket } from '../lib/packet.ts'
import { validateControlPacket } from '../lib/packet-validate.ts'
import { createProposal, validateProposal } from '../lib/materialize.ts'
import { promote } from '../commands/promote.ts'
import { appendNdjsonAutopoiesis, writeNdjsonAutopoiesis } from '../lib/store.ts'
import { AUTOPOIESIS_PATHS } from '../lib/paths.ts'
import type {
  AuthorityScope,
  ControlPacket,
  LifecycleState,
  MaterializationProposal,
  SemanticNode,
  SourceAnchorRef,
} from '../lib/records.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

const ORIGINAL_CWD = process.cwd()
let FIXTURE_ROOT: string
const ANCHORS_FILE = () => path.join(FIXTURE_ROOT, '.atelier', 'v0', 'anchors', 'source-anchors.ndjson')
const TRANSFORMER_DIR = () =>
  path.join(FIXTURE_ROOT, '.atelier', 'v0', 'transforms', 'md-to-code', 'model')

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-smoke-'))
  await mkdir(path.dirname(ANCHORS_FILE()), { recursive: true })
  await mkdir(TRANSFORMER_DIR(), { recursive: true })
  process.chdir(FIXTURE_ROOT)
})

afterAll(async () => {
  process.chdir(ORIGINAL_CWD)
  await rm(FIXTURE_ROOT, { recursive: true, force: true })
})

beforeEach(async () => {
  // Wipe the autopoiesis ledgers between tests.
  for (const file of [
    AUTOPOIESIS_PATHS.semanticNodes,
    AUTOPOIESIS_PATHS.promotionDecisions,
    AUTOPOIESIS_PATHS.stalenessRecords,
    AUTOPOIESIS_PATHS.conflictRecords,
    AUTOPOIESIS_PATHS.authorityRules,
    AUTOPOIESIS_PATHS.controlPackets,
    AUTOPOIESIS_PATHS.materializationProposals,
    AUTOPOIESIS_PATHS.materializationReports,
    AUTOPOIESIS_PATHS.handoffs,
    ANCHORS_FILE(),
    path.join(TRANSFORMER_DIR(), 'implementation-tasks.ndjson'),
  ]) {
    await rm(file, { force: true })
  }
})

/* -------------------------------------------------------------------------- */
/*                               Test helpers                                 */
/* -------------------------------------------------------------------------- */

async function writeAnchor(anchor: {
  id: string
  status: string
  path: string
  content_hash?: string
}): Promise<void> {
  const hash = anchor.content_hash ?? 'a'.repeat(64)
  await writeFile(
    ANCHORS_FILE(),
    JSON.stringify({
      id: anchor.id,
      kind: 'file',
      path: anchor.path,
      start_line: 1,
      end_line: 10,
      content_hash: hash,
      selector_strategy: 'path',
      produced_by: 'indexer',
      provenance_kind: 'deterministic_fact',
      confidence: 'fact',
      status: anchor.status,
      source_refs: [{ path: anchor.path, sha256: hash }],
      created_at: '2026-06-07T00:00:00Z',
    }) + '\n',
    'utf8',
  )
}

async function writeTask(task: {
  id: string
  status: string
  allowed_files: string[]
  forbidden_files: string[]
  source_anchor_ids?: string[]
}): Promise<void> {
  const file = path.join(TRANSFORMER_DIR(), 'implementation-tasks.ndjson')
  const row = {
    id: task.id,
    kind: 'implementation_task',
    version: '1',
    status: task.status,
    title: task.id,
    body_ref: file,
    source_anchor_ids: task.source_anchor_ids ?? [],
    source_object_ids: [],
    allowed_files: task.allowed_files,
    forbidden_files: task.forbidden_files,
    created_at: '2026-06-07T00:00:00Z',
  }
  await writeFile(file, JSON.stringify(row) + '\n', 'utf8')
}

function makeAnchorRef(anchorId: string, filePath: string): SourceAnchorRef {
  return {
    anchor_id: anchorId,
    path: filePath,
    start_line: 1,
    end_line: 10,
    sha256: 'a'.repeat(64),
  }
}

function makeScope(kind: 'path' | 'task' | 'global', pattern?: string, taskId?: string): AuthorityScope {
  if (kind === 'path') return { kind: 'path', pattern: pattern ?? '**' }
  if (kind === 'task') return { kind: 'task', task_id: taskId ?? 'task:smoke-autopoiesis' }
  return { kind: 'global' }
}

function makeSemanticNode(overrides: Partial<SemanticNode> & Pick<SemanticNode, 'id' | 'kind'>): SemanticNode {
  return {
    schema: 'atelier.semantic-node/v1',
    lifecycle_state: 'accepted' as LifecycleState,
    authority_scope: makeScope('path', '.atelier-bootstrap/autopoiesis/**'),
    source_anchors: [makeAnchorRef('anchor:smoke-records', '.atelier-bootstrap/autopoiesis/src/lib/records.ts')],
    provenance_kind: 'deterministic_fact',
    produced_by: 'smoke-test',
    created_at: '2026-06-07T00:00:00Z',
    ...overrides,
  } as SemanticNode
}

/* -------------------------------------------------------------------------- */
/*                              T1 — E_PACKET_OP_OVERLAP                       */
/* -------------------------------------------------------------------------- */

describe('C5 smoke: T1 packet op-overlap', () => {
  test('a packet with allowed_operations ∩ forbidden_operations = [create] yields E_PACKET_OP_OVERLAP', async () => {
    const packet: ControlPacket = {
      schema: 'atelier.control-packet/v1',
      id: 'pkt:test-op-overlap',
      task: 'task:test',
      lifecycle_state: 'observed',
      authority_scope: makeScope('task', undefined, 'task:test'),
      source_anchors: [makeAnchorRef('anchor:smoke-records', '.atelier-bootstrap/autopoiesis/src/lib/records.ts')],
      evidence_anchors: [],
      provenance_kind: 'deterministic_fact',
      produced_by: 'smoke-test',
      created_at: '2026-06-07T00:00:00Z',
      generated_at: '2026-06-07T00:00:00Z',
      active_requirements: [],
      accepted_decisions: [],
      // The injected overlap: 'create' appears on both sides.
      allowed_operations: ['create', 'modify'],
      forbidden_operations: ['create', 'delete'],
      required_checks: [],
      open_findings: [],
      stale_artifacts: [],
      conflicts: [],
      evidence_anchors_list: [],
      materialization_rules: [],
      status: 'valid',
      defects: [],
    }

    const result = await validateControlPacket(packet.id, { packet })
    expect(result.ok).toBe(false)
    const codes = result.defects.map((d) => d.code)
    expect(codes).toContain('E_PACKET_OP_OVERLAP')
  })
})

/* -------------------------------------------------------------------------- */
/*                   T2 — E_MATERIALIZE_DECISION_SUPERSEDED                   */
/* -------------------------------------------------------------------------- */

describe('C6 smoke: T2 materialize decision-superseded', () => {
  test('a proposal whose affected_decision references a superseded decision yields E_MATERIALIZE_DECISION_SUPERSEDED', async () => {
    // Seed the disk: an implementation task, a source anchor, the
    // proposal we want to validate, and a superseded decision
    // semantic-node. validateProposal reads the proposal from
    // disk by id and consumes the `semanticNodes` opt for the
    // rest of the index.
    await writeAnchor({
      id: 'anchor:smoke-records',
      status: 'fresh',
      path: '.atelier-bootstrap/autopoiesis/src/lib/records.ts',
    })
    await writeTask({
      id: 'task:smoke-autopoiesis',
      status: 'ready',
      allowed_files: ['.atelier-bootstrap/autopoiesis/**'],
      forbidden_files: ['harness/atelier-autopoiesis/**'],
    })

    // Pre-promoted proposal (lifecycle_state='accepted') so the
    // gate can reach the affected_decisions check. The proposal
    // references the superseded decision.
    const proposal: MaterializationProposal = {
      schema: 'atelier.materialization-proposal/v1',
      id: 'prop:test-superseded',
      task_id: 'task:smoke-autopoiesis',
      lifecycle_state: 'accepted',
      authority_scope: makeScope('task', undefined, 'task:smoke-autopoiesis'),
      source_anchors: [],
      evidence_anchors: [],
      owner_or_policy: 'atelier:smoke',
      provenance_kind: 'deterministic_fact',
      produced_by: 'smoke-test',
      created_at: '2026-06-07T00:00:00Z',
      affected_requirements: [],
      affected_findings: [],
      affected_decisions: ['dec:smoke-superseded'],
      required_checks: [],
      diff_refs: [{ path: '.atelier-bootstrap/autopoiesis/src/lib/records.ts', kind: 'modify' }],
      allowed_files: ['.atelier-bootstrap/autopoiesis/**'],
      forbidden_files: ['harness/atelier-autopoiesis/**'],
      status: 'proposed',
      defects: [],
    }
    await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.materializationProposals, proposal)

    const semanticNodes: SemanticNode[] = [
      makeSemanticNode({
        id: 'dec:smoke-superseded',
        kind: 'decision',
        lifecycle_state: 'superseded',
      }),
    ]

    const result = await validateProposal('prop:test-superseded', { semanticNodes })
    expect(result.report.status).toBe('rejected')
    const codes = result.report.defects.map((d) => d.code)
    expect(codes).toContain('E_MATERIALIZE_DECISION_SUPERSEDED')
  })
})

/* -------------------------------------------------------------------------- */
/*                       T3 — E_PROMOTION_LLM_DIRECT_ACCEPT                   */
/* -------------------------------------------------------------------------- */

describe('C2 smoke: T3 promote llm-direct-accept', () => {
  test('a promote on an llm_extracted record yields E_PROMOTION_LLM_DIRECT_ACCEPT', async () => {
    const node = makeSemanticNode({
      id: 'node:llm-extracted',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      provenance_kind: 'llm_extracted',
    })
    const r = await promote('node:llm-extracted', 'accepted', {
      semanticNodes: [node],
      evidenceRefs: ['a:1'],
      ownerOrPolicy: 'policy:1',
      persist: false,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('E_PROMOTION_LLM_DIRECT_ACCEPT')
    }
  })
})

/* -------------------------------------------------------------------------- */
/*                       T4 — E_PROMOTION_MISSING_EVIDENCE                   */
/* -------------------------------------------------------------------------- */

describe('C2 smoke: T4 promote missing-evidence', () => {
  test('a promote to accepted without evidence_refs yields E_PROMOTION_MISSING_EVIDENCE', async () => {
    const node = makeSemanticNode({
      id: 'node:deterministic',
      kind: 'requirement',
      lifecycle_state: 'proposed',
      provenance_kind: 'deterministic_fact',
    })
    const r = await promote('node:deterministic', 'accepted', {
      semanticNodes: [node],
      // No evidenceRefs.
      ownerOrPolicy: 'policy:1',
      persist: false,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('E_PROMOTION_MISSING_EVIDENCE')
    }
  })
})

/* -------------------------------------------------------------------------- */
/*                   T5 — positive end-to-end (per-test fixture)              */
/* -------------------------------------------------------------------------- */

describe('C5/C6 smoke: T5 positive end-to-end', () => {
  test('packet:create -> packet:validate -> materialize:create -> materialize:validate all pass', async () => {
    // Seed: a real source anchor, a fresh implementation task,
    // a check_result, a requirement, a decision, and a
    // PromotionDecision for the check_result (to_state=verified).
    const anchorId = 'anchor:smoke-records'
    const filePath = '.atelier-bootstrap/autopoiesis/src/lib/records.ts'
    await writeAnchor({ id: anchorId, status: 'fresh', path: filePath })
    await writeTask({
      id: 'task:smoke-autopoiesis',
      status: 'ready',
      // Keep `forbidden_files` empty: the packet generator
      // derives `['create','modify','delete', ...files]` from
      // BOTH lists, so any non-empty forbidden set always
      // overlaps the allowed set. Empty forbidden set is the
      // only path through the E_PACKET_OP_OVERLAP gate.
      allowed_files: ['.atelier-bootstrap/autopoiesis/**'],
      forbidden_files: [],
      source_anchor_ids: [anchorId],
    })

    // Seed semantic-nodes: a check_result, a requirement, a
    // decision, all of which live in lifecycle_state required
    // by the gate.
    const checkNode = makeSemanticNode({
      id: 'check:smoke-1',
      kind: 'check_result',
      lifecycle_state: 'verified',
      source_anchors: [makeAnchorRef(anchorId, filePath)],
    })
    ;(checkNode as SemanticNode & { status?: string; evidence_proof?: unknown }).status = 'passed'
    ;(checkNode as SemanticNode & { status?: string; evidence_proof?: unknown }).evidence_proof = {
      raw_output_ref: 'atelier:smoke/raw:1',
    }

    const reqNode = makeSemanticNode({
      id: 'req:smoke-1',
      kind: 'requirement',
      lifecycle_state: 'accepted',
      source_anchors: [makeAnchorRef(anchorId, filePath)],
    })

    const decNode = makeSemanticNode({
      id: 'dec:smoke-1',
      kind: 'decision',
      lifecycle_state: 'accepted',
      source_anchors: [makeAnchorRef(anchorId, filePath)],
    })

    await writeNdjsonAutopoiesis<SemanticNode>(AUTOPOIESIS_PATHS.semanticNodes, [
      checkNode,
      reqNode,
      decNode,
    ])

    // PromotionDecision for the check_result: to_state=verified.
    await appendNdjsonAutopoiesis(AUTOPOIESIS_PATHS.promotionDecisions, {
      schema: 'atelier.promotion-decision/v1',
      id: 'pd:smoke-check-1',
      subject_id: 'check:smoke-1',
      from_state: 'accepted',
      to_state: 'verified',
      decision: 'accepted',
      required_checks: [],
      evidence_refs: ['a:smoke-check-1'],
      decided_by: 'atelier-autopoiesis-implementer',
      decided_at: '2026-06-07T00:00:00Z',
      created_at: '2026-06-07T00:00:00Z',
    })

    // Step 1: packet:create
    const packetResult = await createControlPacket('task:smoke-autopoiesis', {
      producedBy: 'atelier:smoke:test',
    })
    expect(packetResult.ok).toBe(true)
    if (!packetResult.ok) return
    const packet = packetResult.packet

    // Step 2: packet:validate — re-load semantic-nodes from disk
    // so the validator sees the freshly written check_result
    // (createControlPacket already wrote the packet).
    const validateResult = await validateControlPacket(packet.id)
    if (!validateResult.ok) {
      throw new Error(
        `packet:validate defects: ${JSON.stringify(validateResult.defects, null, 2)}`,
      )
    }
    expect(validateResult.ok).toBe(true)

    // Step 3: materialize:create produces a proposal with
    // lifecycle_state='observed' (the gate's first check
    // requires 'accepted'). The transition table requires a
    // multi-step promotion (observed -> inferred -> proposed
    // -> accepted); for the positive end-to-end test we go
    // through that chain in one call.
    const proposalResult = await createProposal('task:smoke-autopoiesis', {
      taskId: 'task:smoke-autopoiesis',
      // diffRef is the path that ends up in
      // `diff_refs[0].path`; the gate requires it to be in
      // allowed_files. Pass a real file path so the gate
      // passes.
      diffRef: '.atelier-bootstrap/autopoiesis/src/lib/records.ts',
      affectedRequirements: ['req:smoke-1'],
      affectedDecisions: ['dec:smoke-1'],
      requiredChecks: ['check:smoke-1'],
      allowedFiles: ['.atelier-bootstrap/autopoiesis/**'],
      forbiddenFiles: [],
    })
    expect(proposalResult.ok).toBe(true)
    if (!proposalResult.ok) return
    const proposal = proposalResult.proposal

    // Walk the lifecycle chain: observed -> inferred ->
    // proposed -> accepted. The proposal's provenance_kind is
    // 'derived' which is not in LLM_PROVENANCE_KINDS, so the
    // policy permits the move.
    const { transition } = await import('../lib/lifecycle.ts')
    let state: LifecycleState = proposal.lifecycle_state
    const chain: LifecycleState[] = ['inferred', 'proposed', 'accepted']
    for (const next of chain) {
      const step = transition(state, next, {
        provenance: proposal.provenance_kind,
        evidence_refs: ['atelier.materialize.gate'],
        owner_or_policy: proposal.owner_or_policy ?? 'atelier-autopoiesis-implementer',
        authority_scope: proposal.authority_scope,
      })
      expect(step.ok).toBe(true)
      if (!step.ok) return
      state = next
    }

    // Persist the promoted proposal (lifecycle_state=accepted)
    // so validateProposal sees the new state.
    await writeNdjsonAutopoiesis<MaterializationProposal>(
      AUTOPOIESIS_PATHS.materializationProposals,
      [{ ...proposal, lifecycle_state: 'accepted' as LifecycleState }],
    )

    // Step 4: materialize:validate
    const materializeResult = await validateProposal(proposal.id)
    if (materializeResult.report.status !== 'validated') {
      throw new Error(
        `materialize:validate defects: ${JSON.stringify(materializeResult.report.defects, null, 2)}`,
      )
    }
    expect(materializeResult.report.status).toBe('validated')
    expect(materializeResult.report.defects.length).toBe(0)
  })
})
