'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import type { BlogPublicationReceipt } from '@/features/blog/blog.domain'
import { BlogPostForm } from './blog-post-form'
import { readBlogEditArticle, writeBlogArticle } from './blog-workspace-client'
import type {
  BlogArticleView,
  BlogWorkspaceRequest,
  BlogWorkspaceResult,
} from './blog-workspace.validation'

type Command = Exclude<BlogWorkspaceRequest, { operation: 'check' }>
type Failure = Exclude<BlogWorkspaceResult, { kind: 'saved' }>
type Receipt = {
  publication: BlogPublicationReceipt
  slug: string
  refreshed: boolean
}
const subscribe = () => () => {}

export function BlogWorkspace({
  locale,
  slug,
  mode = 'write',
  onSaved,
  onBusyChange,
  onDraftChange,
}: {
  locale: string
  onBusyChange?: (busy: boolean) => void
  onDraftChange?: () => void
  slug?: string
  mode?: 'write' | 'rename'
  onSaved?: (article: BlogArticleView, renamed: boolean) => void
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const ja = locale === 'ja'
  const [article, setArticle] = useState<BlogArticleView>()
  const [working, setWorking] = useState(!!slug)
  const [failure, setFailure] = useState<Failure>()
  const [latest, setLatest] = useState<BlogArticleView>()
  const [receipt, setReceipt] = useState<Receipt>()
  const pending = useRef(false)
  const submission = useRef<Command>(null)

  useEffect(() => {
    onBusyChange?.(working)
  }, [working, onBusyChange])

  useEffect(() => {
    if (!slug) return
    const lifetime = new AbortController()
    void readBlogEditArticle(slug).then(
      (view) => {
        if (lifetime.signal.aborted) return
        setArticle(view)
        setWorking(false)
      },
      () => {
        if (lifetime.signal.aborted) return
        setFailure({
          kind: 'unavailable',
          message: 'The article could not be loaded.',
        })
        setWorking(false)
      },
    )
    return () => lifetime.abort()
  }, [slug])

  async function run(work: () => Promise<void>) {
    if (pending.current) return
    pending.current = true
    setWorking(true)
    try {
      await work()
    } finally {
      pending.current = false
      setWorking(false)
    }
  }

  async function readSaved(
    saved: Receipt,
    command: Command,
    loaded?: BlogArticleView,
  ) {
    setReceipt(saved)
    setFailure(undefined)
    try {
      const view = loaded ?? (await readBlogEditArticle(saved.slug))
      setArticle(view)
      setReceipt({ ...saved, refreshed: true })
      if (saved.publication.status !== 'unchanged')
        onSaved?.(view, command.operation === 'rename')
    } catch {
      // The receipt stays visible while a read is retried.
    }
  }

  function save(command: Command) {
    if (
      failure?.kind === 'uncertain' ||
      failure?.kind === 'conflict' ||
      (receipt && !receipt.refreshed)
    )
      return
    void run(async () => {
      submission.current = command
      setFailure(undefined)
      setLatest(undefined)
      const result = await writeBlogArticle(command)
      if (result.kind !== 'saved') {
        setFailure(result)
        return
      }
      const target =
        command.operation === 'rename' ? command.newSlug.trim() : command.slug
      await readSaved(
        { publication: result.receipt, slug: target, refreshed: false },
        command,
      )
    })
  }

  function check() {
    if (failure?.kind !== 'uncertain' || !submission.current) return
    const candidate = failure.candidateOid
    const command = submission.current
    void run(async () => {
      if (!candidate) {
        const target =
          command.operation === 'rename' ? command.oldSlug : command.slug
        try {
          const view = await readBlogEditArticle(target)
          if (matchesSavedArticle(view, command)) {
            setArticle(view)
            setFailure(undefined)
            onSaved?.(view, command.operation === 'rename')
            return
          }
        } catch {
          setFailure({
            kind: 'uncertain',
            message: 'The article could not be read. Your draft is kept.',
          })
          return
        }
        setFailure({
          kind: 'uncertain',
          message: 'Publication is still unconfirmed. Your draft is kept.',
        })
        return
      }
      const target =
        command.operation === 'rename' ? command.newSlug.trim() : command.slug
      const result = await writeBlogArticle({
        operation: 'check',
        candidate,
        slug: target,
      })
      if (result.kind !== 'saved') {
        setFailure({
          kind: 'uncertain',
          candidateOid: candidate,
          message: result.message,
        })
        return
      }
      await readSaved(
        { publication: result.receipt, slug: target, refreshed: false },
        command,
        result.view,
      )
    })
  }

  function readLatest(compare: boolean) {
    const target = article?.slug ?? slug
    if (!target) return
    void run(async () => {
      try {
        const view = await readBlogEditArticle(target)
        if (compare) setLatest(view)
        else {
          setArticle(view)
          setFailure(undefined)
        }
      } catch {
        setFailure(
          compare
            ? {
                kind: 'conflict',
                message:
                  'The latest version could not be loaded. Your draft is kept.',
              }
            : {
                kind: 'unavailable',
                message: 'The article could not be loaded.',
              },
        )
      }
    })
  }

  const blocked =
    working ||
    failure?.kind === 'uncertain' ||
    failure?.kind === 'conflict' ||
    Boolean(receipt && !receipt.refreshed)
  if (!hydrated) return null
  return (
    <div className="min-w-0 space-y-4" aria-busy={working}>
      {working && <p role="status">{ja ? '処理中…' : 'Working…'}</p>}
      {failure && (
        <p role="alert" className="break-words text-destructive">
          {failure.message}
          {failure.kind === 'uncertain' && failure.candidateOid && (
            <>
              {' '}
              <code>{failure.candidateOid}</code>
            </>
          )}
        </p>
      )}
      {receipt && (
        <p role="status">
          {receipt.publication.status === 'unchanged'
            ? 'No changes to save.'
            : 'Saved.'}{' '}
          <code className="break-all">{receipt.publication.commitOid}</code>
          {receipt.publication.headOid !== receipt.publication.commitOid && (
            <>
              {' '}
              Current Git revision{' '}
              <code className="break-all">{receipt.publication.headOid}</code>
            </>
          )}
        </p>
      )}
      {receipt && !receipt.refreshed && !working && (
        <div className="space-y-2">
          <p role="alert">
            {ja
              ? '保存後の記事を取得できませんでした。'
              : 'The saved article could not be loaded.'}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const command = submission.current
              if (command) void run(() => readSaved(receipt, command))
            }}
          >
            {ja ? '記事を読み直す' : 'Refresh editor'}
          </Button>
        </div>
      )}
      {!article && slug && failure?.kind === 'unavailable' && (
        <Button
          type="button"
          variant="outline"
          disabled={working}
          onClick={() => readLatest(false)}
        >
          {ja ? '再読み込み' : 'Retry read'}
        </Button>
      )}
      {failure?.kind === 'conflict' && article && (
        <Button
          type="button"
          variant="outline"
          disabled={working}
          onClick={() => readLatest(true)}
        >
          {ja ? '最新の値を比較' : 'Compare latest'}
        </Button>
      )}
      {latest && (
        <div className="space-y-2 rounded-md border p-3">
          <p>{latest.metadata.title}</p>
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap">
            {latest.rawContent.slice(0, 600)}
          </pre>
          <Button
            type="button"
            variant="outline"
            disabled={working}
            onClick={() => {
              setArticle(latest)
              setLatest(undefined)
              setFailure(undefined)
            }}
          >
            {ja
              ? '下書きを破棄して最新の記事を使う'
              : 'Discard draft and use latest article'}
          </Button>
        </div>
      )}
      {failure?.kind === 'uncertain' && (
        <Button
          type="button"
          disabled={working}
          variant="outline"
          onClick={check}
        >
          {ja ? '保存結果を確認' : 'Check publication'}
        </Button>
      )}
      {mode === 'write' && (!slug || article) && (
        <BlogPostForm
          key={article ? `${article.slug}/${article.version}` : 'new'}
          locale={locale}
          post={article}
          disabled={blocked}
          onSave={save}
          onDraftChange={onDraftChange}
        />
      )}
      {mode === 'rename' && article && (
        <RenamePostForm
          key={`${article.slug}/${article.version}`}
          article={article}
          locale={locale}
          disabled={blocked}
          onRename={save}
        />
      )}
      {receipt?.refreshed && article && (
        <Link
          className="inline-block text-primary underline"
          href={blogPath(article.slug, locale)}
        >
          {ja ? '公開ページを開く' : 'Open public post'}
        </Link>
      )}
    </div>
  )
}

