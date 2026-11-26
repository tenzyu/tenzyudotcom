import {
  githubContentRepository,
  saveGitHubTextFile,
} from './github-content.infra'
import { createItemDocumentCommands } from '@tenzyu/revisioned-content/item-command'
import { InvalidItemCommand } from './json-item-command.validation'

export const { loadItemDocument, executeItemCommand } = createItemDocumentCommands({
  snapshot: githubContentRepository.snapshot,
  snapshotAt: githubContentRepository.snapshotAt,
  saveText: saveGitHubTextFile,
})

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
