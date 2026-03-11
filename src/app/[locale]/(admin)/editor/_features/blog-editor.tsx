'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MDXData } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { saveBlogPostAction } from './actions'

type BlogEditorProps = {
  locale: string
  posts: MDXData[]
  slug?: string | null
  error?: string
}

export function BlogEditor({ locale, posts, slug, error }: BlogEditorProps) {
  const [editingPost, setEditingPost] = useState<MDXData | null>(
    slug ? posts.find((p) => p.slug === slug) || null : null
  )
  const [isCreating, setIsCreating] = useState(false)

  if (editingPost || isCreating) {
    const post = editingPost
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isCreating ? 'New Post' : `Editing: ${post?.slug}`}</CardTitle>
          <Button variant="ghost" onClick={() => { setEditingPost(null); setIsCreating(false); }}>
            Back to list
          </Button>
        </CardHeader>
        <CardContent>
          {error === 'conflict' && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              Version conflict: This post has been modified by another session. Please reload or backup your changes.
            </div>
          )}
          <form action={saveBlogPostAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            {post && <input type="hidden" name="expectedVersion" value={post.version} />}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium">Slug</label>
                <input
                  id="slug"
                  name="slug"
                  defaultValue={post?.slug}
                  readOnly={!isCreating}
                  className="w-full rounded-md border p-2 text-sm bg-muted"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <input
                  id="title"
                  name="title"
                  defaultValue={post?.metadata.title}
                  className="w-full rounded-md border p-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="summary" className="text-sm font-medium">Summary</label>
              <textarea
                id="summary"
                name="summary"
                defaultValue={post?.metadata.summary}
                className="w-full rounded-md border p-2 text-sm min-h-20"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="publishedAt" className="text-sm font-medium">Published At</label>
                <input
                  id="publishedAt"
                  type="datetime-local"
                  name="publishedAt"
                  defaultValue={
                    post?.metadata.publishedAt
                      ? new Date(post.metadata.publishedAt.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                      : new Date().toISOString().slice(0, 16)
                  }
                  className="w-full rounded-md border p-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="updatedAt" className="text-sm font-medium">Updated At (Optional)</label>
                <input
                  id="updatedAt"
                  type="datetime-local"
                  name="updatedAt"
                  defaultValue={
                    post?.metadata.updatedAt
                      ? new Date(post.metadata.updatedAt.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                      : ''
                  }
                  className="w-full rounded-md border p-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium">Tags (Comma separated)</label>
                <input
                  id="tags"
                  name="tags"
                  defaultValue={post?.metadata.tags?.join(', ')}
                  placeholder="nextjs, tutorial, tips"
                  className="w-full rounded-md border p-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium">Content (MDX)</label>
              <textarea
                id="body"
                name="body"
                defaultValue={post?.rawContent}
                className="w-full rounded-md border p-2 text-sm font-mono min-h-[500px]"
                spellCheck={false}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Save Post
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>Create New Post</Button>
      </div>
      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.slug} className="flex flex-row items-center justify-between p-4">
            <div>
              <h3 className="font-semibold">{post.metadata.title}</h3>
              <p className="text-xs text-muted-foreground">{post.slug}.mdx</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditingPost(post)}>
              Edit
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
