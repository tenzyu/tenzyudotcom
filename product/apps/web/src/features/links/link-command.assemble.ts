import {
  type DocumentBase,
  InvalidItemCommand,
} from '@/platform/content-store/json-item-command.validation'
import {
  executeItemCommand,
  loadItemDocument,
  requireItem,
} from '@/platform/content-store/json-item-command.infra'
import {
  LinkCommand,
  LinkEditView,
  LINKS_STORAGE_PATH,
  parseLinkSourceEntries,
} from './link-command.validation'
import { refreshLinksAfterSave } from './links-cache'

export async function loadLinkEditView(
  shortCode: string | null,
): Promise<LinkEditView> {
  const { base, items } = await loadItemDocument(
    LINKS_STORAGE_PATH,
    parseLinkSourceEntries,
  )
  const target = shortCode
    ? requireItem(items, (item) => item.shortenUrl === shortCode)
    : null
  const before =
    target &&
    items
      .slice(items.indexOf(target) + 1)
      .find((item) => item.category === target.category)?.shortenUrl
  return LinkEditView.parse({
    base,
    target,
    before: before ?? null,
    neighbors: items
      .filter((item) => item !== target)
      .map(({ name, shortenUrl, category }) => ({
        name,
        shortenUrl,
        category,
      })),
  })
}

export async function runLinkCommand(
  base: DocumentBase,
  operation: 'apply' | 'check',
  raw: unknown,
) {
  const parsed = LinkCommand.safeParse(raw)
  if (!parsed.success) throw new InvalidItemCommand('Check the link fields.')
  const command = parsed.data
  const result = await executeItemCommand({
    pathname: LINKS_STORAGE_PATH,
    parse: parseLinkSourceEntries,
    base,
    operation,
    change(items) {
      const target =
        command.kind === 'create'
          ? null
          : requireItem(
              items,
              (item) => item.shortenUrl === command.originalShortCode,
            )
      const remaining = items.filter((item) => item !== target)
      if (command.kind === 'delete') return remaining

      const { link, before } = command
      if (
        link.shortenUrl !== target?.shortenUrl &&
        !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(link.shortenUrl)
      ) {
        throw new InvalidItemCommand(
          'Use letters, numbers, hyphens, or underscores for the short code.',
        )
      }
      if (link.icon !== target?.icon && !/^[A-Za-z0-9_-]+$/.test(link.icon)) {
        throw new InvalidItemCommand(
          'Enter an icon name without a path or file extension.',
        )
      }

      const neighbor =
        before === null
          ? null
          : requireItem(
              remaining,
              (item) =>
                item.shortenUrl === before && item.category === link.category,
            )
      if (target?.category === link.category) {
        const previousNext = items
          .slice(items.indexOf(target) + 1)
          .find((item) => item.category === target.category)
        if ((previousNext?.shortenUrl ?? null) === before) {
          remaining.splice(items.indexOf(target), 0, link)
          return validate(remaining)
        }
      }
      const position = neighbor ? remaining.indexOf(neighbor) : remaining.length
      remaining.splice(position, 0, link)
      return validate(remaining)
    },
  })
  if (result.kind === 'saved') refreshLinksAfterSave()
  return result
}

function validate(links: Parameters<typeof parseLinkSourceEntries>[0]) {
  try {
    return parseLinkSourceEntries(links)
  } catch (error) {
    throw new InvalidItemCommand(
      error instanceof Error ? error.message : 'Invalid link.',
    )
  }
}
