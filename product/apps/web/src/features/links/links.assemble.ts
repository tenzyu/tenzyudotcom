import { revalidatePath, revalidateTag } from 'next/cache'
import { getEditorCollectionMeta } from '@/features/content-editor/editor-collections'
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
  for (const path of getEditorCollectionMeta('links').publicPaths) {
    revalidatePath(path.path, path.type)
  }
}
