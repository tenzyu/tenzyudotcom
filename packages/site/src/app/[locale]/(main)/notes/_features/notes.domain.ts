import { getLocalizedUrl } from 'intlayer'

export type LocalizedText = {
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
  return ((randomBytes[0] ?? 0) << 8 | (randomBytes[1] ?? 0)) & 0x3ff
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

export function buildLocalizedNotePath(locale: string, noteId: string) {
  return getLocalizedUrl(`/notes/${noteId}`, locale)
}

export function collectDescendantNoteIds(
  entries: readonly NoteSourceEntry[],
  noteId: string,
) {
  const descendants = new Set<string>()
  const stack = [noteId]

  while (stack.length > 0) {
    const currentId = stack.pop()

    if (!currentId) {
      continue
    }

    for (const entry of entries) {
      if (entry.parentId !== currentId || descendants.has(entry.id)) {
        continue
      }

      descendants.add(entry.id)
      stack.push(entry.id)
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
