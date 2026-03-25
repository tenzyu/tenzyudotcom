import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

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

function printUsage() {
  console.error(
    'Usage: bun scripts/migrate-notes-threading.ts <path-to-notes.json>',
  )
}

function migrateNoteEntries(raw: unknown) {
  if (!Array.isArray(raw)) {
    throw new Error('notes JSON must be an array')
  }

  const migrated = raw.map((entry, index) => {
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
      ...candidate,
      id:
        typeof candidate.id === 'string' && candidate.id.trim()
          ? candidate.id
          : candidate.createdAt,
      body: {
        ja: candidate.body.ja,
        en: typeof candidate.body.en === 'string' ? candidate.body.en : '',
      },
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
