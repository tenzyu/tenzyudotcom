'use client'

import { useId, useState } from 'react'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import { Textarea } from '@tenzyu/ui/textarea'
import { SourceField } from '@/features/content-editor/source/source-field'
import type { BlogChanges } from '@tenzyu/publishing-domain/blog'
import type {
  BlogArticleView,
  BlogWorkspaceRequest,
} from './blog-workspace.validation'

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

export function BlogPostForm({
  post,
  locale,
  disabled,
  onSave,
  onDraftChange,
}: {
  post?: BlogArticleView
  locale: string
  disabled: boolean
  onDraftChange?: () => void
  onSave: (input: Extract<BlogWorkspaceRequest, { operation: 'save' }>) => void
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
  const [invalid, setInvalid] = useState(false)
  const ja = locale === 'ja'
  const id = useId()
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (disabled) return
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
          if (
            draft[field] === initial[field] &&
            (post || field === 'updatedAt')
          )
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
            setInvalid(true)
            return
          }
          changes[field] = date.toISOString()
        }
        setInvalid(false)
        onSave({
          operation: 'save',
          intent: post ? 'edit' : 'create',
          slug: draft.slug,
          expectedVersion: post?.version,
          changes,
        })
      }}
    >
      {invalid && (
        <p role="alert">
          {ja
            ? '日時を確認してください。'
            : 'Choose a valid local date and time.'}
        </p>
      )}
      <fieldset disabled={disabled} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor={`${id}-slug`}>{ja ? 'スラッグ' : 'Slug'}</label>
          <Input
            id={`${id}-slug`}
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
          <label htmlFor={`${id}-title`}>{ja ? 'タイトル' : 'Title'}</label>
          <Input
            id={`${id}-title`}
            name="title"
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-summary`}>{ja ? '要約' : 'Summary'}</label>
          <Textarea
            id={`${id}-summary`}
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
            <label htmlFor="blog-published">
              {ja ? '公開日時' : 'Published at'}
            </label>
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
          <label htmlFor={`${id}-tags`}>
            {ja ? 'タグ（カンマ区切り）' : 'Tags, separated by commas'}
          </label>
          <Input
            id={`${id}-tags`}
            name="tags"
            value={draft.tags}
            onChange={(event) =>
              setDraft({ ...draft, tags: event.target.value })
            }
          />
        </div>
        <SourceField
          label={ja ? '本文（MDX）' : 'Content, in MDX'}
          name="body"
          kind="blog"
          source={draft.body}
          onChange={(body) => {
            setDraft({ ...draft, body })
            onDraftChange?.()
          }}
          locale={locale}
          disabled={disabled}
          required
        />
        <Button type="submit">
          {ja ? (post ? '記事を保存' : '記事を公開') : 'Save post'}
        </Button>
      </fieldset>
    </form>
  )
}
