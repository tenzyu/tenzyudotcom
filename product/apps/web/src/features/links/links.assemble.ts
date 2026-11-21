import { loadPublication } from '@/lib/content-store/publication.assemble'
import { loadLinksState, loadPublicLinks } from './links.infra'

export async function loadLinks() {
  return loadPublicLinks(await loadPublication())
}

export async function loadCachedLinks() {
  return (await loadLinksState()).collection
}
