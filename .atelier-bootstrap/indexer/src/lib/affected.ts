import { readdir } from 'node:fs/promises'
import path from 'node:path'
import {
  type AtelierEdge,
  type SourceUnit,
} from '../../../lib/src/index.ts'
import { INDEXER_OUTPUT } from './paths.ts'
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import { writeJson } from '../../../lib/src/json.ts'
import {
  ATELIER_V0,
  EXECUTOR_PATHS,
  TRANSFORMER_PATHS,
} from '../../../lib/src/paths.ts'

/**
 * Affected engine for the indexer.
 *
 * Compares the current snapshot to the previous one (by sha256 of the unit
 * payloads), marks changed source units and dependent edges stale, and walks
 * the graph transitively to mark every dependent OBJECT stale. The output
 * of `bun run affected` is the single source of truth for the reader,
 * transformer, and executor when they want to know what to redo.
 *
 * This is intentionally edge-driven: a dependent object is any object that
 * is reachable from a changed unit through `depends_on`, `transforms_to`,
 * `references`, `verifies`, `satisfies`, `constrains`, or `defines` edges.
 *
 * `contains` edges from `src:repo:root` are not propagated because they
 * describe the repository skeleton, not a semantic dependency.
 *
 * NOTE on design: the indexer only emits `contains` edges today. Reader,
 * transformer, and executor will emit `references`/`depends_on`/
 * `transforms_to`/`verifies`/`satisfies`/`constrains` edges as they run.
 * As those edges arrive, the dependent set in `stale.json` will surface
 * the real cascade. Until then, dependents may be empty.
 */

export type SnapshotEntry = {
  path: string
  id: string
  sha256: string
}

export type DependentObjects = {
  source_unit: string[]
  source_fact: string[]
  knowledge_object: string[]
  semantic_claim: string[]
  attention_set: string[]
  implementation_task: string[]
  test_contract: string[]
  edit_boundary: string[]
  packet_template: string[]
  execution_packet: string[]
  evidence_record: string[]
  transform_recommendation: string[]
  blocker: string[]
  other: string[]
}

export type StaleMap = {
  generated_at: string
  previous_generated_at: string
  /** Paths of source files that changed on disk. */
  changed: string[]
  /** Paths added to the repository. */
  added: string[]
  /** Paths removed from the repository. */
  deleted: string[]
  /** Paths moved within the repository. */
  moved: Array<{ from: string; to: string; id: string }>
  /** Source unit ids whose on-disk payload changed. */
  stale_units: string[]
  /** Edge ids whose endpoint changed. */
  stale_edges: string[]
  /**
   * Dependent object ids reachable from the stale set, grouped by kind.
   * The reader/transformer/executor use this to know exactly what they
   * need to redo. A change to a single source unit therefore surfaces
   * its dependents — it does not stop at the changed set.
   */
  dependent_objects: DependentObjects
  /**
   * Edges that were traversed while computing dependents.
   */
  traversed_edge_ids: string[]
  /**
   * Maximum number of hops used to reach the deepest dependent.
   */
  max_hops: number
  /**
   * Total dependent object count across all kinds.
   */
  total_dependents: number
}

const REPO_ROOT_ID = 'src:repo:root'

