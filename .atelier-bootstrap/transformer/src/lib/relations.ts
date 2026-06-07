/**
 * Accepted-relation loading and projection for the transformer.
 *
 * The transformer is the *consumer* of the accepted relation graph.
 * The reader is the *producer*: it emits `RelationProposal` records
 * which the reader (or a human reviewer) accepts and writes to
 * `.atelier/v0/edges/reader-accepted-relations.ndjson` (one edge per
 * line, in the same `AtelierEdge` shape used by the indexer's
 * `edges.ndjson`).
 *
 * This module is the ONLY place the transformer touches accepted
 * relations. Every other transformer module calls
 * `loadAcceptedRelations()` to read the merged set.
 */
import { readNdjson } from '../../../lib/src/ndjson.ts'
import {
  type AtelierEdge,
  type AtelierObjectBase,
  type SourceAnchor,
  type SourceUnit,
  INDEXER_PATHS,
  READER_PATHS,
} from '../../../lib/src/index.ts'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type { AtelierEdge } from '../../../lib/src/index.ts'

/**
 * Path to the reader-owned accepted-relation file. The reader workstream
 * is the sole writer of this file; the transformer only reads it.
 *
 * This path is intentionally NOT in the shared `paths.ts` because
 * ownership is reader-specific.
 */
export function readerAcceptedRelationsPath(): string {
  return path.join(path.dirname(INDEXER_PATHS.edges), 'reader-accepted-relations.ndjson')
}

/**
 * The set of relation kinds the transformer treats as *accepted*
 * (i.e. meaningful for task / contract / packet projection).
 *
 * `contains` is explicitly excluded: it is the indexer's structural
 * edge and the Relation Kernel invariant forbids using it as
 * operational proof.
 */
export const ACCEPTED_RELATION_KINDS: ReadonlySet<AtelierEdge['kind']> = new Set<AtelierEdge['kind']>([
  'defines',
  'references',
  'depends_on',
  'supports',
  'constrains',
  'verifies',
  'satisfies',
])

export type AcceptedRelationInvalidReason =
  | 'missing-id'
  | 'duplicate-id'
  | 'unaccepted-kind'
  | 'not-current'
  | 'missing-endpoint'
  | 'unresolved-from'
  | 'unresolved-to'
  | 'stale-from'
  | 'stale-to'

export interface InvalidAcceptedRelation {
  id: string
  reason: AcceptedRelationInvalidReason
  message: string
  relation: AtelierEdge
}

export interface AcceptedRelationsDetailed {
  relations: AtelierEdge[]
  invalid: InvalidAcceptedRelation[]
  raw_relations: AtelierEdge[]
  endpoint_count: number
}

type RelationEndpoint = {
  id: string
  status?: string
  path?: string
}

/**
 * Load the merged accepted-relation set.
 *
 * Reads:
 *   - `.atelier/v0/edges/edges.ndjson` (indexer edges)
 *   - `.atelier/v0/edges/reader-accepted-relations.ndjson` (reader edges)
 *
 * Both are read; their union is deduped by edge id; only edges whose
 * `kind` is in `ACCEPTED_RELATION_KINDS` are returned. Missing files
 * produce empty lists (never an error) so the transformer remains
 * backward-compatible with snapshots that predate the Relation Kernel.
 */
export async function loadAcceptedRelations(): Promise<AtelierEdge[]> {
  return (await loadAcceptedRelationsDetailed()).relations
}

/**
 * Load accepted relations with validation diagnostics.
 *
 * A relation is consumable by the transformer only when it is:
 *
 *   - one of the accepted non-`contains` relation kinds,
 *   - marked `status: 'fresh'`, and
 *   - both endpoints resolve to current source units / source anchors /
 *     reader objects in the generated object graph.
 *
 * Invalid rows are returned in `invalid` but never in `relations`. This
 * keeps projection safe while allowing the validator to explain why a
 * persisted `source_relation_ids` trace is no longer valid.
 */
