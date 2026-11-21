import { z } from 'zod'
import { ScrapEditorCommandSchema } from '@/features/content-editor/scrap-editor.validation'

const oid = z.string().regex(/^[0-9a-f]{40}$/)

export const ScrapWorkspaceRequest = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('save'), command: ScrapEditorCommandSchema }),
  z.object({
    operation: z.literal('check'),
    candidate: oid,
    expectedVersion: oid.optional(),
  }),
])