async function loadSnapshot(): Promise<{ entries: SnapshotEntry[]; generatedAt: string }> {
  const unitsPath = INDEXER_OUTPUT.objectsSource
  const generatedAt = new Date().toISOString()
  let units: SourceUnit[] = []
  try {
    units = await readNdjson<SourceUnit>(unitsPath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  return {
    generatedAt,
    entries: units
      .filter((u) => u.unit_type !== undefined)
      .map((u) => ({ path: u.path, id: u.id, sha256: u.sha256 })),
  }
}

async function writeSnapshotEntries(entries: ReadonlyArray<SnapshotEntry>): Promise<void> {
  const target = path.join(path.dirname(INDEXER_OUTPUT.indexStale), 'previous-snapshot.ndjson')
  await writeNdjson(target, entries)
}

async function readPreviousSnapshot(): Promise<SnapshotEntry[]> {
  const target = path.join(path.dirname(INDEXER_OUTPUT.indexStale), 'previous-snapshot.ndjson')
  return readNdjson<SnapshotEntry>(target)
}

/**
 * Edge kinds that propagate staleness. `contains` is intentionally
 * excluded because it describes the repository skeleton, not a
 * semantic dependency.
 */
const PROPAGATING_EDGE_KINDS: ReadonlySet<string> = new Set([
  'defines',
  'references',
  'depends_on',
  'supports',
  'constrains',
  'transforms_to',
  'verifies',
  'satisfies',
  'invalidates',
])

type DependentKind = keyof DependentObjects

const DEPENDENT_KIND_BUCKETS: ReadonlyArray<DependentKind> = [
  'source_unit',
  'source_fact',
  'knowledge_object',
  'semantic_claim',
  'attention_set',
  'implementation_task',
  'test_contract',
  'edit_boundary',
  'packet_template',
  'execution_packet',
  'evidence_record',
  'transform_recommendation',
  'blocker',
]

function emptyDependents(): DependentObjects {
  const out: Partial<DependentObjects> = {}
  for (const k of DEPENDENT_KIND_BUCKETS) out[k] = []
  out.other = []
  return out as DependentObjects
}

/**
 * Build adjacency lists for fast graph traversal.
 */
function buildGraph(
  edges: ReadonlyArray<AtelierEdge>,
): {
  outEdges: Map<string, Array<{ edgeId: string; to: string }>>
  inEdges: Map<string, Array<{ edgeId: string; from: string }>>
  edgeMeta: Map<string, AtelierEdge>
} {
  const outEdges = new Map<string, Array<{ edgeId: string; to: string }>>()
  const inEdges = new Map<string, Array<{ edgeId: string; from: string }>>()
  const edgeMeta = new Map<string, AtelierEdge>()
  for (const e of edges) {
    edgeMeta.set(e.id, e)
    if (!outEdges.has(e.from)) outEdges.set(e.from, [])
    outEdges.get(e.from)!.push({ edgeId: e.id, to: e.to })
    if (!inEdges.has(e.to)) inEdges.set(e.to, [])
    inEdges.get(e.to)!.push({ edgeId: e.id, from: e.from })
  }
  return { outEdges, inEdges, edgeMeta }
}

/**
 * BFS from the stale seed set over propagating edges. Returns:
 *  - the set of dependent object ids (excluding the seed)
 *  - the set of edge ids traversed
 *  - the maximum hop distance reached
 */
function bfsDependents(
  seedIds: ReadonlySet<string>,
  graph: ReturnType<typeof buildGraph>,
): { dependents: Set<string>; traversedEdgeIds: Set<string>; maxHops: number } {
  const dependents = new Set<string>()
  const traversedEdgeIds = new Set<string>()
  let maxHops = 0
  const queue: Array<{ id: string; depth: number }> = []
  for (const s of seedIds) queue.push({ id: s, depth: 0 })
  const seen = new Set<string>(seedIds)
  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur.depth > maxHops) maxHops = cur.depth
    const out = graph.outEdges.get(cur.id) ?? []
    for (const { edgeId, to } of out) {
      const edge = graph.edgeMeta.get(edgeId)
      if (!edge) continue
      if (!PROPAGATING_EDGE_KINDS.has(edge.kind)) continue
      traversedEdgeIds.add(edgeId)
      if (!seen.has(to)) {
        seen.add(to)
        dependents.add(to)
        queue.push({ id: to, depth: cur.depth + 1 })
      }
    }
    const inn = graph.inEdges.get(cur.id) ?? []
    for (const { edgeId, from } of inn) {
      const edge = graph.edgeMeta.get(edgeId)
      if (!edge) continue
      if (!PROPAGATING_EDGE_KINDS.has(edge.kind)) continue
      traversedEdgeIds.add(edgeId)
      if (!seen.has(from)) {
        seen.add(from)
        dependents.add(from)
        queue.push({ id: from, depth: cur.depth + 1 })
      }
    }
  }
  return { dependents, traversedEdgeIds, maxHops }
}

/**
 * NDJSON file -> (file path, default kind) pairs. The first array
 * element is the file path, the second is the object kind assumed
 * when a record's `kind` is missing.
 */