export async function loadAcceptedRelationsDetailed(): Promise<AcceptedRelationsDetailed> {
  const indexerEdges = await readNdjsonSafe<AtelierEdge>(INDEXER_PATHS.edges)
  const readerEdges = await readNdjsonSafe<AtelierEdge>(readerAcceptedRelationsPath())
  const endpoints = await loadRelationEndpointIndex()
  const merged: AtelierEdge[] = []
  const invalid: InvalidAcceptedRelation[] = []
  const seen = new Set<string>()
  for (const e of indexerEdges) {
    if (!isAcceptedKind(e.kind)) continue
    if (!e.id) {
      invalid.push(invalidRelation(e, 'missing-id', 'accepted relation row has no id'))
      continue
    }
    if (seen.has(e.id)) {
      invalid.push(invalidRelation(e, 'duplicate-id', `duplicate accepted relation id ${e.id}`))
      continue
    }
    seen.add(e.id)
    const issue = validateAcceptedRelation(e, endpoints)
    if (issue) invalid.push(issue)
    else merged.push(e)
  }
  for (const e of readerEdges) {
    if (!isAcceptedKind(e.kind)) continue
    if (!e.id) {
      invalid.push(invalidRelation(e, 'missing-id', 'reader accepted relation row has no id'))
      continue
    }
    if (seen.has(e.id)) {
      invalid.push(invalidRelation(e, 'duplicate-id', `duplicate accepted relation id ${e.id}`))
      continue
    }
    seen.add(e.id)
    const issue = validateAcceptedRelation(e, endpoints)
    if (issue) invalid.push(issue)
    else merged.push(e)
  }
  return {
    relations: merged,
    invalid,
    raw_relations: [...indexerEdges, ...readerEdges],
    endpoint_count: endpoints.size,
  }
}

/**
 * Filter `relations` to only the accepted (non-`contains`) kinds.
 */
export function filterAcceptedRelations(relations: ReadonlyArray<AtelierEdge>): AtelierEdge[] {
  return relations.filter((e) => isAcceptedKind(e.kind))
}

function isAcceptedKind(kind: AtelierEdge['kind']): boolean {
  return ACCEPTED_RELATION_KINDS.has(kind)
}

function validateAcceptedRelation(
  e: AtelierEdge,
  endpoints: ReadonlyMap<string, RelationEndpoint>,
): InvalidAcceptedRelation | null {
  if (!isAcceptedKind(e.kind)) {
    return invalidRelation(e, 'unaccepted-kind', `relation ${e.id} kind ${e.kind} is not accepted by the transformer`)
  }
  if (e.status !== 'fresh') {
    return invalidRelation(e, 'not-current', `relation ${e.id} is not current (status=${e.status})`)
  }
  if (!e.from || !e.to) {
    return invalidRelation(e, 'missing-endpoint', `relation ${e.id} lacks a from/to endpoint`)
  }
  const from = endpoints.get(e.from)
  if (!from) {
    return invalidRelation(e, 'unresolved-from', `relation ${e.id} from endpoint ${e.from} does not resolve to a current graph object or anchor`)
  }
  const to = endpoints.get(e.to)
  if (!to) {
    return invalidRelation(e, 'unresolved-to', `relation ${e.id} to endpoint ${e.to} does not resolve to a current graph object or anchor`)
  }
  if (from.status && from.status !== 'fresh') {
    return invalidRelation(e, 'stale-from', `relation ${e.id} from endpoint ${e.from} is not fresh (status=${from.status})`)
  }
  if (to.status && to.status !== 'fresh') {
    return invalidRelation(e, 'stale-to', `relation ${e.id} to endpoint ${e.to} is not fresh (status=${to.status})`)
  }
  return null
}

function invalidRelation(
  relation: AtelierEdge,
  reason: AcceptedRelationInvalidReason,
  message: string,
): InvalidAcceptedRelation {
  return {
    id: relation.id || '<missing-id>',
    reason,
    message,
    relation,
  }
}

