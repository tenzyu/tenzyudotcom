import { loadPublication } from '@/platform/content-store/publication.assemble'
import { loadPublicLinks } from './links.infra'

export async function loadLinks() {
  return loadPublicLinks(await loadPublication())
}

export async function loadCachedLinks() {
  return loadLinks()
}
