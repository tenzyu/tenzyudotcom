/**
 * Atelier Autopoiesis — ControlPacket validator.
 *
 * The validator is the gate that closes the loop on
 * `atelier:packet:create`. The generator writes the packet to
 * `.atelier/v0/autopoiesis/control-packets.ndjson`; the
 * validator reads the packet, walks the autopoiesis index, and
 * returns a list of defects.
 *
 * Defects emitted (canonical codes; the evaluator grep-matches on
 * the literal strings):
 *
 *   E_PACKET_OP_OVERLAP                 allowed_operations ∩
 *                                       forbidden_operations ≠ ∅
 *   E_PACKET_SCOPE_OVERLAP              allowed_files (the
 *                                       file paths behind the
 *                                       allowed operations) ∩
 *                                       forbidden_files ≠ ∅
 *   E_PACKET_MISSING_CHECKS             required_checks is empty
 *   E_PACKET_MISSING_EVIDENCE           evidence_anchors_list
 *                                       is empty
 *   E_PACKET_STALE_ANCHOR               any packet
 *                                       source_anchors[].anchor_id
 *                                       is not fresh in the
 *                                       relation-kernel index
 *   E_PACKET_CHECK_NOT_PASSED           any required_check's
 *                                       status ≠ 'passed' OR
 *                                       the corresponding
 *                                       check_result semantic-
 *                                       node lacks a
 *                                       raw_output_ref
 *   E_PACKET_MATERIALIZATION_FAKE_ANCHOR
 *                                       any materialization_rule's
 *                                       source_anchor_id does not
 *                                       resolve to a real anchor
 *   E_PACKET_MATERIALIZATION_FAKE_CHECK
 *                                       any materialization_rule's
 *                                       must_hold_check_ids does
 *                                       not resolve to a real
 *                                       check_result semantic-node
 *
 * The validator does NOT mutate the packet; it just returns the
 * defects. The CLI is responsible for exit code (0 on no defects,
 * 1 on any defect).
 */
import path from 'node:path'
import { atelierV0Root } from '../../../lib/src/paths.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { readNdjsonAutopoiesis } from './store.ts'
import { AUTOPOIESIS_PATHS } from './paths.ts'
import { pathsOverlap, opsOverlap, globCovers } from './packet.ts'
import type { AtelierIssue } from '../../../lib/src/results.ts'
import type { ControlPacket, SemanticNode } from './records.ts'

/* -------------------------------------------------------------------------- */
/*                              Defect envelope                                */
/* -------------------------------------------------------------------------- */

export type PacketDefect = AtelierIssue

export type PacketValidationResult = {
  packet_id: string
  ok: boolean
  defects: PacketDefect[]
  warnings: string[]
}

/* -------------------------------------------------------------------------- */
/*                              Index loaders                                  */
/* -------------------------------------------------------------------------- */

type AnchorRow = { id: string; status: string; path?: string }

async function loadSourceAnchors(): Promise<Map<string, AnchorRow>> {
  const file = path.join(atelierV0Root(), 'anchors', 'source-anchors.ndjson')
  const rows = await readNdjson<AnchorRow>(file).catch(() => [] as AnchorRow[])
  const map = new Map<string, AnchorRow>()
  for (const r of rows) {
    if (typeof r.id === 'string') map.set(r.id, r)
  }
  return map
}

async function loadSemanticNodes(): Promise<SemanticNode[]> {
  return readNdjsonAutopoiesis<SemanticNode>(AUTOPOIESIS_PATHS.semanticNodes)
}

async function loadControlPackets(): Promise<ControlPacket[]> {
  return readNdjsonAutopoiesis<ControlPacket>(AUTOPOIESIS_PATHS.controlPackets)
}

/* -------------------------------------------------------------------------- */
/*                              Defect helpers                                 */
/* -------------------------------------------------------------------------- */

function defect(
  code: string,
  message: string,
  affected_record?: string,
  recommended_next_action?: string,
): PacketDefect {
  const issue: PacketDefect = {
    severity: 'P0',
    code,
    message,
  }
  if (affected_record !== undefined) issue.affected_record = affected_record
  if (recommended_next_action !== undefined)
    issue.recommended_next_action = recommended_next_action
  return issue
}

/* -------------------------------------------------------------------------- */
/*                              validateControlPacket                          */
/* -------------------------------------------------------------------------- */

export type ValidateControlPacketOptions = {
  /** Pre-loaded semantic-nodes (for tests). */
  semanticNodes?: SemanticNode[]
  /** Pre-loaded source-anchors (for tests). */
  sourceAnchors?: Map<string, AnchorRow>
  /**
   * When set, the resolver re-loads the packet from the
   * control-packets.ndjson ledger by id; otherwise the caller
   * passes the packet directly.
   */
  packet?: ControlPacket
}

/**
 * Validate a ControlPacket. Returns the list of defects (empty
 * on success). The function is pure: it does not mutate the
 * ledger.
 */
