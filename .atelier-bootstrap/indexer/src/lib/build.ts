import path from 'node:path'
import {
  deterministicId,
  type SourceFact,
  type SourceRef,
  type SourceUnit,
} from '../../../lib/src/index.ts'
import { INDEXER_CONFIDENCE, INDEXER_PRODUCER, INDEXER_PROVENANCE } from '../schemas/indexer.ts'
import { createLogger } from '../../../lib/src/logger.ts'
import { writeJson } from '../../../lib/src/json.ts'
import { writeNdjson } from '../../../lib/src/ndjson.ts'
import { INDEXER_OUTPUT } from './paths.ts'
import type { ScanFileRow, ScanResult } from './scan.ts'
import { buildAnchors, buildByAnchorIndex } from './anchors.ts'
import { buildDeterministicRelations } from './relations.ts'

const log = createLogger('indexer/build')

/**
 * Map a file path to a `unit_type` based on simple, deterministic heuristics.
 *
 * This is intentionally cheap. Semantic classification belongs to the reader.
 */
function unitTypeForFile(relpath: string): SourceUnit['unit_type'] {
  const base = path.basename(relpath)
  const ext = path.extname(relpath).toLowerCase()
  if (base === 'package.json' || base === 'tsconfig.json' || base.endsWith('.config.js') || base.endsWith('.config.ts')) {
    return 'config_file'
  }
  if (ext === '.md' || ext === '.mdx') {
    return relpath.startsWith('docs/') || relpath.startsWith('harness/') ? 'docs_file' : 'markdown_section'
  }
  if (base.includes('.test.') || base.includes('.spec.') || base.startsWith('test')) {
    return 'test_file'
  }
  if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') {
    return 'symbol_candidate'
  }
  return 'file'
}

/**
 * Best-effort language detection from extension.
 */
function languageFor(relpath: string): string | undefined {
  const ext = path.extname(relpath).toLowerCase()
  const map: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.json': 'json',
    '.md': 'markdown',
    '.mdx': 'markdown',
    '.py': 'python',
    '.rs': 'rust',
    '.nix': 'nix',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.toml': 'toml',
    '.css': 'css',
    '.html': 'html',
    '.sh': 'shell',
    '.sql': 'sql',
  }
  return map[ext]
}

function makeSourceRef(relpath: string, sha256: string): SourceRef {
  return { path: relpath, sha256 }
}

function nowIso(): string {
  return new Date().toISOString()
}

export type BuildResult = {
  units: SourceUnit[]
  facts: SourceFact[]
}

/**
 * Build SourceUnit and SourceFact NDJSON from a scan.
 *
 * The function is deterministic: given the same scan, the same NDJSON is produced.
 */
