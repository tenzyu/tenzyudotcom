import { z } from 'zod'
import type { BlogSaveCommand } from '../blog.domain'

const blogSlug = z
  .string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9-]*$/)
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

export function parseEditorBlogSaveInput(
  form: FormData,
):
  | { success: true; locale: string; command: BlogSaveCommand }
  | { success: false; error: 'conflict' | 'invalid'; message: string } {
  const invalid = {
    success: false,
    error: 'invalid',
    message:
      'Check the required blog fields and time zone. Your draft is still here.',
  } as const
  const submission = BlogSubmission.safeParse({
    locale: form.get('locale'),
    slug: form.get('slug'),
    intent: form.get('intent'),
    expectedVersion: form.get('expectedVersion'),
    changes: form.get('changes'),
  })
  if (!submission.success) return invalid
  const {
    locale,
    slug,
    expectedVersion,
    changes,
    intent: explicitIntent,
  } = submission.data
  const intent = explicitIntent ?? (expectedVersion ? 'edit' : 'create')
  if (intent === 'edit' && !/^[0-9a-f]{40}$/.test(expectedVersion ?? '')) {
    return {
      success: false,
      error: 'conflict',
      message:
        'This form has an old edit version. Copy your draft and reload the editor.',
    }
  }

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
    } else {
      return invalid
    }
  } catch {
    return invalid
  }

  if (intent === 'create') {
    const parsed = BlogCreateFields.safeParse(fields)
    return parsed.success && !expectedVersion
      ? {
          success: true,
          locale,
          command: { slug, intent, changes: parsed.data },
        }
      : invalid
  }
  const parsed = BlogEditFields.safeParse(fields)
  return parsed.success && expectedVersion
    ? {
        success: true,
        locale,
        command: { slug, intent, expectedVersion, changes: parsed.data },
      }
    : invalid
}
