import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { readJson } from '../../../lib/src/json.ts'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { INDEXER_OUTPUT } from './paths.ts'
import { type SourceUnit, type SourceAnchor, type AtelierEdge } from '../../../lib/src/index.ts'
import { createLogger } from '../../../lib/src/logger.ts'

const log = createLogger('indexer/render')

const GENERATED_MARKER = '<!-- GENERATED FILE. DO NOT EDIT DIRECTLY. -->'

function header(title: string, source: string): string {
  return [
    GENERATED_MARKER,
    `# ${title}`,
    '',
    `Source: \`${source}\``,
    `Generated: ${new Date().toISOString()}`,
    '',
  ].join('\n')
}

/**
 * Render the INDEX_SUMMARY view.
 */
export async function renderIndexSummary(): Promise<string> {
  const repo = (await readJson(INDEXER_OUTPUT.factsRepo)) as {
    total_files: number
    total_bytes: number
    root: string
  } | null
  const extensions = (await readJson(INDEXER_OUTPUT.factsExtensions)) as Record<string, number> | null
  const packages = (await readJson(INDEXER_OUTPUT.factsPackage)) as Record<string, unknown> | null
  const scripts = (await readJson(INDEXER_OUTPUT.factsScripts)) as Record<string, string> | null
  const out: string[] = [header('INDEX_SUMMARY', 'atelier-indexer scan + index')]
  out.push('## Repository')
  if (repo) {
    out.push(`- root: \`${repo.root}\``)
    out.push(`- total_files: ${repo.total_files}`)
    out.push(`- total_bytes: ${repo.total_bytes}`)
  } else {
    out.push('- (no scan yet)')
  }
  out.push('')
  out.push('## Package')
  if (packages) {
    out.push('```json')
    out.push(JSON.stringify(packages, null, 2))
    out.push('```')
  } else {
    out.push('- (no package.json)')
  }
  out.push('')
  out.push('## Scripts')
  if (scripts && Object.keys(scripts).length > 0) {
    out.push('| Script | Command |')
    out.push('| --- | --- |')
    for (const [k, v] of Object.entries(scripts)) {
      out.push(`| \`${k}\` | \`${v}\` |`)
    }
  } else {
    out.push('- (no scripts)')
  }
  out.push('')
  out.push('## Extensions')
  if (extensions) {
    out.push('| Extension | Count |')
    out.push('| --- | --- |')
    const sorted = Object.entries(extensions).sort((a, b) => b[1] - a[1])
    for (const [ext, count] of sorted) {
      out.push(`| \`${ext}\` | ${count} |`)
    }
  } else {
    out.push('- (no extensions recorded)')
  }
  out.push('')
  return out.join('\n')
}

/**
 * Render the SOURCE_UNITS view.
 */
export async function renderSourceUnits(): Promise<string> {
  const units = await readNdjson<SourceUnit>(INDEXER_OUTPUT.objectsSource)
  const out: string[] = [header('SOURCE_UNITS', 'atelier-indexer index')]
  out.push(`Total units: ${units.length}`)
  out.push('')
  out.push('| ID | Type | Path | Lang | Bytes | Sha256 |')
  out.push('| --- | --- | --- | --- | ---: | --- |')
  for (const u of units.slice(0, 200)) {
    out.push(`| \`${u.id}\` | ${u.unit_type} | \`${u.path}\` | ${u.language ?? ''} | ${u.byte_size} | \`${u.sha256.slice(0, 12)}\` |`)
  }
  if (units.length > 200) {
    out.push(`| ... | | _${units.length - 200} more_ | | | |`)
  }
  out.push('')
  return out.join('\n')
}

/**
 * Render the AFFECTED view from the stale map.
 */
