import { createHash } from 'node:crypto'
import { sha256OfString } from './hash'

/**
 * Build a deterministic id from a stable key.
 *
 * Atelier ids are prefixed by the object kind, for example:
 *   - `src:abc...`     for SourceUnit
 *   - `fact:abc...`    for SourceFact
 *   - `edge:abc...`    for AtelierEdge
 *   - `ko:abc...`      for KnowledgeObject
 *   - `sc:abc...`      for SemanticClaim
 *   - `att:abc...`     for AttentionSet
 *   - `task:abc...`    for ImplementationTask
 *   - `tc:abc...`      for TestContract
 *   - `eb:abc...`      for EditBoundary
 *   - `pt:abc...`      for PacketTemplate
 *   - `rec:abc...`     for TransformRecommendation
 *   - `pkt:abc...`     for ExecutionPacket
 *   - `evi:abc...`     for EvidenceRecord
 *   - `blk:abc...`     for Blocker
 *
 * The hash is sha256 over a stable serialized form, truncated to 16 hex chars.
 */
export function deterministicId(prefix: string, key: string): string {
  const hash = createHash('sha256').update(`${prefix}|${key}`, 'utf8').digest('hex').slice(0, 16)
  return `${prefix}:${hash}`
}

/**
 * Build a short random id with a given prefix, suitable for events and ledgers.
 *
 * This is not deterministic; it is only used when no stable content is available.
 */
export function randomId(prefix: string): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return `${prefix}:${hex}`
}

/**
 * Build a short hash of a content payload, useful for naming packet files.
 */
export function shortHash(value: string): string {
  return sha256OfString(value).slice(0, 12)
}
