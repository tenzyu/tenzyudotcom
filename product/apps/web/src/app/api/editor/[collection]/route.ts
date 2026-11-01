import { type NextRequest, NextResponse } from 'next/server'
import {
  hasEditorAdminSession,
  isSameOriginEditorRequest,
} from '@/features/editor-auth/editor-session'
import {
  makeLoadEditorCollectionUseCase,
  makeSaveEditorCollectionUseCase,
} from '@/app/[locale]/(admin)/editor/_features/editor.assemble'
import {
  isEditorCollectionId,
  isWritableEditorCollectionId,
} from '@/features/content-editor/editor-collections'
import { StorageVersionConflictError } from '@/lib/content-store/content-store.domain'
import { z, ZodError } from 'zod'

const CollectionSavePayload = z.object({
  sourceJson: z.string().trim().min(2),
  expectedVersion: z.string().trim().min(1),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const isAdmin = await hasEditorAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collection } = await params
  if (!isEditorCollectionId(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 })
  }

  try {
    const loadUseCase = makeLoadEditorCollectionUseCase()
    const state = await loadUseCase.execute(collection)
    return NextResponse.json(state)
  } catch (error) {
    console.error('Failed to load collection:', error)
    return NextResponse.json(
      { error: 'Failed to load collection' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  if (!isSameOriginEditorRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isAdmin = await hasEditorAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collection } = await params
  if (!isEditorCollectionId(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 })
  }

  if (!isWritableEditorCollectionId(collection)) {
    return NextResponse.json(
      { error: 'Collection is read-only' },
      { status: 405 },
    )
  }

  try {
    const body = CollectionSavePayload.parse(await request.json())

    const saveUseCase = makeSaveEditorCollectionUseCase()
    const result = await saveUseCase.execute(
      collection,
      body.sourceJson,
      body.expectedVersion,
    )

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    if (error instanceof StorageVersionConflictError) {
      return NextResponse.json({ error: 'conflict' }, { status: 409 })
    }

    console.error('Failed to save collection:', error)
    return NextResponse.json(
      { error: 'Failed to save collection' },
      { status: 500 },
    )
  }
}