const NDJSON_OBJECT_SOURCES: ReadonlyArray<{ file: string; kind: DependentKind }> = [
  { file: INDEXER_OUTPUT.objectsSource, kind: 'source_unit' },
  { file: path.join(ATELIER_V0.objects, 'facts.ndjson'), kind: 'source_fact' },
  { file: path.join(ATELIER_V0.objects, 'knowledge.ndjson'), kind: 'knowledge_object' },
  { file: path.join(ATELIER_V0.objects, 'semantics.ndjson'), kind: 'semantic_claim' },
  { file: path.join(ATELIER_V0.objects, 'attention.ndjson'), kind: 'attention_set' },
  { file: TRANSFORMER_PATHS.implementationTasks, kind: 'implementation_task' },
  { file: TRANSFORMER_PATHS.testContracts, kind: 'test_contract' },
  { file: TRANSFORMER_PATHS.editBoundaries, kind: 'edit_boundary' },
  { file: TRANSFORMER_PATHS.packetTemplates, kind: 'packet_template' },
  { file: TRANSFORMER_PATHS.recommendations, kind: 'transform_recommendation' },
]

/**
 * Load every NDJSON object file under `.atelier/v0/objects/**` and
 * `.atelier/v0/transforms/md-to-code/model/**` and bucket them by
 * `kind` so dependents can be classified. Missing files are
 * silently skipped.
 */
async function loadObjectKindMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  for (const { file, kind } of NDJSON_OBJECT_SOURCES) {
    let rows: Array<{ id?: string; kind?: string }> = []
    try {
      rows = await readNdjson<{ id?: string; kind?: string }>(file)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue
      // Any other read error is reported but does not abort affected.
      if (process.env.ATELIER_DEBUG) {
        process.stderr.write(`[affected] skip ${file}: ${(err as Error).message}\n`)
      }
      continue
    }
    for (const r of rows) if (r.id) map.set(r.id, r.kind ?? kind)
  }
  // The executor stores evidence / handoffs / blockers as individual
  // files. We scan the directories to find them and pull out the
  // object id from each row.
  await scanNdjsonDir(EXECUTOR_PATHS.handoffsDir, map, 'execution_packet')
  await scanNdjsonDir(EXECUTOR_PATHS.blockersDir, map, 'blocker')
  await scanEvidenceDir(EXECUTOR_PATHS.evidenceDir, map)
  return map
}

async function scanNdjsonDir(
  dir: string,
  out: Map<string, string>,
  defaultKind: DependentKind,
): Promise<void> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return
    if (process.env.ATELIER_DEBUG) {
      process.stderr.write(`[affected] skip dir ${dir}: ${(err as Error).message}\n`)
    }
    return
  }
  for (const name of entries) {
    if (!name.endsWith('.ndjson')) continue
    let rows: Array<{ id?: string; kind?: string }> = []
    try {
      rows = await readNdjson<{ id?: string; kind?: string }>(path.join(dir, name))
    } catch (err) {
      if (process.env.ATELIER_DEBUG) {
        process.stderr.write(`[affected] skip file ${name}: ${(err as Error).message}\n`)
      }
      continue
    }
    for (const r of rows) if (r.id) out.set(r.id, r.kind ?? defaultKind)
  }
}

async function scanEvidenceDir(
  dir: string,
  out: Map<string, string>,
): Promise<void> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return
    if (process.env.ATELIER_DEBUG) {
      process.stderr.write(`[affected] skip dir ${dir}: ${(err as Error).message}\n`)
    }
    return
  }
  for (const name of entries) {
    if (!name.endsWith('.json') && !name.endsWith('.ndjson')) continue
    let rows: Array<{ id?: string; kind?: string }> = []
    try {
      rows = await readNdjson<{ id?: string; kind?: string }>(path.join(dir, name))
    } catch (err) {
      // Single JSON object case: try parse-as-array.
      try {
        const text = await (await import('node:fs/promises')).readFile(path.join(dir, name), 'utf8')
        const obj = JSON.parse(text) as { id?: string; kind?: string }
        if (obj.id) out.set(obj.id, obj.kind ?? 'evidence_record')
        continue
      } catch {
        if (process.env.ATELIER_DEBUG) {
          process.stderr.write(`[affected] skip file ${name}: ${(err as Error).message}\n`)
        }
        continue
      }
    }
    for (const r of rows) if (r.id) out.set(r.id, r.kind ?? 'evidence_record')
  }
}

