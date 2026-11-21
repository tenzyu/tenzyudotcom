import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  EditorialList,
  EditorialEntry,
  EditorPanel,
} from '@tenzyu/ui/editorial'
import {
  loadScrapEditorIndex,
  loadScrapEditorState,
} from '@/features/content-editor/scrap-editor.assemble'
import { isValidScrapSlug } from '@/features/scraps/scraps.domain'
import { ScrapWorkspace } from '@/features/content-editor/scrap-workspace'

export async function ScrapsEditor({
  locale,
  slug,
  create,
}: {
  locale: string
  slug?: string | null
  create?: boolean
}) {
  if (create) return <ScrapWorkspace locale={locale} />
  if (slug) {
    if (!isValidScrapSlug(slug)) notFound()
    const scrap = await loadScrapEditorState(slug)
    if (!scrap) notFound()
    return <ScrapWorkspace locale={locale} initial={scrap} />
  }
  const scraps = await loadScrapEditorIndex()
  return (
    <EditorPanel
      title="Research logs"
      description="Drafts and archived scraps are visible here."
      actions={
        <Link href={getLocalizedUrl('/editor/scraps?create=1', locale)}>
          Create a scrap
        </Link>
      }
    >
      {scraps.length === 0 ? (
        <p>No scraps yet. Create one to start a research log.</p>
      ) : null}
      <EditorialList>
        {scraps.map((scrap) => (
          <EditorialEntry key={scrap.slug}>
            <h2>
              <Link
                href={getLocalizedUrl(
                  `/editor/scraps?slug=${scrap.slug}`,
                  locale,
                )}
              >
                {scrap.title}
              </Link>
            </h2>
            <p>
              {scrap.published ? 'Published' : 'Draft'} · {scrap.status} ·{' '}
              {scrap.entryCount} entries
            </p>
            <p>{scrap.hypothesis}</p>
          </EditorialEntry>
        ))}
      </EditorialList>
    </EditorPanel>
  )
}