async function loadRelationEndpointIndex(): Promise<Map<string, RelationEndpoint>> {
  const map = new Map<string, RelationEndpoint>()
  const [sources, anchors, facts, knowledge, semantics, attention] = await Promise.all([
    readNdjsonSafe<SourceUnit>(INDEXER_PATHS.objectsSource),
    readNdjsonSafe<SourceAnchor>(INDEXER_PATHS.anchorsFile),
    readNdjsonSafe<AtelierObjectBase>(INDEXER_PATHS.objectsFacts),
    readNdjsonSafe<AtelierObjectBase>(READER_PATHS.knowledge),
    readNdjsonSafe<AtelierObjectBase>(READER_PATHS.semantics),
    readNdjsonSafe<AtelierObjectBase>(READER_PATHS.attention),
  ])
  for (const s of sources) addEndpoint(map, s)
  for (const a of anchors) addEndpoint(map, a)
  for (const f of facts) addEndpoint(map, f)
  for (const k of knowledge) addEndpoint(map, k)
  for (const s of semantics) addEndpoint(map, s)
  for (const a of attention) addEndpoint(map, a)
  return map
}

function addEndpoint(map: Map<string, RelationEndpoint>, record: { id?: unknown; status?: unknown; path?: unknown }): void {
  if (!record || typeof record.id !== 'string' || record.id.length === 0) return
  map.set(record.id, {
    id: record.id,
    status: typeof record.status === 'string' ? record.status : undefined,
    path: typeof record.path === 'string' ? record.path : undefined,
  })
}

async function readNdjsonSafe<T>(filePath: string): Promise<T[]> {
  try {
    return await readNdjson<T>(filePath)
  } catch (err) {
    // If the file does not exist, treat as empty (backward compat with
    // snapshots that predate the reader-accepted-relations file).
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}

/**
 * Subset of `relations` whose `from` or `to` endpoint is one of the
 * given `anchorIds` (which can be a mix of source-anchor ids and
 * object ids — both are valid graph node ids).
 */
export function pickAcceptedRelationsForAnchors(
  anchorIds: ReadonlyArray<string>,
  relations: ReadonlyArray<AtelierEdge>,
): AtelierEdge[] {
  if (anchorIds.length === 0) return []
  const idSet = new Set(anchorIds)
  return relations.filter((e) => idSet.has(e.from) || idSet.has(e.to))
}

export function relationEndpointIds(relations: ReadonlyArray<AtelierEdge>): string[] {
  const out = new Set<string>()
  for (const e of relations) {
    if (e.from) out.add(e.from)
    if (e.to) out.add(e.to)
  }
  return [...out].sort()
}

/**
 * Subset of `relations` of the given `kinds` whose `from` or `to`
 * endpoint is one of the given `anchorIds`.
 */
export function pickAcceptedRelationsForAnchorsByKind(
  anchorIds: ReadonlyArray<string>,
  relations: ReadonlyArray<AtelierEdge>,
  kinds: ReadonlySet<AtelierEdge['kind']>,
): AtelierEdge[] {
  return pickAcceptedRelationsForAnchors(anchorIds, relations).filter((e) => kinds.has(e.kind))
}

/**
 * Convenience: load accepted relations, then filter to those whose
 * endpoints overlap `anchorIds`. Equivalent to
 * `pickAcceptedRelationsForAnchors(anchorIds, await loadAcceptedRelations())`
 * but with one I/O round-trip.
 */
export async function loadAcceptedRelationsForAnchors(
  anchorIds: ReadonlyArray<string>,
): Promise<AtelierEdge[]> {
  const all = await loadAcceptedRelations()
  return pickAcceptedRelationsForAnchors(anchorIds, all)
}

/**
 * Read the raw ndjson from disk and return a `{edges, missing}` pair.
 * `missing` is true when the file does not exist; `edges` is the empty
 * list in that case. Used by the render layer for diagnostic views.
 */
export async function readAcceptedRelationsRaw(): Promise<{ edges: AtelierEdge[]; missing: boolean }> {
  const filePath = readerAcceptedRelationsPath()
  try {
    await readFile(filePath, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { edges: [], missing: true }
    }
    throw err
  }
  return { edges: await readNdjson<AtelierEdge>(filePath), missing: false }
}
