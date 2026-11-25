import { revalidateTag } from 'next/cache'
import { getEditorCollectionContentTag } from '@/config/content-cache'
import { loadPublication } from '@/platform/content-store/publication.assemble'
import { loadLinksState, loadPublicLinks } from './links.infra'

export async function loadLinks() {
  return loadPublicLinks(await loadPublication())
}

export async function loadCachedLinks() {
  return (await loadLinksState()).collection
}

export function refreshLinksAfterSave() {
  revalidateTag(getEditorCollectionContentTag('links'), { expire: 0 })
}
