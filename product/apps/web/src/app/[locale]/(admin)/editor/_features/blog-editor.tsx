'use client'

import { useActionState, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import { Textarea } from '@tenzyu/ui/textarea'
import {
  EditorPanel,
  EditorialList,
  EditorialEntry,
} from '@tenzyu/ui/editorial'
import type {
  BlogChanges,
  MDXData,
} from '@/app/[locale]/(main)/blog/_features/blog.domain'
import {
  INITIAL_SAVE_BLOG_POST_ACTION_STATE,
  type SaveBlogPostActionState,
} from './blog-save-form-state'
import { saveBlogPostAction } from './actions'

type BlogDraft = {
  slug: string
  title: string
  summary: string
  publishedAt: string
  updatedAt: string
  tags: string
  body: string
}

function localDate(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

const subscribe = () => () => {}

function BlogPostForm({
  post,
  locale,
  onBack,
}: {
  post: MDXData | null
  locale: string
  onBack: () => void
}) {
  const [initial] = useState<BlogDraft>(() => ({
    slug: post?.slug ?? '',
    title: post?.metadata.title ?? '',
    summary: post?.metadata.summary ?? '',
    publishedAt: localDate(post?.metadata.publishedAt ?? new Date()),
    updatedAt: post?.metadata.updatedAt
      ? localDate(post.metadata.updatedAt)
      : '',
    tags: post?.metadata.tags?.join(', ') ?? '',
    body: post?.rawContent ?? '',
  }))
  const [draft, setDraft] = useState(initial)
  const router = useRouter()
  const [state, action, pending] = useActionState<
    SaveBlogPostActionState,
    FormData
  >(async (previous, form: FormData) => {
    const submission = new FormData()
    submission.set('locale', locale)
    if (form.get('operation') === 'reconcile') {
      submission.set('operation', 'reconcile')
    } else {
      const changes: BlogChanges = {}
      if (!post || draft.title !== initial.title) changes.title = draft.title
      if (!post || draft.summary !== initial.summary)
        changes.summary = draft.summary
      if (!post || draft.body !== initial.body) changes.body = draft.body
      if (draft.tags !== initial.tags) {
        const tags = draft.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
        changes.tags = tags.length ? tags : null
      }
      for (const field of ['publishedAt', 'updatedAt'] as const) {
        if (draft[field] === initial[field] && (post || field === 'updatedAt'))
          continue
        if (field === 'updatedAt' && !draft.updatedAt) {
          changes.updatedAt = null
          continue
        }
        const date = new Date(draft[field])
        if (
          !Number.isFinite(date.getTime()) ||
          localDate(date) !== draft[field]
        ) {
          return {
            status: 'error',
            error: 'invalid',
            message:
              'Choose a valid local date and time. Your draft is still here.',
          }
        }
        changes[field] = date.toISOString()
      }
      submission.set('intent', post ? 'edit' : 'create')
      submission.set('slug', draft.slug)
      submission.set('expectedVersion', post?.version ?? '')
      submission.set('changes', JSON.stringify(changes))
    }
    return saveBlogPostAction(previous, submission)
  }, INITIAL_SAVE_BLOG_POST_ACTION_STATE)
  const published =
    state.status === 'saved' && state.receipt.status !== 'unchanged'
  return (
    <EditorPanel
      title={post ? `Edit ${post.slug}` : 'Create a post'}
      actions={
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => {
            onBack()
            router.refresh()
          }}
        >
          Back to list
        </Button>
      }
    >
      <form action={action} className="space-y-5">
        {state.status === 'error' ? <p role="alert">{state.message}</p> : null}
        {state.status === 'uncertain' ? (
          <p role="alert">
            {state.message} <code>{state.candidateOid}</code>
          </p>
        ) : null}
        {state.status === 'saved' ? (
          <p role="status">
            {state.message} Commit <code>{state.receipt.commitOid}</code>
          </p>
        ) : null}
        <fieldset disabled={pending} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="blog-slug">Slug</label>
            <Input
              id="blog-slug"
              name="slug"
              value={draft.slug}
              readOnly={!!post}
              onChange={(event) =>
                setDraft({ ...draft, slug: event.target.value })
              }
              pattern="[a-z0-9][a-z0-9-]*"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="blog-title">Title</label>
            <Input
              id="blog-title"
              name="title"
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="blog-summary">Summary</label>
            <Textarea
              id="blog-summary"
              name="summary"
              value={draft.summary}
              onChange={(event) =>
                setDraft({ ...draft, summary: event.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="blog-published">Published at</label>
              <Input
                id="blog-published"
                name="publishedAt"
                type="datetime-local"
                value={draft.publishedAt}
                onChange={(event) =>
                  setDraft({ ...draft, publishedAt: event.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="blog-updated">Updated at, optional</label>
              <Input
                id="blog-updated"
                name="updatedAt"
                type="datetime-local"
                value={draft.updatedAt}
                onChange={(event) =>
                  setDraft({ ...draft, updatedAt: event.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="blog-tags">Tags, separated by commas</label>
            <Input
              id="blog-tags"
              name="tags"
              value={draft.tags}
              onChange={(event) =>
                setDraft({ ...draft, tags: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="blog-body">Content, in MDX</label>
            <Textarea
              id="blog-body"
              name="body"
              rows={24}
              value={draft.body}
              onChange={(event) =>
                setDraft({ ...draft, body: event.target.value })
              }
              spellCheck={false}
              required
            />
          </div>
          {state.status === 'uncertain' ? (
            <Button
              type="submit"
              name="operation"
              value="reconcile"
              formNoValidate
            >
              {pending ? 'Checking…' : 'Check publication'}
            </Button>
          ) : (
            <Button type="submit" disabled={published}>
              {pending ? 'Saving…' : 'Save post'}
            </Button>
          )}
        </fieldset>
      </form>
    </EditorPanel>
  )
}

export function BlogEditor({
  locale,
  posts,
  slug,
  startCreating = false,
}: {
  locale: string
  posts: MDXData[]
  slug?: string | null
  error?: string
  startCreating?: boolean
}) {
  const [selection, setSelection] = useState<
    { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; post: MDXData }
  >(() => {
    const post = posts.find((post) => post.slug === slug)
    return startCreating
      ? { kind: 'create' }
      : post
        ? { kind: 'edit', post }
        : { kind: 'list' }
  })
  const [query, setQuery] = useState('')
  // datetime-local widgets must initialize in the browser's time zone.
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  if (selection.kind !== 'list')
    return inBrowser ? (
      <BlogPostForm
        locale={locale}
        post={selection.kind === 'edit' ? selection.post : null}
        onBack={() => setSelection({ kind: 'list' })}
      />
    ) : null
  const normalized = query.trim().toLowerCase()
  const filtered = posts.filter((post) =>
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
        <Button onClick={() => setSelection({ kind: 'create' })}>
          Create a post
        </Button>
      </div>
      {filtered.length === 0 ? <p>No posts match this search.</p> : null}
      <EditorialList>
        {filtered.map((post) => (
          <EditorialEntry key={post.slug}>
            <h2>{post.metadata.title}</h2>
            <p>{post.metadata.summary}</p>
            <p>{post.metadata.tags?.join(' · ')}</p>
            <Button
              variant="outline"
              onClick={() => setSelection({ kind: 'edit', post })}
            >
              Edit {post.slug}
            </Button>
          </EditorialEntry>
        ))}
      </EditorialList>
    </div>
  )
}
