import { z } from 'zod'

export const DocumentBaseSchema = z.object({
  version: z.string().regex(/^[0-9a-f]{64}$/),
  revision: z.string().regex(/^[0-9a-f]{40}$/),
})

export type DocumentBase = z.infer<typeof DocumentBaseSchema>

export const ItemCommandResultSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('saved'), version: z.string() }),
  z.object({
    kind: z.enum(['unchanged', 'conflict', 'unknown', 'unavailable', 'denied']),
  }),
  z.object({ kind: z.literal('invalid'), message: z.string() }),
])

export type ItemCommandResult = z.output<typeof ItemCommandResultSchema>

export class InvalidItemCommand extends Error {}
