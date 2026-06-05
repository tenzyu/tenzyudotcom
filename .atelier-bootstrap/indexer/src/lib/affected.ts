import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  deterministicId,
  writeJson,
  type AtelierObjectBase,
  type AtelierEdge,
  type SourceUnit,
} from '../../../lib/src/index.ts'
import { INDEXER_OUTPUT } from './paths.ts'
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'

/**
 * Affected engine for the indexer.
 *
 * Compares the current snapshot to the previous one (by sha256 of the unit
 * payloads), marks changed source units and dependent edges stale, and writes
 * the stale state. This file also persists a lightweight snapshot of the
 * previous hashes so the next `affected` invocation has something to compare
 * against.
 */
export type SnapshotEntry = {
  path: string
  id: string
  sha256: string
}

export type StaleMap = {
  generated_at: string
  previous_generated_at: string
  changed: string[]
  added: string[]
  deleted: string[]
  moved: Array<{ from: string; to: string; id: string }>
  stale_units: string[]
  stale_edges: string[]
}

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
 * Compute the affected set by comparing current snapshot to the stored
 * previous one, then mark units and dependent edges as stale.
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

  // Traverse edges to mark dependent edges stale.
  let edges: AtelierEdge[] = []
  try {
    edges = await readNdjson<AtelierEdge>(INDEXER_OUTPUT.edges)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  const staleSet = new Set(staleUnitIds)
  const staleEdges: string[] = []
  for (const e of edges) {
    if (staleSet.has(e.from) || staleSet.has(e.to)) {
      staleEdges.push((e as { id: string }).id)
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
  }
  await writeJson(INDEXER_OUTPUT.indexStale, map)
  await writeSnapshotEntries(current.entries)
  return map
}

export type { AtelierObjectBase }
