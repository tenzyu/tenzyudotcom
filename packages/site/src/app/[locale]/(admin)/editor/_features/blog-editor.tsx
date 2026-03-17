'use client'

import { useState } from 'react'
import { Search, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import type { MDXData } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { saveBlogPostAction } from './actions'

type BlogEditorProps = {
  locale: string
  posts: MDXData[]
  slug?: string | null
  error?: string
  startCreating?: boolean
}

export function BlogEditor({
  locale,
  posts,
  slug,
  error,
  startCreating = false,
}: BlogEditorProps) {
  const allTags = [...new Set(posts.flatMap((entry) => entry.metadata.tags ?? []))]
    .sort((a, b) => a.localeCompare(b))
  const [editingPost, setEditingPost] = useState<MDXData | null>(
    slug ? posts.find((p) => p.slug === slug) || null : null,
  )
  const [isCreating, setIsCreating] = useState(startCreating)
  const [query, setQuery] = useState('')

  const filteredPosts = posts.filter((post) => {
    const normalizedQuery = query.trim().toLowerCase()

    if (normalizedQuery.length === 0) {
      return true
    }

    return (
      post.slug.toLowerCase().includes(normalizedQuery) ||
      post.metadata.title.toLowerCase().includes(normalizedQuery) ||
      post.metadata.summary.toLowerCase().includes(normalizedQuery) ||
      (post.metadata.tags ?? []).some((tag) =>
        tag.toLowerCase().includes(normalizedQuery),
      )
    )
  })

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
          {error === 'save' && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              Save failed. Check optional fields like updatedAt and try again.
            </div>
          )}
          <form action={saveBlogPostAction} className="space-y-6">
            <input type="hidden" name="locale" value={locale} />
            {post && <input type="hidden" name="expectedVersion" value={post.version} />}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium">Slug</label>
                <input
                  id="slug"
                  name="slug"
                  defaultValue={post?.slug}
                  readOnly={!isCreating}
                  className="bg-muted w-full rounded-md border p-3 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <input
                  id="title"
                  name="title"
                  defaultValue={post?.metadata.title}
                  className="w-full rounded-md border p-3 text-sm"
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
                className="min-h-32 w-full rounded-md border p-3 text-sm leading-relaxed"
                required
              />
            </div>

            <div className="space-y-4">
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
                  className="w-full rounded-md border p-3 text-sm"
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
                  className="w-full rounded-md border p-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium">Tags (Comma separated)</label>
                <input
                  id="tags"
                  name="tags"
                  list="blog-tag-suggestions"
                  defaultValue={post?.metadata.tags?.join(', ')}
                  placeholder="nextjs, tutorial, tips"
                  className="w-full rounded-md border p-3 text-sm"
                />
                <datalist id="blog-tag-suggestions">
                  {allTags.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium">Content (MDX)</label>
              <textarea
                id="body"
                name="body"
                defaultValue={post?.rawContent}
                className="min-h-[70vh] w-full rounded-md border p-4 font-mono text-sm leading-6"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts, tags, slug"
            className="bg-background w-full rounded-md border py-2 pr-3 pl-9 text-sm"
          />
        </div>
        <Button onClick={() => setIsCreating(true)}>Create New Post</Button>
      </div>
      <div className="grid gap-4">
        {filteredPosts.map((post) => (
          <Card key={post.slug}>
            <CardHeader className="gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">{post.metadata.title}</CardTitle>
                  <CardDescription>{post.slug}.mdx</CardDescription>
                </div>
                <Button variant="outline" size="icon-sm" onClick={() => setEditingPost(post)}>
                  <Pencil />
                  <span className="sr-only">Edit {post.slug}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(post.metadata.tags ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {post.metadata.tags?.map((tag) => (
                    <span key={tag} className="rounded-full border border-border/60 px-2 py-0.5">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No posts matched your search.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
