import { z } from 'zod'
import { DocumentBaseSchema } from '@/lib/content-store/json-item-command.validation'
import { defineLinks, LINK_CATEGORY_ORDER } from './links.domain'

export const LinkSourceEntrySchema = z.object({
  name: z.string().trim().min(1),
  id: z.string().trim().min(1),
  url: z.string().trim().min(1),
  shortenUrl: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  category: z.enum(LINK_CATEGORY_ORDER),
})

export const LINKS_STORAGE_PATH = 'editor/links.json'

export function parseLinkSourceEntries(raw: unknown) {
  return defineLinks(z.array(LinkSourceEntrySchema).parse(raw))
}

const ShortCode = z.string().trim().min(1)
export const LinkCommand = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('create'),
    link: LinkSourceEntrySchema,
    before: ShortCode.nullable(),
  }),
  z.object({
    kind: z.literal('edit'),
    originalShortCode: ShortCode,
    link: LinkSourceEntrySchema,
    before: ShortCode.nullable(),
  }),
  z.object({ kind: z.literal('delete'), originalShortCode: ShortCode }),
])
export type LinkCommand = z.output<typeof LinkCommand>

export const LinkEditView = z.object({
  base: DocumentBaseSchema,
  target: LinkSourceEntrySchema.nullable(),
  before: ShortCode.nullable(),
  neighbors: z.array(
    LinkSourceEntrySchema.pick({
      name: true,
      shortenUrl: true,
      category: true,
    }),
  ),
})
export type LinkEditView = z.output<typeof LinkEditView>
