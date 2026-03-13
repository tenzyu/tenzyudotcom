'use client'

import type { EditorCollectionData, EditorCollectionId } from '@/lib/editor/editor.domain'

type CollectionState<K extends EditorCollectionId> = {
  collection: EditorCollectionData[K]
  version: string
}

export async function loadEditorCollection<K extends EditorCollectionId>(
  collectionId: K,
): Promise<CollectionState<K>> {
  const response = await fetch(`/api/editor/${collectionId}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${collectionId}`)
  }

  return (await response.json()) as CollectionState<K>
}

export async function saveEditorCollection<K extends Exclude<EditorCollectionId, 'blog'>>(
  collectionId: K,
  sourceJson: string,
  expectedVersion?: string,
) {
  const response = await fetch(`/api/editor/${collectionId}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sourceJson,
      expectedVersion,
    }),
  })

  if (!response.ok) {
    const error =
      response.status === 409 ? 'conflict' : response.status === 401 ? 'unauthorized' : 'save'
    return {
      ok: false as const,
      error,
    }
  }

  const data = (await response.json()) as { version: string }

  return {
    ok: true as const,
    version: data.version,
  }
}
