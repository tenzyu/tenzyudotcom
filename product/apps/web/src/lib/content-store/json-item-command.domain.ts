import { z } from 'zod'

export const DocumentBaseSchema = z.object({
  version: z.string().regex(/^[0-9a-f]{64}$/),
  revision: z.string().regex(/^[0-9a-f]{40}$/),
})

export type DocumentBase = z.infer<typeof DocumentBaseSchema>

export type ItemCommandResult =
  | { kind: 'saved'; version: string }
  | { kind: 'unchanged' | 'conflict' | 'unknown' | 'unavailable' | 'denied' }
  | { kind: 'invalid'; message: string }

export class InvalidItemCommand extends Error {}
