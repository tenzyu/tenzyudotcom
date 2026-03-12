import { z } from 'zod'

const LoginSchema = z.object({
  locale: z.string().trim().min(2),
  password: z.string().min(1),
})

const SaveCollectionSchema = z.object({
  locale: z.string().trim().min(2),
  collectionId: z.enum([
    'recommendations',
    'notes',
    'puzzles',
    'pointers',
    'links',
    'blog',
  ]),
  sourceJson: z.string().trim().min(2),
  expectedVersion: z.string().trim().min(1).optional(),
})

const SaveBlogPostSchema = z.object({
  locale: z.string().trim().min(2),
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  publishedAt: z.string().trim().min(1),
  updatedAt: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  body: z.string(),
  expectedVersion: z.string().trim().min(1).optional(),
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

export function parseEditorBlogSaveInput(input: {
  locale: FormDataEntryValue | null
  slug: FormDataEntryValue | null
  title: FormDataEntryValue | null
  summary: FormDataEntryValue | null
  publishedAt: FormDataEntryValue | null
  updatedAt: FormDataEntryValue | null | undefined
  tags: FormDataEntryValue | null
  body: FormDataEntryValue | null
  expectedVersion: FormDataEntryValue | null
}) {
  return SaveBlogPostSchema.safeParse(input)
}
