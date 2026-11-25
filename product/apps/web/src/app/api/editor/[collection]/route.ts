import { type NextRequest, NextResponse } from 'next/server'
import {
  hasEditorAdminSession,
  isSameOriginEditorRequest,
} from '@/features/editor-auth/editor-session'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/composition/editor/editor.assemble'
import {
  isEditorCollectionId,
  isWritableEditorCollectionId,
} from '@/composition/editor/editor-collections'
import { StorageVersionConflictError } from '@tenzyu/revisioned-content/contracts'
import { isEditorValidationError } from '@/features/content-editor/editor.validation'
import { CollectionSavePayload } from './_features/collection-save.validation'

function json(body: unknown, status = 200) {
  return json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const isAdmin = await hasEditorAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, 401)
  }

  const { collection } = await params
  if (!isEditorCollectionId(collection)) {
    return json({ error: 'Unknown collection' }, 404)
  }

  try {
    const state = await loadEditorCollection(collection)
    return json(state)
  } catch (error) {
    console.error('Failed to load collection:', error)
    return NextResponse.json(
      { error: 'Failed to load collection' }, 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  if (!isSameOriginEditorRequest(request)) {
    return json({ error: 'Forbidden' }, 403)
  }

  const isAdmin = await hasEditorAdminSession()
  if (!isAdmin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { collection } = await params
  if (!isEditorCollectionId(collection)) {
    return json({ error: 'Unknown collection' }, 404)
  }

  if (!isWritableEditorCollectionId(collection)) {
    return json({ error: 'Collection is read-only' }, 405)
  }

  try {
    const body = CollectionSavePayload.parse(await request.json())

    const result = await saveEditorCollection(
      collection,
      body.sourceJson,
      body.expectedVersion,
    )

    return json(result)
  } catch (error) {
    if (isEditorValidationError(error)) {
      return NextResponse.json({ error: 'Invalid payload' }, 400)
    }
    if (error instanceof StorageVersionConflictError) {
      return json({ error: 'conflict' }, 409)
    }

    console.error('Failed to save collection:', error)
    return json({ error: 'Failed to save collection' }, 500)
  }
}
