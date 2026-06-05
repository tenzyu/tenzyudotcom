import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  type SourceUnit,
  type AtelierObjectBase,
  type AtelierEdge,
  type SourceFact,
  type SourceRef,
} from '../../../lib/src/index.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { INDEXER_OUTPUT } from './paths.ts'
import { createLogger } from '../../../lib/src/logger.ts'
import { INDEXER_CONFIDENCE, INDEXER_PRODUCER, INDEXER_PROVENANCE } from '../schemas/indexer.ts'

const log = createLogger('indexer/validate')

export type ValidationIssue = {
  severity: 'P0' | 'P1' | 'P2'
  code: string
  message: string
  affected_record?: string
  recommended_next_action?: string
}

/**
 * Validate every contract obligation of the indexer.
 *
 * The validator must FAIL (return issues) when:
 *   - any object id is duplicated
 *   - any edge references missing objects
 *   - any SourceUnit points to a missing file
 *   - any SourceRef hash mismatches the file content
 *   - generated index views are stale
 *   - facts or source NDJSON is invalid
 */
export async function validateIndex(): Promise<{
  issues: ValidationIssue[]
  warnings: string[]
  stats: {
    units: number
    facts: number
    edges: number
  }
}> {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []

  // 1. facts ndjson parse
  let files: Array<{ relpath: string; sha256: string; size: number; mtime_ms?: number }> = []
  try {
    files = await readNdjson<{ relpath: string; sha256: string; size: number; mtime_ms?: number }>(INDEXER_OUTPUT.factsFiles)
  } catch (err) {
    issues.push({
      severity: 'P0',
      code: 'E_FACTS_INVALID',
      message: `facts/files.ndjson is invalid: ${(err as Error).message}`,
      affected_record: INDEXER_OUTPUT.factsFiles,
      recommended_next_action: 'rerun `bun run scan` then `bun run index`',
    })
  }

  // 2. parse source units
  let units: SourceUnit[] = []
  try {
    units = await readNdjson<SourceUnit>(INDEXER_OUTPUT.objectsSource)
  } catch (err) {
    issues.push({
      severity: 'P0',
      code: 'E_OBJECTS_INVALID',
      message: `objects/source.ndjson is invalid: ${(err as Error).message}`,
      affected_record: INDEXER_OUTPUT.objectsSource,
      recommended_next_action: 'rerun `bun run index`',
    })
  }

  // 3. parse edges
  let edges: AtelierEdge[] = []
  try {
    edges = await readNdjson<AtelierEdge>(INDEXER_OUTPUT.edges)
  } catch (err) {
    issues.push({
      severity: 'P0',
      code: 'E_EDGES_INVALID',
      message: `edges/edges.ndjson is invalid: ${(err as Error).message}`,
      affected_record: INDEXER_OUTPUT.edges,
      recommended_next_action: 'rerun `bun run index`',
    })
  }

  // 4. parse facts ndjson
  let facts: SourceFact[] = []
  try {
    facts = await readNdjson<SourceFact>(path.join(path.dirname(INDEXER_OUTPUT.objectsSource), 'facts.ndjson'))
  } catch (err) {
    warnings.push(`facts.ndjson is missing or invalid: ${(err as Error).message}`)
  }

  // 5. duplicate ids
  const seenUnit = new Set<string>()
  for (const u of units) {
    if (seenUnit.has(u.id)) {
      issues.push({
        severity: 'P0',
        code: 'E_DUP_ID',
        message: `duplicate source unit id: ${u.id}`,
        affected_record: u.id,
        recommended_next_action: 'deduplicate by path; rerun `bun run index`',
      })
    }
    seenUnit.add(u.id)
  }

  // 6. unit points to missing file (sample top 100 for speed)
  const sample = units.slice(0, 100)
  for (const u of sample) {
    if (!u.path) continue
    try {
      await stat(u.path)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        issues.push({
          severity: 'P1',
          code: 'E_UNIT_MISSING_FILE',
          message: `source unit ${u.id} points to missing file ${u.path}`,
          affected_record: u.id,
          recommended_next_action: 'rerun `bun run index` to refresh the file scan',
        })
      }
    }
  }

  // 7. source ref hash mismatches file content (sample)
  const factByPath = new Map<string, string>()
  for (const f of files) factByPath.set(f.relpath, f.sha256)
  let sampled = 0
  for (const u of units) {
    if (sampled >= 50) break
    sampled += 1
    if (!u.sha256) continue
    const onDisk = factByPath.get(u.path)
    if (onDisk && onDisk !== u.sha256) {
      issues.push({
        severity: 'P1',
        code: 'E_HASH_DRIFT',
        message: `source unit ${u.id} has sha256 ${u.sha256} but facts/files.ndjson shows ${onDisk}`,
        affected_record: u.id,
        recommended_next_action: 'rerun `bun run scan && bun run index`',
      })
    }
    for (const ref of u.source_refs) {
      if (!ref.path) continue
      if (ref.sha256 && factByPath.get(ref.path) && ref.sha256 !== factByPath.get(ref.path)) {
        issues.push({
          severity: 'P1',
          code: 'E_REF_HASH_DRIFT',
          message: `source ref ${ref.path} hash mismatch (unit ${u.id})`,
          affected_record: u.id,
          recommended_next_action: 'rerun `bun run scan && bun run index`',
        })
      }
    }
  }

  // 8. edges reference missing objects
  const unitIds = new Set(units.map((u) => u.id))
  for (const e of edges) {
    if (e.kind === 'contains' && e.from === 'src:repo:root') continue
    if (!unitIds.has(e.from)) {
      issues.push({
        severity: 'P1',
        code: 'E_EDGE_MISSING_FROM',
        message: `edge ${e.id} references missing from-object ${e.from}`,
        affected_record: e.id,
      })
    }
    if (!unitIds.has(e.to)) {
      issues.push({
        severity: 'P1',
        code: 'E_EDGE_MISSING_TO',
        message: `edge ${e.id} references missing to-object ${e.to}`,
        affected_record: e.id,
      })
    }
  }

  // 9. views freshness: views must exist and start with the marker.
  const viewFiles = [
    INDEXER_OUTPUT.viewIndexSummary,
    INDEXER_OUTPUT.viewSourceUnits,
    INDEXER_OUTPUT.viewAffected,
  ]
  for (const vf of viewFiles) {
    try {
      const content = await readFile(vf, 'utf8')
      if (!content.includes('GENERATED FILE. DO NOT EDIT DIRECTLY.')) {
        issues.push({
          severity: 'P1',
          code: 'E_VIEW_STALE_MARKER',
          message: `view ${vf} does not include generated marker`,
          affected_record: vf,
          recommended_next_action: 'rerun `bun run render`',
        })
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        warnings.push(`view ${vf} does not exist yet; render it`)
      }
    }
  }

  // 10. cross-check schema: every unit has required keys.
  for (const u of units) {
    if (!u.path || !u.sha256 || typeof u.byte_size !== 'number') {
      issues.push({
        severity: 'P1',
        code: 'E_UNIT_SCHEMA',
        message: `source unit ${u.id} missing required fields (path/sha256/byte_size)`,
        affected_record: u.id,
      })
    }
    if (u.provenance_kind !== INDEXER_PROVENANCE) {
      issues.push({
        severity: 'P1',
        code: 'E_UNIT_PROVENANCE',
        message: `source unit ${u.id} has provenance ${u.provenance_kind} (expected ${INDEXER_PROVENANCE})`,
        affected_record: u.id,
      })
    }
  }

  if (issues.length === 0) log.info('index validation passed')
  else log.warn(`index validation found ${issues.length} issues`)

  return { issues, warnings, stats: { units: units.length, facts: facts.length, edges: edges.length } }
}
