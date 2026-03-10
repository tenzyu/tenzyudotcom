import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/components/site-ui/content'
import { PageHeader } from '@/components/site-ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type EditorialCollectionId } from '@/lib/editorial/editorial.port'
import { getEditorialCollectionDescriptor } from '@/lib/editorial/editorial.contract'
import { makeLoadEditorialCollectionUseCase } from './editorial.assemble'
import { saveEditorialCollectionAction } from './actions'
import { EDITORIAL_ADMIN_LOCALE } from './constants'
import { LinksEditor } from './links-editor'
import { NotesEditor } from './notes-editor'
import { PointersEditor } from './pointers-editor'
import { PuzzlesEditor } from './puzzles-editor'
import { RecommendationsEditor } from './recommendations-editor'

export async function EditorialCollectionEditor({
  locale,
  collectionId,
  saved,
  error,
}: {
  locale: string
  collectionId: EditorialCollectionId
  saved?: boolean
  error?: string
}) {
  const content = useIntlayer('editorialAdmin', EDITORIAL_ADMIN_LOCALE)
  const descriptor = getEditorialCollectionDescriptor(collectionId)
  const loadUseCase = makeLoadEditorialCollectionUseCase()

  if (collectionId === 'recommendations') {
    const state = await loadUseCase.execute('recommendations')

    return (
      <Content size="4xl" className="space-y-8">
        <PageHeader
          title={`${content.dashboard.title.value}: ${descriptor.label}`}
        />
        <Link
          href={getLocalizedUrl('/editorial', locale)}
          className="inline-flex text-sm underline underline-offset-4"
        >
          {content.dashboard.backLabel.value}
        </Link>
        {saved ? (
          <p className="text-sm font-medium">
            {content.dashboard.savedMessage.value}
          </p>
        ) : null}
        {error === 'conflict' ? (
          <p className="text-sm font-medium">
            {content.dashboard.conflictMessage.value}
          </p>
        ) : null}
        {error === 'save' ? (
          <p className="text-sm font-medium">
            {content.dashboard.saveErrorMessage.value}
          </p>
        ) : null}
        <RecommendationsEditor
          entries={[...state.collection]}
          expectedVersion={state.version}
          locale={locale}
        />
      </Content>
    )
  }

  if (collectionId === 'links') {
    const state = await loadUseCase.execute('links')

    return (
      <Content size="4xl" className="space-y-8">
        <PageHeader
          title={`${content.dashboard.title.value}: ${descriptor.label}`}
        />
        <Link
          href={getLocalizedUrl('/editorial', locale)}
          className="inline-flex text-sm underline underline-offset-4"
        >
          {content.dashboard.backLabel.value}
        </Link>
        {saved ? (
          <p className="text-sm font-medium">
            {content.dashboard.savedMessage.value}
          </p>
        ) : null}
        {error === 'conflict' ? (
          <p className="text-sm font-medium">
            {content.dashboard.conflictMessage.value}
          </p>
        ) : null}
        {error === 'save' ? (
          <p className="text-sm font-medium">
            {content.dashboard.saveErrorMessage.value}
          </p>
        ) : null}
        <LinksEditor
          locale={locale}
          entries={[...state.collection]}
          expectedVersion={state.version}
        />
      </Content>
    )
  }

  if (collectionId === 'notes') {
    const state = await loadUseCase.execute('notes')

    return (
      <Content size="4xl" className="space-y-8">
        <PageHeader
          title={`${content.dashboard.title.value}: ${descriptor.label}`}
        />
        <Link
          href={getLocalizedUrl('/editorial', locale)}
          className="inline-flex text-sm underline underline-offset-4"
        >
          {content.dashboard.backLabel.value}
        </Link>
        {saved ? (
          <p className="text-sm font-medium">
            {content.dashboard.savedMessage.value}
          </p>
        ) : null}
        {error === 'conflict' ? (
          <p className="text-sm font-medium">
            {content.dashboard.conflictMessage.value}
          </p>
        ) : null}
        {error === 'save' ? (
          <p className="text-sm font-medium">
            {content.dashboard.saveErrorMessage.value}
          </p>
        ) : null}
        <NotesEditor
          locale={locale}
          entries={[...state.collection]}
          expectedVersion={state.version}
        />
      </Content>
    )
  }

  if (collectionId === 'pointers') {
    const state = await loadUseCase.execute('pointers')

    return (
      <Content size="4xl" className="space-y-8">
        <PageHeader
          title={`${content.dashboard.title.value}: ${descriptor.label}`}
        />
        <Link
          href={getLocalizedUrl('/editorial', locale)}
          className="inline-flex text-sm underline underline-offset-4"
        >
          {content.dashboard.backLabel.value}
        </Link>
        {saved ? (
          <p className="text-sm font-medium">
            {content.dashboard.savedMessage.value}
          </p>
        ) : null}
        {error === 'conflict' ? (
          <p className="text-sm font-medium">
            {content.dashboard.conflictMessage.value}
          </p>
        ) : null}
        {error === 'save' ? (
          <p className="text-sm font-medium">
            {content.dashboard.saveErrorMessage.value}
          </p>
        ) : null}
        <PointersEditor
          entries={[...state.collection]}
          expectedVersion={state.version}
          locale={locale}
        />
      </Content>
    )
  }

  if (collectionId === 'puzzles') {
    const state = await loadUseCase.execute('puzzles')

    return (
      <Content size="4xl" className="space-y-8">
        <PageHeader
          title={`${content.dashboard.title.value}: ${descriptor.label}`}
        />
        <Link
          href={getLocalizedUrl('/editorial', locale)}
          className="inline-flex text-sm underline underline-offset-4"
        >
          {content.dashboard.backLabel.value}
        </Link>
        {saved ? (
          <p className="text-sm font-medium">
            {content.dashboard.savedMessage.value}
          </p>
        ) : null}
        {error === 'conflict' ? (
          <p className="text-sm font-medium">
            {content.dashboard.conflictMessage.value}
          </p>
        ) : null}
        {error === 'save' ? (
          <p className="text-sm font-medium">
            {content.dashboard.saveErrorMessage.value}
          </p>
        ) : null}
        <PuzzlesEditor
          locale={locale}
          entries={[...state.collection]}
          expectedVersion={state.version}
        />
      </Content>
    )
  }

  const state = await loadUseCase.execute(collectionId)
  return (
    <Content size="4xl" className="space-y-8">
      <PageHeader
        title={`${content.dashboard.title.value}: ${descriptor.label}`}
      />
      <Link
        href={getLocalizedUrl('/editorial', locale)}
        className="inline-flex text-sm underline underline-offset-4"
      >
        {content.dashboard.backLabel.value}
      </Link>
      {saved ? (
        <p className="text-sm font-medium">
          {content.dashboard.savedMessage.value}
        </p>
      ) : null}
      {error === 'conflict' ? (
        <p className="text-sm font-medium">
          {content.dashboard.conflictMessage.value}
        </p>
      ) : null}
      {error === 'save' ? (
        <p className="text-sm font-medium">
          {content.dashboard.saveErrorMessage.value}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{content.dashboard.sourceJsonLabel.value}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveEditorialCollectionAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="collectionId" value={collectionId} />
            <input type="hidden" name="expectedVersion" value={state.version} />
            <textarea
              name="sourceJson"
              defaultValue={state.serialized}
              className="min-h-112 w-full rounded-md border p-3 font-mono text-xs"
              spellCheck={false}
            />
            <Button type="submit">{content.dashboard.saveLabel.value}</Button>
          </form>
        </CardContent>
      </Card>
    </Content>
  )
}