export function buildObjects(scan: ScanResult): BuildResult {
  const units: SourceUnit[] = []
  const facts: SourceFact[] = []
  const seen = new Set<string>()

  for (const f of scan.files) {
    if (seen.has(f.relpath)) continue
    seen.add(f.relpath)
    const unitType = unitTypeForFile(f.relpath)
    const language = languageFor(f.relpath)
    const id = deterministicId('src', f.relpath)
    const ref = makeSourceRef(f.relpath, f.sha256)
    units.push({
      id,
      kind: 'source_unit',
      version: '1',
      title: f.relpath,
      body_ref: f.relpath,
      source_refs: [ref],
      produced_by: INDEXER_PRODUCER,
      provenance_kind: INDEXER_PROVENANCE,
      confidence: INDEXER_CONFIDENCE,
      status: 'fresh',
      affordances: ['index', 'review-candidate', 'lint-candidate'],
      created_at: nowIso(),
      unit_type: unitType,
      path: f.relpath,
      language,
      sha256: f.sha256,
      byte_size: f.size,
    })
    facts.push({
      id: deterministicId('fact', `file_exists:${f.relpath}`),
      kind: 'source_fact',
      version: '1',
      title: `file_exists ${f.relpath}`,
      source_refs: [ref],
      produced_by: INDEXER_PRODUCER,
      provenance_kind: INDEXER_PROVENANCE,
      confidence: INDEXER_CONFIDENCE,
      status: 'fresh',
      affordances: ['index'],
      created_at: nowIso(),
      fact_type: 'file_exists',
      value: { relpath: f.relpath, sha256: f.sha256, size: f.size },
    })
  }

  if (scan.package) {
    const pkgPath = 'package.json'
    const pkgSha = scan.files.find((f) => f.relpath === pkgPath)?.sha256 ?? ''
    const ref: SourceRef = { path: pkgPath, sha256: pkgSha }
    const pm = typeof (scan.package as { packageManager?: string }).packageManager === 'string'
      ? (scan.package as { packageManager: string }).packageManager
      : 'npm'
    facts.push({
      id: deterministicId('fact', 'package_manager'),
      kind: 'source_fact',
      version: '1',
      title: 'package_manager',
      source_refs: [ref],
      produced_by: INDEXER_PRODUCER,
      provenance_kind: INDEXER_PROVENANCE,
      confidence: INDEXER_CONFIDENCE,
      status: 'fresh',
      affordances: ['index'],
      created_at: nowIso(),
      fact_type: 'package_manager',
      value: pm,
    })
    facts.push({
      id: deterministicId('fact', 'workspace_config'),
      kind: 'source_fact',
      version: '1',
      title: 'workspace_config',
      source_refs: [ref],
      produced_by: INDEXER_PRODUCER,
      provenance_kind: INDEXER_PROVENANCE,
      confidence: INDEXER_CONFIDENCE,
      status: 'fresh',
      affordances: ['index'],
      created_at: nowIso(),
      fact_type: 'workspace_config',
      value: scan.workspace ?? null,
    })
  }
  if (scan.scripts) {
    const pkgPath = 'package.json'
    const pkgSha = scan.files.find((f) => f.relpath === pkgPath)?.sha256 ?? ''
    facts.push({
      id: deterministicId('fact', 'package_scripts'),
      kind: 'source_fact',
      version: '1',
      title: 'package_scripts',
      source_refs: [{ path: pkgPath, sha256: pkgSha }],
      produced_by: INDEXER_PRODUCER,
      provenance_kind: INDEXER_PROVENANCE,
      confidence: INDEXER_CONFIDENCE,
      status: 'fresh',
      affordances: ['index', 'test-candidate'],
      created_at: nowIso(),
      fact_type: 'script_exists',
      value: scan.scripts,
    })
  }
  if (Object.keys(scan.extensions).length > 0) {
    facts.push({
      id: deterministicId('fact', 'extension_histogram'),
      kind: 'source_fact',
      version: '1',
      title: 'extension_histogram',
      source_refs: [],
      produced_by: INDEXER_PRODUCER,
      provenance_kind: INDEXER_PROVENANCE,
      confidence: INDEXER_CONFIDENCE,
      status: 'fresh',
      affordances: ['index'],
      created_at: nowIso(),
      fact_type: 'extension_histogram',
      value: scan.extensions,
    })
  }
  // Detect candidate test framework from script names and test file extensions.
  const hasVitest = Boolean(scan.scripts && Object.keys(scan.scripts as Record<string, string>).some((k) => /vitest/.test(k) || /test/.test(k)))
  if (hasVitest) {
    facts.push({
      id: deterministicId('fact', 'test_framework_candidate'),
      kind: 'source_fact',
      version: '1',
      title: 'test_framework_candidate',
      source_refs: [{ path: 'package.json', sha256: scan.files.find((f) => f.relpath === 'package.json')?.sha256 ?? '' }],
      produced_by: INDEXER_PRODUCER,
      provenance_kind: INDEXER_PROVENANCE,
      confidence: INDEXER_CONFIDENCE,
      status: 'fresh',
      affordances: ['index', 'test-candidate'],
      created_at: nowIso(),
      fact_type: 'test_framework_candidate',
      value: 'vitest-or-bun-test',
    })
  }
  // git_status and naming patterns could be expanded here.
  return { units, facts }
}

/**
 * Build `contains` edges: each `SourceUnit` is contained by the repository root.
 * Real graph traversal happens in the affected engine, but the seed edges
 * establish the structure.
 */
