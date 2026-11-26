import {
  type ContentSnapshot,
  type ContentRepositorySaveOptions,
  StorageDocumentWriteUncertainError,
  StorageVersionConflictError,
} from './contracts'
import { createContentVersion } from './version'
import { parseJsonCollection } from './json-document'

export type DocumentBase = { version: string; revision: string }
export type DocumentCommandResult =
  | { kind: 'saved'; version: string }
  | { kind: 'conflict' | 'unknown' | 'unchanged' }

export type ItemDocumentStorage = {
  snapshot(): Promise<ContentSnapshot>
  snapshotAt(revision: string): ContentSnapshot
  saveText(pathname: string, bytes: string, options?: ContentRepositorySaveOptions): Promise<void>
}

export function createItemDocumentCommands(storage: ItemDocumentStorage) {
  async function loadItemDocument<T>(
    pathname: string,
    parse: (raw: unknown) => readonly T[],
    revision?: string,
  ) {
    const snapshot = revision
      ? storage.snapshotAt(revision)
      : await storage.snapshot()
    const file = await snapshot.loadText(pathname)
    const document = parseJsonCollection(file?.content, parse, () => [])
    return {
      items: document.collection,
      bytes: file?.content,
      base: { version: document.version, revision: snapshot.version },
    }
  }

  async function executeItemCommand<T>({
    pathname,
    parse,
    base,
    operation,
    change,
  }: {
    pathname: string
    parse: (raw: unknown) => readonly T[]
    base: DocumentBase
    operation: 'apply' | 'check'
    change: (items: readonly T[]) => readonly T[]
  }): Promise<DocumentCommandResult> {
    const current = await loadItemDocument(pathname, parse)
    if (operation === 'apply' && current.base.version !== base.version) {
      return { kind: 'conflict' }
    }

    const original =
      current.base.version === base.version
        ? current
        : await loadItemDocument(pathname, parse, base.revision)
    if (original.base.version !== base.version) return { kind: 'unknown' }

    const serialized = JSON.stringify(change(original.items), null, 2)
    const bytes = `${serialized}\n`
    const saved = {
      kind: 'saved',
      version: createContentVersion(serialized),
    } as const

    if (current.bytes === bytes) return saved
    if (operation === 'check') {
      return {
        kind: current.base.version === base.version ? 'unchanged' : 'unknown',
      }
    }

    try {
      await storage.saveText(pathname, bytes, { expectedVersion: base.version })
      return saved
    } catch (error) {
      if (error instanceof StorageVersionConflictError)
        return { kind: 'conflict' }
      if (!(error instanceof StorageDocumentWriteUncertainError)) throw error
      const latest = await loadItemDocument(pathname, parse).catch(() => null)
      return latest?.bytes === bytes ? saved : { kind: 'unknown' }
    }
  }


  return { loadItemDocument, executeItemCommand }
}
