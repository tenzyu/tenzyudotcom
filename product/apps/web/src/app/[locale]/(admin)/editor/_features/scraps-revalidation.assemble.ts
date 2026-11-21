import type { RevalidatePathTarget } from '@/lib/content-store/content-store.domain'

const publicRevalidation: {
  tags: readonly string[]
  paths: readonly RevalidatePathTarget[]
} = {
  tags: [],
  paths: [],
}

export function planScrapEntryRevalidation(_slug: string, _entryId: string) {
  return publicRevalidation
}

export function planScrapManifestRevalidation(_slug: string) {
  return publicRevalidation
}
