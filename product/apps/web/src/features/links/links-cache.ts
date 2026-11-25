import { revalidateTag } from 'next/cache'
import { getEditorCollectionContentTag } from '@/config/content-cache'
import { saveLinksState } from './links.infra'

export async function saveLinksCollection(
  rawJson: string,
  expectedVersion: string,
) {
  const result = await saveLinksState(rawJson, expectedVersion)
  refreshLinksAfterSave()
  return result
}

// A refresh failure must never turn an acknowledged write into a failed save.
export function refreshLinksAfterSave() {
  try {
    revalidateTag(getEditorCollectionContentTag('links'), { expire: 0 })
  } catch (error) {
    console.error('Unable to refresh links after a confirmed save', error)
  }
}
