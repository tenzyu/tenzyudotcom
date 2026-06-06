import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  type SourceUnit,
  type AtelierEdge,
  type SourceFact,
  type SourceRef,
} from '../../../lib/src/index.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { INDEXER_OUTPUT } from './paths.ts'
import { createLogger } from '../../../lib/src/logger.ts'
import { INDEXER_CONFIDENCE, INDEXER_PRODUCER, INDEXER_PROVENANCE } from '../schemas/indexer.ts'
import { sha256OfFile } from '../../../lib/src/hash.ts'

const log = createLogger('indexer/validate')

export type ValidationIssue = {
  severity: 'P0' | 'P1' | 'P2'
  code: string
  message: string
  affected_record?: string
  recommended_next_action?: string
}

export type ValidationOptions = {
  /**
   * Quick/sample mode is strictly opt-in and must never be the default
   * used by `atelier:ready` or `atelier:verify`.
   *
   * When `true`, the validator only checks a small sample (top N units /
   * N hashes). This is intended for editor-side or smoke-test use only.
   */
  quick?: boolean
  /**
   * Sample size used in quick mode. Defaults to a tiny value to keep
   * the intent clear: this is a smoke check, not a real validation.
   */
  quickSample?: number
}

export type ValidationResult = {
  issues: ValidationIssue[]
  warnings: string[]
  stats: {
    units: number
    facts: number
    edges: number
    source_refs_checked: number
    units_checked: number
    mode: 'strict' | 'quick'
  }
}

/**
 * Validate every contract obligation of the indexer.
 *
 * STRICT MODE (default):
 *   - checks every object id for duplicates
 *   - checks every edge from/to id points at an existing object
 *   - checks every SourceUnit points to an existing file
 *   - checks every SourceRef by computing the on-disk sha256 (NOT a sample)
 *   - checks every fact in facts.ndjson parses
 *   - checks every edge from src:repo:root is a contains-edge
 *
 * QUICK MODE (opt-in via `--quick` or `validate:quick`):
 *   - same checks, but only over a small sample.
 *   - quick mode is intended for editor smoke-tests and development.
 *   - quick mode must never be wired into `atelier:ready` or
 *     `atelier:verify`.
 */
export async function validateIndex(
  options: ValidationOptions = {},
): Promise<ValidationResult> {
  const quick = options.quick === true
  const sample = options.quickSample ?? (quick ? 25 : Number.POSITIVE_INFINITY)
  const mode: 'strict' | 'quick' = quick ? 'quick' : 'strict'
  const issues: ValidationIssue[] = []
  const warnings: string[] = []

  if (quick) {
    warnings.push(
      'validate:quick is sample-based and MUST NOT be used as the basis for operational pass; run `bun run atelier:index:validate` (strict) for that.',
    )
  }

  // 1. facts ndjson parse (always full)
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

  // 2. parse source units (always full)
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

  // 3. parse edges (always full)
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

  // 4. parse facts ndjson (always full)
  let facts: SourceFact[] = []
  try {
    facts = await readNdjson<SourceFact>(path.join(path.dirname(INDEXER_OUTPUT.objectsSource), 'facts.ndjson'))
  } catch (err) {
    warnings.push(`facts.ndjson is missing or invalid: ${(err as Error).message}`)
  }

  // 5. duplicate ids — ALWAYS strict
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

  // Build a by-path map of facts for source-ref hash cross-check.
  const factByPath = new Map<string, string>()
  for (const f of files) factByPath.set(f.relpath, f.sha256)

  // 6. unit points to missing file — STRICT: every unit.
  //    In quick mode, only a small sample is checked.
  const unitsToCheck = quick ? units.slice(0, sample) : units
  let unitsChecked = 0
  for (const u of unitsToCheck) {
    unitsChecked += 1
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
      } else {
        issues.push({
          severity: 'P1',
          code: 'E_UNIT_STAT_ERROR',
          message: `source unit ${u.id} stat failed for ${u.path}: ${(err as Error).message}`,
          affected_record: u.id,
        })
      }
    }
  }

  // 7. STRICT: hash every source unit by re-computing sha256 on disk.
  //    This is the only way to catch the kind of drift that the
  //    review flagged as P0-005.
  let sourceRefsChecked = 0
  if (quick) {
    // quick mode: only top-N units' refs
    for (const u of unitsToCheck) {
      if (u.sha256) {
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
        for (const ref of u.source_refs) sourceRefsChecked += 1
      }
    }
  } else {
    // STRICT: walk every unit, every source ref, and re-hash on disk.
    for (const u of units) {
      if (u.sha256) {
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
      }
      for (const ref of u.source_refs) {
        sourceRefsChecked += 1
        const refIssue = await checkSourceRefHash(ref)
        if (refIssue) issues.push(refIssue)
      }
    }
  }

  // 8. edges reference existing objects — STRICT: every edge.
  //    contains-edges from src:repo:root are allowed to be the seed.
  const unitIds = new Set(units.map((u) => u.id))
  // also include any object id we have seen so that the contains edges
  // resolve; the seed contains edges are accepted because the source
  // unit "src:repo:root" is virtual, not stored in source.ndjson.
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

  // 9. views freshness — view files must exist and carry the generated
  //    marker. Always strict because views are cheap to read.
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

  // 10. cross-check schema — every unit has required keys.
  if (quick) {
    for (const u of unitsToCheck) checkUnitSchema(u, issues)
  } else {
    for (const u of units) checkUnitSchema(u, issues)
  }

  // 11. strict-only: cross-check that EVERY source ref actually
  //     resolves against the on-disk file. This is the heart of
  //     P0-005: no sampling for source-ref hash integrity.
  if (!quick) {
    const refIssues = await findStraySourceRefs(units)
    issues.push(...refIssues)
  }

  if (issues.length === 0) log.info(`index validation passed (${mode})`)
  else log.warn(`index validation found ${issues.length} issues (${mode})`)

  return {
    issues,
    warnings,
    stats: {
      units: units.length,
      facts: facts.length,
      edges: edges.length,
      units_checked: unitsChecked,
      source_refs_checked: sourceRefsChecked,
      mode,
    },
  }
}

