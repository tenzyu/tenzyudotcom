'use client'

import { useActionState, useState } from 'react'
import type { CollectionSaveState } from '@/features/content-editor/editor-mutation.domain'
import { saveEditorCollectionAction } from './actions'

export function useCollectionSave(initialVersion: string) {
  const [version, setVersion] = useState(initialVersion)
  const [state, action, pending] = useActionState(
    async (previous: CollectionSaveState, form: FormData) => {
      const result = await saveEditorCollectionAction(previous, form)
      if (result.status === 'saved') setVersion(result.version)
      return result
    },
    { status: 'idle' },
  )
  return { state, action, pending, version }
}