function matchesSavedArticle(view: BlogArticleView, command: Command) {
  if (command.operation === 'rename') {
    return (
      view.slug === command.newSlug.trim() &&
      view.version === command.expectedVersion
    )
  }
  const { changes } = command
  if (Object.keys(changes).length === 0) return false
  if (view.slug !== command.slug || command.expectedVersion === view.version)
    return false
  return Object.entries(changes).every(([key, value]) => {
    switch (key) {
      case 'body':
        return view.rawContent === value
      case 'title':
        return view.metadata.title === value
      case 'summary':
        return view.metadata.summary === value
      case 'publishedAt':
        return view.metadata.publishedAt.toISOString() === value
      case 'updatedAt':
        return (view.metadata.updatedAt?.toISOString() ?? null) === value
      case 'tags':
        return (
          JSON.stringify(view.metadata.tags ?? null) === JSON.stringify(value)
        )
      default:
        return false
    }
  })
}

function blogPath(slug: string, locale: string) {
  return buildLocalizedUrl(`/blog/${encodeURIComponent(slug)}`, locale)
}

function RenamePostForm({
  article,
  locale,
  disabled,
  onRename,
}: {
  article: BlogArticleView
  locale: string
  disabled: boolean
  onRename: (command: Extract<Command, { operation: 'rename' }>) => void
}) {
  const ja = locale === 'ja'
  const id = useId()
  const [next, setNext] = useState(article.slug)
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!disabled)
          onRename({
            operation: 'rename',
            oldSlug: article.slug,
            newSlug: next,
            expectedVersion: article.version,
          })
      }}
    >
      <fieldset className="space-y-4" disabled={disabled}>
        <div className="grid gap-1.5">
          <label htmlFor={id}>{ja ? '新しいスラッグ' : 'New slug'}</label>
          <Input
            id={id}
            value={next}
            onChange={(event) => setNext(event.target.value)}
            pattern="[a-z0-9][a-z0-9\-]*"
            required
          />
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-md border p-3 text-sm">
          <dt>{ja ? '現在' : 'Current URL'}</dt>
          <dd className="break-all">{blogPath(article.slug, locale)}</dd>
          <dt>{ja ? '変更後' : 'New URL'}</dt>
          <dd className="break-all">{blogPath(next, locale)}</dd>
        </dl>
        <p className="text-sm text-muted-foreground">
          {ja
            ? '以前の URL は新しい URL に転送されます。'
            : 'The old URL will redirect to the new URL.'}
        </p>
        <Button type="submit">
          {ja ? 'URL の変更を確定' : 'Confirm URL change'}
        </Button>
      </fieldset>
    </form>
  )
}
