import { z } from 'zod'

const oid = z.string().regex(/^[0-9a-f]{40}$/)
const slug = z.string().min(1)
const writableSlug = slug.trim().regex(/^[a-z0-9][a-z0-9-]*$/)

export const BlogArticleViewSchema = z.object({
  slug,
  version: oid,
  rawContent: z.string(),
  metadata: z.object({
    title: z.string(),
    summary: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
  }),
})
export type BlogArticleView = z.output<typeof BlogArticleViewSchema>

export const BlogWorkspaceRequestSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('save'),
    slug: writableSlug,
    intent: z.enum(['create', 'edit']),
    expectedVersion: z.string().optional(),
    changes: z.record(z.string(), z.unknown()),
  }),
  z.object({
    operation: z.literal('rename'),
    oldSlug: slug,
    newSlug: writableSlug,
    expectedVersion: oid,
  }),
  z.object({
    operation: z.literal('check'),
    candidate: oid,
    slug,
  }),
])
export type BlogWorkspaceRequest = z.output<typeof BlogWorkspaceRequestSchema>

export const BlogWorkspaceResultSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('saved'),
    view: BlogArticleViewSchema.optional(),
    receipt: z.object({
      commitOid: oid,
      headOid: oid,
      status: z.enum(['written', 'unchanged', 'reconciled']),
    }),
  }),
  z.object({
    kind: z.literal('uncertain'),
    candidateOid: oid.optional(),
    message: z.string(),
  }),
  z.object({
    kind: z.enum(['invalid', 'conflict', 'unavailable', 'denied']),
    message: z.string(),
  }),
])
export type BlogWorkspaceResult = z.output<typeof BlogWorkspaceResultSchema>