export async function renderAffected(): Promise<string> {
  const map = (await readJson(INDEXER_OUTPUT.indexStale)) as
    | {
        generated_at: string
        previous_generated_at: string
        changed: string[]
        added: string[]
        deleted: string[]
        moved: Array<{ from: string; to: string }>
        stale_units: string[]
        stale_edges: string[]
        dependent_objects?: Record<string, string[]>
        total_dependents?: number
        max_hops?: number
        traversed_edge_ids?: string[]
      }
    | null
  const out: string[] = [header('AFFECTED', 'atelier-indexer affected')]
  if (!map) {
    out.push('No affected run recorded yet.')
  } else {
    out.push(`- generated_at: ${map.generated_at}`)
    out.push(`- previous: ${map.previous_generated_at}`)
    out.push(`- changed: ${map.changed.length}`)
    out.push(`- added: ${map.added.length}`)
    out.push(`- deleted: ${map.deleted.length}`)
    out.push(`- moved: ${map.moved.length}`)
    out.push(`- stale units: ${map.stale_units.length}`)
    out.push(`- stale edges: ${map.stale_edges.length}`)
    out.push(`- total dependents: ${map.total_dependents ?? 0}`)
    out.push(`- max hops: ${map.max_hops ?? 0}`)
    out.push('')
    if (map.changed.length > 0) {
      out.push('### Changed')
      for (const p of map.changed.slice(0, 100)) out.push(`- \`${p}\``)
      if (map.changed.length > 100) out.push(`- ... ${map.changed.length - 100} more`)
      out.push('')
    }
    if (map.added.length > 0) {
      out.push('### Added')
      for (const p of map.added.slice(0, 100)) out.push(`- \`${p}\``)
      if (map.added.length > 100) out.push(`- ... ${map.added.length - 100} more`)
      out.push('')
    }
    if (map.deleted.length > 0) {
      out.push('### Deleted')
      for (const p of map.deleted.slice(0, 100)) out.push(`- \`${p}\``)
      if (map.deleted.length > 100) out.push(`- ... ${map.deleted.length - 100} more`)
      out.push('')
    }
    if (map.moved.length > 0) {
      out.push('### Moved')
      for (const m of map.moved.slice(0, 100)) out.push(`- \`${m.from}\` -> \`${m.to}\``)
      out.push('')
    }
    if (map.dependent_objects) {
      out.push('### Dependent objects (cascaded via edges)')
      const ordered = Object.entries(map.dependent_objects).filter(
        ([, ids]) => ids.length > 0,
      ) as Array<[string, string[]]>
      if (ordered.length === 0) {
        out.push('- (no dependents surfaced yet; reader/transformer/executor edges will populate this as they run)')
      } else {
        for (const [kind, ids] of ordered) {
          out.push(`- **${kind}** (${ids.length})`)
          for (const id of ids.slice(0, 25)) out.push(`  - \`${id}\``)
          if (ids.length > 25) out.push(`  - ... ${ids.length - 25} more`)
        }
      }
      out.push('')
    }
  }
  return out.join('\n')
}

/**
 * Render the ANCHORS view: anchor counts by kind, plus the count of
 * non-`contains` relations. Generated from the anchor and edge files.
 */
export async function renderAnchors(): Promise<string> {
  const anchors = await readNdjson<SourceAnchor>(INDEXER_OUTPUT.anchorsFile).catch(
    () => [] as SourceAnchor[],
  )
  const edges = await readNdjson<AtelierEdge>(INDEXER_OUTPUT.edges).catch(
    () => [] as AtelierEdge[],
  )
  const out: string[] = [header('ANCHORS', 'atelier-indexer relations-index')]
  out.push(`Total anchors: ${anchors.length}`)
  out.push('')
  // Count by kind.
  const byKind: Record<string, number> = {}
  for (const a of anchors) byKind[a.kind] = (byKind[a.kind] ?? 0) + 1
  out.push('## Anchors by kind')
  out.push('| Kind | Count |')
  out.push('| --- | ---: |')
  const kinds = Object.keys(byKind).sort()
  for (const k of kinds) out.push(`| \`${k}\` | ${byKind[k]} |`)
  out.push('')
  // Non-contains relations summary.
  const nonContains = edges.filter((e) => e.kind !== 'contains')
  const byEdge: Record<string, number> = {}
  for (const e of nonContains) byEdge[e.kind] = (byEdge[e.kind] ?? 0) + 1
  out.push('## Non-`contains` relations by kind')
  out.push(`Total non-` + '`' + `contains` + '`' + ` relations: ${nonContains.length}`)
  out.push('')
  out.push('| Kind | Count |')
  out.push('| --- | ---: |')
  const edgeKinds = Object.keys(byEdge).sort()
  if (edgeKinds.length === 0) {
    out.push('| (none) | 0 |')
  } else {
    for (const k of edgeKinds) out.push(`| \`${k}\` | ${byEdge[k]} |`)
  }
  out.push('')
  // Top anchors (by id) for quick scan, capped to 50.
  out.push('## First anchors (capped to 50)')
  out.push('| ID | Kind | Path | Symbol | Selector |')
  out.push('| --- | --- | --- | --- | --- |')
  for (const a of anchors.slice(0, 50)) {
    out.push(
      `| \`${a.id}\` | ${a.kind} | \`${a.path}\` | ${a.symbol_name ?? ''} | ${a.selector_strategy} |`,
    )
  }
  if (anchors.length > 50) {
    out.push(`| ... | | _${anchors.length - 50} more_ | | |`)
  }
  out.push('')
  return out.join('\n')
}

export async function renderAll(): Promise<{ files: string[] }> {
  await mkdir(path.dirname(INDEXER_OUTPUT.viewIndexSummary), { recursive: true })
  const summary = await renderIndexSummary()
  const units = await renderSourceUnits()
  const affected = await renderAffected()
  const anchors = await renderAnchors()
  await writeFile(INDEXER_OUTPUT.viewIndexSummary, summary, 'utf8')
  await writeFile(INDEXER_OUTPUT.viewSourceUnits, units, 'utf8')
  await writeFile(INDEXER_OUTPUT.viewAffected, affected, 'utf8')
  await writeFile(INDEXER_OUTPUT.viewAnchors, anchors, 'utf8')
  log.info('rendered index views')
  return {
    files: [
      INDEXER_OUTPUT.viewIndexSummary,
      INDEXER_OUTPUT.viewSourceUnits,
      INDEXER_OUTPUT.viewAffected,
      INDEXER_OUTPUT.viewAnchors,
    ],
  }
}
