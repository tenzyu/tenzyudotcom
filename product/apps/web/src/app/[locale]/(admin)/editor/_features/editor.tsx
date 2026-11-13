import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { PageIntro, ReadingColumn } from '@tenzyu/ui/editorial'
import type { EditorCollectionId } from '@/features/content-editor/editor-collections'
import { getEditorCollectionMeta } from '@/features/content-editor/editor-collections'
import { makeLoadEditorCollectionUseCase } from './editor.assemble'
import { BlogEditor } from './blog-editor'
import { LinksEditor } from './links-editor'
import { NotesEditor } from './notes-editor'
import { ScrapsEditor } from './scraps-editor'

export async function EditorCollectionEditor({
  locale,
  collectionId,
  saved,
  error,
  slug,
  create,
}: {
  locale: string
  collectionId: EditorCollectionId
  saved?: boolean
  error?: string
  slug?: string | null
  create?: boolean
}) {
  const loader = makeLoadEditorCollectionUseCase()
  async function collectionEditor() {
    switch (collectionId) {
      case 'blog': {
        const state = await loader.execute('blog')
        return (
          <BlogEditor
            locale={locale}
            posts={[...state.collection]}
            slug={slug}
            error={error}
            startCreating={create}
          />
        )
      }
      case 'notes': {
        const state = await loader.execute('notes')
        return (
          <NotesEditor
            locale={locale}
            entries={[...state.collection]}
            expectedVersion={state.version}
          />
        )
      }
      case 'links': {
        const state = await loader.execute('links')
        return (
          <LinksEditor
            locale={locale}
            entries={[...state.collection]}
            expectedVersion={state.version}
          />
        )
      }
      case 'scraps':
        return <ScrapsEditor locale={locale} slug={slug} create={create} />
    }
  }
  return (
    <ReadingColumn className="space-y-8">
      <PageIntro
        eyebrow="Workspace"
        title={getEditorCollectionMeta(collectionId).label}
        description="Write, review, and publish your content."
        actions={
          <Link href={getLocalizedUrl('/editor', locale)}>All collections</Link>
        }
      />
      {saved ? <p role="status">Saved.</p> : null}
      {await collectionEditor()}
    </ReadingColumn>
  )
}