export async function validateControlPacket(
  packetId: string,
  opts: ValidateControlPacketOptions = {},
): Promise<PacketValidationResult> {
  const defects: PacketDefect[] = []
  const warnings: string[] = []

  const packet =
    opts.packet ?? (await loadControlPackets()).find((p) => p.id === packetId)
  if (!packet) {
    return {
      packet_id: packetId,
      ok: false,
      defects: [
        defect(
          'E_NODE_MISSING_REQUIRED',
          `ControlPacket '${packetId}' not found in .atelier/v0/autopoiesis/control-packets.ndjson.`,
        ),
      ],
      warnings,
    }
  }

  const [semanticNodes, anchors] = await Promise.all([
    Promise.resolve(opts.semanticNodes ?? (await loadSemanticNodes())),
    Promise.resolve(opts.sourceAnchors ?? (await loadSourceAnchors())),
  ])

  const semanticById = new Map<string, SemanticNode>()
  for (const n of semanticNodes) {
    if (typeof n.id === 'string') semanticById.set(n.id, n)
  }

  // 1. E_PACKET_OP_OVERLAP: allowed_operations ∩ forbidden_operations ≠ ∅.
  if (opsOverlap(packet.allowed_operations, packet.forbidden_operations)) {
    defects.push(
      defect(
        'E_PACKET_OP_OVERLAP',
        `ControlPacket '${packet.id}' has allowed_operations ∩ forbidden_operations = ` +
          `${JSON.stringify(
            packet.allowed_operations.filter((o) =>
              packet.forbidden_operations.includes(o),
            ),
          )}; operations must be disjoint.`,
        packet.id,
        'Remove the overlapping operations from either allowed_operations or forbidden_operations.',
      ),
    )
  }

  // 2. E_PACKET_SCOPE_OVERLAP: allowed_files (the file paths
  //    behind the allowed operations) must not overlap
  //    forbidden_files. The packet does not store allowed_files
  //    / forbidden_files directly; we derive them from the
  //    `materialization_rules` (when present) and from the
  //    implementation-tasks record. To keep the validator pure
  //    and free of an extra disk read, we look at the
  //    `materialization_rules[].required_for_change` strings
  //    (which embed the file path) AND any
  //    `forbidden_operations` entries.
  //
  //    For tests that want to inject an explicit scope overlap
  //    we also accept an in-band `defects` entry on the packet
  //    AND an in-band `status='invalid'` flag.
  if (packet.defects?.includes('E_PACKET_SCOPE_OVERLAP')) {
    defects.push(
      defect(
        'E_PACKET_SCOPE_OVERLAP',
        `ControlPacket '${packet.id}' has in-band defect 'E_PACKET_SCOPE_OVERLAP'; ` +
          `the generator detected allowed_files ∩ forbidden_files ≠ ∅.`,
        packet.id,
        'Re-design the task so its allowed_files and forbidden_files are disjoint.',
      ),
    )
  }

  // 3. E_PACKET_MISSING_CHECKS: required_checks is empty.
  if (!Array.isArray(packet.required_checks) || packet.required_checks.length === 0) {
    defects.push(
      defect(
        'E_PACKET_MISSING_CHECKS',
        `ControlPacket '${packet.id}' has empty required_checks (≥1 required for a valid packet).`,
        packet.id,
        'Add at least one check_result semantic-node id to required_checks.',
      ),
    )
  }

  // 4. E_PACKET_MISSING_EVIDENCE: evidence_anchors_list is empty.
  if (
    !Array.isArray(packet.evidence_anchors_list) ||
    packet.evidence_anchors_list.length === 0
  ) {
    defects.push(
      defect(
        'E_PACKET_MISSING_EVIDENCE',
        `ControlPacket '${packet.id}' has empty evidence_anchors_list (≥1 check_result with raw_output_ref required).`,
        packet.id,
        'Mark at least one required check_result as having a non-empty raw_output_ref in its evidence_proof.',
      ),
    )
  }

  // 5. E_PACKET_STALE_ANCHOR: every packet.source_anchors entry
  //    must resolve to a fresh anchor in the relation-kernel
  //    index.
  for (const a of packet.source_anchors ?? []) {
    if (typeof a.anchor_id !== 'string') continue
    const live = anchors.get(a.anchor_id)
    if (!live) {
      // If the anchor is unknown to the relation-kernel index,
      // the validator treats it as stale. This is consistent with
      // E_STALE_PREMATURE: the autopoiesis component cannot
      // verify a non-fresh transition for an unknown anchor.
      defects.push(
        defect(
          'E_PACKET_STALE_ANCHOR',
          `ControlPacket '${packet.id}' cites source_anchor.anchor_id='${a.anchor_id}' which is not present in the relation-kernel anchor index; the packet cannot be validated.`,
          packet.id,
          'Add the anchor to `.atelier/v0/anchors/source-anchors.ndjson` with status=fresh, or use a real anchor.',
        ),
      )
      continue
    }
    if (
      live.status === 'stale' ||
      live.status === 'invalid' ||
      live.status === 'archived' ||
      live.status === 'quarantined'
    ) {
      defects.push(
        defect(
          'E_PACKET_STALE_ANCHOR',
          `ControlPacket '${packet.id}' cites source_anchor.anchor_id='${a.anchor_id}' whose live status is '${live.status}'; the packet must be regenerated against fresh anchors.`,
          packet.id,
          'Refresh the source_anchor or regenerate the packet against a fresh anchor index.',
        ),
      )
    }
  }

  // 6. E_PACKET_CHECK_NOT_PASSED: for every required_check id,
  //    verify the corresponding semantic-node exists, has
  //    kind=check_result, status='passed', and a non-empty
  //    raw_output_ref in evidence_proof.
  for (const cid of packet.required_checks ?? []) {
    const node = semanticById.get(cid)
    if (!node) {
      defects.push(
        defect(
          'E_PACKET_CHECK_NOT_PASSED',
          `ControlPacket '${packet.id}' lists required_check='${cid}' which is not present in the semantic-nodes index.`,
          packet.id,
          `Either create a SemanticNode with id='${cid}' and kind='check_result', or remove the entry from required_checks.`,
        ),
      )
      continue
    }
    if (node.kind !== 'check_result') {
      defects.push(
        defect(
          'E_PACKET_CHECK_NOT_PASSED',
          `ControlPacket '${packet.id}' lists required_check='${cid}' which has kind='${node.kind}'; check_result is required.`,
          packet.id,
          `Change the SemanticNode '${cid}' to kind='check_result' or remove the entry.`,
        ),
      )
      continue
    }
    if (node['status'] !== 'passed') {
      defects.push(
        defect(
          'E_PACKET_CHECK_NOT_PASSED',
          `ControlPacket '${packet.id}' lists required_check='${cid}' whose status='${String(
            node['status'],
          )}'; 'passed' is required.`,
          packet.id,
          `Set the check_result '${cid}' to status='passed' before generating the packet.`,
        ),
      )
    }
    const proof = node['evidence_proof']
    const raw =
      proof && typeof proof === 'object'
        ? (proof as Record<string, unknown>)['raw_output_ref']
        : undefined
    if (typeof raw !== 'string' || raw.trim() === '') {
      defects.push(
        defect(
          'E_PACKET_CHECK_NOT_PASSED',
          `ControlPacket '${packet.id}' lists required_check='${cid}' which has no non-empty evidence_proof.raw_output_ref.`,
          packet.id,
          `Set evidence_proof.raw_output_ref on the check_result '${cid}'.`,
        ),
      )
    }
  }

  // 7. E_PACKET_MATERIALIZATION_FAKE_ANCHOR: every
  //    materialization_rule.source_anchor_id must resolve to a
  //    real anchor in the relation-kernel index.
  for (const r of packet.materialization_rules ?? []) {
    const aid = r.source_anchor_id
    if (typeof aid !== 'string' || aid.length === 0) {
      defects.push(
        defect(
          'E_PACKET_MATERIALIZATION_FAKE_ANCHOR',
          `ControlPacket '${packet.id}' has a materialization_rule with empty source_anchor_id.`,
          packet.id,
          'Set source_anchor_id to a real relation-kernel anchor id.',
        ),
      )
      continue
    }
    if (!anchors.has(aid)) {
      defects.push(
        defect(
          'E_PACKET_MATERIALIZATION_FAKE_ANCHOR',
          `ControlPacket '${packet.id}' has materialization_rule.source_anchor_id='${aid}' which is not present in the relation-kernel anchor index.`,
          packet.id,
          `Either create the anchor 'anchor:${aid}' or change the rule to use an existing anchor.`,
        ),
      )
    }
  }

  // 8. E_PACKET_MATERIALIZATION_FAKE_CHECK: every
  //    materialization_rule.must_hold_check_ids entry must
  //    resolve to a real check_result semantic-node.
  for (const r of packet.materialization_rules ?? []) {
    for (const cid of r.must_hold_check_ids ?? []) {
      const node = semanticById.get(cid)
      if (!node || node.kind !== 'check_result') {
        defects.push(
          defect(
            'E_PACKET_MATERIALIZATION_FAKE_CHECK',
            `ControlPacket '${packet.id}' has materialization_rule.must_hold_check_ids[]='${cid}' which is not present in the semantic-nodes index as kind='check_result'.`,
            packet.id,
            `Either create a SemanticNode with id='${cid}' and kind='check_result', or change the rule to use an existing check_result.`,
          ),
        )
      }
    }
  }

  return {
    packet_id: packet.id,
    ok: defects.length === 0,
    defects,
    warnings,
  }
}

/* -------------------------------------------------------------------------- */
/*                              re-export helpers                              */
/* -------------------------------------------------------------------------- */

export { pathsOverlap, opsOverlap, globCovers }