function bucketOfKind(rawKind: string | undefined): DependentKind {
  if (!rawKind) return 'other'
  if ((DEPENDENT_KIND_BUCKETS as ReadonlyArray<string>).includes(rawKind)) {
    return rawKind as DependentKind
  }
  return 'other'
}

/**
 * Compute the affected set by comparing current snapshot to the stored
 * previous one, then mark units and dependent edges AND objects as
 * stale. The dependents are bucketed by object kind and written into
 * `.atelier/v0/indexes/stale.json`.
 */
export async function computeAffected(): Promise<StaleMap> {
  const current = await loadSnapshot()
  const previous = await readPreviousSnapshot()
  const prevByPath = new Map<string, SnapshotEntry>()
  const prevById = new Map<string, SnapshotEntry>()
  for (const e of previous) {
    prevByPath.set(e.path, e)
    prevById.set(e.id, e)
  }
  const curByPath = new Map<string, SnapshotEntry>()
  for (const e of current.entries) curByPath.set(e.path, e)

  const changed: string[] = []
  const added: string[] = []
  const deleted: string[] = []
  const moved: Array<{ from: string; to: string; id: string }> = []
  const staleUnitIds: string[] = []

  for (const cur of current.entries) {
    const prev = prevByPath.get(cur.path)
    if (!prev) {
      added.push(cur.path)
      staleUnitIds.push(cur.id)
      continue
    }
    if (prev.sha256 !== cur.sha256) {
      changed.push(cur.path)
      staleUnitIds.push(cur.id)
    }
  }
  for (const prev of previous) {
    if (!curByPath.has(prev.path)) {
      const cur = [...current.entries].find((e) => e.sha256 === prev.sha256 && e.path !== prev.path)
      if (cur) {
        moved.push({ from: prev.path, to: cur.path, id: cur.id })
        staleUnitIds.push(cur.id)
      } else {
        deleted.push(prev.path)
      }
    }
  }

  // Load all edges and the object-kind map.
  let edges: AtelierEdge[] = []
  try {
    edges = await readNdjson<AtelierEdge>(INDEXER_OUTPUT.edges)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  const kindMap = await loadObjectKindMap()

  // Build the graph and propagate dependents from the stale set.
  const graph = buildGraph(edges)
  const seed = new Set<string>(staleUnitIds)
  const bfs = bfsDependents(seed, graph)

  // Compute stale edge ids: any edge whose endpoint is in the union
  // of the seed and the dependents is stale. The `contains` edge from
  // `src:repo:root` is exempt.
  const reach = new Set<string>([...seed, ...bfs.dependents])
  const staleEdges: string[] = []
  for (const e of edges) {
    if (e.kind === 'contains' && e.from === REPO_ROOT_ID) continue
    if (reach.has(e.from) || reach.has(e.to)) staleEdges.push(e.id)
  }

  // Bucket dependents by kind. Anything not in the map lands in `other`.
  const dependents = emptyDependents()
  let totalDependents = 0
  for (const depId of bfs.dependents) {
    if (seed.has(depId)) continue // never count the seed itself
    const bucket = bucketOfKind(kindMap.get(depId))
    if (!dependents[bucket].includes(depId)) {
      dependents[bucket].push(depId)
      totalDependents += 1
    }
  }

  const map: StaleMap = {
    generated_at: current.generatedAt,
    previous_generated_at: previous.length > 0 ? 'previous' : 'none',
    changed,
    added,
    deleted,
    moved,
    stale_units: staleUnitIds,
    stale_edges: staleEdges,
    dependent_objects: dependents,
    traversed_edge_ids: [...bfs.traversedEdgeIds].sort(),
    max_hops: bfs.maxHops,
    total_dependents: totalDependents,
  }
  await writeJson(INDEXER_OUTPUT.indexStale, map)
  await writeSnapshotEntries(current.entries)
  return map
}
