import { ok, fail, printResult } from '../../../lib/src/index.ts'
import { scanRepo } from '../lib/scan.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { writeNdjson } from '../../../lib/src/ndjson.ts'
import { writeJson } from '../../../lib/src/json.ts'
import { INDEXER_OUTPUT } from '../lib/paths.ts'
import { buildAnchors, buildByAnchorIndex } from '../lib/anchors.ts'
import { buildDeterministicRelations } from '../lib/relations.ts'
import { buildEdges } from '../lib/build.ts'
import type { AtelierEdge, SourceUnit } from '../../../lib/src/index.ts'

/**
 * `bun run relations-index` command.
 *
 * Lightweight re-build of the deterministic non-`contains` relations.
 * Reads the existing `source.ndjson` (produced by `atelier:index`) and
 * `package.json` scan facts, regenerates anchors, then re-emits
 * `edges.ndjson` (contains + non-contains) plus the `by-anchor.json`
 * index. Designed to be cheap enough to run on every change.
 */
export async function runRelationsIndexCommand(): Promise<number> {
  const startedAt = new Date().toISOString()
  try {
    const scan = await scanRepo(process.cwd(), {
      factsDir: INDEXER_OUTPUT.factsRepo.replace(/[^/]+$/, ''),
    })
    const units = await readNdjson<SourceUnit>(INDEXER_OUTPUT.objectsSource)
    const anchors = await buildAnchors(scan)
    const deterministicEdges = await buildDeterministicRelations(units, anchors, scan)
    const containsEdges = buildEdges(units)
    const allEdges: AtelierEdge[] = [...containsEdges, ...deterministicEdges]
    await writeNdjson(INDEXER_OUTPUT.edges, allEdges)
    await writeNdjson(INDEXER_OUTPUT.anchorsFile, anchors)
    const byAnchor = buildByAnchorIndex(anchors)
    await writeJson(INDEXER_OUTPUT.indexByAnchor, byAnchor)
    const result = ok(
      'indexer',
      'relations-index',
      {
        anchors: anchors.length,
        edges: allEdges.length,
        non_contains_edges: deterministicEdges.length,
        contains_edges: containsEdges.length,
      },
      { startedAt },
    )
    printResult(result)
    return 0
  } catch (err) {
    const result = fail<unknown>('indexer', 'relations-index', [
      {
        severity: 'P0',
        code: 'E_RELATIONS_INDEX',
        message: (err as Error).message,
        recommended_next_action: 'rerun `bun run atelier:index` first',
      },
    ], undefined, { startedAt })
    printResult(result)
    return 1
  }
}

if (import.meta.main) {
  runRelationsIndexCommand().then((code) => process.exit(code))
}
