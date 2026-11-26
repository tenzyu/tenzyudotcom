import { z } from 'zod'
import { normalizeExternalUrl } from './external-url'

type LocalizedText = {
  ja: string
  en: string
}

export type NoteSourceEntry = {
  id: string
  body: LocalizedText
  createdAt: string
  parentId?: string
  externalUrl?: string
  published?: boolean
}

export type NoteTimestampedEntry = {
  createdAt: string
}

const NOTE_SNOWFLAKE_EPOCH = Date.UTC(2026, 0, 1)
const NOTE_SNOWFLAKE_ID_PATTERN = /^\d+$/
const NOTE_SNOWFLAKE_NODE_ID = (() => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(2))
  return (((randomBytes[0] ?? 0) << 8) | (randomBytes[1] ?? 0)) & 0x3ff
})()

let lastSnowflakeTimestamp = -1
let snowflakeSequence = 0

export function compareNotesByCreatedAtDesc(
  a: NoteTimestampedEntry,
  b: NoteTimestampedEntry,
) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

export function compareNotesByCreatedAtAsc(
  a: NoteTimestampedEntry,
  b: NoteTimestampedEntry,
) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

function assertSnowflakeTimestamp(timestampMs: number) {
  if (!Number.isFinite(timestampMs) || timestampMs < NOTE_SNOWFLAKE_EPOCH) {
    throw new Error(`Invalid note snowflake timestamp: ${timestampMs}`)
  }
}

export function createNoteSnowflakeId(
  timestampMs: number,
  sequence = 0,
  nodeId = 0,
) {
  assertSnowflakeTimestamp(timestampMs)

  const timestampPart = BigInt(timestampMs - NOTE_SNOWFLAKE_EPOCH)
  const nodePart = BigInt(nodeId & 0x3ff)
  const sequencePart = BigInt(sequence & 0xfff)

  return ((timestampPart << 22n) | (nodePart << 12n) | sequencePart).toString()
}

export function isNoteSnowflakeId(value: string | undefined) {
  return typeof value === 'string' && NOTE_SNOWFLAKE_ID_PATTERN.test(value)
}

export function createNoteId() {
  const now = Date.now()

  if (now === lastSnowflakeTimestamp) {
    snowflakeSequence = (snowflakeSequence + 1) & 0xfff
  } else {
    lastSnowflakeTimestamp = now
    snowflakeSequence = 0
  }

  return createNoteSnowflakeId(now, snowflakeSequence, NOTE_SNOWFLAKE_NODE_ID)
}

function collectDescendantNoteIds(
  entries: readonly NoteSourceEntry[],
  noteId: string,
) {
  const descendants = new Set<string>()
  const stack = [noteId]
  const children = new Map<string, string[]>()
  for (const entry of entries) {
    if (!entry.parentId) continue
    const siblings = children.get(entry.parentId) ?? []
    siblings.push(entry.id)
    children.set(entry.parentId, siblings)
  }

  while (stack.length > 0) {
    const currentId = stack.pop()

    if (!currentId) {
      continue
    }

    for (const childId of children.get(currentId) ?? []) {
      if (descendants.has(childId)) {
        continue
      }

      descendants.add(childId)
      stack.push(childId)
    }
  }

  return descendants
}

export function reparentChildrenAfterNoteDelete(
  entries: readonly NoteSourceEntry[],
  noteId: string,
) {
  const deleted = entries.find((entry) => entry.id === noteId)

  if (!deleted) {
    return [...entries]
  }

  return entries
    .filter((entry) => entry.id !== noteId)
    .map((entry) =>
      entry.parentId === noteId
        ? {
            ...entry,
            parentId: deleted.parentId,
          }
        : entry,
    )
}

export function listAvailableParentNotes(
  entries: readonly NoteSourceEntry[],
  noteId: string,
) {
  const descendantIds = collectDescendantNoteIds(entries, noteId)

  return entries.filter(
    (entry) => entry.id !== noteId && !descendantIds.has(entry.id),
  )
}

export const NoteBodySchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().optional().default(''),
})

const RawNoteSourceEntrySchema = z.object({
  id: z.string().trim().min(1).optional(),
  body: NoteBodySchema,
  createdAt: z.string().datetime({ offset: true }),
  parentId: z.string().trim().min(1).optional(),
  externalUrl: z.string().trim().min(1).optional(),
  published: z.boolean().optional(),
})

