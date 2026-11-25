import { revalidateTag } from 'next/cache'
import { getEditorCollectionContentTag } from '@/config/content-cache'

export function refreshLinksAfterSave() {
  revalidateTag(getEditorCollectionContentTag('links'), { expire: 0 })
}
