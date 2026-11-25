import {
  InvalidItemCommand,
  type DocumentBase,
} from '@/platform/content-store/json-item-command.validation'
import {
  executeItemCommand,
  loadItemDocument,
  requireItem,
} from '@/platform/content-store/json-item-command.infra'
import type { z } from 'zod'
import type { NoteCommand, NoteEditView } from './note-command.validation'
import {
  type NoteSourceEntry,
  compareNotesByCreatedAtDesc,
  listAvailableParentNotes,
  reparentChildrenAfterNoteDelete,
} from './notes.domain'
import { NOTES_STORAGE_PATH, parseNoteSourceEntries } from './notes.infra'

export async function loadNoteEditView(
  id: string | null,
  locale: string,
): Promise<NoteEditView> {
  const { base, items } = await loadItemDocument(
    NOTES_STORAGE_PATH,
    parseNoteSourceEntries,
  )
  const target = id ? requireItem(items, (item) => item.id === id) : null
  const parents = (
    target ? listAvailableParentNotes(items, target.id) : [...items]
  )
    .sort(compareNotesByCreatedAtDesc)
    .map((item) => ({
      id: item.id,
      label: (locale === 'ja' ? item.body.ja : item.body.en || item.body.ja)
        .replace(/\s+/g, ' ')
        .slice(0, 64),
    }))
  return {
    base,
    target: target && {
      id: target.id,
      body: target.body,
      parentId: target.parentId,
      externalUrl: target.externalUrl,
      published: target.published !== false,
    },
    parents,
    childCount: target
      ? items.filter((item) => item.parentId === target.id).length
      : 0,
    visibleParentId: items.find(
      (item) => item.id === target?.parentId && item.published !== false,
    )?.id,
  }
}

export function runNoteCommand(
  base: DocumentBase,
  operation: 'apply' | 'check',
  command: z.output<typeof NoteCommand>,
) {
  return executeItemCommand({
    pathname: NOTES_STORAGE_PATH,
    parse: parseNoteSourceEntries,
    base,
    operation,
    change(items) {
      let next: readonly NoteSourceEntry[]
      if (command.kind === 'delete') {
        requireItem(items, (item) => item.id === command.id)
        next = reparentChildrenAfterNoteDelete(items, command.id)
      } else {
        const fields = {
          id: command.id,
          body: command.body,
          parentId: command.parentId,
          externalUrl: command.externalUrl,
          published: command.published,
        }
        if (command.kind === 'create') {
          if (items.some((item) => item.id === command.id)) {
            throw new InvalidItemCommand('This note ID already exists.')
          }
          next = [{ ...fields, createdAt: command.createdAt }, ...items]
        } else {
          const target = requireItem(items, (item) => item.id === command.id)
          next = items.map((item) =>
            item === target ? { ...target, ...fields } : item,
          )
        }
      }
      try {
        return parseNoteSourceEntries(next)
      } catch (error) {
        throw new InvalidItemCommand(
          error instanceof Error ? error.message : 'Invalid note.',
        )
      }
    },
  })
}