function assertValidNoteThread(entries: readonly NoteSourceEntry[]) {
  const ids = new Set<string>()

  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate note id: ${entry.id}`)
    }

    ids.add(entry.id)
  }

  for (const entry of entries) {
    if (!entry.parentId) {
      continue
    }

    if (entry.parentId === entry.id) {
      throw new Error(`Note cannot reference itself as parent: ${entry.id}`)
    }

    if (!ids.has(entry.parentId)) {
      throw new Error(
        `Note parentId must reference an existing note: ${entry.parentId}`,
      )
    }
  }

  const completed = new Set<string>()
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]))
  for (const entry of entries) {
    let current: string | undefined = entry.id
    const chain = new Set<string>()
    while (current && !completed.has(current)) {
      if (chain.has(current)) {
        throw new Error(`Circular note parent reference detected: ${current}`)
      }
      chain.add(current)
      current = entriesById.get(current)?.parentId
    }
    for (const id of chain) completed.add(id)
  }
}

type RawNoteSourceEntry = z.infer<typeof RawNoteSourceEntrySchema>

function normalizeNoteIds(entries: RawNoteSourceEntry[]): NoteSourceEntry[] {
  const normalized = entries.map((entry) => ({
    id:
      typeof entry.id === 'string' && entry.id.trim()
        ? entry.id
        : entry.createdAt,
    body: entry.body,
    createdAt: entry.createdAt,
    parentId: entry.parentId,
    externalUrl: entry.externalUrl,
    published: entry.published,
  }))

  const legacyEntries = normalized
    .map((entry, originalIndex) => ({
      entry,
      originalIndex,
    }))
    .filter(({ entry }) => !isNoteSnowflakeId(entry.id))
    .sort((a, b) => {
      const timestampOrder = compareNotesByCreatedAtAsc(a.entry, b.entry)

      if (timestampOrder !== 0) {
        return timestampOrder
      }

      const idOrder = a.entry.id.localeCompare(b.entry.id)

      if (idOrder !== 0) {
        return idOrder
      }

      return a.originalIndex - b.originalIndex
    })

  const migratedIdByLegacyId = new Map<string, string>()
  const sequenceByTimestampMs = new Map<number, number>()

  for (const { entry } of legacyEntries) {
    const timestampMs = new Date(entry.createdAt).getTime()

    if (Number.isNaN(timestampMs)) {
      throw new Error(`Invalid createdAt timestamp: ${entry.createdAt}`)
    }

    const sequence = sequenceByTimestampMs.get(timestampMs) ?? 0
    sequenceByTimestampMs.set(timestampMs, sequence + 1)
    migratedIdByLegacyId.set(
      entry.id,
      createNoteSnowflakeId(timestampMs, sequence),
    )
  }

  return normalized.map((entry) => ({
    ...entry,
    id: migratedIdByLegacyId.get(entry.id) ?? entry.id,
    parentId: entry.parentId
      ? (migratedIdByLegacyId.get(entry.parentId) ?? entry.parentId)
      : undefined,
  }))
}

export function parseNoteSourceEntries(raw: unknown) {
  const entries = normalizeNoteIds(z.array(RawNoteSourceEntrySchema).parse(raw))

  for (const entry of entries) {
    if (entry.externalUrl) {
      normalizeExternalUrl(
        entry.externalUrl,
        `note external url (${entry.createdAt})`,
      )
    }
  }

  assertValidNoteThread(entries)

  return entries
}


export type PublicNoteThreadItem = {
  entry: NoteSourceEntry
  depth: number
  parent?: NoteSourceEntry
}

/** Pure visible forest projection; missing/unpublished parents promote replies. */
export function createPublicNoteGraph(entries: readonly NoteSourceEntry[]) {
  const visibleById = new Map(
    entries.filter((entry) => entry.published !== false).map((entry) => [entry.id, entry]),
  )
  const childrenByParent = new Map<string, NoteSourceEntry[]>()
  const roots: NoteSourceEntry[] = []
  for (const entry of visibleById.values()) {
    if (entry.parentId && visibleById.has(entry.parentId)) {
      const children = childrenByParent.get(entry.parentId) ?? []
      children.push(entry)
      childrenByParent.set(entry.parentId, children)
    } else {
      roots.push(entry)
    }
  }
  roots.sort(compareNotesByCreatedAtDesc)
  for (const children of childrenByParent.values()) children.sort(compareNotesByCreatedAtAsc)

  const parentOf = (entry: NoteSourceEntry) =>
    entry.parentId ? visibleById.get(entry.parentId) : undefined
  const item = (entry: NoteSourceEntry, depth: number): PublicNoteThreadItem =>
    ({ entry, depth, parent: parentOf(entry) })

  function flatten(start: readonly NoteSourceEntry[], depth: number) {
    const stack = [...start].reverse().map((entry) => ({ entry, depth }))
    const result: PublicNoteThreadItem[] = []
    const visited = new Set<string>()
    while (stack.length) {
      const current = stack.pop()!
      if (visited.has(current.entry.id)) throw new Error('Circular visible note thread')
      visited.add(current.entry.id)
      result.push(item(current.entry, current.depth))
      const children = childrenByParent.get(current.entry.id) ?? []
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i]
        if (child) stack.push({ entry: child, depth: current.depth + 1 })
      }
    }
    return result
  }

  return {
    feed: () => flatten(roots, 0),
    thread(id: string) {
      const target = visibleById.get(id)
      if (!target) return undefined
      const ancestors: NoteSourceEntry[] = []
      const visited = new Set([target.id])
      for (let parent = parentOf(target); parent; parent = parentOf(parent)) {
        if (visited.has(parent.id)) throw new Error('Circular visible note thread')
        visited.add(parent.id)
        ancestors.push(parent)
      }
      return {
        ancestors: ancestors.reverse().map(item),
        note: item(target, ancestors.length),
        replies: flatten(childrenByParent.get(id) ?? [], ancestors.length + 1),
      }
    },
  }
}
