import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { PageIntro, ReadingColumn } from '@tenzyu/ui/editorial'
import type { EditorCollectionId } from './editor-collections'
import { getEditorCollectionMeta } from './editor-collections'
import { readBlogEditorSummaries } from '@/features/blog/blog-workspace.assemble'
import { loadEditorCollection } from './editor.assemble'
import { BlogEditor } from '@/features/blog/editor/blog-editor'
import { LinksEditor } from '@/features/links/editor/links-editor'
import { NotesEditor } from '@/features/notes/editor/notes-editor'
import { ScrapsEditor } from '@/features/scraps/editor/scraps-editor'

export async function EditorCollectionEditor({
  locale,
  collectionId,
  saved,
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
  async function collectionEditor() {
    switch (collectionId) {
      case 'blog': {
        const posts = create || slug ? [] : await readBlogEditorSummaries()
        return (
          <BlogEditor
            locale={locale}
            posts={posts}
            slug={slug}
            startCreating={create}
          />
        )
      }
      case 'notes': {
        const state = await loadEditorCollection('notes')
        return (
          <NotesEditor
            locale={locale}
            entries={[...state.collection]}
            expectedVersion={state.version}
          />
        )
      }
      case 'links': {
        const state = await loadEditorCollection('links')
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
