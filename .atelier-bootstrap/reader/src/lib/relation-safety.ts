/**
 * Reader-local relation safety helpers.
 *
 * This module intentionally lives inside the reader workstream so the reader
 * can enforce default exclusions and SourceAnchor resolution without changing
 * the shared bootstrap library during a parallel goal run.
 */
import path from 'node:path'
import {
  INDEXER_PATHS,
  isBuildArtifactPath,
  type AtelierEdge,
  type AttentionSet,
  type KnowledgeObject,
  type RelationProposal,
  type SemanticClaim,
  type SourceAnchor,
  type SourceFact,
  type SourceRef,
  type SourceUnit,
} from '../../../lib/src/index.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'

export type ReaderAttentionSet = AttentionSet & {
  selected_anchor_ids: string[]
  excluded_anchor_ids: string[]
}

export type ReaderKnowledgeObject = KnowledgeObject & {
  source_anchor_ids: string[]
}

export type ReaderSemanticClaim = SemanticClaim & {
  source_anchor_ids: string[]
}

export type ReaderAcceptedRelation = AtelierEdge & {
  proposal_id?: string
  source_anchor_ids?: string[]
}

type EndpointKind = 'source_anchor' | 'source_unit' | 'source_fact'

export type EndpointRecord = {
  id: string
  endpoint_kind: EndpointKind
  path?: string
  source_refs: SourceRef[]
  status?: string
}

export type CurrentReaderIndex = {
  units: SourceUnit[]
  facts: SourceFact[]
  anchors: SourceAnchor[]
  unitsById: Map<string, SourceUnit>
  factsById: Map<string, SourceFact>
  anchorsById: Map<string, SourceAnchor>
  anchorsByPath: Map<string, SourceAnchor[]>
  unitsByPath: Map<string, SourceUnit>
  endpointsById: Map<string, EndpointRecord>
}

const DEFAULT_EXCLUDED_SEGMENTS = new Set<string>([
  '.git',
  '.opencode',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'target',
])

const STALE_STATUSES = new Set<string>([
  'stale',
  'conflicted',
  'invalid',
  'archived',
  'quarantined',
  'rejected',
])

const FILE_ANCHOR_KINDS: ReadonlyArray<SourceAnchor['kind']> = [
  'file',
  'test_file',
  'config_file',
  'markdown_section',
]