export function buildEdges(units: ReadonlyArray<SourceUnit>): Array<{
  id: string
  from: string
  to: string
  kind: 'contains'
  provenance_kind: 'deterministic_fact'
  source_refs: SourceRef[]
  confidence: 'fact'
  status: 'fresh'
  created_at: string
}> {
  const repoId = 'src:repo:root'
  const now = nowIso()
  return units.map((u) => ({
    id: deterministicId('edge', `contains:${repoId}->${u.id}`),
    from: repoId,
    to: u.id,
    kind: 'contains',
    provenance_kind: INDEXER_PROVENANCE,
    source_refs: u.source_refs,
    confidence: INDEXER_CONFIDENCE,
    status: 'fresh',
    created_at: now,
  }))
}

/**
 * Persist all indexer outputs in the standard layout.
 */
export async function writeIndex(scan: ScanResult): Promise<{
  units: number
  facts: number
  edges: number
  anchors: number
  non_contains_edges: number
}> {
  const { units, facts } = buildObjects(scan)
  const containsEdges = buildEdges(units)
  const anchors = await buildAnchors(scan)
  const deterministicEdges = await buildDeterministicRelations(units, anchors, scan)
  const allEdges = [...containsEdges, ...deterministicEdges]
  await writeJson(INDEXER_OUTPUT.factsRepo, scan.repo)
  await writeJson(INDEXER_OUTPUT.factsPackage, scan.package)
  await writeJson(INDEXER_OUTPUT.factsScripts, scan.scripts)
  await writeJson(INDEXER_OUTPUT.factsWorkspace, scan.workspace)
  await writeJson(INDEXER_OUTPUT.factsGit, null)
  await writeNdjson(
    INDEXER_OUTPUT.factsFiles,
    scan.files.map((f) => ({ relpath: f.relpath, size: f.size, sha256: f.sha256, mtime_ms: f.mtime_ms })),
  )
  await writeJson(INDEXER_OUTPUT.factsExtensions, scan.extensions)
  await writeNdjson(INDEXER_OUTPUT.objectsSource, units)
  await writeNdjson(INDEXER_OUTPUT.anchorsFile, anchors)
  await writeNdjson(INDEXER_OUTPUT.edges, allEdges)
  log.info(
    `wrote ${units.length} source units, ${facts.length} facts, ${anchors.length} anchors, ${allEdges.length} edges (${deterministicEdges.length} non-contains)`,
  )

  // Build indexes.
  const byPath: Record<string, string> = {}
  const byKind: Record<string, string[]> = {}
  const byHash: Record<string, string[]> = {}
  for (const u of units) {
    byPath[u.path] = u.id
    const kind = `${u.kind}:${u.unit_type}`
    if (!byKind[kind]) byKind[kind] = []
    byKind[kind].push(u.id)
    if (u.sha256) {
      if (!byHash[u.sha256]) byHash[u.sha256] = []
      byHash[u.sha256].push(u.id)
    }
  }
  const byObject: Record<string, string[]> = {}
  for (const e of allEdges) {
    if (!byObject[e.from]) byObject[e.from] = []
    byObject[e.from].push(e.to)
  }
  const byAnchor = buildByAnchorIndex(anchors)
  await writeJson(INDEXER_OUTPUT.indexByPath, byPath)
  await writeJson(INDEXER_OUTPUT.indexByKind, byKind)
  await writeJson(INDEXER_OUTPUT.indexByHash, byHash)
  await writeJson(INDEXER_OUTPUT.indexByObject, byObject)
  await writeJson(INDEXER_OUTPUT.indexByAnchor, byAnchor)
  await writeJson(INDEXER_OUTPUT.indexStale, { stale: [] })
  // Also write facts as NDJSON so the reader can scan them.
  await writeNdjson(path.join(path.dirname(INDEXER_OUTPUT.objectsSource), 'facts.ndjson'), facts)
  return {
    units: units.length,
    facts: facts.length,
    edges: allEdges.length,
    anchors: anchors.length,
    non_contains_edges: deterministicEdges.length,
  }
}
