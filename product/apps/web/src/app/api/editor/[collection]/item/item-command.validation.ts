import { z } from 'zod'
import { DocumentBaseSchema } from '@/platform/content-store/json-item-command.validation'

export const Payload = z.object({
  base: DocumentBaseSchema,
  operation: z.enum(['apply', 'check']),
  command: z.unknown(),
})
