'use client'

import { useActionState, useState } from 'react'
import type { CollectionSaveState } from '@/features/content-editor/editor-mutation.domain'

export function useCollectionSave(
  initialVersion: string,
  save: (previous: CollectionSaveState, form: FormData) => Promise<CollectionSaveState>,
) {
  const [version, setVersion] = useState(initialVersion)
  const [state, action, pending] = useActionState(
    async (previous: CollectionSaveState, form: FormData) => {
      const result = await save(previous, form)
      if (result.status === 'saved') setVersion(result.version)
      return result
    },
    { status: 'idle' },
  )
  return { state, action, pending, version }
}