export function normalizeRepoPath(inputPath: string): string {
  if (!inputPath) return ''
  const normalized = inputPath.replace(/\\/g, '/')
  if (path.isAbsolute(normalized)) {
    return path.relative(process.cwd(), normalized).replace(/\\/g, '/')
  }
  return normalized.replace(/^\.\//, '')
}

export function isDefaultExcludedPath(inputPath: string | undefined): boolean {
  if (!inputPath) return false
  const normalized = normalizeRepoPath(inputPath)
  if (isBuildArtifactPath(normalized)) return true
  const base = normalized.slice(normalized.lastIndexOf('/') + 1)
  if (base === '.rmeta' || base.endsWith('.rmeta')) return true
  for (const segment of normalized.split('/')) {
    if (DEFAULT_EXCLUDED_SEGMENTS.has(segment)) return true
  }
  return false
}

export function isCurrentStatus(status: string | undefined): boolean {
  return !status || !STALE_STATUSES.has(status)
}

function mapById<T extends { id: string }>(rows: ReadonlyArray<T>): Map<string, T> {
  const out = new Map<string, T>()
  for (const row of rows) out.set(row.id, row)
  return out
}

export async function loadCurrentReaderIndex(): Promise<CurrentReaderIndex> {
  const [units, facts, anchors] = await Promise.all([
    readNdjson<SourceUnit>(INDEXER_PATHS.objectsSource),
    readNdjson<SourceFact>(INDEXER_PATHS.objectsFacts),
    readNdjson<SourceAnchor>(INDEXER_PATHS.anchorsFile),
  ])
  const unitsById = mapById(units)
  const factsById = mapById(facts)
  const anchorsById = mapById(anchors)
  const unitsByPath = new Map<string, SourceUnit>()
  for (const unit of units) unitsByPath.set(normalizeRepoPath(unit.path), unit)
  const anchorsByPath = new Map<string, SourceAnchor[]>()
  for (const anchor of anchors) {
    const key = normalizeRepoPath(anchor.path)
    const list = anchorsByPath.get(key) ?? []
    list.push(anchor)
    anchorsByPath.set(key, list)
  }
  const endpointsById = new Map<string, EndpointRecord>()
  for (const anchor of anchors) {
    endpointsById.set(anchor.id, {
      id: anchor.id,
      endpoint_kind: 'source_anchor',
      path: anchor.path,
      source_refs: anchor.source_refs,
      status: anchor.status,
    })
  }
  for (const unit of units) {
    endpointsById.set(unit.id, {
      id: unit.id,
      endpoint_kind: 'source_unit',
      path: unit.path,
      source_refs: unit.source_refs,
      status: unit.status,
    })
  }
  for (const fact of facts) {
    const firstRef = fact.source_refs[0]
    endpointsById.set(fact.id, {
      id: fact.id,
      endpoint_kind: 'source_fact',
      path: firstRef?.path,
      source_refs: fact.source_refs,
      status: fact.status,
    })
  }
  return {
    units,
    facts,
    anchors,
    unitsById,
    factsById,
    anchorsById,
    anchorsByPath,
    unitsByPath,
    endpointsById,
  }
}

export function sourceRefForAnchor(anchor: SourceAnchor): SourceRef {
  return anchor.source_refs[0] ?? { path: anchor.path, sha256: '' }
}

export function sourceRefForUnit(unit: SourceUnit): SourceRef {
  return {
    path: unit.path,
    start_line: unit.start_line,
    end_line: unit.end_line,
    sha256: unit.sha256,
  }
}

export function sourceRefIsCurrent(index: CurrentReaderIndex, ref: SourceRef): boolean {
  const refPath = normalizeRepoPath(ref.path)
  if (!refPath || !ref.sha256) return false
  if (isDefaultExcludedPath(refPath)) return false
  const unit = index.unitsByPath.get(refPath)
  if (unit && unit.sha256 === ref.sha256 && isCurrentStatus(unit.status)) return true
  const anchors = index.anchorsByPath.get(refPath) ?? []
  if (anchors.some((a) => isCurrentStatus(a.status) && a.source_refs.some((r) => r.sha256 === ref.sha256))) {
    return true
  }
  return index.facts.some((fact) =>
    isCurrentStatus(fact.status) && fact.source_refs.some((r) => normalizeRepoPath(r.path) === refPath && r.sha256 === ref.sha256),
  )
}

function endpointHasDefaultExcludedPath(endpoint: EndpointRecord): boolean {
  if (endpoint.path && isDefaultExcludedPath(endpoint.path)) return true
  return endpoint.source_refs.some((r) => isDefaultExcludedPath(r.path))
}

export function endpointIsResolvable(index: CurrentReaderIndex, endpointId: string | undefined): boolean {
  if (!endpointId) return false
  const endpoint = index.endpointsById.get(endpointId)
  if (!endpoint) return false
  if (!isCurrentStatus(endpoint.status)) return false
  if (endpointHasDefaultExcludedPath(endpoint)) return false
  return true
}

function anchorUsable(anchor: SourceAnchor): boolean {
  return isCurrentStatus(anchor.status) && !isDefaultExcludedPath(anchor.path)
}

function preferredKindsForUnit(unit: SourceUnit): SourceAnchor['kind'][] {
  if (unit.unit_type === 'test_file') return ['test_file', 'file']
  if (unit.unit_type === 'config_file') return ['config_file', 'file']
  if (unit.unit_type === 'markdown_section' || unit.unit_type === 'docs_file') return ['markdown_section', 'file']
  if (unit.unit_type === 'symbol_candidate') return ['file', 'code_symbol_candidate']
  return ['file']
}

function anchorSortScore(unit: SourceUnit, anchor: SourceAnchor, preferred: ReadonlyArray<SourceAnchor['kind']>): number {
  let score = 0
  const preferredIdx = preferred.indexOf(anchor.kind)
  if (preferredIdx >= 0) score += 100 - preferredIdx * 10
  if (unit.start_line !== undefined && anchor.start_line === unit.start_line) score += 5
  if (unit.end_line !== undefined && anchor.end_line === unit.end_line) score += 5
  if (anchor.kind === 'file') score += 1
  return score
}

export function anchorsForUnit(index: CurrentReaderIndex, unit: SourceUnit): SourceAnchor[] {
  if (isDefaultExcludedPath(unit.path) || !isCurrentStatus(unit.status)) return []
  const candidates = (index.anchorsByPath.get(normalizeRepoPath(unit.path)) ?? []).filter(anchorUsable)
  const preferred = preferredKindsForUnit(unit)
  const sorted = [...candidates]
    .filter((anchor) => preferred.includes(anchor.kind) || FILE_ANCHOR_KINDS.includes(anchor.kind))
    .sort((a, b) => anchorSortScore(unit, b, preferred) - anchorSortScore(unit, a, preferred))
  return sorted
}

export function bestAnchorForUnit(index: CurrentReaderIndex, unit: SourceUnit): SourceAnchor | undefined {
  return anchorsForUnit(index, unit)[0]
}

export function bestFileAnchorForPath(
  index: CurrentReaderIndex,
  relpath: string,
  preferred: ReadonlyArray<SourceAnchor['kind']> = ['file', 'test_file', 'config_file'],
): SourceAnchor | undefined {
  const candidates = (index.anchorsByPath.get(normalizeRepoPath(relpath)) ?? []).filter(anchorUsable)
  const sorted = [...candidates].sort((a, b) => {
    const ai = preferred.indexOf(a.kind)
    const bi = preferred.indexOf(b.kind)
    const as = ai >= 0 ? 100 - ai : 0
    const bs = bi >= 0 ? 100 - bi : 0
    return bs - as
  })
  return sorted[0]
}

export function packageScriptAnchor(
  index: CurrentReaderIndex,
  scriptName: string,
  pkgPath = 'package.json',
): SourceAnchor | undefined {
  return (index.anchorsByPath.get(normalizeRepoPath(pkgPath)) ?? []).find(
    (anchor) => anchorUsable(anchor) && anchor.kind === 'package_script' && anchor.symbol_name === scriptName,
  )
}

export function anchorIdsForSourceRef(index: CurrentReaderIndex, ref: SourceRef): string[] {
  const refPath = normalizeRepoPath(ref.path)
  const candidates = (index.anchorsByPath.get(refPath) ?? []).filter(anchorUsable)
  if (candidates.length === 0) return []
  const exactRange = candidates.filter((a) =>
    ref.start_line !== undefined && ref.end_line !== undefined &&
    a.start_line === ref.start_line && a.end_line === ref.end_line,
  )
  const fileLike = candidates.filter((a) => FILE_ANCHOR_KINDS.includes(a.kind))
  const chosen = exactRange.length > 0 ? exactRange : fileLike.length > 0 ? fileLike : candidates
  return [...new Set(chosen.slice(0, 2).map((a) => a.id))]
}

export function anchorIdsForSourceRefs(index: CurrentReaderIndex, refs: ReadonlyArray<SourceRef>): string[] {
  const ids = new Set<string>()
  for (const ref of refs) for (const id of anchorIdsForSourceRef(index, ref)) ids.add(id)
  return [...ids]
}

export function validateSourceAnchorIds(
  index: CurrentReaderIndex,
  ids: ReadonlyArray<string> | undefined,
): string[] {
  const issues: string[] = []
  if (!Array.isArray(ids) || ids.length === 0) {
    issues.push('missing source_anchor_ids')
    return issues
  }
  for (const id of ids) {
    const anchor = index.anchorsById.get(id)
    if (!anchor) {
      issues.push(`unresolved source_anchor_id ${id}`)
      continue
    }
    if (!isCurrentStatus(anchor.status)) issues.push(`stale source_anchor_id ${id} status=${anchor.status}`)
    if (isDefaultExcludedPath(anchor.path)) issues.push(`default-excluded source_anchor_id ${id} path=${anchor.path}`)
  }
  return issues
}

export function validateSourceRefs(
  index: CurrentReaderIndex,
  refs: ReadonlyArray<SourceRef> | undefined,
): string[] {
  const issues: string[] = []
  if (!Array.isArray(refs) || refs.length === 0) {
    issues.push('missing source_refs')
    return issues
  }
  for (const ref of refs) {
    if (!ref.path || !ref.sha256) {
      issues.push(`incomplete source_ref path=${ref.path ?? '<missing>'}`)
      continue
    }
    if (isDefaultExcludedPath(ref.path)) {
      issues.push(`default-excluded source_ref path=${ref.path}`)
      continue
    }
    if (!sourceRefIsCurrent(index, ref)) {
      issues.push(`stale or unresolved source_ref path=${ref.path}`)
    }
  }
  return issues
}

export function validateProposalAgainstCurrentIndex(
  index: CurrentReaderIndex,
  proposal: RelationProposal,
): string[] {
  const issues: string[] = []
  if (proposal.schema !== 'atelier.relation-proposal/v1') issues.push('schema is not atelier.relation-proposal/v1')
  if (!proposal.proposal_id) issues.push('missing proposal_id')
  if (!proposal.proposed_relation) {
    issues.push('missing proposed_relation')
    return issues
  }
  const relation = proposal.proposed_relation
  if (!relation.from || !relation.to) issues.push(`missing endpoints from=${relation.from ?? '<missing>'} to=${relation.to ?? '<missing>'}`)
  if (relation.kind === 'contains') issues.push('reader proposal kind contains is forbidden')
  if (!endpointIsResolvable(index, relation.from)) issues.push(`unresolved endpoint from=${relation.from ?? '<missing>'}`)
  if (!endpointIsResolvable(index, relation.to)) issues.push(`unresolved endpoint to=${relation.to ?? '<missing>'}`)
  const relationConfidence = (relation as { confidence?: string }).confidence
  if (relationConfidence === 'fact' || relationConfidence === 'validated') {
    issues.push(`proposed_relation confidence ${relationConfidence} is not allowed before acceptance`)
  }
  if (proposal.confidence !== 'hypothesis' && proposal.confidence !== 'inferred') {
    issues.push(`proposal confidence ${String(proposal.confidence)} is not hypothesis|inferred`)
  }
  if (!['proposed', 'accepted', 'rejected', 'stale'].includes(String(proposal.status))) {
    issues.push(`invalid proposal status ${String(proposal.status)}`)
  }
  issues.push(...validateSourceAnchorIds(index, proposal.source_anchor_ids))
  issues.push(...validateSourceRefs(index, proposal.source_refs))
  return issues
}

export function validateAcceptedRelationAgainstCurrentIndex(
  index: CurrentReaderIndex,
  edge: ReaderAcceptedRelation,
): string[] {
  const issues: string[] = []
  if (!edge.from || !edge.to) issues.push(`missing endpoints from=${edge.from ?? '<missing>'} to=${edge.to ?? '<missing>'}`)
  if (edge.kind === 'contains') issues.push('reader accepted relation kind contains is forbidden')
  if (!endpointIsResolvable(index, edge.from)) issues.push(`unresolved endpoint from=${edge.from ?? '<missing>'}`)
  if (!endpointIsResolvable(index, edge.to)) issues.push(`unresolved endpoint to=${edge.to ?? '<missing>'}`)
  issues.push(...validateSourceAnchorIds(index, edge.source_anchor_ids))
  issues.push(...validateSourceRefs(index, edge.source_refs ?? []))
  return issues
}
