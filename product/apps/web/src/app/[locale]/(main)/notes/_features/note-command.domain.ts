import { z } from 'zod'
import { DocumentBaseSchema } from '@/lib/content-store/json-item-command.domain'

export const NoteBodySchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().optional().default(''),
})

const NoteId = z.string().regex(/^\d+$/)
const NoteFields = z.object({
  body: NoteBodySchema,
  parentId: NoteId.optional(),
  externalUrl: z.string().trim().min(1).optional(),
  published: z.boolean(),
})

export const NoteCommand = z.discriminatedUnion('kind', [
  NoteFields.extend({
    kind: z.literal('create'),
    id: NoteId,
    createdAt: z.iso.datetime(),
  }),
  NoteFields.extend({ kind: z.literal('edit'), id: NoteId }),
  z.object({ kind: z.literal('delete'), id: NoteId }),
])
export type NoteCommand = z.input<typeof NoteCommand>
export type NoteFields = z.output<typeof NoteFields>

export const NoteEditView = z.object({
  base: DocumentBaseSchema,
  target: NoteFields.extend({ id: NoteId }).nullable(),
  parents: z.array(z.object({ id: NoteId, label: z.string() })),
  childCount: z.number().int().nonnegative(),
  visibleParentId: NoteId.optional(),
})
export type NoteEditView = z.output<typeof NoteEditView>
