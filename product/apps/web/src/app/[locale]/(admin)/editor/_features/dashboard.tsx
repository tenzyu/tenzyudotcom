import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import {
  PageIntro,
  ReadingColumn,
  EditorialList,
  EditorialEntry,
} from '@tenzyu/ui/editorial'
import { listEditorCollectionMeta } from '@/features/content-editor/editor-collections'
import { usesEditorGithubStorage } from './editor-config.assemble'
import { logoutEditorAdminAction } from './actions'

const descriptions = {
  blog: 'Longer articles, drafts, and published posts.',
  notes: 'Short updates and threaded notes in Japanese and English.',
  scraps: 'Research logs with an introduction and dated entries.',
  links: 'Links, categories, and short URLs.',
}

export function EditorDashboard({ locale }: { locale: string }) {
  return (
    <ReadingColumn className="space-y-8">
      <PageIntro
        eyebrow="Private workspace"
        title="Content editor"
        description="Choose a collection, then write or revise."
        actions={
          <form action={logoutEditorAdminAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit">Sign out</button>
          </form>
        }
      />
      {!usesEditorGithubStorage() ? (
        <p role="status">GitHub content storage is not configured.</p>
      ) : null}
      <EditorialList>
        {listEditorCollectionMeta().map((collection) => (
          <EditorialEntry key={collection.id}>
            <h2>
              <Link href={getLocalizedUrl(`/editor/${collection.id}`, locale)}>
                {collection.label}
              </Link>
            </h2>
            <p>{descriptions[collection.id]}</p>
            {collection.id === 'scraps' ? (
              <Link href={getLocalizedUrl('/editor/scraps?create=1', locale)}>
                Create a scrap
              </Link>
            ) : null}
          </EditorialEntry>
        ))}
        <EditorialEntry>
          <h2>
            <Link href={getLocalizedUrl('/tools', locale)}>Tools</Link>
          </h2>
          <p>Open the site utilities.</p>
        </EditorialEntry>
      </EditorialList>
    </ReadingColumn>
  )
}
