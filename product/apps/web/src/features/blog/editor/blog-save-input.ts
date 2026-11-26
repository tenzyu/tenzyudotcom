import { z } from 'zod'
import { blogWriteSlugPattern, type BlogSaveCommand } from '@tenzyu/publishing-domain/blog'

const blogSlug = z
  .string()
  .trim()
  .regex(blogWriteSlugPattern)
const BlogSubmission = z.object({
  locale: z.string().trim().min(2),
  slug: blogSlug,
  intent: z.enum(['create', 'edit']).nullable(),
  expectedVersion: z.string().nullable(),
  changes: z.string().nullable(),
})

const instant = z.iso
  .datetime({ offset: true })
  .refine((value) => Number.isFinite(Date.parse(value)))
  .transform((value) => new Date(value).toISOString())
const BlogCreateFields = z.strictObject({
  title: z
    .string()
    .min(1)
    .refine((value) => value.trim().length > 0),
  summary: z
    .string()
    .min(1)
    .refine((value) => value.trim().length > 0),
  publishedAt: instant,
  updatedAt: instant.nullable().optional(),
  tags: z
    .array(z.string().trim().min(1))
    .transform((tags) => [...new Set(tags)])
    .nullable()
    .optional(),
  body: z.string(),
})
const BlogEditFields = BlogCreateFields.partial()

type BlogSaveParseResult =
  | { success: true; command: BlogSaveCommand }
  | { success: false; error: 'conflict' | 'invalid'; message: string }

const invalidBlogSave = {
  success: false,
  error: 'invalid',
  message:
    'Check the required blog fields and time zone. Your draft is still here.',
} as const

// Both transport boundaries have already validated the slug and intent.
export function parseBlogSaveCommand({
  slug,
  intent,
  expectedVersion,
  changes,
}: {
  slug: string
  intent: 'create' | 'edit'
  expectedVersion?: string | null
  changes: unknown
}): BlogSaveParseResult {
  if (intent === 'edit' && !/^[0-9a-f]{40}$/.test(expectedVersion ?? '')) {
    return {
      success: false,
      error: 'conflict',
      message:
        'This form has an old edit version. Copy your draft and reload the editor.',
    }
  }
  if (intent === 'create') {
    const parsed = BlogCreateFields.safeParse(changes)
    return parsed.success && !expectedVersion
      ? { success: true, command: { slug, intent, changes: parsed.data } }
      : invalidBlogSave
  }
  const parsed = BlogEditFields.safeParse(changes)
  return parsed.success && expectedVersion
    ? {
        success: true,
        command: { slug, intent, expectedVersion, changes: parsed.data },
      }
    : invalidBlogSave
}

export function parseEditorBlogSaveInput(
  form: FormData,
):
  | { success: true; locale: string; command: BlogSaveCommand }
  | Extract<BlogSaveParseResult, { success: false }> {
  const submission = BlogSubmission.safeParse({
    locale: form.get('locale'),
    slug: form.get('slug'),
    intent: form.get('intent'),
    expectedVersion: form.get('expectedVersion'),
    changes: form.get('changes'),
  })
  if (!submission.success) return invalidBlogSave
  const {
    locale,
    slug,
    expectedVersion,
    changes,
    intent: explicitIntent,
  } = submission.data
  const intent = explicitIntent ?? (expectedVersion ? 'edit' : 'create')
  let fields: unknown
  try {
    if (changes !== null) {
      fields = JSON.parse(changes)
    } else if (!explicitIntent && intent === 'create') {
      const tags = form.get('tags')
      fields = {
        title: form.get('title'),
        summary: form.get('summary'),
        body: form.get('body'),
        publishedAt: form.get('publishedAt'),
        updatedAt: form.get('updatedAt') || null,
        tags:
          typeof tags === 'string'
            ? tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : null,
      }
    }
  } catch {
    // The common parser still reports an invalid edit precondition first.
    fields = undefined
  }

  const result = parseBlogSaveCommand({ slug, intent, expectedVersion, changes: fields })
  return result.success ? { ...result, locale } : result
}
