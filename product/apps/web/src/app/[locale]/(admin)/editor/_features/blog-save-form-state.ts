import type { BlogPublicationReceipt } from '@/app/[locale]/(main)/blog/_features/blog.domain'

export type SaveBlogPostActionState =
  | { status: 'idle' }
  | { status: 'error'; error: 'conflict' | 'invalid' | 'save'; message: string }
  | { status: 'uncertain'; candidateOid: string; message: string }
  | {
      status: 'saved'
      receipt: BlogPublicationReceipt
      refreshPending: boolean
      message: string
    }

export const INITIAL_SAVE_BLOG_POST_ACTION_STATE: SaveBlogPostActionState = {
  status: 'idle',
}

export function confirmBlogPublication(
  receipt: BlogPublicationReceipt,
  refresh?: () => void,
): SaveBlogPostActionState {
  const message =
    receipt.status === 'unchanged'
      ? 'No changes to save.'
      : receipt.headOid === receipt.commitOid
        ? 'Saved.'
        : `Saved, then followed by a newer revision. Load ${receipt.headOid} before editing again.`
  let refreshPending = false
  if (receipt.status !== 'unchanged') {
    try {
      refresh?.()
    } catch {
      refreshPending = true
    }
  }
  return {
    status: 'saved',
    receipt,
    refreshPending,
    message: refreshPending ? `${message} Refresh pending.` : message,
  }
}
