'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import {
  EditorPanel,
  EditorialList,
  EditorialEntry,
} from '@tenzyu/ui/editorial'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import type { BlogPostSummary } from '@tenzyu/publishing-domain/blog'
import { BlogWorkspace } from './blog-workspace'

export function BlogEditor({
  locale,
  posts,
  slug,
  startCreating = false,
}: {
  locale: string
  posts: BlogPostSummary[]
  slug?: string | null
  startCreating?: boolean
}) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const ja = locale === 'ja'
  const home = buildLocalizedUrl('/editor/blog', locale)
  if (startCreating || slug) {
    return (
      <EditorPanel
        title={slug ? `Edit ${slug}` : 'Create a post'}
        actions={<Link href={home}>{ja ? '一覧に戻る' : 'Back to list'}</Link>}
      >
        <BlogWorkspace
          locale={locale}
          slug={startCreating ? undefined : (slug ?? undefined)}
          onSaved={() => router.refresh()}
        />
      </EditorPanel>
    )
  }
  const normalized = query.trim().toLowerCase()
  const matches = posts.filter((post) =>
    [
      post.slug,
      post.metadata.title,
      post.metadata.summary,
      ...(post.metadata.tags ?? []),
    ].some((value) => value.toLowerCase().includes(normalized)),
  )
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <label htmlFor="blog-search">Search posts</label>
          <Input
            id="blog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button
          render={<Link href={`${home}?create=1`}>Create a post</Link>}
          nativeButton={false}
        />
      </div>
      {matches.length === 0 && <p>No posts match this search.</p>}
      <EditorialList>
        {matches.map((post) => (
          <EditorialEntry key={post.slug}>
            <h2>{post.metadata.title}</h2>
            <p>{post.metadata.summary}</p>
            <p>{post.metadata.tags?.join(' · ')}</p>
            <Link
              className="text-primary underline"
              href={`${home}?slug=${encodeURIComponent(post.slug)}`}
            >
              Edit {post.slug}
            </Link>
          </EditorialEntry>
        ))}
      </EditorialList>
    </div>
  )
}
