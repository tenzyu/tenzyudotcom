import {
  githubContentRepository,
  saveGitHubTextFile,
} from './github-content.infra'
import {
  StorageDocumentWriteUncertainError,
  StorageVersionConflictError,
} from './content-store.domain'
import { createContentVersion } from './content-version.infra'
import { parseJsonCollection } from './json-document.infra'
import {
  InvalidItemCommand,
  type DocumentBase,
  type ItemCommandResult,
} from './json-item-command.domain'

export async function loadItemDocument<T>(
  pathname: string,
  parse: (raw: unknown) => readonly T[],
  revision?: string,
) {
  const snapshot = revision
    ? githubContentRepository.snapshotAt(revision)
    : await githubContentRepository.snapshot()
  const file = await snapshot.loadText(pathname)
  const document = parseJsonCollection(file?.content, parse, () => [])
  return {
    items: document.collection,
    bytes: file?.content,
    base: { version: document.version, revision: snapshot.version },
  }
}

export async function executeItemCommand<T>({
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
}): Promise<ItemCommandResult> {
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
    await saveGitHubTextFile(pathname, bytes, { expectedVersion: base.version })
    return saved
  } catch (error) {
    if (error instanceof StorageVersionConflictError)
      return { kind: 'conflict' }
    if (!(error instanceof StorageDocumentWriteUncertainError)) throw error
    const latest = await loadItemDocument(pathname, parse).catch(() => null)
    return latest?.bytes === bytes ? saved : { kind: 'unknown' }
  }
}

export function requireItem<T>(
  items: readonly T[],
  matches: (item: T) => boolean,
): T {
  const item = items.find(matches)
  if (!item)
    throw new InvalidItemCommand(
      'The selected item is no longer in the collection.',
    )
  return item
}
