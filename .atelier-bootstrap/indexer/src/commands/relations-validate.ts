import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { INDEXER_OUTPUT } from '../lib/paths.ts'
import type { AtelierEdge, SourceAnchor, SourceUnit } from '../../../lib/src/index.ts'
import type { AtelierIssue } from '../../../lib/src/results.ts'

/**
 * `bun run relations:validate` command.
 *
 * Strict validation of the deterministic non-`contains` relation
 * graph. Fails (P0) when the count of non-`contains` edges is zero.
 * Fails (P1) when any non-`contains` relation lacks `source_refs`.
 * Fails (P0) when the from/to endpoint of any relation does not
 * resolve to an existing object or anchor id.
 */
export async function runRelationsValidateCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  const issues: AtelierIssue[] = []
  const warnings: string[] = []
  try {
    const [units, anchors, edges] = await Promise.all([
      readNdjson<SourceUnit>(INDEXER_OUTPUT.objectsSource),
      readNdjson<SourceAnchor>(INDEXER_OUTPUT.anchorsFile).catch(() => [] as SourceAnchor[]),
      readNdjson<AtelierEdge>(INDEXER_OUTPUT.edges).catch(() => [] as AtelierEdge[]),
    ])

    const objectIds = new Set<string>(units.map((u) => u.id))
    const anchorIds = new Set<string>(anchors.map((a) => a.id))
    const allIds = new Set<string>([...objectIds, ...anchorIds])

    // P0: at least one non-contains edge.
    const nonContains = edges.filter((e) => e.kind !== 'contains')
    if (nonContains.length === 0) {
      issues.push({
        severity: 'P0',
        code: 'E_NO_NON_CONTAINS_RELATIONS',
        message: 'no non-`contains` relations emitted; relation kernel readiness requires at least one',
        affected_record: INDEXER_OUTPUT.edges,
        recommended_next_action: 'rerun `bun run atelier:index` (or `bun run atelier:relations:index`)',
      })
    }

    // P1: every non-contains edge must carry source_refs.
    for (const e of nonContains) {
      if (!e.source_refs || e.source_refs.length === 0) {
        issues.push({
          severity: 'P1',
          code: 'E_RELATION_MISSING_SOURCE_REFS',
          message: `relation ${e.id} (${e.kind}) has no source_refs`,
          affected_record: e.id,
          recommended_next_action: 'inspect relations builder; non-`contains` relations must carry at least one source_ref',
        })
      }
    }

    // P0: every edge endpoint must resolve.
    for (const e of edges) {
      // The seed `contains` edge from `src:repo:root` is a virtual
      // root and is allowed to be unresolved.
      if (e.kind === 'contains' && e.from === 'src:repo:root') continue
      if (!allIds.has(e.from)) {
        issues.push({
          severity: 'P0',
          code: 'E_RELATION_ENDPOINT_INVALID',
          message: `edge ${e.id} from-id ${e.from} does not resolve to any object or anchor`,
          affected_record: e.id,
        })
      }
      if (!allIds.has(e.to)) {
        issues.push({
          severity: 'P0',
          code: 'E_RELATION_ENDPOINT_INVALID',
          message: `edge ${e.id} to-id ${e.to} does not resolve to any object or anchor`,
          affected_record: e.id,
        })
      }
    }

    const data = {
      edges: edges.length,
      non_contains_edges: nonContains.length,
      anchors: anchors.length,
      units: units.length,
      endpoints_resolved: allIds.size,
    }
    if (issues.length === 0) {
      const result = ok('indexer', 'relations-validate', data, {
        warnings,
        startedAt,
      })
      printResult(result)
      return 0
    }
    const result = fail('indexer', 'relations-validate', issues, data, {
      warnings,
      startedAt,
    })
    printResult(result)
    return 1
  } catch (err) {
    const result = fail<unknown>('indexer', 'relations-validate', [
      {
        severity: 'P0',
        code: 'E_RELATIONS_VALIDATE',
        message: (err as Error).message,
        recommended_next_action: 'rerun `bun run atelier:index` first',
      },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runRelationsValidateCommand().then((code) => process.exit(code))
}
