import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  createNoteSnowflakeId,
  compareNotesByCreatedAtAsc,
} from '../../product/apps/web/src/app/[locale]/(main)/notes/_features/notes.domain'

type LegacyLocalizedText = {
  ja: string
  en?: string
}

type LegacyNoteEntry = {
  id?: string
  body: LegacyLocalizedText
  createdAt: string
  parentId?: string
  externalUrl?: string
  published?: boolean
}

type NormalizedLegacyNoteEntry = {
  id: string
  body: {
    ja: string
    en: string
  }
  createdAt: string
  parentId?: string
  externalUrl?: string
  published?: boolean
}

function printUsage() {
  console.error(
    'Usage: bun scripts/migrate-notes-threading.ts <path-to-notes.json>',
  )
}

function normalizeLegacyEntries(raw: unknown): NormalizedLegacyNoteEntry[] {
  if (!Array.isArray(raw)) {
    throw new Error('notes JSON must be an array')
  }

  return raw.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Entry at index ${index} is not an object`)
    }

    const candidate = entry as LegacyNoteEntry

    if (typeof candidate.createdAt !== 'string' || !candidate.createdAt.trim()) {
      throw new Error(`Entry at index ${index} is missing createdAt`)
    }

    if (
      !candidate.body ||
      typeof candidate.body !== 'object' ||
      typeof candidate.body.ja !== 'string'
    ) {
      throw new Error(`Entry at index ${index} is missing body.ja`)
    }

    return {
      id:
        typeof candidate.id === 'string' && candidate.id.trim()
          ? candidate.id
          : candidate.createdAt,
      body: {
        ja: candidate.body.ja,
        en: typeof candidate.body.en === 'string' ? candidate.body.en : '',
      },
      createdAt: candidate.createdAt,
      parentId: candidate.parentId,
      externalUrl: candidate.externalUrl,
      published: candidate.published,
    }
  })
}

function buildSnowflakeIdMap(entries: readonly NormalizedLegacyNoteEntry[]) {
  const ordered = entries
    .map((entry, originalIndex) => ({
      entry,
      originalIndex,
    }))
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

  const sequenceByTimestamp = new Map<number, number>()
  const idMap = new Map<string, string>()

  for (const { entry } of ordered) {
    const timestampMs = new Date(entry.createdAt).getTime()

    if (Number.isNaN(timestampMs)) {
      throw new Error(`Invalid createdAt timestamp: ${entry.createdAt}`)
    }

    const sequence = sequenceByTimestamp.get(timestampMs) ?? 0
    sequenceByTimestamp.set(timestampMs, sequence + 1)
    idMap.set(entry.id, createNoteSnowflakeId(timestampMs, sequence))
  }

  return idMap
}

function migrateNoteEntries(raw: unknown) {
  const normalizedEntries = normalizeLegacyEntries(raw)
  const idMap = buildSnowflakeIdMap(normalizedEntries)

  const migrated = normalizedEntries.map((entry) => {
    const nextId = idMap.get(entry.id)
    const nextParentId = entry.parentId ? idMap.get(entry.parentId) : undefined

    if (!nextId) {
      throw new Error(`Missing migrated id for note: ${entry.id}`)
    }

    if (entry.parentId && !nextParentId) {
      throw new Error(`Missing migrated parentId for note: ${entry.parentId}`)
    }

    return {
      ...entry,
      id: nextId,
      parentId: nextParentId,
    }
  })

  const ids = new Set<string>()

  for (const entry of migrated) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate note id detected after migration: ${entry.id}`)
    }

    ids.add(entry.id)
  }

  return migrated
}

function main() {
  const targetPath = process.argv[2]

  if (!targetPath) {
    printUsage()
    process.exit(1)
  }

  const absolutePath = resolve(process.cwd(), targetPath)
  const source = readFileSync(absolutePath, 'utf8')
  const raw = JSON.parse(source)
  const migrated = migrateNoteEntries(raw)

  writeFileSync(absolutePath, `${JSON.stringify(migrated, null, 2)}\n`)
  console.log(`Migrated notes threading data: ${absolutePath}`)
}

main()

export { migrateNoteEntries }
