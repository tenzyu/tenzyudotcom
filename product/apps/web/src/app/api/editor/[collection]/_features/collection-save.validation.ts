import { z } from 'zod'

export const CollectionSavePayload = z.object({
  sourceJson: z.string().trim().min(2),
  expectedVersion: z.string().trim().min(1),
})