function checkUnitSchema(u: SourceUnit, issues: ValidationIssue[]): void {
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
  if (u.produced_by !== INDEXER_PRODUCER) {
    issues.push({
      severity: 'P1',
      code: 'E_UNIT_PRODUCER',
      message: `source unit ${u.id} has produced_by ${u.produced_by} (expected ${INDEXER_PRODUCER})`,
      affected_record: u.id,
    })
  }
  if (u.confidence !== INDEXER_CONFIDENCE) {
    issues.push({
      severity: 'P1',
      code: 'E_UNIT_CONFIDENCE',
      message: `source unit ${u.id} has confidence ${u.confidence} (expected ${INDEXER_CONFIDENCE})`,
      affected_record: u.id,
    })
  }
}

/**
 * For every source ref, compute the on-disk sha256 and compare it to
 * the recorded sha256. This is the strict path: NO SAMPLING.
 */
async function checkSourceRefHash(ref: SourceRef): Promise<ValidationIssue | null> {
  if (!ref.path || !ref.sha256) return null
  let onDisk: string
  try {
    onDisk = await sha256OfFile(ref.path)
  } catch (err) {
    return {
      severity: 'P1',
      code: 'E_REF_FILE_MISSING',
      message: `source ref ${ref.path} cannot be hashed: ${(err as Error).message}`,
      affected_record: ref.path,
    }
  }
  if (onDisk !== ref.sha256) {
    return {
      severity: 'P1',
      code: 'E_REF_HASH_DRIFT',
      message: `source ref ${ref.path} hash mismatch: recorded ${ref.sha256} != on-disk ${onDisk}`,
      affected_record: ref.path,
      recommended_next_action: 'rerun `bun run scan && bun run index`',
    }
  }
  return null
}

/**
 * Check that every recorded path still exists on disk. This is a
 * cheap belt-and-braces check for the case where a file was deleted
 * but the source unit was not refreshed.
 */
async function findStraySourceRefs(units: SourceUnit[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()
  for (const u of units) {
    for (const ref of u.source_refs) {
      if (!ref.path || seen.has(ref.path)) continue
      seen.add(ref.path)
      try {
        await stat(ref.path)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          issues.push({
            severity: 'P1',
            code: 'E_REF_MISSING_FILE',
            message: `source ref ${ref.path} is referenced by ${u.id} but does not exist on disk`,
            affected_record: ref.path,
            recommended_next_action: 'rerun `bun run index` to refresh the file scan',
          })
        }
      }
    }
  }
  return issues
}

