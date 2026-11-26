import { z } from 'zod'

const LoginSchema = z.object({
  locale: z.enum(['ja', 'en']),
  password: z.string().min(1),
})

const SaveCollectionSchema = z.object({
  locale: z.string().trim().min(2),
  collectionId: z.enum(['notes', 'links']),
  sourceJson: z.string().trim().min(2),
  expectedVersion: z.string().trim().min(1),
})

export function parseEditorLoginInput(input: {
  locale: FormDataEntryValue | null
  password: FormDataEntryValue | null
}) {
  return LoginSchema.safeParse(input)
}

export function parseEditorCollectionSaveInput(input: {
  locale: FormDataEntryValue | string | null
  collectionId: FormDataEntryValue | string | null
  sourceJson: FormDataEntryValue | string | null
  expectedVersion?: FormDataEntryValue | string | null | undefined
}) {
  return SaveCollectionSchema.safeParse(input)
}
